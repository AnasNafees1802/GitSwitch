/**
 * Utility IPC Handlers
 */

import { ipcMain, shell, dialog, BrowserWindow } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { createLogger } from '../utils';

const logger = createLogger('UtilIPC');

// Open external URL
ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, url: string) => {
    try {
        // Validate URL
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return createError('INVALID_URL', 'Only HTTP(S) URLs are allowed');
        }

        await shell.openExternal(url);
        return createSuccess({ opened: true });
    } catch (error) {
        logger.error('Failed to open external URL', { url, error });
        return createError('OPEN_FAILED', (error as Error).message);
    }
});

// Open path in file explorer
ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (_event, path: string) => {
    try {
        await shell.openPath(path);
        return createSuccess({ opened: true });
    } catch (error) {
        logger.error('Failed to open path', { path, error });
        return createError('OPEN_FAILED', (error as Error).message);
    }
});

// Select directory dialog
ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    try {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Directory',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return createSuccess({ selected: false });
        }

        return createSuccess({
            selected: true,
            path: result.filePaths[0],
        });
    } catch (error) {
        logger.error('Failed to show directory dialog', error);
        return createError('DIALOG_FAILED', (error as Error).message);
    }
});

// Window controls
ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
});

ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
        window.unmaximize();
    } else {
        window?.maximize();
    }
});

ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
});

logger.info('Utility IPC handlers registered');
