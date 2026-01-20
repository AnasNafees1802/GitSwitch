/**
 * useRepositories Hook
 * Manages repositories state
 */

import { useState, useEffect, useCallback } from 'react';
import type { Repository } from '../../../shared/types';

interface UseRepositoriesResult {
    repositories: Repository[];
    loading: boolean;
    scanning: boolean;
    error: string | null;
    scan: () => Promise<void>;
    scanDirectory: () => Promise<void>;  // New: scan a specific folder
    bind: (repoPath: string, profileId: string) => Promise<void>;
    unbind: (repoPath: string) => Promise<void>;
    validate: (repoPath: string) => Promise<{ success: boolean; message: string }>;
    refresh: () => Promise<void>;
}

export function useRepositories(): UseRepositoriesResult {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepositories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await window.gitswitch.repos.list();

            if (result.success) {
                setRepositories(result.data as Repository[]);
            } else {
                setError(result.error?.message || 'Failed to load repositories');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const scan = useCallback(async () => {
        try {
            setScanning(true);
            setError(null);
            const result = await window.gitswitch.repos.scan();

            if (result.success) {
                const data = result.data as { repositories: Repository[] };
                setRepositories(data.repositories);
            } else {
                setError(result.error?.message || 'Failed to scan repositories');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setScanning(false);
        }
    }, []);

    // New: Scan a user-selected directory
    const scanDirectory = useCallback(async () => {
        try {
            // Open folder picker dialog
            const result = await window.gitswitch.util.selectDirectory();

            if (!result.success || !result.data) {
                // User cancelled
                return;
            }

            const selectedPath = result.data as string;

            setScanning(true);
            setError(null);

            // Scan with the selected directory
            const scanResult = await window.gitswitch.repos.scan({
                additionalRepoDirs: [selectedPath]
            });

            if (scanResult.success) {
                const data = scanResult.data as { repositories: Repository[] };
                setRepositories(data.repositories);
            } else {
                setError(scanResult.error?.message || 'Failed to scan directory');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setScanning(false);
        }
    }, []);

    const bind = useCallback(async (repoPath: string, profileId: string) => {
        const result = await window.gitswitch.repos.bind(repoPath, profileId);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to bind repository');
        }

        await fetchRepositories();
    }, [fetchRepositories]);

    const unbind = useCallback(async (repoPath: string) => {
        const result = await window.gitswitch.repos.unbind(repoPath);

        if (!result.success) {
            throw new Error(result.error?.message || 'Failed to unbind repository');
        }

        await fetchRepositories();
    }, [fetchRepositories]);

    const validate = useCallback(async (repoPath: string) => {
        const result = await window.gitswitch.repos.validate(repoPath);

        if (!result.success) {
            return { success: false, message: result.error?.message || 'Validation failed' };
        }

        return result.data as { success: boolean; message: string };
    }, []);

    useEffect(() => {
        fetchRepositories();
    }, [fetchRepositories]);

    return {
        repositories,
        loading,
        scanning,
        error,
        scan,
        scanDirectory,
        bind,
        unbind,
        validate,
        refresh: fetchRepositories,
    };
}
