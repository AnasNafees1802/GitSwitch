/**
 * Path Utilities
 * Cross-platform path handling for Git and SSH files
 */

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs/promises';
import { createLogger } from './logger';

const logger = createLogger('PathUtils');

/**
 * Get the user's home directory
 */
export function getHomeDir(): string {
    return os.homedir();
}

/**
 * Get the SSH directory path
 */
export function getSSHDir(): string {
    return path.join(getHomeDir(), '.ssh');
}

/**
 * Get the SSH config file path
 */
export function getSSHConfigPath(): string {
    return path.join(getSSHDir(), 'config');
}

/**
 * Get the global git config path
 */
export function getGlobalGitConfigPath(): string {
    // Git looks for config in multiple places
    // 1. $XDG_CONFIG_HOME/git/config
    // 2. ~/.gitconfig
    // 3. ~/.config/git/config

    const xdgConfig = process.env.XDG_CONFIG_HOME;
    if (xdgConfig) {
        return path.join(xdgConfig, 'git', 'config');
    }

    return path.join(getHomeDir(), '.gitconfig');
}

/**
 * Get the application data directory
 */
export function getAppDataDir(): string {
    const appName = 'GitSwitch';

    switch (process.platform) {
        case 'win32':
            return path.join(process.env.APPDATA || getHomeDir(), appName);
        case 'darwin':
            return path.join(getHomeDir(), 'Library', 'Application Support', appName);
        default:
            // Linux and others
            const xdgData = process.env.XDG_DATA_HOME;
            if (xdgData) {
                return path.join(xdgData, appName);
            }
            return path.join(getHomeDir(), '.local', 'share', appName);
    }
}

/**
 * Get the backup directory path
 */
export function getBackupDir(): string {
    return path.join(getAppDataDir(), 'backups');
}

/**
 * Get the audit log directory path
 */
export function getAuditLogDir(): string {
    return path.join(getAppDataDir(), 'audit');
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        // Ignore if directory already exists
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw error;
        }
    }
}

/**
 * Check if a path exists
 */
export async function pathExists(targetPath: string): Promise<boolean> {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if a path is a directory
 */
export async function isDirectory(targetPath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(targetPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Check if a path is a file
 */
export async function isFile(filePath: string): Promise<boolean> {
    try {
        const stats = await fs.stat(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}

/**
 * Safely read a file, returning null if it doesn't exist
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        logger.error('Failed to read file', { filePath, error });
        throw error;
    }
}

/**
 * Get default directories to scan for repositories
 */
export function getDefaultScanDirs(): string[] {
    const home = getHomeDir();
    const dirs: string[] = [];

    switch (process.platform) {
        case 'win32':
            dirs.push(
                path.join(home, 'Documents'),
                path.join(home, 'Projects'),
                path.join(home, 'Source'),
                path.join(home, 'Repos'),
                path.join(home, 'dev'),
                'C:\\dev',
                'C:\\Projects',
                'D:\\Projects',
                'D:\\dev',
            );
            break;
        case 'darwin':
            dirs.push(
                path.join(home, 'Projects'),
                path.join(home, 'Developer'),
                path.join(home, 'dev'),
                path.join(home, 'Code'),
                path.join(home, 'Documents', 'Projects'),
            );
            break;
        default:
            // Linux
            dirs.push(
                path.join(home, 'Projects'),
                path.join(home, 'dev'),
                path.join(home, 'code'),
                path.join(home, 'repos'),
                '/opt/projects',
            );
    }

    return dirs;
}

/**
 * Normalize path separators for the current platform
 */
export function normalizePath(inputPath: string): string {
    return path.normalize(inputPath);
}

/**
 * Expand tilde (~) in path to home directory
 */
export function expandTilde(inputPath: string): string {
    if (inputPath.startsWith('~')) {
        return path.join(getHomeDir(), inputPath.slice(1));
    }
    return inputPath;
}
