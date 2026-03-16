/**
 * Utilities Barrel Export
 *
 * Central export point for all utility functions.
 * Import utilities from this file for cleaner imports:
 *   import { devLog, reportError, formatDuration } from '../utils';
 */

// Development logging
export {
  devLog,
  devWarn,
  devError,
  createDevLogger,
  default as devLogger,
} from "./devLogger";
export type { DevLogger } from "./devLogger";

// Error reporting
export {
  reportError,
  reportNetworkError,
  reportApiError,
  getRecentErrors,
  clearErrorStore,
  getErrorStats,
  createErrorHandler,
  default as errorReporter,
} from "./errorReporter";
export type { ErrorCategory, ErrorReport } from "./errorReporter";

// Audio utilities
export {
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  base64ToFloat32Array,
  NOTE_NAMES,
} from "./audioUtils";
export type { NoteInfo, AutoCorrelateResult } from "./audioUtils";

// Formatting utilities
export {
  formatDuration,
  formatPercentage,
  formatCents,
  formatFrequency,
  pluralize,
} from "./formatters";
