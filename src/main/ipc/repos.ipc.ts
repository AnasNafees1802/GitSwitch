/**
 * Repository IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { gitService, discoveryService, secureStore, profileService } from '../services';
import { createLogger } from '../utils';

const logger = createLogger('RepoIPC');

// Scan for repositories
ipcMain.handle(IPC_CHANNELS.REPO_SCAN, async (_event, options?: unknown) => {
    try {
        const result = await discoveryService.discover({
            scanSSHKeys: false,
            scanGitConfig: false,
            scanRepositories: true,
            ...(options as object || {}),
        });

        // Get full repo info for each discovered repo
        const repos = [];
        for (const repoPath of result.repositories) {
            const repo = await gitService.getRepo(repoPath);
            if (repo) {
                repos.push(repo);
            }
        }

        // Save to store
        secureStore.saveRepositories(repos);

        return createSuccess({
            repositories: repos,
            duration: result.duration,
        });
    } catch (error) {
        logger.error('Failed to scan repositories', error);
        return createError('SCAN_FAILED', (error as Error).message);
    }
});

// Get a specific repository
ipcMain.handle(IPC_CHANNELS.REPO_GET, async (_event, path: string) => {
    try {
        const repo = await gitService.getRepo(path);
        if (!repo) {
            return createError('NOT_FOUND', `Not a git repository: ${path}`);
        }
        return createSuccess(repo);
    } catch (error) {
        logger.error('Failed to get repository', { path, error });
        return createError('GET_FAILED', (error as Error).message);
    }
});

// List known repositories
ipcMain.handle(IPC_CHANNELS.REPO_LIST, async () => {
    try {
        const repos = secureStore.getRepositories();
        return createSuccess(repos);
    } catch (error) {
        logger.error('Failed to list repositories', error);
        return createError('LIST_FAILED', (error as Error).message);
    }
});

// Bind a repository to a profile
ipcMain.handle(IPC_CHANNELS.REPO_BIND, async (_event, data: { repoPath: string; profileId: string }) => {
    try {
        const { repoPath, profileId } = data;

        // Get profile
        const profile = profileService.getById(profileId);
        if (!profile) {
            return createError('PROFILE_NOT_FOUND', `Profile not found: ${profileId}`);
        }

        // Set local git config
        await gitService.setLocalConfig(repoPath, {
            email: profile.email,
            username: profile.username,
        });

        // Update stored repo
        const repo = await gitService.getRepo(repoPath);
        if (repo) {
            repo.boundProfileId = profileId;
            secureStore.saveRepository(repo);
        }

        return createSuccess({
            bound: true,
            profile: profile.label,
        });
    } catch (error) {
        logger.error('Failed to bind repository', error);
        return createError('BIND_FAILED', (error as Error).message);
    }
});

// Unbind a repository
ipcMain.handle(IPC_CHANNELS.REPO_UNBIND, async (_event, repoPath: string) => {
    try {
        // We don't actually remove the git config, just remove the binding reference
        const repo = secureStore.getRepository(repoPath);
        if (repo) {
            repo.boundProfileId = undefined;
            secureStore.saveRepository(repo);
        }

        return createSuccess({ unbound: true });
    } catch (error) {
        logger.error('Failed to unbind repository', { repoPath, error });
        return createError('UNBIND_FAILED', (error as Error).message);
    }
});

// Validate repository access
ipcMain.handle(IPC_CHANNELS.REPO_VALIDATE, async (_event, repoPath: string) => {
    try {
        const result = await gitService.validateAccess(repoPath);
        return createSuccess(result);
    } catch (error) {
        logger.error('Failed to validate repository', { repoPath, error });
        return createError('VALIDATE_FAILED', (error as Error).message);
    }
});

logger.info('Repository IPC handlers registered');
