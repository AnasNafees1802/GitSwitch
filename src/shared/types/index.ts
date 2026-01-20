/**
 * Shared Types Export
 * Central export for all shared types
 */

export * from './profile';
export * from './repository';
export * from './discovery';
export * from './settings';

/**
 * IPC Channel Names
 * Type-safe IPC channel definitions
 */
export const IPC_CHANNELS = {
    // Profile operations
    PROFILE_LIST: 'profiles:list',
    PROFILE_GET: 'profiles:get',
    PROFILE_CREATE: 'profiles:create',
    PROFILE_UPDATE: 'profiles:update',
    PROFILE_DELETE: 'profiles:delete',
    PROFILE_SET_DEFAULT: 'profiles:setDefault',

    // Repository operations
    REPO_SCAN: 'repos:scan',
    REPO_GET: 'repos:get',
    REPO_BIND: 'repos:bind',
    REPO_UNBIND: 'repos:unbind',
    REPO_VALIDATE: 'repos:validate',
    REPO_LIST: 'repos:list',

    // Discovery operations
    DISCOVERY_START: 'discovery:start',
    DISCOVERY_IMPORT: 'discovery:import',

    // SSH operations
    SSH_LIST_KEYS: 'ssh:listKeys',
    SSH_GENERATE_KEY: 'ssh:generateKey',
    SSH_GET_PUBLIC_KEY: 'ssh:getPublicKey',

    // Settings operations
    SETTINGS_GET: 'settings:get',
    SETTINGS_UPDATE: 'settings:update',

    // Backup operations
    BACKUP_LIST: 'backup:list',
    BACKUP_RESTORE: 'backup:restore',
    BACKUP_DELETE: 'backup:delete',

    // Audit operations
    AUDIT_GET_LOGS: 'audit:getLogs',
    AUDIT_EXPORT: 'audit:export',

    // Utility operations
    OPEN_EXTERNAL: 'util:openExternal',
    OPEN_PATH: 'util:openPath',
    SELECT_DIRECTORY: 'util:selectDirectory',

    // Window operations
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close',
} as const;

/**
 * IPC Channel Type
 */
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

/**
 * Result wrapper for IPC operations
 */
export interface IPCResult<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}

/**
 * Create success result
 */
export function createSuccess<T>(data: T): IPCResult<T> {
    return { success: true, data };
}

/**
 * Create error result
 */
export function createError<T>(code: string, message: string, details?: unknown): IPCResult<T> {
    return {
        success: false,
        error: { code, message, details }
    };
}
