/**
 * Settings Page
 */

import { useState } from 'react';
import { useSettings } from '../../hooks';
import styles from './Settings.module.css';

export default function Settings() {
    const { settings, updateSettings, loading } = useSettings();
    const [saving, setSaving] = useState(false);

    const handleToggle = async (key: string, value: boolean) => {
        setSaving(true);
        try {
            await updateSettings({ [key]: value });
        } finally {
            setSaving(false);
        }
    };

    const openBackupFolder = async () => {
        // The backup folder is in the app data directory
        await window.gitswitch.util.openPath('');
    };

    const exportLogs = async () => {
        const result = await window.gitswitch.audit.export();
        if (result.success && (result.data as { exported: boolean }).exported) {
            alert('Audit logs exported successfully!');
        }
    };

    if (loading || !settings) {
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
        <div className={styles.settings}>
            <header className={styles.header}>
                <h1>Settings</h1>
                <p className="text-secondary">Configure GitSwitch behavior</p>
            </header>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>General</h3>

                <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>Auto-scan on startup</span>
                        <span className={styles.settingDescription}>
                            Automatically scan for new repositories when GitSwitch starts
                        </span>
                    </div>
                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={settings.autoScanOnStartup}
                            onChange={e => handleToggle('autoScanOnStartup', e.target.checked)}
                            disabled={saving}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>

                <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>Show mismatch warnings</span>
                        <span className={styles.settingDescription}>
                            Display warnings when repository identity doesn't match the bound profile
                        </span>
                    </div>
                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={settings.showMismatchWarnings}
                            onChange={e => handleToggle('showMismatchWarnings', e.target.checked)}
                            disabled={saving}
                        />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Safety</h3>

                <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                        <span className={styles.settingLabel}>Backup retention</span>
                        <span className={styles.settingDescription}>
                            Number of days to keep configuration backups
                        </span>
                    </div>
                    <select
                        className="form-select"
                        value={settings.backupRetentionDays}
                        onChange={e => handleToggle('backupRetentionDays', parseInt(e.target.value) as unknown as boolean)}
                    >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                    </select>
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Data</h3>

                <div className={styles.buttonGroup}>
                    <button className="btn btn-secondary" onClick={exportLogs}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2.75 14A1.75 1.75 0 011 12.25v-2.5a.75.75 0 011.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25v-2.5a.75.75 0 011.5 0v2.5A1.75 1.75 0 0113.25 14H2.75z" />
                            <path d="M7.25 7.689V2a.75.75 0 011.5 0v5.689l1.97-1.969a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 6.78a.75.75 0 011.06-1.06l1.97 1.969z" />
                        </svg>
                        Export Audit Logs
                    </button>
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>About</h3>

                <div className={styles.about}>
                    <p><strong>GitSwitch</strong> v1.0.0</p>
                    <p className="text-muted">One laptop. Many Git accounts. Zero confusion.</p>
                    <p className="text-muted" style={{ marginTop: 'var(--space-md)' }}>
                        Built with ❤️ for developers who juggle multiple Git identities
                    </p>
                </div>
            </section>
        </div>
    );
}
