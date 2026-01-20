/**
 * Audit Log Entry
 * Represents a single audit log entry
 */
export interface AuditLogEntry {
    /** Unique entry ID */
    id: string;
    /** Timestamp (ISO string) */
    timestamp: string;
    /** Action category */
    category: AuditCategory;
    /** Specific action */
    action: string;
    /** Action details */
    details: Record<string, unknown>;
    /** Affected paths (if any) */
    affectedPaths?: string[];
    /** Whether this action is reversible */
    reversible: boolean;
    /** Backup ID for rollback */
    backupId?: string;
    /** Entry checksum for integrity */
    checksum: string;
}
/**
 * Audit Category
 */
export type AuditCategory = 'profile' | 'repository' | 'ssh' | 'git_config' | 'discovery' | 'backup' | 'settings';
/**
 * Backup Info
 * Information about a configuration backup
 */
export interface BackupInfo {
    /** Unique backup ID */
    id: string;
    /** Backup timestamp */
    timestamp: string;
    /** What was backed up */
    type: BackupType;
    /** Original file path */
    originalPath: string;
    /** Backup file path */
    backupPath: string;
    /** File hash before backup */
    originalHash: string;
    /** Reason for backup */
    reason: string;
    /** Whether backup has been restored */
    restored: boolean;
}
/**
 * Backup Type
 */
export type BackupType = 'ssh_config' | 'git_config_global' | 'git_config_local' | 'ssh_key';
/**
 * Application Settings
 */
export interface AppSettings {
    /** Theme */
    theme: 'dark' | 'light' | 'system';
    /** Auto-scan for repos on startup */
    autoScanOnStartup: boolean;
    /** Show mismatch warnings */
    showMismatchWarnings: boolean;
    /** Default directories to scan for repos */
    defaultScanDirs: string[];
    /** Backup retention days */
    backupRetentionDays: number;
    /** Enable pre-push hook */
    enablePrePushHook: boolean;
    /** First run completed */
    firstRunComplete: boolean;
    /** Last discovery time */
    lastDiscoveryTime?: string;
}
/**
 * Default app settings
 */
export declare const DEFAULT_SETTINGS: AppSettings;
//# sourceMappingURL=settings.d.ts.map