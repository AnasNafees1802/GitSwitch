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
export declare const IPC_CHANNELS: {
    readonly PROFILE_LIST: "profiles:list";
    readonly PROFILE_GET: "profiles:get";
    readonly PROFILE_CREATE: "profiles:create";
    readonly PROFILE_UPDATE: "profiles:update";
    readonly PROFILE_DELETE: "profiles:delete";
    readonly PROFILE_SET_DEFAULT: "profiles:setDefault";
    readonly REPO_SCAN: "repos:scan";
    readonly REPO_GET: "repos:get";
    readonly REPO_BIND: "repos:bind";
    readonly REPO_UNBIND: "repos:unbind";
    readonly REPO_VALIDATE: "repos:validate";
    readonly REPO_LIST: "repos:list";
    readonly DISCOVERY_START: "discovery:start";
    readonly DISCOVERY_IMPORT: "discovery:import";
    readonly SSH_LIST_KEYS: "ssh:listKeys";
    readonly SSH_GENERATE_KEY: "ssh:generateKey";
    readonly SSH_GET_PUBLIC_KEY: "ssh:getPublicKey";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_UPDATE: "settings:update";
    readonly BACKUP_LIST: "backup:list";
    readonly BACKUP_RESTORE: "backup:restore";
    readonly BACKUP_DELETE: "backup:delete";
    readonly AUDIT_GET_LOGS: "audit:getLogs";
    readonly AUDIT_EXPORT: "audit:export";
    readonly OPEN_EXTERNAL: "util:openExternal";
    readonly OPEN_PATH: "util:openPath";
    readonly SELECT_DIRECTORY: "util:selectDirectory";
    readonly WINDOW_MINIMIZE: "window:minimize";
    readonly WINDOW_MAXIMIZE: "window:maximize";
    readonly WINDOW_CLOSE: "window:close";
};
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
export declare function createSuccess<T>(data: T): IPCResult<T>;
/**
 * Create error result
 */
export declare function createError<T>(code: string, message: string, details?: unknown): IPCResult<T>;
//# sourceMappingURL=index.d.ts.map