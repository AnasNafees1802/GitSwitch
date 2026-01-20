/**
 * Profile IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { profileService } from '../services';
import { createLogger } from '../utils';

const logger = createLogger('ProfileIPC');

// List all profiles
ipcMain.handle(IPC_CHANNELS.PROFILE_LIST, async () => {
    try {
        const profiles = profileService.getAll();
        return createSuccess(profiles);
    } catch (error) {
        logger.error('Failed to list profiles', error);
        return createError('LIST_FAILED', (error as Error).message);
    }
});

// Get a specific profile
ipcMain.handle(IPC_CHANNELS.PROFILE_GET, async (_event, id: string) => {
    try {
        const profile = profileService.getById(id);
        if (!profile) {
            return createError('NOT_FOUND', `Profile not found: ${id}`);
        }
        return createSuccess(profile);
    } catch (error) {
        logger.error('Failed to get profile', { id, error });
        return createError('GET_FAILED', (error as Error).message);
    }
});

// Create a new profile
ipcMain.handle(IPC_CHANNELS.PROFILE_CREATE, async (_event, data: unknown) => {
    try {
        const profile = await profileService.create(data as Parameters<typeof profileService.create>[0]);
        return createSuccess(profile);
    } catch (error) {
        logger.error('Failed to create profile', error);
        return createError('CREATE_FAILED', (error as Error).message);
    }
});

// Update a profile
ipcMain.handle(IPC_CHANNELS.PROFILE_UPDATE, async (_event, data: unknown) => {
    try {
        const profile = await profileService.update(data as Parameters<typeof profileService.update>[0]);
        if (!profile) {
            return createError('NOT_FOUND', 'Profile not found');
        }
        return createSuccess(profile);
    } catch (error) {
        logger.error('Failed to update profile', error);
        return createError('UPDATE_FAILED', (error as Error).message);
    }
});

// Delete a profile
ipcMain.handle(IPC_CHANNELS.PROFILE_DELETE, async (_event, id: string) => {
    try {
        const success = await profileService.delete(id);
        if (!success) {
            return createError('NOT_FOUND', `Profile not found: ${id}`);
        }
        return createSuccess({ deleted: true });
    } catch (error) {
        logger.error('Failed to delete profile', { id, error });
        return createError('DELETE_FAILED', (error as Error).message);
    }
});

// Set default profile
ipcMain.handle(IPC_CHANNELS.PROFILE_SET_DEFAULT, async (_event, id: string) => {
    try {
        const success = profileService.setDefault(id);
        if (!success) {
            return createError('NOT_FOUND', `Profile not found: ${id}`);
        }
        return createSuccess({ success: true });
    } catch (error) {
        logger.error('Failed to set default profile', { id, error });
        return createError('SET_DEFAULT_FAILED', (error as Error).message);
    }
});

// Switch global Git identity (one-click laptop-wide switch)
ipcMain.handle('profiles:switchGlobal', async (_event, id: string) => {
    try {
        const result = await profileService.switchGlobal(id);
        if (!result.success) {
            return createError('SWITCH_FAILED', result.message);
        }
        return createSuccess(result);
    } catch (error) {
        logger.error('Failed to switch global identity', { id, error });
        return createError('SWITCH_FAILED', (error as Error).message);
    }
});

// Get current global Git identity
ipcMain.handle('profiles:getCurrentGlobal', async () => {
    try {
        const current = await profileService.getCurrentGlobal();
        return createSuccess(current);
    } catch (error) {
        logger.error('Failed to get current global', error);
        return createError('GET_FAILED', (error as Error).message);
    }
});

logger.info('Profile IPC handlers registered');
