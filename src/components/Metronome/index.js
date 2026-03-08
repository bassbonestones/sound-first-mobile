/**
 * Metronome module
 * Re-exports for clean imports
 */

// Main component - exported from original file
export { default, CompactMetronome } from "../Metronome.js";

// Constants and utilities
export {
  NOTE_VALUES,
  NOTE_VALUE_NAMES,
  SUBDIVISIONS,
  getSubdivisionLabel,
  createClickSound,
} from "./constants";
