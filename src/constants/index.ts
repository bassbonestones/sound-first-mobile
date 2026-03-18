/**
 * Constants Index
 *
 * Barrel export for all constants. Import from here for convenience:
 *
 * import { colors, spacing, ANIMATION, ENDPOINTS } from '../constants';
 */

// Theme and styling
export {
  colors,
  spacing,
  fontSizes,
  borderRadius,
  default as colorsDefault,
} from "./colors";

// Musical notes and frequencies
export {
  noteNames,
  enharmonicNames,
  A4_FREQUENCY,
  frequencyToNote,
  noteToFrequency,
  getCentsDeviation,
  isInTune,
  parseNoteName,
  formatNoteName,
  default as notesDefault,
} from "./notes";

// Instruments and ranges
export {
  instrumentFamilies,
  instrumentDefaults,
  getAllInstruments,
  getInstrument,
  getInstrumentFamily,
  default as instrumentsDefault,
} from "./instruments";

// Timing and animation
export {
  ANIMATION,
  DELAY,
  AUDIO,
  SESSION,
  PITCH_DETECTION,
  default as timingDefault,
} from "./timing";

// API endpoints and config
export {
  API_CONFIG,
  ENDPOINTS,
  HTTP_STATUS,
  CONTENT_TYPE,
  default as apiDefault,
} from "./api";

// Import pipeline configuration
export {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  ALL_SUPPORTED_EXTENSIONS,
  EXTENSION_TO_SOURCE_TYPE,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_DISPLAY,
  IMPORT_TIMEOUTS,
  USER_ERROR_MESSAGES,
  RECOVERY_HINTS,
  STATUS_MESSAGES,
  IMPORT_ACTION_LABELS,
  IMPORT_ACTION_DESCRIPTIONS,
  IMPORT_ACTION_ICONS,
  FILE_TYPE_HINTS,
} from "./import";

// Navigation items (dev menu)
export { DEV_NAV_ITEMS } from "./devNavItems";

// Range expansion patterns
export { default as rangeExpansionPatterns } from "./rangeExpansionPatterns";
