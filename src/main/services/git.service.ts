/**
 * Git Service
 * 
 * Safe wrapper around Git CLI operations.
 * Uses simple-git for type-safe, non-shell command execution.
 */

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createLogger, pathExists, getGlobalGitConfigPath, safeReadFile, expandTilde } from '../utils';
import { backupService } from './backup.service';
import { auditService } from './audit.service';
import type { Remote, Repository, RepositoryStatus, GitProvider } from '../../shared/types';

const logger = createLogger('GitService');

/**
 * Parse remote URL to determine type and provider
 */
function parseRemoteUrl(url: string): { type: 'ssh' | 'https'; provider?: GitProvider; owner?: string; repo?: string } {
    const result: { type: 'ssh' | 'https'; provider?: GitProvider; owner?: string; repo?: string } = {
        type: url.includes('@') && !url.startsWith('https://') ? 'ssh' : 'https',
    };

    // Match GitHub SSH: git@github.com:owner/repo.git
    const sshMatch = url.match(/git@([^:]+):([^/]+)\/(.+?)(?:\.git)?$/);
    if (sshMatch) {
        const [, host, owner, repo] = sshMatch;
        result.owner = owner;
        result.repo = repo;

        if (host.includes('github')) result.provider = 'github';
        else if (host.includes('gitlab')) result.provider = 'gitlab';
        else if (host.includes('bitbucket')) result.provider = 'bitbucket';
        else if (host.includes('azure') || host.includes('visualstudio')) result.provider = 'azure';

        return result;
    }

    // Match HTTPS: https://github.com/owner/repo.git
    const httpsMatch = url.match(/https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/);
    if (httpsMatch) {
        const [, host, owner, repo] = httpsMatch;
        result.owner = owner;
        result.repo = repo;

        if (host.includes('github')) result.provider = 'github';
        else if (host.includes('gitlab')) result.provider = 'gitlab';
        else if (host.includes('bitbucket')) result.provider = 'bitbucket';
        else if (host.includes('azure') || host.includes('visualstudio')) result.provider = 'azure';

        return result;
    }

    return result;
}

/**
 * Create a SimpleGit instance for a repository
 */
function createGitInstance(repoPath?: string): SimpleGit {
    const options: Partial<SimpleGitOptions> = {
        baseDir: repoPath,
        binary: 'git',
        maxConcurrentProcesses: 6,
        trimmed: true,
    };

    return simpleGit(options);
}

/**
 * Git Service API
 */
