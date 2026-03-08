/**
 * AudioInput module
 * Re-exports for clean imports
 */

// Main component - exported from original file for now
// Future: Move component logic here
export { default } from "../AudioInput.js";

// Pitch detection utilities
export {
  NOTE_NAMES,
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  isOctaveEquivalent,
  getPitchClass,
} from "./pitchUtils";

// Styles
export { styles } from "./styles";
