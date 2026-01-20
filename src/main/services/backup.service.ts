/**
 * Backup Service
 * 
 * Handles backup and restoration of configuration files.
 * Every modification to git or ssh config is backed up first.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, sha256, getBackupDir, ensureDir, pathExists } from '../utils';
import type { BackupInfo, BackupType } from '../../shared/types';

const logger = createLogger('BackupService');

// In-memory backup registry (persisted to disk)
let backupRegistry: BackupInfo[] = [];

/**
 * Load backup registry from disk
 */
async function loadRegistry(): Promise<void> {
    const registryPath = path.join(getBackupDir(), 'registry.json');

    try {
        if (await pathExists(registryPath)) {
            const data = await fs.readFile(registryPath, 'utf-8');
            backupRegistry = JSON.parse(data);
            logger.info('Backup registry loaded', { count: backupRegistry.length });
        }
    } catch (error) {
        logger.error('Failed to load backup registry', error);
        backupRegistry = [];
    }
}

/**
 * Save backup registry to disk
 */
async function saveRegistry(): Promise<void> {
    const backupDir = getBackupDir();
    await ensureDir(backupDir);

    const registryPath = path.join(backupDir, 'registry.json');
    await fs.writeFile(registryPath, JSON.stringify(backupRegistry, null, 2), 'utf-8');
}

// Initialize on module load
loadRegistry().catch(err => logger.error('Failed to initialize backup registry', err));

/**
 * Backup Service API
 */
export const backupService = {
    /**
     * Create a backup of a file before modification
     */
    async createBackup(
        originalPath: string,
        type: BackupType,
        reason: string
    ): Promise<BackupInfo | null> {
        try {
            // Check if file exists
            if (!(await pathExists(originalPath))) {
                logger.debug('No file to backup (does not exist)', { path: originalPath });
                return null;
            }

            // Read original content
            const content = await fs.readFile(originalPath, 'utf-8');
            const originalHash = sha256(content);

            // Generate backup ID and path
            const id = uuidv4();
            const timestamp = new Date().toISOString();
            const backupDir = getBackupDir();
            await ensureDir(backupDir);

            // Create timestamped backup filename
            const baseName = path.basename(originalPath);
            const safeTimestamp = timestamp.replace(/[:.]/g, '-');
            const backupFileName = `${baseName}_${safeTimestamp}_${id.slice(0, 8)}`;
            const backupPath = path.join(backupDir, backupFileName);

            // Write backup
            await fs.writeFile(backupPath, content, 'utf-8');

            // Create backup info
            const backup: BackupInfo = {
                id,
                timestamp,
                type,
                originalPath,
                backupPath,
                originalHash,
                reason,
                restored: false,
            };

            // Add to registry
            backupRegistry.push(backup);
            await saveRegistry();

            logger.info('Backup created', {
                id,
                type,
                originalPath,
                reason,
            });

            return backup;
        } catch (error) {
            logger.error('Failed to create backup', { originalPath, error });
            throw new Error(`Failed to create backup: ${(error as Error).message}`);
        }
    },

    /**
     * Restore a backup
     */
    async restoreBackup(backupId: string): Promise<boolean> {
        try {
            const backup = backupRegistry.find(b => b.id === backupId);

            if (!backup) {
                logger.error('Backup not found', { backupId });
                return false;
            }

            if (!(await pathExists(backup.backupPath))) {
                logger.error('Backup file missing', { backupId, backupPath: backup.backupPath });
                return false;
            }

            // Read backup content
            const content = await fs.readFile(backup.backupPath, 'utf-8');

            // Verify integrity
            const hash = sha256(content);
            if (hash !== backup.originalHash) {
                logger.warn('Backup hash mismatch, file may be corrupted', { backupId });
            }

            // Restore to original location
            await fs.writeFile(backup.originalPath, content, 'utf-8');

            // Mark as restored
            backup.restored = true;
            await saveRegistry();

            logger.info('Backup restored', {
                backupId,
                originalPath: backup.originalPath,
            });

            return true;
        } catch (error) {
            logger.error('Failed to restore backup', { backupId, error });
            throw new Error(`Failed to restore backup: ${(error as Error).message}`);
        }
    },

    /**
     * List all backups
     */
    async listBackups(type?: BackupType): Promise<BackupInfo[]> {
        await loadRegistry();

        if (type) {
            return backupRegistry.filter(b => b.type === type);
        }
        return [...backupRegistry];
    },

    /**
     * Get a specific backup
     */
    getBackup(backupId: string): BackupInfo | undefined {
        return backupRegistry.find(b => b.id === backupId);
    },

    /**
     * Delete a backup
     */
    async deleteBackup(backupId: string): Promise<boolean> {
        try {
            const index = backupRegistry.findIndex(b => b.id === backupId);

            if (index < 0) {
                return false;
            }

            const backup = backupRegistry[index];

            // Delete backup file
            if (await pathExists(backup.backupPath)) {
                await fs.unlink(backup.backupPath);
            }

            // Remove from registry
            backupRegistry.splice(index, 1);
            await saveRegistry();

            logger.info('Backup deleted', { backupId });
            return true;
        } catch (error) {
            logger.error('Failed to delete backup', { backupId, error });
            return false;
        }
    },

    /**
     * Clean up old backups based on retention policy
     */
    async cleanupOldBackups(retentionDays: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        let deletedCount = 0;
        const toDelete: string[] = [];

        for (const backup of backupRegistry) {
            const backupDate = new Date(backup.timestamp);
            if (backupDate < cutoffDate && !backup.restored) {
                toDelete.push(backup.id);
            }
        }

        for (const id of toDelete) {
            if (await this.deleteBackup(id)) {
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            logger.info('Old backups cleaned up', { deletedCount, retentionDays });
        }

        return deletedCount;
    },

    /**
     * Get backup directory path
     */
    getBackupDirectory(): string {
        return getBackupDir();
    },
};

export default backupService;
