/**
 * useProfiles Hook
 * Manages profiles state
 */

import { useState, useEffect, useCallback } from 'react';
import type { Profile, CreateProfileInput, UpdateProfileInput } from '../../../shared/types';

interface UseProfilesResult {
    profiles: Profile[];
    defaultProfile: Profile | null;
    loading: boolean;
    error: string | null;
    createProfile: (input: CreateProfileInput) => Promise<Profile>;
    updateProfile: (input: UpdateProfileInput) => Promise<Profile>;
    deleteProfile: (id: string) => Promise<void>;
    setDefaultProfile: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useProfiles(): UseProfilesResult {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.gitswitch.profiles.list();

            if (result.success) {
                setProfiles(result.data as Profile[]);
            } else {
                setError(result.error?.message || 'Failed to load profiles');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createProfile = useCallback(async (input: CreateProfileInput): Promise<Profile> => {
        const result = await window.gitswitch.profiles.create(input);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to create profile');
        }

        await fetchProfiles();
        return result.data as Profile;
    }, [fetchProfiles]);

    const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<Profile> => {
        const result = await window.gitswitch.profiles.update(input);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to update profile');
        }

        await fetchProfiles();
        return result.data as Profile;
    }, [fetchProfiles]);

    const deleteProfile = useCallback(async (id: string): Promise<void> => {
        const result = await window.gitswitch.profiles.delete(id);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to delete profile');
        }

        await fetchProfiles();
    }, [fetchProfiles]);

    const setDefaultProfile = useCallback(async (id: string): Promise<void> => {
        const result = await window.gitswitch.profiles.setDefault(id);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to set default profile');
        }

        await fetchProfiles();
    }, [fetchProfiles]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0] || null;

    return {
        profiles,
        defaultProfile,
        loading,
        error,
        createProfile,
        updateProfile,
        deleteProfile,
        setDefaultProfile,
        refresh: fetchProfiles,
    };
}
