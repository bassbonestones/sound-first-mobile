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

// Navigation items (dev menu)
export { DEV_NAV_ITEMS } from "./devNavItems";

// Range expansion patterns
export { default as rangeExpansionPatterns } from "./rangeExpansionPatterns";
