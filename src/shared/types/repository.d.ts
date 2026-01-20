/**
 * Remote Interface
 * Represents a Git remote
 */
export interface Remote {
    /** Remote name (e.g., "origin") */
    name: string;
    /** Remote URL */
    url: string;
    /** URL type (SSH or HTTPS) */
    type: 'ssh' | 'https';
    /** Detected provider from URL */
    provider?: string;
    /** Repository owner/organization */
    owner?: string;
    /** Repository name */
    repo?: string;
}
/**
 * Repository Interface
 * Represents a Git repository
 */
export interface Repository {
    /** Absolute path to repository */
    path: string;
    /** Repository folder name */
    name: string;
    /** List of remotes */
    remotes: Remote[];
    /** Bound profile ID (from local git config) */
    boundProfileId?: string;
    /** Current git user.email from local config */
    localEmail?: string;
    /** Current git user.name from local config */
    localUsername?: string;
    /** Detected provider from remotes */
    detectedProvider?: string;
    /** Whether there's an identity mismatch */
    hasMismatch: boolean;
    /** Mismatch details */
    mismatchDetails?: string;
    /** Last accessed timestamp */
    lastAccessed: string;
    /** Repository status */
    status: RepositoryStatus;
}
/**
 * Repository Status
 */
export type RepositoryStatus = 'bound' | 'unbound' | 'mismatch' | 'error';
/**
 * Repository Binding Input
 */
export interface BindRepositoryInput {
    /** Path to repository */
    repoPath: string;
    /** Profile ID to bind */
    profileId: string;
    /** Whether to update remote URLs */
    updateRemotes?: boolean;
}
/**
 * Repository Scan Options
 */
export interface ScanOptions {
    /** Directories to scan */
    directories?: string[];
    /** Maximum scan depth */
    maxDepth?: number;
    /** Exclude patterns */
    excludePatterns?: string[];
}
/**
 * Repository Scan Result
 */
export interface ScanResult {
    /** Found repositories */
    repositories: Repository[];
    /** Scan duration in ms */
    duration: number;
    /** Any errors during scan */
    errors: string[];
}
//# sourceMappingURL=repository.d.ts.map