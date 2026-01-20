/**
 * Type declarations for the GitSwitch API exposed to renderer
 */

import type { GitSwitchAPI } from '../main/preload';

declare global {
    interface Window {
        gitswitch: GitSwitchAPI;
    }
}

export { };
