/**
 * Repositories Page
 * Manage repository bindings to profiles
 */

import { useState } from 'react';
import { useRepositories, useProfiles } from '../../hooks';
import styles from './Repositories.module.css';
import type { Repository } from '../../../../shared/types';

export default function Repositories() {
    const { repositories, loading, scanning, scan, scanDirectory, bind } = useRepositories();
    const { profiles } = useProfiles();
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
    const [bindingProfile, setBindingProfile] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleBind = async () => {
        if (!selectedRepo || !bindingProfile) return;

        try {
            setError(null);
            await bind(selectedRepo.path, bindingProfile);
            setSelectedRepo(null);
            setBindingProfile('');
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const getProfileForRepo = (repo: Repository) => {
        if (!repo.boundProfileId) return null;
        return profiles.find(p => p.id === repo.boundProfileId);
    };

    const openInExplorer = async (path: string) => {
        await window.gitswitch.util.openPath(path);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="animate-spin" style={{
                    width: 32,
                    height: 32,
                    border: '3px solid var(--border-primary)',
                    borderTopColor: 'var(--accent-blue)',
                    borderRadius: '50%'
                }} />
            </div>
        );
    }

    return (
        <div className={styles.repositories}>
            <header className={styles.header}>
                <div>
                    <h1>Repositories</h1>
                    <p className="text-secondary">Bind your repositories to profiles</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className="btn btn-secondary"
                        onClick={scanDirectory}
                        disabled={scanning}
                        title="Choose a specific folder to scan"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M1.75 1A1.75 1.75 0 000 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0016 13.25v-8.5A1.75 1.75 0 0014.25 3H7.5a.25.25 0 01-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75z" />
                        </svg>
                        Select Folder
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={scan}
                        disabled={scanning}
                    >
                        {scanning ? (
                            <>
                                <span className="animate-spin">⟳</span>
                                Scanning...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M8 2.5a5.5 5.5 0 105.5 5.5.75.75 0 011.5 0 7 7 0 11-7-7 .75.75 0 010 1.5z" />
                                    <path d="M10.5 1.75A.75.75 0 0111.25 1h3a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V2.5h-2.5a.75.75 0 01-.75-.75z" />
                                </svg>
                                Auto Scan
                            </>
                        )}
                    </button>
                </div>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {selectedRepo && (
                <div className={styles.bindModal}>
                    <div className={styles.bindContent}>
                        <h3>Bind Repository</h3>
                        <p>Select a profile for <strong>{selectedRepo.name}</strong></p>

                        <select
                            className="form-select w-full"
                            value={bindingProfile}
                            onChange={e => setBindingProfile(e.target.value)}
                        >
                            <option value="">Select a profile...</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.label} ({p.email})</option>
                            ))}
                        </select>

                        <div className={styles.bindActions}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSelectedRepo(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleBind}
                                disabled={!bindingProfile}
                            >
                                Bind Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {repositories.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 16 16" fill="var(--text-muted)">
                        <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
                    </svg>
                    <h3>No Repositories Found</h3>
                    <p>Click "Scan for Repos" to discover Git repositories on your system.</p>
                    <button className="btn btn-primary" onClick={scan} disabled={scanning}>
                        {scanning ? 'Scanning...' : 'Scan for Repos'}
                    </button>
                </div>
            ) : (
                <div className={styles.repoGrid}>
                    {repositories.map(repo => {
                        const boundProfile = getProfileForRepo(repo);

                        return (
                            <div
                                key={repo.path}
                                className={`${styles.repoCard} ${repo.hasMismatch ? styles.mismatch : ''}`}
                            >
                                <div className={styles.repoHeader}>
                                    <div className={styles.repoIcon}>📁</div>
                                    <div className={styles.repoStatus}>
                                        {repo.status === 'bound' && (
                                            <span className="badge badge-success">Configured</span>
                                        )}
                                        {repo.status === 'unbound' && (
                                            <span className="badge badge-info">Unbound</span>
                                        )}
                                        {repo.hasMismatch && (
                                            <span className="badge badge-warning">Mismatch</span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.repoBody}>
                                    <h3 className={styles.repoName}>{repo.name}</h3>
                                    <p className={styles.repoPath}>{repo.path}</p>

                                    {repo.detectedProvider && (
                                        <span className={styles.repoProvider}>
                                            {repo.detectedProvider.charAt(0).toUpperCase() + repo.detectedProvider.slice(1)}
                                        </span>
                                    )}

                                    {boundProfile && (
                                        <div className={styles.boundProfile}>
                                            <div
                                                className={styles.profileDot}
                                                style={{ backgroundColor: boundProfile.color }}
                                            />
                                            <span>{boundProfile.label}</span>
                                        </div>
                                    )}

                                    {repo.localEmail && !boundProfile && (
                                        <p className={styles.localConfig}>
                                            Using: {repo.localEmail}
                                        </p>
                                    )}
                                </div>

                                <div className={styles.repoActions}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setSelectedRepo(repo)}
                                    >
                                        {boundProfile ? 'Change' : 'Bind Profile'}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => openInExplorer(repo.path)}
                                    >
                                        Open
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
