/**
 * Settings IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { secureStore } from '../services';
import { createLogger } from '../utils';
import type { AppSettings } from '../../shared/types';

const logger = createLogger('SettingsIPC');

// Get settings
ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    try {
        const settings = secureStore.getSettings();
        return createSuccess(settings);
    } catch (error) {
        logger.error('Failed to get settings', error);
        return createError('GET_FAILED', (error as Error).message);
    }
});

// Update settings
ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_event, settings: unknown) => {
    try {
        const updated = secureStore.updateSettings(settings as Partial<AppSettings>);
        return createSuccess(updated);
    } catch (error) {
        logger.error('Failed to update settings', error);
        return createError('UPDATE_FAILED', (error as Error).message);
    }
});

logger.info('Settings IPC handlers registered');
