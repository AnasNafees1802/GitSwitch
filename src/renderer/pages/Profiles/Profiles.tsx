/**
 * Profiles Page
 * Manage Git identity profiles
 */

import { useState } from 'react';
import { useProfiles } from '../../hooks';
import ProfileForm from '../../components/ProfileForm/ProfileForm';
import styles from './Profiles.module.css';
import type { Profile, CreateProfileInput } from '../../../../shared/types';

export default function Profiles() {
    const { profiles, loading, createProfile, updateProfile, deleteProfile, setDefaultProfile } = useProfiles();
    const [showForm, setShowForm] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (input: CreateProfileInput) => {
        try {
            setError(null);
            await createProfile(input);
            setShowForm(false);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleDelete = async (id: string, label: string) => {
        if (!confirm(`Are you sure you want to delete "${label}"?`)) return;

        try {
            setError(null);
            await deleteProfile(id);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            setError(null);
            await setDefaultProfile(id);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const copyPublicKey = async (profile: Profile) => {
        if (!profile.sshKeyPath) return;

        try {
            const result = await window.gitswitch.ssh.getPublicKey(profile.sshKeyPath);
            if (result.success && result.data) {
                const data = result.data as { publicKey: string };
                await navigator.clipboard.writeText(data.publicKey);
                alert('Public key copied to clipboard!');
            }
        } catch (err) {
            alert('Failed to copy public key');
        }
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
        <div className={styles.profiles}>
            <header className={styles.header}>
                <div>
                    <h1>Profiles</h1>
                    <p className="text-secondary">Manage your Git identities</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0z" />
                        <path d="M8 4a.75.75 0 01.75.75v2.5h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5A.75.75 0 018 4z" />
                    </svg>
                    Add Profile
                </button>
            </header>

            {error && (
                <div className={styles.error}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM1.5 8a6.5 6.5 0 1013 0 6.5 6.5 0 00-13 0z" />
                        <path d="M6.5 6.5a.5.5 0 011 0v2.5a.5.5 0 01-1 0v-2.5zM7 11a1 1 0 112 0 1 1 0 01-2 0z" />
                    </svg>
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            {showForm && (
                <ProfileForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {profiles.length === 0 ? (
                <div className={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 16 16" fill="var(--text-muted)">
                        <path d="M10.561 8.073a6.005 6.005 0 013.432 5.142.75.75 0 11-1.498.07 4.5 4.5 0 00-8.99 0 .75.75 0 11-1.498-.07 6.004 6.004 0 013.431-5.142 3.999 3.999 0 115.123 0zM10.5 5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3>No Profiles Yet</h3>
                    <p>Create your first Git identity profile to get started.</p>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        Create Profile
                    </button>
                </div>
            ) : (
                <div className={styles.profileGrid}>
                    {profiles.map(profile => (
                        <div key={profile.id} className={styles.profileCard}>
                            <div className={styles.profileHeader}>
                                <div
                                    className={styles.profileAvatar}
                                    style={{ backgroundColor: profile.color }}
                                >
                                    {profile.label.charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.profileBadges}>
                                    {profile.isDefault && (
                                        <span className="badge badge-success">Default</span>
                                    )}
                                    <span className="badge">
                                        {profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.profileBody}>
                                <h3 className={styles.profileLabel}>{profile.label}</h3>
                                <p className={styles.profileEmail}>{profile.email}</p>
                                <p className={styles.profileUsername}>@{profile.username}</p>
                                <p className={styles.profileAuth}>
                                    {profile.authType === 'ssh' ? '🔑 SSH Key' : '🔒 HTTPS Token'}
                                </p>
                            </div>

                            <div className={styles.profileActions}>
                                {!profile.isDefault && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => handleSetDefault(profile.id)}
                                    >
                                        Set Default
                                    </button>
                                )}
                                {profile.sshKeyPath && (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => copyPublicKey(profile)}
                                    >
                                        Copy Key
                                    </button>
                                )}
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(profile.id, profile.label)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
