/**
 * Git Provider Types
 * Supported Git hosting providers
 */
export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'custom';
/**
 * Authentication Type
 * Method used to authenticate with Git provider
 */
export type AuthType = 'ssh' | 'https';
/**
 * Profile Interface
 * Represents a Git identity profile
 */
export interface Profile {
    /** Unique identifier (UUID) */
    id: string;
    /** User-friendly label (e.g., "Personal", "Work") */
    label: string;
    /** Git hosting provider */
    provider: GitProvider;
    /** Git username for commits */
    username: string;
    /** Git email for commits */
    email: string;
    /** Authentication method */
    authType: AuthType;
    /** Path to SSH private key (for SSH auth) */
    sshKeyPath?: string;
    /** SSH Host alias in config */
    sshHostAlias?: string;
    /** Token identifier in secure storage (for HTTPS auth) */
    tokenId?: string;
    /** Whether this is the default profile */
    isDefault: boolean;
    /** Profile color for UI (hex) */
    color: string;
    /** Creation timestamp */
    createdAt: string;
    /** Last update timestamp */
    updatedAt: string;
}
/**
 * Profile Creation Input
 * Data required to create a new profile
 */
export interface CreateProfileInput {
    label: string;
    provider: GitProvider;
    username: string;
    email: string;
    authType: AuthType;
    sshKeyPath?: string;
    generateNewKey?: boolean;
    token?: string;
    isDefault?: boolean;
    color?: string;
}
/**
 * Profile Update Input
 * Data for updating an existing profile
 */
export interface UpdateProfileInput {
    id: string;
    label?: string;
    provider?: GitProvider;
    username?: string;
    email?: string;
    authType?: AuthType;
    sshKeyPath?: string;
    token?: string;
    isDefault?: boolean;
    color?: string;
}
/**
 * Provider Configuration
 * Settings for each Git provider
 */
export interface ProviderConfig {
    name: string;
    displayName: string;
    hostname: string;
    sshHostname: string;
    icon: string;
    docsUrl: string;
}
/**
 * Provider configurations
 */
export declare const PROVIDER_CONFIGS: Record<GitProvider, ProviderConfig>;
//# sourceMappingURL=profile.d.ts.map