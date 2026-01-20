/**
 * SSH IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { sshService } from '../services';
import { createLogger } from '../utils';

const logger = createLogger('SSHIPC');

// List SSH keys
ipcMain.handle(IPC_CHANNELS.SSH_LIST_KEYS, async () => {
    try {
        const keys = await sshService.listKeys();
        return createSuccess(keys);
    } catch (error) {
        logger.error('Failed to list SSH keys', error);
        return createError('LIST_FAILED', (error as Error).message);
    }
});

// Generate SSH key
ipcMain.handle(IPC_CHANNELS.SSH_GENERATE_KEY, async (_event, options: unknown) => {
    try {
        const key = await sshService.generateKey(options as Parameters<typeof sshService.generateKey>[0]);
        return createSuccess(key);
    } catch (error) {
        logger.error('Failed to generate SSH key', error);
        return createError('GENERATE_FAILED', (error as Error).message);
    }
});

// Get public key content
ipcMain.handle(IPC_CHANNELS.SSH_GET_PUBLIC_KEY, async (_event, keyPath: string) => {
    try {
        const publicKey = await sshService.getPublicKey(keyPath);
        if (!publicKey) {
            return createError('NOT_FOUND', 'Public key not found');
        }
        return createSuccess({ publicKey });
    } catch (error) {
        logger.error('Failed to get public key', { keyPath, error });
        return createError('GET_FAILED', (error as Error).message);
    }
});

logger.info('SSH IPC handlers registered');
