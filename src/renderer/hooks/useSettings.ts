/**
 * useSettings Hook
 * Manages application settings state
 */

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../../../shared/types';

interface UseSettingsResult {
    settings: AppSettings | null;
    loading: boolean;
    error: string | null;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.gitswitch.settings.get();

            if (result.success) {
                setSettings(result.data as AppSettings);
            } else {
                setError(result.error?.message || 'Failed to load settings');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
        try {
            setError(null);
            const result = await window.gitswitch.settings.update(newSettings);

            if (result.success) {
                setSettings(result.data as AppSettings);
            } else {
                setError(result.error?.message || 'Failed to update settings');
                throw new Error(result.error?.message);
            }
        } catch (err) {
            setError((err as Error).message);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        error,
        updateSettings,
        refresh: fetchSettings,
    };
}
