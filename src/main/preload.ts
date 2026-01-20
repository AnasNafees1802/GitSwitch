/**
 * Preload Script
 * 
 * Exposes a safe, limited API to the renderer process.
 * All IPC communication goes through this bridge.
 * 
 * NOTE: This file must be standalone - no external imports except electron.
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// IPC Channel names (duplicated here to avoid import issues in preload)
const IPC_CHANNELS = {
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
 * Type-safe API exposed to renderer
 */
const api = {
    // ============================================
    // Profile Operations
    // ============================================

    profiles: {
        list: () => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_LIST),
        get: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_GET, id),
        create: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_CREATE, data),
        update: (data: unknown) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_UPDATE, data),
        delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_DELETE, id),
        setDefault: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.PROFILE_SET_DEFAULT, id),
        // One-click switch: Changes ~/.gitconfig to this profile's identity
        switchGlobal: (id: string) => ipcRenderer.invoke('profiles:switchGlobal', id),
        getCurrentGlobal: () => ipcRenderer.invoke('profiles:getCurrentGlobal'),
    },

    // ============================================
    // Repository Operations
    // ============================================

    repos: {
        scan: (options?: unknown) => ipcRenderer.invoke(IPC_CHANNELS.REPO_SCAN, options),
        get: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.REPO_GET, path),
        list: () => ipcRenderer.invoke(IPC_CHANNELS.REPO_LIST),
        bind: (repoPath: string, profileId: string) =>
            ipcRenderer.invoke(IPC_CHANNELS.REPO_BIND, { repoPath, profileId }),
        unbind: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.REPO_UNBIND, repoPath),
        validate: (repoPath: string) => ipcRenderer.invoke(IPC_CHANNELS.REPO_VALIDATE, repoPath),
    },

    // ============================================
    // Discovery Operations
    // ============================================

    discovery: {
        start: (options?: unknown) => ipcRenderer.invoke(IPC_CHANNELS.DISCOVERY_START, options),
        import: (identities: unknown[]) => ipcRenderer.invoke(IPC_CHANNELS.DISCOVERY_IMPORT, identities),
    },

    // ============================================
    // SSH Operations
    // ============================================

    ssh: {
        listKeys: () => ipcRenderer.invoke(IPC_CHANNELS.SSH_LIST_KEYS),
        generateKey: (options: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SSH_GENERATE_KEY, options),
        getPublicKey: (keyPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SSH_GET_PUBLIC_KEY, keyPath),
    },

    // ============================================
    // Settings Operations
    // ============================================

    settings: {
        get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
        update: (settings: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, settings),
    },

    // ============================================
    // Backup Operations
    // ============================================

    backup: {
        list: () => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
        restore: (backupId: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_RESTORE, backupId),
        delete: (backupId: string) => ipcRenderer.invoke(IPC_CHANNELS.BACKUP_DELETE, backupId),
    },

    // ============================================
    // Audit Operations
    // ============================================

    audit: {
        getLogs: (options?: unknown) => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_GET_LOGS, options),
        export: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIT_EXPORT),
    },

    // ============================================
    // Utility Operations
    // ============================================

    util: {
        openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),
        openPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_PATH, path),
        selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),
    },

    // ============================================
    // Window Operations
    // ============================================

    window: {
        minimize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
        maximize: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
        close: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
    },

    // ============================================
    // Event Listeners
    // ============================================

    on: (channel: string, callback: (...args: unknown[]) => void) => {
        const validChannels = ['discovery:progress', 'scan:progress', 'notification'];
        if (validChannels.includes(channel)) {
            const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }
        return () => { };
    },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('gitswitch', api);

// TypeScript declarations for renderer
export type GitSwitchAPI = typeof api;
