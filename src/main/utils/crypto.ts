/**
 * Crypto Utilities
 * Secure hash generation and verification
 */

import * as crypto from 'crypto';

/**
 * Generate a SHA256 hash of the input
 */
export function sha256(input: string): string {
    return crypto.createHash('sha256').update(input, 'utf-8').digest('hex');
}

/**
 * Generate a random hex string
 */
export function randomHex(bytes: number = 16): string {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a checksum for audit log integrity
 */
export function generateChecksum(data: Record<string, unknown>): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return sha256(serialized);
}

/**
 * Verify a checksum
 */
export function verifyChecksum(data: Record<string, unknown>, checksum: string): boolean {
    return generateChecksum(data) === checksum;
}

/**
 * Generate profile colors
 * Returns a pleasing color based on index or random
 */
const PROFILE_COLORS = [
    '#238636', // GitHub green
    '#1f6feb', // GitHub blue
    '#8957e5', // Purple
    '#f78166', // Orange
    '#d29922', // Yellow
    '#3fb950', // Light green
    '#58a6ff', // Light blue
    '#bc8cff', // Light purple
    '#ff7b72', // Light orange/red
    '#7ee787', // Mint
];

export function getProfileColor(index?: number): string {
    if (index !== undefined) {
        return PROFILE_COLORS[index % PROFILE_COLORS.length];
    }
    return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}
