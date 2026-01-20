/**
 * Secure Store Service
 * 
 * Handles secure storage of application data:
 * - Non-sensitive data: electron-store (encrypted)
 * - Sensitive data (tokens): OS keychain via keytar
 */

import Store from 'electron-store';
import * as keytar from 'keytar';
import { createLogger } from '../utils';
import type { Profile, AppSettings, Repository } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/types/settings';

const logger = createLogger('SecureStore');

// Keytar service name
const KEYTAR_SERVICE = 'GitSwitch';

// Store schema for type safety
interface StoreSchema {
    profiles: Profile[];
    repositories: Repository[];
    settings: AppSettings;
    version: number;
}

// Initialize encrypted store
const store = new Store<StoreSchema>({
    name: 'gitswitch-data',
    encryptionKey: 'gitswitch-local-encryption-key', // For local storage encryption
    defaults: {
        profiles: [],
        repositories: [],
        settings: {
            theme: 'dark',
            autoScanOnStartup: true,
            showMismatchWarnings: true,
            defaultScanDirs: [],
            backupRetentionDays: 30,
            enablePrePushHook: false,
            firstRunComplete: false,
        },
        version: 1,
    },
});

/**
 * Secure Store API
 */
export const secureStore = {
    // ============================================
    // Profile Operations
    // ============================================

    /**
     * Get all profiles
     */
    getProfiles(): Profile[] {
        try {
            return store.get('profiles', []);
        } catch (error) {
            logger.error('Failed to get profiles', error);
            return [];
        }
    },

    /**
     * Get a specific profile by ID
     */
    getProfile(id: string): Profile | undefined {
        const profiles = this.getProfiles();
        return profiles.find(p => p.id === id);
    },

    /**
     * Save a profile
     */
    saveProfile(profile: Profile): void {
        const profiles = this.getProfiles();
        const index = profiles.findIndex(p => p.id === profile.id);

        if (index >= 0) {
            profiles[index] = profile;
        } else {
            profiles.push(profile);
        }

        store.set('profiles', profiles);
        logger.info('Profile saved', { id: profile.id, label: profile.label });
    },

    /**
     * Delete a profile
     */
    deleteProfile(id: string): boolean {
        const profiles = this.getProfiles();
        const filtered = profiles.filter(p => p.id !== id);

        if (filtered.length !== profiles.length) {
            store.set('profiles', filtered);
            logger.info('Profile deleted', { id });
            return true;
        }
        return false;
    },

    /**
     * Set default profile
     */
    setDefaultProfile(id: string): void {
        const profiles = this.getProfiles().map(p => ({
            ...p,
            isDefault: p.id === id,
        }));
        store.set('profiles', profiles);
        logger.info('Default profile set', { id });
    },

    // ============================================
    // Repository Operations
    // ============================================

    /**
     * Get all repositories
     */
    getRepositories(): Repository[] {
        try {
            return store.get('repositories', []);
        } catch (error) {
            logger.error('Failed to get repositories', error);
            return [];
        }
    },

    /**
     * Get a specific repository by path
     */
    getRepository(path: string): Repository | undefined {
        const repos = this.getRepositories();
        return repos.find(r => r.path === path);
    },

    /**
     * Save a repository
     */
    saveRepository(repo: Repository): void {
        const repos = this.getRepositories();
        const index = repos.findIndex(r => r.path === repo.path);

        if (index >= 0) {
            repos[index] = repo;
        } else {
            repos.push(repo);
        }

        store.set('repositories', repos);
        logger.info('Repository saved', { path: repo.path, name: repo.name });
    },

    /**
     * Save multiple repositories
     */
    saveRepositories(repos: Repository[]): void {
        const existing = this.getRepositories();
        const merged = [...existing];

        for (const repo of repos) {
            const index = merged.findIndex(r => r.path === repo.path);
            if (index >= 0) {
                merged[index] = repo;
            } else {
                merged.push(repo);
            }
        }

        store.set('repositories', merged);
        logger.info('Repositories saved', { count: repos.length });
    },

    /**
     * Delete a repository
     */
    deleteRepository(path: string): boolean {
        const repos = this.getRepositories();
        const filtered = repos.filter(r => r.path !== path);

        if (filtered.length !== repos.length) {
            store.set('repositories', filtered);
            logger.info('Repository deleted', { path });
            return true;
        }
        return false;
    },

    // ============================================
    // Settings Operations
    // ============================================

    /**
     * Get application settings
     */
    getSettings(): AppSettings {
        return store.get('settings');
    },

    /**
     * Update application settings
     */
    updateSettings(settings: Partial<AppSettings>): AppSettings {
        const current = this.getSettings();
        const updated = { ...current, ...settings };
        store.set('settings', updated);
        logger.info('Settings updated', Object.keys(settings));
        return updated;
    },

    // ============================================
    // Token Operations (via OS Keychain)
    // ============================================

    /**
     * Store a token securely
     */
    async storeToken(profileId: string, token: string): Promise<void> {
        try {
            await keytar.setPassword(KEYTAR_SERVICE, profileId, token);
            logger.info('Token stored securely', { profileId });
        } catch (error) {
            logger.error('Failed to store token', { profileId, error });
            throw new Error('Failed to store token in secure storage');
        }
    },

    /**
     * Retrieve a token
     */
    async getToken(profileId: string): Promise<string | null> {
        try {
            return await keytar.getPassword(KEYTAR_SERVICE, profileId);
        } catch (error) {
            logger.error('Failed to get token', { profileId, error });
            return null;
        }
    },

    /**
     * Delete a token
     */
    async deleteToken(profileId: string): Promise<boolean> {
        try {
            return await keytar.deletePassword(KEYTAR_SERVICE, profileId);
        } catch (error) {
            logger.error('Failed to delete token', { profileId, error });
            return false;
        }
    },

    // ============================================
    // Utility
    // ============================================

    /**
     * Get store path (for debugging)
     */
    getStorePath(): string {
        return store.path;
    },

    /**
     * Clear all data (for testing/reset)
     */
    clearAll(): void {
        store.clear();
        logger.warn('All store data cleared');
    },
};

export default secureStore;
