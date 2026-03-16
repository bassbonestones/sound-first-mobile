/**
 * Development-only logging utilities
 *
 * These functions only log in development mode (__DEV__).
 * In production builds, they are no-ops.
 */

declare const __DEV__: boolean;

export interface DevLogger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Log a message only in development mode
 */
export function devLog(...args: unknown[]): void {
  if (__DEV__) {
    console.log(...args);
  }
}

/**
 * Log a warning only in development mode
 */
export function devWarn(...args: unknown[]): void {
  if (__DEV__) {
    console.warn(...args);
  }
}

/**
 * Log an error only in development mode
 */
export function devError(...args: unknown[]): void {
  if (__DEV__) {
    console.error(...args);
  }
}

/**
 * Create a prefixed logger for a specific component/module
 */
export function createDevLogger(prefix: string): DevLogger {
  return {
    log: (...args: unknown[]) => devLog(`[${prefix}]`, ...args),
    warn: (...args: unknown[]) => devWarn(`[${prefix}]`, ...args),
    error: (...args: unknown[]) => devError(`[${prefix}]`, ...args),
  };
}

export default {
  log: devLog,
  warn: devWarn,
  error: devError,
  createLogger: createDevLogger,
};
