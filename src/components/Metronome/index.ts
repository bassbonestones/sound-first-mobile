/**
 * Metronome module
 * Re-exports for clean imports
 */

// Main component - exported from original file
export { default } from "../Metronome";

// CompactMetronome is a named export from Metronome.js
import MetronomeModule from "../Metronome";
// @ts-ignore - CompactMetronome is exported from JS file
export const CompactMetronome = (MetronomeModule as any).CompactMetronome;

// Constants and utilities
export {
  NOTE_VALUES,
  NOTE_VALUE_NAMES,
  SUBDIVISIONS,
  getSubdivisionLabel,
  createClickSound,
} from "./constants";
export type { SubdivisionPattern } from "./constants";