export const gitService = {
    /**
     * Check if a path is a Git repository
     */
    async isGitRepo(dirPath: string): Promise<boolean> {
        try {
            const gitDir = path.join(dirPath, '.git');
            return await pathExists(gitDir);
        } catch {
            return false;
        }
    },

    /**
     * Get repository information
     */
    async getRepo(repoPath: string): Promise<Repository | null> {
        try {
            if (!(await this.isGitRepo(repoPath))) {
                return null;
            }

            const git = createGitInstance(repoPath);

            // Get remotes
            const remotesOutput = await git.getRemotes(true);
            const remotes: Remote[] = remotesOutput.map(r => {
                const parsed = parseRemoteUrl(r.refs.fetch || r.refs.push || '');
                return {
                    name: r.name,
                    url: r.refs.fetch || r.refs.push || '',
                    type: parsed.type,
                    provider: parsed.provider,
                    owner: parsed.owner,
                    repo: parsed.repo,
                };
            });

            // Get local git config
            let localEmail: string | undefined;
            let localUsername: string | undefined;

            try {
                localEmail = await git.getConfig('user.email', 'local').then(r => r.value || undefined);
                localUsername = await git.getConfig('user.name', 'local').then(r => r.value || undefined);
            } catch {
                // No local config
            }

            // Determine status
            let status: RepositoryStatus = 'unbound';
            let hasMismatch = false;
            let mismatchDetails: string | undefined;

            if (localEmail || localUsername) {
                status = 'bound';
                // Could add mismatch detection here
            }

            // Determine provider from remotes
            const detectedProvider = remotes.find(r => r.provider)?.provider;

            const repo: Repository = {
                path: repoPath,
                name: path.basename(repoPath),
                remotes,
                localEmail,
                localUsername,
                detectedProvider,
                hasMismatch,
                mismatchDetails,
                status,
                lastAccessed: new Date().toISOString(),
            };

            return repo;
        } catch (error) {
            logger.error('Failed to get repo info', { repoPath, error });
            return null;
        }
    },

    /**
     * Get global git config
     */
    async getGlobalConfig(): Promise<{ email?: string; username?: string }> {
        try {
            const git = createGitInstance();

            const email = await git.getConfig('user.email', 'global').then(r => r.value || undefined);
            const username = await git.getConfig('user.name', 'global').then(r => r.value || undefined);

            return { email, username };
        } catch (error) {
            logger.error('Failed to get global git config', error);
            return {};
        }
    },

    /**
     * Set local git config for a repository
     */
    async setLocalConfig(
        repoPath: string,
        config: { email?: string; username?: string }
    ): Promise<void> {
        try {
            // Backup local config
            const localConfigPath = path.join(repoPath, '.git', 'config');
            const backup = await backupService.createBackup(
                localConfigPath,
                'git_config_local',
                `Setting local config for ${path.basename(repoPath)}`
            );

            const git = createGitInstance(repoPath);

            if (config.email) {
                await git.addConfig('user.email', config.email, false, 'local');
            }

            if (config.username) {
                await git.addConfig('user.name', config.username, false, 'local');
            }

            // Audit log
            await auditService.logRepoBinding(repoPath, 'direct-config', backup?.id);

            logger.info('Local git config set', { repoPath, ...config });
        } catch (error) {
            logger.error('Failed to set local git config', { repoPath, error });
            throw new Error(`Failed to set local git config: ${(error as Error).message}`);
        }
    },

    /**
     * Set global git config
     */
    async setGlobalConfig(config: { email?: string; username?: string }): Promise<void> {
        try {
            // Backup global config
            const globalConfigPath = getGlobalGitConfigPath();
            await backupService.createBackup(
                globalConfigPath,
                'git_config_global',
                'Setting global git config'
            );

            const git = createGitInstance();

            if (config.email) {
                await git.addConfig('user.email', config.email, false, 'global');
            }

            if (config.username) {
                await git.addConfig('user.name', config.username, false, 'global');
            }

            logger.info('Global git config set', config);
        } catch (error) {
            logger.error('Failed to set global git config', error);
            throw new Error(`Failed to set global git config: ${(error as Error).message}`);
        }
    },

    /**
     * Update remote URL
     */
    async setRemoteUrl(
        repoPath: string,
        remoteName: string,
        url: string
    ): Promise<void> {
        try {
            const git = createGitInstance(repoPath);
            await git.remote(['set-url', remoteName, url]);
            logger.info('Remote URL updated', { repoPath, remoteName, url });
        } catch (error) {
            logger.error('Failed to set remote URL', { repoPath, remoteName, error });
            throw new Error(`Failed to set remote URL: ${(error as Error).message}`);
        }
    },

    /**
     * Test repository access
     */
    async validateAccess(repoPath: string): Promise<{ success: boolean; message: string }> {
        try {
            const git = createGitInstance(repoPath);

            // Try to fetch (without actually downloading)
            await git.fetch(['--dry-run']);

            return { success: true, message: 'Access validated successfully' };
        } catch (error) {
            const message = (error as Error).message;

            if (message.includes('Permission denied')) {
                return { success: false, message: 'Permission denied. Check your SSH key or token.' };
            }

            if (message.includes('Could not resolve host')) {
                return { success: false, message: 'Could not connect. Check your network connection.' };
            }

            return { success: false, message: `Access validation failed: ${message}` };
        }
    },

    /**
     * Parse git config file
     */
    async parseGitConfig(configPath: string): Promise<Record<string, string>> {
        const content = await safeReadFile(expandTilde(configPath));

        if (!content) {
            return {};
        }

        const config: Record<string, string> = {};
        let currentSection = '';

        for (const line of content.split('\n')) {
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
                continue;
            }

            // Section header
            const sectionMatch = trimmed.match(/^\[(.+?)\]$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1].replace(/\s+/, '.').toLowerCase();
                continue;
            }

            // Key-value pair
            const kvMatch = trimmed.match(/^([^=]+?)\s*=\s*(.*)$/);
            if (kvMatch && currentSection) {
                const key = `${currentSection}.${kvMatch[1].trim().toLowerCase()}`;
                config[key] = kvMatch[2].trim();
            }
        }

        return config;
    },
};

export default gitService;
