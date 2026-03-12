/**
 * PitchDrone module
 * Re-exports for clean imports
 */

// Main component - exported from original file
export { default } from "../PitchDrone";

// Constants and utilities
export {
  NOTES,
  OCTAVE_COLORS,
  JUST_RATIOS,
  calculateEqualTemperamentFrequency,
  calculateJustIntonationFrequency,
  getNoteNameBySemitone,
  getOctaveColor,
} from "./constants";
export type { NoteDefinition } from "./constants";
