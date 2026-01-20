/**
 * Onboarding Page
 * First-run experience with identity discovery
 */

import { useState } from 'react';
import { useSettings } from '../../hooks';
import styles from './Onboarding.module.css';
import type { DiscoveryResult, DiscoveredIdentity } from '../../../../shared/types';

type Step = 'welcome' | 'discovery' | 'import' | 'complete';

export default function Onboarding() {
    const { updateSettings } = useSettings();
    const [step, setStep] = useState<Step>('welcome');
    const [discovering, setDiscovering] = useState(false);
    const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
    const [selectedIdentities, setSelectedIdentities] = useState<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);

    const startDiscovery = async () => {
        setDiscovering(true);
        try {
            const result = await window.gitswitch.discovery.start({});
            if (result.success) {
                const data = result.data as DiscoveryResult;
                setDiscoveryResult(data);

                // Auto-select all identities
                const ids = new Set(data.identities.map(i => i.id));
                setSelectedIdentities(ids);

                setStep(data.identities.length > 0 ? 'import' : 'complete');
            }
        } catch (error) {
            console.error('Discovery failed:', error);
        } finally {
            setDiscovering(false);
        }
    };

    const toggleIdentity = (id: string) => {
        const newSelected = new Set(selectedIdentities);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIdentities(newSelected);
    };

    const importIdentities = async () => {
        if (!discoveryResult) return;

        setImporting(true);
        try {
            const toImport = discoveryResult.identities
                .filter(i => selectedIdentities.has(i.id))
                .map(i => ({ ...i, selected: true }));

            await window.gitswitch.discovery.import(toImport);
            setStep('complete');
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setImporting(false);
        }
    };

    const finishOnboarding = async () => {
        await updateSettings({ firstRunComplete: true });
        window.location.reload();
    };

    return (
        <div className={styles.onboarding}>
            <div className={styles.container}>
                {/* Progress indicator */}
                <div className={styles.progress}>
                    <div className={`${styles.dot} ${step === 'welcome' ? styles.active : styles.done}`} />
                    <div className={styles.line} />
                    <div className={`${styles.dot} ${step === 'discovery' ? styles.active : step === 'import' || step === 'complete' ? styles.done : ''}`} />
                    <div className={styles.line} />
                    <div className={`${styles.dot} ${step === 'import' ? styles.active : step === 'complete' ? styles.done : ''}`} />
                    <div className={styles.line} />
                    <div className={`${styles.dot} ${step === 'complete' ? styles.active : ''}`} />
                </div>

                {/* Welcome Step */}
                {step === 'welcome' && (
                    <div className={styles.step}>
                        <div className={styles.icon}>
                            <svg width="64" height="64" viewBox="0 0 16 16" fill="var(--accent-green)">
                                <path d="M8.186 1.113a.5.5 0 00-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 011.114 0l7.129 2.852A.5.5 0 0116 3.5v8.662a1 1 0 01-.629.928l-7.185 2.874a.5.5 0 01-.372 0L.63 13.09a1 1 0 01-.629-.928V3.5a.5.5 0 01.314-.464L7.443.184z" />
                            </svg>
                        </div>
                        <h1>Welcome to GitSwitch</h1>
                        <p className={styles.subtitle}>
                            One laptop. Many Git accounts. Zero confusion.
                        </p>
                        <p className={styles.description}>
                            Let's set up your Git identities so you never accidentally commit
                            with the wrong account again.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => { setStep('discovery'); startDiscovery(); }}
                        >
                            Get Started
                        </button>
                    </div>
                )}

                {/* Discovery Step */}
                {step === 'discovery' && (
                    <div className={styles.step}>
                        <div className={styles.spinner}>
                            <div className="animate-spin" style={{
                                width: 48,
                                height: 48,
                                border: '3px solid var(--border-primary)',
                                borderTopColor: 'var(--accent-blue)',
                                borderRadius: '50%'
                            }} />
                        </div>
                        <h2>Discovering Identities</h2>
                        <p className={styles.description}>
                            Scanning your system for existing SSH keys, Git configurations,
                            and repositories...
                        </p>
                    </div>
                )}

                {/* Import Step */}
                {step === 'import' && discoveryResult && (
                    <div className={styles.step}>
                        <h2>We Found {discoveryResult.identities.length} Identities</h2>
                        <p className={styles.description}>
                            Select which identities you'd like to import as profiles.
                        </p>

                        <div className={styles.identityList}>
                            {discoveryResult.identities.map(identity => (
                                <label
                                    key={identity.id}
                                    className={`${styles.identityItem} ${selectedIdentities.has(identity.id) ? styles.selected : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIdentities.has(identity.id)}
                                        onChange={() => toggleIdentity(identity.id)}
                                    />
                                    <div className={styles.identityInfo}>
                                        <span className={styles.identityLabel}>
                                            {identity.suggestedLabel || 'Unknown'}
                                        </span>
                                        <span className={styles.identityEmail}>
                                            {identity.email || 'No email'}
                                        </span>
                                        <span className={styles.identitySource}>
                                            {identity.source === 'ssh_key' && '🔑 SSH Key'}
                                            {identity.source === 'git_config' && '⚙️ Git Config'}
                                            {identity.source === 'ssh_config' && '📝 SSH Config'}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className={styles.summary}>
                            <p>Also found:</p>
                            <ul>
                                <li>{discoveryResult.sshKeys.length} SSH keys</li>
                                <li>{discoveryResult.repositories.length} repositories</li>
                            </ul>
                        </div>

                        <div className={styles.actions}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setStep('complete')}
                            >
                                Skip
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={importIdentities}
                                disabled={selectedIdentities.size === 0 || importing}
                            >
                                {importing ? 'Importing...' : `Import ${selectedIdentities.size} Profiles`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Complete Step */}
                {step === 'complete' && (
                    <div className={styles.step}>
                        <div className={styles.icon}>
                            <svg width="64" height="64" viewBox="0 0 16 16" fill="var(--accent-green)">
                                <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4.5-4.5z" />
                            </svg>
                        </div>
                        <h2>You're All Set!</h2>
                        <p className={styles.description}>
                            GitSwitch is ready to help you manage your Git identities.
                            You can always add more profiles or scan for repositories later.
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={finishOnboarding}>
                            Open GitSwitch
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
