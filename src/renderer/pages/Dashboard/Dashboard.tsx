/**
 * Dashboard Page
 * Main overview with one-click identity switching
 */

import { useState, useEffect } from 'react';
import { useProfiles, useRepositories } from '../../hooks';
import styles from './Dashboard.module.css';
import type { Profile } from '../../../../shared/types';

export default function Dashboard() {
    const { profiles, defaultProfile, refresh: refreshProfiles } = useProfiles();
    const { repositories, scanning, scan } = useRepositories();
    const [switching, setSwitching] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    // Get repos with mismatches or unbound
    const issueRepos = repositories.filter(r => r.hasMismatch || r.status === 'unbound');
    const boundRepos = repositories.filter(r => r.status === 'bound');

    // One-click global switch
    const handleSwitch = async (profile: Profile) => {
        if (switching) return;

        setSwitching(profile.id);
        setMessage(null);

        try {
            const result = await window.gitswitch.profiles.switchGlobal(profile.id);
            if (result.success) {
                setMessage({
                    type: 'success',
                    text: `✅ Switched to ${profile.label}! All new git commits will use ${profile.email}`
                });
                await refreshProfiles();
            } else {
                setMessage({ type: 'error', text: result.error?.message || 'Switch failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: (error as Error).message });
        } finally {
            setSwitching(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1>Dashboard</h1>
                    <p className="text-secondary">One-click identity switching for your entire laptop</p>
                </div>
                <button
                    className="btn btn-ghost"
                    onClick={() => setShowHelp(!showHelp)}
                >
                    {showHelp ? '✕ Close Help' : '❓ Help'}
                </button>
            </header>

            {/* Help Section */}
            {showHelp && (
                <section className={styles.helpSection}>
                    <h3>🎓 How GitSwitch Works</h3>
                    <div className={styles.helpGrid}>
                        <div className={styles.helpCard}>
                            <span className={styles.helpIcon}>🔄</span>
                            <h4>One-Click Switch</h4>
                            <p>Click any profile below to instantly change your <strong>entire laptop's</strong> Git identity. This updates your global ~/.gitconfig file.</p>
                        </div>
                        <div className={styles.helpCard}>
                            <span className={styles.helpIcon}>📁</span>
                            <h4>Per-Repo Binding</h4>
                            <p>Go to <strong>Repositories</strong> tab to bind specific repos to specific profiles. Those repos will always use that identity.</p>
                        </div>
                        <div className={styles.helpCard}>
                            <span className={styles.helpIcon}>🔍</span>
                            <h4>Repo Scanning</h4>
                            <p>We scan common folders: Documents, Projects, dev, D:\Projects. You can also manually add directories in Settings.</p>
                        </div>
                        <div className={styles.helpCard}>
                            <span className={styles.helpIcon}>🔐</span>
                            <h4>Your Keys Are Safe</h4>
                            <p>GitSwitch <strong>never reads</strong> your private keys. Only paths are stored. Tokens use Windows Credential Manager.</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Status Message */}
            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                </div>
            )}

            {/* Quick Switch Section */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    ⚡ Quick Switch (One Click = Entire Laptop)
                </h3>
                <p className={styles.sectionDesc}>
                    Click a profile to instantly switch your global Git identity. All new commits anywhere will use that email/name.
                </p>

                {profiles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No profiles yet. Create one to get started!</p>
                        <a href="/profiles" className="btn btn-primary">Create Profile</a>
                    </div>
                ) : (
                    <div className={styles.switchGrid}>
                        {profiles.map(profile => (
                            <button
                                key={profile.id}
                                className={`${styles.switchCard} ${profile.isDefault ? styles.active : ''}`}
                                onClick={() => handleSwitch(profile)}
                                disabled={switching !== null}
                            >
                                <div
                                    className={styles.switchDot}
                                    style={{ backgroundColor: profile.color }}
                                />
                                <div className={styles.switchInfo}>
                                    <span className={styles.switchLabel}>{profile.label}</span>
                                    <span className={styles.switchEmail}>{profile.email}</span>
                                </div>
                                {profile.isDefault && <span className={styles.activeBadge}>ACTIVE</span>}
                                {switching === profile.id && (
                                    <span className={styles.switchSpinner}>⟳</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Current Identity Card */}
            <section className={styles.section}>
                <div className={styles.identityCard}>
                    <div className={styles.identityHeader}>
                        <span className={styles.identityLabel}>Current Global Identity</span>
                        <span className="badge badge-success">Active in ~/.gitconfig</span>
                    </div>

                    {defaultProfile ? (
                        <div className={styles.identityContent}>
                            <div
                                className={styles.identityAvatar}
                                style={{ backgroundColor: defaultProfile.color }}
                            >
                                {defaultProfile.label.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.identityInfo}>
                                <h2 className={styles.identityName}>{defaultProfile.label}</h2>
                                <p className={styles.identityEmail}>{defaultProfile.email}</p>
                                <p className={styles.identityProvider}>
                                    {defaultProfile.provider.charAt(0).toUpperCase() + defaultProfile.provider.slice(1)} • {defaultProfile.authType.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>No profile configured</p>
                            <a href="/profiles" className="btn btn-primary">Create Profile</a>
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Row */}
            <section className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{profiles.length}</span>
                    <span className={styles.statLabel}>Profiles</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{repositories.length}</span>
                    <span className={styles.statLabel}>Repositories</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{boundRepos.length}</span>
                    <span className={styles.statLabel}>Configured</span>
                </div>
                <div className={`${styles.statCard} ${issueRepos.length > 0 ? styles.statWarning : ''}`}>
                    <span className={styles.statValue}>{issueRepos.length}</span>
                    <span className={styles.statLabel}>Need Attention</span>
                </div>
            </section>

            {/* Quick Actions */}
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Quick Actions</h3>
                <div className={styles.quickActions}>
                    <button
                        className="btn btn-secondary"
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
                                Scan for Repos
                            </>
                        )}
                    </button>
                    <a href="/profiles" className="btn btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0z" />
                            <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z" />
                        </svg>
                        Add Profile
                    </a>
                </div>
            </section>

            {/* Repos Needing Attention */}
            {issueRepos.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent-orange)">
                            <path d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" />
                        </svg>
                        Repositories Need Attention
                    </h3>
                    <div className={styles.repoList}>
                        {issueRepos.slice(0, 5).map(repo => (
                            <div key={repo.path} className={styles.repoItem}>
                                <div className={styles.repoInfo}>
                                    <span className={styles.repoName}>{repo.name}</span>
                                    <span className={styles.repoPath}>{repo.path}</span>
                                </div>
                                <span className={`badge ${repo.hasMismatch ? 'badge-warning' : 'badge-info'}`}>
                                    {repo.hasMismatch ? 'Mismatch' : 'Unbound'}
                                </span>
                            </div>
                        ))}
                    </div>
                    {issueRepos.length > 5 && (
                        <a href="/repositories" className={styles.viewMore}>
                            View all {issueRepos.length} repositories →
                        </a>
                    )}
                </section>
            )}
        </div>
    );
}
