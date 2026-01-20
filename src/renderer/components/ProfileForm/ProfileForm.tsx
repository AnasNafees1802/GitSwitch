/**
 * Profile Form Component
 * Create or edit a profile
 */

import { useState } from 'react';
import styles from './ProfileForm.module.css';
import type { CreateProfileInput, GitProvider, AuthType } from '../../../../shared/types';

interface ProfileFormProps {
    onSubmit: (input: CreateProfileInput) => Promise<void>;
    onCancel: () => void;
    initialData?: Partial<CreateProfileInput>;
}

const PROVIDERS: { value: GitProvider; label: string }[] = [
    { value: 'github', label: 'GitHub' },
    { value: 'gitlab', label: 'GitLab' },
    { value: 'bitbucket', label: 'Bitbucket' },
    { value: 'azure', label: 'Azure DevOps' },
    { value: 'custom', label: 'Custom' },
];

export default function ProfileForm({ onSubmit, onCancel, initialData }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [label, setLabel] = useState(initialData?.label || '');
    const [provider, setProvider] = useState<GitProvider>(initialData?.provider || 'github');
    const [username, setUsername] = useState(initialData?.username || '');
    const [email, setEmail] = useState(initialData?.email || '');
    const [authType, setAuthType] = useState<AuthType>(initialData?.authType || 'ssh');
    const [generateNewKey, setGenerateNewKey] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!label.trim()) {
            setError('Profile name is required');
            return;
        }
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!username.trim()) {
            setError('Username is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await onSubmit({
                label: label.trim(),
                provider,
                username: username.trim(),
                email: email.trim(),
                authType,
                generateNewKey: authType === 'ssh' && generateNewKey,
            });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Create Profile</h2>
                    <button className={styles.closeBtn} onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Profile Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g., Personal, Work, Freelance"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                        />
                        <span className="form-hint">A friendly name for this identity</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Provider</label>
                        <select
                            className="form-select"
                            value={provider}
                            onChange={e => setProvider(e.target.value as GitProvider)}
                        >
                            {PROVIDERS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <span className="form-hint">This will appear on your Git commits</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="your-username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Authentication</label>
                        <div className={styles.authOptions}>
                            <label className={`${styles.authOption} ${authType === 'ssh' ? styles.selected : ''}`}>
                                <input
                                    type="radio"
                                    name="authType"
                                    value="ssh"
                                    checked={authType === 'ssh'}
                                    onChange={() => setAuthType('ssh')}
                                />
                                <div>
                                    <strong>🔑 SSH Key</strong>
                                    <span>Recommended for most users</span>
                                </div>
                            </label>
                            <label className={`${styles.authOption} ${authType === 'https' ? styles.selected : ''}`}>
                                <input
                                    type="radio"
                                    name="authType"
                                    value="https"
                                    checked={authType === 'https'}
                                    onChange={() => setAuthType('https')}
                                />
                                <div>
                                    <strong>🔒 HTTPS Token</strong>
                                    <span>Personal access token</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {authType === 'ssh' && (
                        <div className="form-group">
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={generateNewKey}
                                    onChange={e => setGenerateNewKey(e.target.checked)}
                                />
                                <span>Generate a new SSH key for this profile</span>
                            </label>
                            <span className="form-hint">
                                A new ED25519 key will be created. You'll need to add it to your {provider} account.
                            </span>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
