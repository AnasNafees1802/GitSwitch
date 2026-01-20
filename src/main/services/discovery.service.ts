/**
 * Discovery Service
 * 
 * Automatically discovers existing Git/SSH identities on the system.
 * This is read-only and never modifies any files.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
    createLogger,
    getDefaultScanDirs,
    pathExists,
    isDirectory,
    getGlobalGitConfigPath,
} from '../utils';
import { sshService } from './ssh.service';
import { gitService } from './git.service';
import { auditService } from './audit.service';
import type {
    DiscoveryResult,
    DiscoveredIdentity,
    DiscoveryOptions,
    GitProvider,
    SSHKeyInfo,
    SSHConfigEntry,
} from '../../shared/types';

const logger = createLogger('DiscoveryService');

/**
 * Infer provider from hostnames
 */
function inferProvider(hostname?: string): GitProvider | undefined {
    if (!hostname) return undefined;

    if (hostname.includes('github')) return 'github';
    if (hostname.includes('gitlab')) return 'gitlab';
    if (hostname.includes('bitbucket')) return 'bitbucket';
    if (hostname.includes('azure') || hostname.includes('visualstudio')) return 'azure';

    return undefined;
}

/**
 * Suggest a label based on identity info
 */
function suggestLabel(identity: Partial<DiscoveredIdentity>): string {
    // Try to infer from email domain
    if (identity.email) {
        const domain = identity.email.split('@')[1]?.toLowerCase();

        if (domain) {
            if (domain === 'gmail.com' || domain === 'hotmail.com' || domain === 'outlook.com') {
                return 'Personal';
            }

            if (domain === 'users.noreply.github.com') {
                return 'GitHub';
            }

            // Use company domain
            const company = domain.split('.')[0];
            return company.charAt(0).toUpperCase() + company.slice(1);
        }
    }

    // Try to infer from username
    if (identity.username) {
        if (identity.username.toLowerCase().includes('personal')) return 'Personal';
        if (identity.username.toLowerCase().includes('work')) return 'Work';
    }

    // Try to infer from SSH key comment
    if (identity.sshKey?.comment) {
        return identity.sshKey.comment.split('@')[0] || 'Unknown';
    }

    return 'Unknown';
}

/**
 * Recursively find Git repositories
 */
async function findGitRepos(
    dir: string,
    maxDepth: number,
    currentDepth: number = 0
): Promise<string[]> {
    if (currentDepth > maxDepth) {
        return [];
    }

    const repos: string[] = [];

    try {
        // Check if this is a git repo
        const gitDir = path.join(dir, '.git');
        if (await pathExists(gitDir)) {
            repos.push(dir);
            return repos; // Don't recurse into git repos
        }

        // Skip known non-repo directories
        const baseName = path.basename(dir);
        if (['node_modules', '.git', 'vendor', 'packages', '.npm', '.cache'].includes(baseName)) {
            return repos;
        }

        // Recurse into subdirectories
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subRepos = await findGitRepos(
                    path.join(dir, entry.name),
                    maxDepth,
                    currentDepth + 1
                );
                repos.push(...subRepos);
            }
        }
    } catch (error) {
        // Permission denied or other errors - skip
        logger.debug('Cannot access directory', { dir, error: (error as Error).message });
    }

    return repos;
}

/**
 * Discovery Service API
 */
