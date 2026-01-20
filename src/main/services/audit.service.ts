/**
 * Audit Service
 * 
 * Maintains an append-only audit log of all configuration changes.
 * Logs include checksums for integrity verification.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, generateChecksum, getAuditLogDir, ensureDir, pathExists } from '../utils';
import type { AuditLogEntry, AuditCategory } from '../../shared/types';

const logger = createLogger('AuditService');

// Audit log file name format: audit-YYYY-MM-DD.jsonl
function getAuditLogPath(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0];
    return path.join(getAuditLogDir(), `audit-${dateStr}.jsonl`);
}

/**
 * Audit Service API
 */
export const auditService = {
    /**
     * Log an action
     */
    async log(
        category: AuditCategory,
        action: string,
        details: Record<string, unknown>,
        options: {
            affectedPaths?: string[];
            reversible?: boolean;
            backupId?: string;
        } = {}
    ): Promise<AuditLogEntry> {
        const entry: Omit<AuditLogEntry, 'checksum'> = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            category,
            action,
            details: this.sanitizeDetails(details),
            affectedPaths: options.affectedPaths,
            reversible: options.reversible ?? true,
            backupId: options.backupId,
        };

        // Generate checksum for integrity
        const checksum = generateChecksum(entry as Record<string, unknown>);
        const fullEntry: AuditLogEntry = { ...entry, checksum };

        // Write to log file
        await this.appendToLog(fullEntry);

        logger.debug('Audit entry logged', {
            category,
            action,
            id: fullEntry.id,
        });

        return fullEntry;
    },

    /**
     * Sanitize details to remove sensitive information
     */
    sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(details)) {
            const lowerKey = key.toLowerCase();

            // Skip sensitive keys
            if (
                lowerKey.includes('password') ||
                lowerKey.includes('token') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('private')
            ) {
                sanitized[key] = '[REDACTED]';
                continue;
            }

            // Recursively sanitize objects
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeDetails(value as Record<string, unknown>);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    },

    /**
     * Append entry to log file
     */
    async appendToLog(entry: AuditLogEntry): Promise<void> {
        const logDir = getAuditLogDir();
        await ensureDir(logDir);

        const logPath = getAuditLogPath();
        const line = JSON.stringify(entry) + '\n';

        await fs.appendFile(logPath, line, 'utf-8');
    },

    /**
     * Get audit logs with filtering
     */
    async getLogs(options: {
        startDate?: Date;
        endDate?: Date;
        category?: AuditCategory;
        limit?: number;
    } = {}): Promise<AuditLogEntry[]> {
        const { startDate, endDate, category, limit = 100 } = options;

        const logDir = getAuditLogDir();
        if (!(await pathExists(logDir))) {
            return [];
        }

        // Get all log files
        const files = await fs.readdir(logDir);
        const logFiles = files
            .filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'))
            .sort()
            .reverse(); // Most recent first

        const entries: AuditLogEntry[] = [];

        for (const file of logFiles) {
            if (entries.length >= limit) break;

            const filePath = path.join(logDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').filter(Boolean);

            for (const line of lines.reverse()) {
                if (entries.length >= limit) break;

                try {
                    const entry: AuditLogEntry = JSON.parse(line);
                    const entryDate = new Date(entry.timestamp);

                    // Apply filters
                    if (startDate && entryDate < startDate) continue;
                    if (endDate && entryDate > endDate) continue;
                    if (category && entry.category !== category) continue;

                    entries.push(entry);
                } catch {
                    // Skip invalid entries
                }
            }
        }

        return entries;
    },

    /**
     * Verify integrity of a log entry
     */
    verifyEntry(entry: AuditLogEntry): boolean {
        const { checksum, ...rest } = entry;
        const computed = generateChecksum(rest as Record<string, unknown>);
        return computed === checksum;
    },

    /**
     * Export audit logs to a file
     */
    async exportLogs(outputPath: string, options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<void> {
        const entries = await this.getLogs({
            ...options,
            limit: 10000, // Export up to 10k entries
        });

        const content = JSON.stringify(entries, null, 2);
        await fs.writeFile(outputPath, content, 'utf-8');

        logger.info('Audit logs exported', {
            outputPath,
            entryCount: entries.length,
        });
    },

    // ============================================
    // Convenience Methods for Specific Actions
    // ============================================

    async logProfileCreated(profileId: string, label: string): Promise<void> {
        await this.log('profile', 'created', { profileId, label });
    },

    async logProfileUpdated(profileId: string, changes: string[]): Promise<void> {
        await this.log('profile', 'updated', { profileId, changes });
    },

    async logProfileDeleted(profileId: string): Promise<void> {
        await this.log('profile', 'deleted', { profileId });
    },

    async logRepoBinding(repoPath: string, profileId: string, backupId?: string): Promise<void> {
        await this.log('repository', 'bound', { repoPath, profileId }, {
            affectedPaths: [path.join(repoPath, '.git', 'config')],
            backupId,
        });
    },

    async logSSHConfigUpdated(backupId?: string): Promise<void> {
        await this.log('ssh', 'config_updated', {}, { backupId });
    },

    async logSSHKeyGenerated(keyPath: string): Promise<void> {
        await this.log('ssh', 'key_generated', { keyPath });
    },

    async logDiscoveryCompleted(foundCount: number): Promise<void> {
        await this.log('discovery', 'completed', { foundCount }, { reversible: false });
    },

    async logBackupRestored(backupId: string): Promise<void> {
        await this.log('backup', 'restored', { backupId });
    },
};

export default auditService;
