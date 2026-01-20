/**
 * Backup IPC Handlers
 */

import { ipcMain } from 'electron';
import { IPC_CHANNELS, createSuccess, createError } from '../../shared/types';
import { backupService, auditService } from '../services';
import { createLogger } from '../utils';

const logger = createLogger('BackupIPC');

// List backups
ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async () => {
    try {
        const backups = await backupService.listBackups();
        return createSuccess(backups);
    } catch (error) {
        logger.error('Failed to list backups', error);
        return createError('LIST_FAILED', (error as Error).message);
    }
});

// Restore a backup
ipcMain.handle(IPC_CHANNELS.BACKUP_RESTORE, async (_event, backupId: string) => {
    try {
        const success = await backupService.restoreBackup(backupId);
        if (!success) {
            return createError('NOT_FOUND', `Backup not found: ${backupId}`);
        }
        await auditService.logBackupRestored(backupId);
        return createSuccess({ restored: true });
    } catch (error) {
        logger.error('Failed to restore backup', { backupId, error });
        return createError('RESTORE_FAILED', (error as Error).message);
    }
});

// Delete a backup
ipcMain.handle(IPC_CHANNELS.BACKUP_DELETE, async (_event, backupId: string) => {
    try {
        const success = await backupService.deleteBackup(backupId);
        if (!success) {
            return createError('NOT_FOUND', `Backup not found: ${backupId}`);
        }
        return createSuccess({ deleted: true });
    } catch (error) {
        logger.error('Failed to delete backup', { backupId, error });
        return createError('DELETE_FAILED', (error as Error).message);
    }
});

// Get audit logs
ipcMain.handle(IPC_CHANNELS.AUDIT_GET_LOGS, async (_event, options?: unknown) => {
    try {
        const logs = await auditService.getLogs(options as Parameters<typeof auditService.getLogs>[0]);
        return createSuccess(logs);
    } catch (error) {
        logger.error('Failed to get audit logs', error);
        return createError('GET_FAILED', (error as Error).message);
    }
});

// Export audit logs
ipcMain.handle(IPC_CHANNELS.AUDIT_EXPORT, async () => {
    try {
        const { dialog, app } = await import('electron');
        const result = await dialog.showSaveDialog({
            title: 'Export Audit Logs',
            defaultPath: `gitswitch-audit-${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });

        if (result.canceled || !result.filePath) {
            return createSuccess({ exported: false });
        }

        await auditService.exportLogs(result.filePath);
        return createSuccess({ exported: true, path: result.filePath });
    } catch (error) {
        logger.error('Failed to export audit logs', error);
        return createError('EXPORT_FAILED', (error as Error).message);
    }
});

logger.info('Backup IPC handlers registered');
