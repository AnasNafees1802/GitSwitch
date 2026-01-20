/**
 * Discovery IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { discoveryService, profileService } from '../services';
import { createLogger } from '../utils';
import type { DiscoveredIdentity } from '../../shared/types';

const logger = createLogger('DiscoveryIPC');

// Start discovery
ipcMain.handle(IPC_CHANNELS.DISCOVERY_START, async (_event, options?: unknown) => {
    try {
        const result = await discoveryService.discover(options as Parameters<typeof discoveryService.discover>[0]);
        return createSuccess(result);
    } catch (error) {
        logger.error('Failed to run discovery', error);
        return createError('DISCOVERY_FAILED', (error as Error).message);
    }
});

// Import discovered identities
ipcMain.handle(IPC_CHANNELS.DISCOVERY_IMPORT, async (_event, identities: unknown[]) => {
    try {
        const imported = await profileService.importFromDiscovery(identities as DiscoveredIdentity[]);
        return createSuccess({
            imported: imported.length,
            profiles: imported,
        });
    } catch (error) {
        logger.error('Failed to import identities', error);
        return createError('IMPORT_FAILED', (error as Error).message);
    }
});

logger.info('Discovery IPC handlers registered');
