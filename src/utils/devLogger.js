/**
 * Development-only logging utilities
 *
 * These functions only log in development mode (__DEV__).
 * In production builds, they are no-ops.
 */

/**
 * Log a message only in development mode
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
  if (__DEV__) {
    console.log(...args);
  }
}

/**
 * Log a warning only in development mode
 * @param {...any} args - Arguments to log
 */
export function devWarn(...args) {
  if (__DEV__) {
    console.warn(...args);
  }
}

/**
 * Log an error only in development mode
 * @param {...any} args - Arguments to log
 */
export function devError(...args) {
  if (__DEV__) {
    console.error(...args);
  }
}

/**
 * Create a prefixed logger for a specific component/module
 * @param {string} prefix - Prefix to add to all log messages
 * @returns {Object} Object with log, warn, error methods
 */
export function createDevLogger(prefix) {
  return {
    log: (...args) => devLog(`[${prefix}]`, ...args),
    warn: (...args) => devWarn(`[${prefix}]`, ...args),
    error: (...args) => devError(`[${prefix}]`, ...args),
  };
}

export default {
  log: devLog,
  warn: devWarn,
  error: devError,
  createLogger: createDevLogger,
};
