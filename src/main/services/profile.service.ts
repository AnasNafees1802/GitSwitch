/**
 * Profile Service
 * 
 * Business logic for profile management.
 * Orchestrates profile creation, SSH config, and identity management.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger, getProfileColor } from '../utils';
import { secureStore } from './secure-store.service';
import { sshService } from './ssh.service';
import { auditService } from './audit.service';
import type {
    Profile,
    CreateProfileInput,
    UpdateProfileInput,
    DiscoveredIdentity,
} from '../../shared/types';

const logger = createLogger('ProfileService');

/**
 * Profile Service API
 */
export const profileService = {
    /**
     * Get all profiles
     */
    getAll(): Profile[] {
        return secureStore.getProfiles();
    },

    /**
     * Get a profile by ID
     */
    getById(id: string): Profile | undefined {
        return secureStore.getProfile(id);
    },

    /**
     * Get the default profile
     */
    getDefault(): Profile | undefined {
        const profiles = this.getAll();
        return profiles.find(p => p.isDefault) || profiles[0];
    },

    /**
     * Create a new profile
     */
    async create(input: CreateProfileInput): Promise<Profile> {
        logger.info('Creating profile', { label: input.label, provider: input.provider });

        // Generate SSH key if requested
        let sshKeyPath = input.sshKeyPath;
        let sshHostAlias: string | undefined;

        if (input.authType === 'ssh' && input.generateNewKey) {
            const key = await sshService.generateKey({
                email: input.email,
                label: input.label,
                type: 'ed25519',
            });
            sshKeyPath = key.privatePath;

            // Create SSH config entry for this profile
            sshHostAlias = `${input.provider}-${input.label.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            await sshService.upsertSSHConfigEntry({
                host: sshHostAlias,
                hostName: this.getProviderHostname(input.provider),
                user: 'git',
                identityFile: sshKeyPath,
                identitiesOnly: true,
            });
        }

        // Store token if provided
        const id = uuidv4();
        let tokenId: string | undefined;

        if (input.authType === 'https' && input.token) {
            tokenId = id;
            await secureStore.storeToken(id, input.token);
        }

        const now = new Date().toISOString();
        const existingProfiles = this.getAll();

        const profile: Profile = {
            id,
            label: input.label,
            provider: input.provider,
            username: input.username,
            email: input.email,
            authType: input.authType,
            sshKeyPath,
            sshHostAlias,
            tokenId,
            isDefault: input.isDefault || existingProfiles.length === 0,
            color: input.color || getProfileColor(existingProfiles.length),
            createdAt: now,
            updatedAt: now,
        };

        // If setting as default, unset other defaults
        if (profile.isDefault) {
            const profiles = this.getAll().map(p => ({ ...p, isDefault: false }));
            for (const p of profiles) {
                secureStore.saveProfile(p);
            }
        }

        secureStore.saveProfile(profile);
        await auditService.logProfileCreated(profile.id, profile.label);

        logger.info('Profile created', { id: profile.id, label: profile.label });
        return profile;
    },

    /**
     * Update an existing profile
     */
    async update(input: UpdateProfileInput): Promise<Profile | null> {
        const existing = secureStore.getProfile(input.id);

        if (!existing) {
            logger.error('Profile not found for update', { id: input.id });
            return null;
        }

        const changes: string[] = [];

        // Track changes
        if (input.label !== undefined && input.label !== existing.label) changes.push('label');
        if (input.email !== undefined && input.email !== existing.email) changes.push('email');
        if (input.username !== undefined && input.username !== existing.username) changes.push('username');
        if (input.provider !== undefined && input.provider !== existing.provider) changes.push('provider');
        if (input.authType !== undefined && input.authType !== existing.authType) changes.push('authType');
        if (input.sshKeyPath !== undefined && input.sshKeyPath !== existing.sshKeyPath) changes.push('sshKeyPath');

        // Update token if provided
        if (input.token) {
            await secureStore.storeToken(input.id, input.token);
            changes.push('token');
        }

        // Handle default change
        if (input.isDefault && !existing.isDefault) {
            const profiles = this.getAll().map(p => ({
                ...p,
                isDefault: p.id === input.id
            }));
            for (const p of profiles) {
                secureStore.saveProfile(p);
            }
            changes.push('isDefault');
        }

        const updated: Profile = {
            ...existing,
            label: input.label ?? existing.label,
            provider: input.provider ?? existing.provider,
            username: input.username ?? existing.username,
            email: input.email ?? existing.email,
            authType: input.authType ?? existing.authType,
            sshKeyPath: input.sshKeyPath ?? existing.sshKeyPath,
            isDefault: input.isDefault ?? existing.isDefault,
            color: input.color ?? existing.color,
            updatedAt: new Date().toISOString(),
        };

        secureStore.saveProfile(updated);
        await auditService.logProfileUpdated(updated.id, changes);

        logger.info('Profile updated', { id: updated.id, changes });
        return updated;
    },

    /**
     * Delete a profile
     */
    async delete(id: string): Promise<boolean> {
        const profile = secureStore.getProfile(id);

        if (!profile) {
            return false;
        }

        // Delete token if exists
        if (profile.tokenId) {
            await secureStore.deleteToken(profile.tokenId);
        }

        // Optionally remove SSH config entry
        if (profile.sshHostAlias) {
            await sshService.removeSSHConfigEntry(profile.sshHostAlias);
        }

        const success = secureStore.deleteProfile(id);

        if (success) {
            await auditService.logProfileDeleted(id);

            // If was default, set new default
            if (profile.isDefault) {
                const remaining = this.getAll();
                if (remaining.length > 0) {
                    this.setDefault(remaining[0].id);
                }
            }
        }

        logger.info('Profile deleted', { id });
        return success;
    },

    /**
     * Set default profile
     */
    setDefault(id: string): boolean {
        const profile = secureStore.getProfile(id);

        if (!profile) {
            return false;
        }

        secureStore.setDefaultProfile(id);
        return true;
    },

    /**
     * Switch global Git identity (one-click laptop-wide switch)
     * This changes ~/.gitconfig to use this profile's identity for all git operations
     */
    async switchGlobal(id: string): Promise<{ success: boolean; message: string }> {
        const profile = secureStore.getProfile(id);

        if (!profile) {
            return { success: false, message: 'Profile not found' };
        }

        logger.info('Switching global Git identity', { id, label: profile.label });

        try {
            // Import gitService here to avoid circular dependency
            const { gitService } = await import('./git.service');

            // Change the global git config
            await gitService.setGlobalConfig({
                email: profile.email,
                username: profile.username,
            });

            // Set this profile as default
            this.setDefault(id);

            await auditService.log('profile', 'global_switch', {
                profileId: id,
                label: profile.label,
                email: profile.email,
            });

            logger.info('Global Git identity switched', {
                profile: profile.label,
                email: profile.email
            });

            return {
                success: true,
                message: `Switched to ${profile.label} (${profile.email})`
            };
        } catch (error) {
            logger.error('Failed to switch global identity', error);
            return {
                success: false,
                message: (error as Error).message
            };
        }
    },

    /**
     * Get current global Git identity
     */
    async getCurrentGlobal(): Promise<{ email?: string; username?: string } | null> {
        try {
            const { gitService } = await import('./git.service');
            return await gitService.getGlobalConfig();
        } catch (error) {
            logger.error('Failed to get current global config', error);
            return null;
        }
    },

    /**
     * Import discovered identities as profiles
     */
    async importFromDiscovery(identities: DiscoveredIdentity[]): Promise<Profile[]> {
        const imported: Profile[] = [];

        for (const identity of identities) {
            if (!identity.selected) continue;

            try {
                const profile = await this.create({
                    label: identity.suggestedLabel || 'Imported',
                    provider: identity.provider || 'github',
                    username: identity.username || identity.email?.split('@')[0] || '',
                    email: identity.email || '',
                    authType: identity.sshKey ? 'ssh' : 'https',
                    sshKeyPath: identity.sshKey?.privatePath,
                    isDefault: imported.length === 0,
                });

                imported.push(profile);
            } catch (error) {
                logger.error('Failed to import identity', { identity, error });
            }
        }

        return imported;
    },

    /**
     * Get public key for a profile
     */
    async getPublicKey(profileId: string): Promise<string | null> {
        const profile = secureStore.getProfile(profileId);

        if (!profile || !profile.sshKeyPath) {
            return null;
        }

        return sshService.getPublicKey(profile.sshKeyPath);
    },

    /**
     * Get provider hostname
     */
    getProviderHostname(provider: string): string {
        const hostnames: Record<string, string> = {
            github: 'github.com',
            gitlab: 'gitlab.com',
            bitbucket: 'bitbucket.org',
            azure: 'ssh.dev.azure.com',
        };

        return hostnames[provider] || provider;
    },
};

export default profileService;
