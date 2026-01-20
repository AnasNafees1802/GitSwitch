/**
 * Logger Utility
 * Provides consistent logging throughout the application
 * Never logs sensitive data (private keys, tokens, etc.)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: unknown;
}

/**
 * Sensitive patterns to redact from logs
 */
const SENSITIVE_PATTERNS = [
    /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/gi,
    /ghp_[a-zA-Z0-9]{36,}/g,  // GitHub personal access token
    /glpat-[a-zA-Z0-9-_]{20,}/g,  // GitLab personal access token
    /password\s*[:=]\s*\S+/gi,
    /token\s*[:=]\s*\S+/gi,
    /secret\s*[:=]\s*\S+/gi,
];

/**
 * Redact sensitive information from data
 */
function redactSensitive(data: unknown): unknown {
    if (typeof data === 'string') {
        let result = data;
        for (const pattern of SENSITIVE_PATTERNS) {
            result = result.replace(pattern, '[REDACTED]');
        }
        return result;
    }

    if (Array.isArray(data)) {
        return data.map(redactSensitive);
    }

    if (data && typeof data === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.includes('password') ||
                lowerKey.includes('token') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('private') ||
                lowerKey.includes('key')
            ) {
                result[key] = '[REDACTED]';
            } else {
                result[key] = redactSensitive(value);
            }
        }
        return result;
    }

    return data;
}

/**
 * Format log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
    if (entry.data !== undefined) {
        return `${prefix} ${entry.message} ${JSON.stringify(entry.data)}`;
    }
    return `${prefix} ${entry.message}`;
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string) {
    const log = (level: LogLevel, message: string, data?: unknown): void => {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            context,
            message,
            data: data !== undefined ? redactSensitive(data) : undefined,
        };

        const formatted = formatLogEntry(entry);

        switch (level) {
            case 'debug':
                if (process.env.NODE_ENV === 'development') {
                    console.debug(formatted);
                }
                break;
            case 'info':
                console.info(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            case 'error':
                console.error(formatted);
                break;
        }
    };

    return {
        debug: (message: string, data?: unknown) => log('debug', message, data),
        info: (message: string, data?: unknown) => log('info', message, data),
        warn: (message: string, data?: unknown) => log('warn', message, data),
        error: (message: string, data?: unknown) => log('error', message, data),
    };
}

/**
 * Global application logger
 */
export const logger = createLogger('App');