export const discoveryService = {
    /**
     * Run full discovery
     */
    async discover(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
        const startTime = Date.now();
        const errors: string[] = [];

        const result: DiscoveryResult = {
            identities: [],
            sshKeys: [],
            sshConfigEntries: [],
            globalGitConfig: undefined,
            repositories: [],
            duration: 0,
            errors: [],
        };

        logger.info('Starting discovery', options);

        // 1. Scan SSH keys
        if (options.scanSSHKeys !== false) {
            try {
                result.sshKeys = await sshService.listKeys();
                logger.info('SSH keys found', { count: result.sshKeys.length });
            } catch (error) {
                const msg = `SSH key scan failed: ${(error as Error).message}`;
                errors.push(msg);
                logger.error(msg);
            }
        }

        // 2. Get SSH config entries
        if (options.scanSSHKeys !== false) {
            try {
                result.sshConfigEntries = await sshService.getSSHConfig();
                logger.info('SSH config entries found', { count: result.sshConfigEntries.length });
            } catch (error) {
                const msg = `SSH config scan failed: ${(error as Error).message}`;
                errors.push(msg);
                logger.error(msg);
            }
        }

        // 3. Get global git config
        if (options.scanGitConfig !== false) {
            try {
                result.globalGitConfig = await gitService.getGlobalConfig();
                logger.info('Global git config found', result.globalGitConfig);
            } catch (error) {
                const msg = `Git config scan failed: ${(error as Error).message}`;
                errors.push(msg);
                logger.error(msg);
            }
        }

        // 4. Scan for repositories
        if (options.scanRepositories !== false) {
            // Normalize additionalRepoDirs - handle object format from dialog
            const additionalDirs: string[] = (options.additionalRepoDirs || []).map((dir: unknown) => {
                if (typeof dir === 'string') return dir;
                if (dir && typeof dir === 'object' && 'path' in dir) return (dir as { path: string }).path;
                return null;
            }).filter((d): d is string => d !== null);

            const scanDirs = [...getDefaultScanDirs(), ...additionalDirs];
            const maxDepth = 4;

            for (const dir of scanDirs) {
                if (await isDirectory(dir)) {
                    try {
                        // First check if the selected folder itself is a git repo
                        const gitDir = path.join(dir, '.git');
                        if (await pathExists(gitDir)) {
                            result.repositories.push(dir);
                        }

                        // Then scan for repos inside
                        const repos = await findGitRepos(dir, maxDepth);
                        result.repositories.push(...repos);
                    } catch (error) {
                        logger.debug('Failed to scan directory', { dir, error });
                    }
                }
            }

            // Remove duplicates
            result.repositories = [...new Set(result.repositories)];
            logger.info('Repositories found', { count: result.repositories.length });
        }

        // 5. Build identity suggestions
        result.identities = this.buildIdentitySuggestions(result);

        result.duration = Date.now() - startTime;
        result.errors = errors;

        await auditService.logDiscoveryCompleted(result.identities.length);

        logger.info('Discovery complete', {
            identities: result.identities.length,
            sshKeys: result.sshKeys.length,
            repos: result.repositories.length,
            duration: result.duration,
        });

        return result;
    },

    /**
     * Build identity suggestions from discovery results
     */
    buildIdentitySuggestions(result: DiscoveryResult): DiscoveredIdentity[] {
        const identities: DiscoveredIdentity[] = [];
        const seen = new Set<string>();

        // Create identities from SSH keys
        for (const key of result.sshKeys) {
            const id = key.comment || key.fingerprint || key.privatePath;
            if (seen.has(id)) continue;
            seen.add(id);

            // Find matching SSH config entry
            const configEntry = result.sshConfigEntries.find(
                e => e.identityFile === key.privatePath
            );

            const provider = configEntry
                ? inferProvider(configEntry.hostName)
                : undefined;

            const identity: DiscoveredIdentity = {
                id: uuidv4(),
                source: 'ssh_key',
                email: key.comment?.includes('@') ? key.comment : undefined,
                sshKey: key,
                sshConfig: configEntry,
                provider,
                selected: false,
                suggestedLabel: '',
            };

            identity.suggestedLabel = suggestLabel(identity);
            identities.push(identity);
        }

        // Create identity from global git config
        if (result.globalGitConfig?.email) {
            const id = result.globalGitConfig.email;
            if (!seen.has(id)) {
                seen.add(id);

                const identity: DiscoveredIdentity = {
                    id: uuidv4(),
                    source: 'git_config',
                    email: result.globalGitConfig.email,
                    username: result.globalGitConfig.username,
                    selected: false,
                    suggestedLabel: '',
                };

                identity.suggestedLabel = suggestLabel(identity);
                identities.push(identity);
            }
        }

        // Create identities from SSH config entries without keys
        for (const entry of result.sshConfigEntries) {
            if (entry.identityFile) continue; // Already handled with SSH keys

            const id = entry.host;
            if (seen.has(id)) continue;
            seen.add(id);

            const provider = inferProvider(entry.hostName || entry.host);

            if (provider) {
                const identity: DiscoveredIdentity = {
                    id: uuidv4(),
                    source: 'ssh_config',
                    sshConfig: entry,
                    provider,
                    selected: false,
                    suggestedLabel: entry.host,
                };

                identities.push(identity);
            }
        }

        return identities;
    },

    /**
     * Get default scan directories
     */
    getDefaultScanDirectories(): string[] {
        return getDefaultScanDirs();
    },

    /**
     * Quick check - are there any existing identities?
     */
    async hasExistingIdentities(): Promise<boolean> {
        const keys = await sshService.listKeys();
        if (keys.length > 0) return true;

        const config = await gitService.getGlobalConfig();
        if (config.email) return true;

        return false;
    },
};

export default discoveryService;
