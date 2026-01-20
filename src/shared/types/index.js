"use strict";
/**
 * Shared Types Export
 * Central export for all shared types
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
exports.createSuccess = createSuccess;
exports.createError = createError;
__exportStar(require("./profile"), exports);
__exportStar(require("./repository"), exports);
__exportStar(require("./discovery"), exports);
__exportStar(require("./settings"), exports);
/**
 * IPC Channel Names
 * Type-safe IPC channel definitions
 */
exports.IPC_CHANNELS = {
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
};
/**
 * Create success result
 */
function createSuccess(data) {
    return { success: true, data };
}
/**
 * Create error result
 */
function createError(code, message, details) {
    return {
        success: false,
        error: { code, message, details }
    };
}
//# sourceMappingURL=index.js.map