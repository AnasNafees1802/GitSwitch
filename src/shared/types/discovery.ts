import type { GitProvider } from './profile';

/**
 * SSH Key Info
 * Information about an SSH key
 */
export interface SSHKeyInfo {
    /** Path to private key */
    privatePath: string;

    /** Path to public key */
    publicPath: string;

    /** Key fingerprint */
    fingerprint?: string;

    /** Key comment (usually email) */
    comment?: string;

    /** Key type (rsa, ed25519, etc.) */
    keyType?: string;

    /** Key bit size */
    bits?: number;

    /** Whether key is password protected */
    hasPassphrase?: boolean;
}

/**
 * SSH Config Entry
 * Represents an entry in ~/.ssh/config
 */
export interface SSHConfigEntry {
    /** Host alias */
    host: string;

    /** HostName (actual hostname) */
    hostName?: string;

    /** User */
    user?: string;

    /** IdentityFile path */
    identityFile?: string;

    /** IdentitiesOnly flag */
    identitiesOnly?: boolean;

    /** Port */
    port?: number;

    /** Additional properties */
    [key: string]: string | number | boolean | undefined;
}

/**
 * Discovered Identity
 * An identity found during discovery
 */
export interface DiscoveredIdentity {
    /** Unique ID for this discovery */
    id: string;

    /** Source of discovery */
    source: 'ssh_key' | 'git_config' | 'ssh_config' | 'credential_helper';

    /** Email if found */
    email?: string;

    /** Username if found */
    username?: string;

    /** SSH key info if applicable */
    sshKey?: SSHKeyInfo;

    /** SSH config entry if applicable */
    sshConfig?: SSHConfigEntry;

    /** Detected provider */
    provider?: GitProvider;

    /** Suggested profile label */
    suggestedLabel?: string;

    /** Whether user selected this for import */
    selected: boolean;
}

/**
 * Discovery Result
 * Result of identity discovery scan
 */
export interface DiscoveryResult {
    /** Discovered identities */
    identities: DiscoveredIdentity[];

    /** SSH keys found */
    sshKeys: SSHKeyInfo[];

    /** SSH config entries */
    sshConfigEntries: SSHConfigEntry[];

    /** Global git config */
    globalGitConfig?: {
        email?: string;
        username?: string;
    };

    /** Repositories found */
    repositories: string[];

    /** Discovery duration in ms */
    duration: number;

    /** Errors encountered */
    errors: string[];
}

/**
 * Discovery Options
 */
export interface DiscoveryOptions {
    /** Scan for SSH keys */
    scanSSHKeys?: boolean;

    /** Scan git config */
    scanGitConfig?: boolean;

    /** Scan for repositories */
    scanRepositories?: boolean;

    /** Additional directories to scan for repos */
    additionalRepoDirs?: string[];
}
