/**
 * AudioInput module
 * Re-exports for clean imports
 */

// Main component - exported from original file for now
// Future: Move component logic here
export { default } from "../AudioInput";

// Pitch detection utilities
export {
  NOTE_NAMES,
  frequencyToNote,
  noteNameToMidi,
  autoCorrelate,
  isOctaveEquivalent,
  getPitchClass,
} from "./pitchUtils";
export type { NoteInfo, AutocorrelateResult } from "./pitchUtils";

// WebView HTML generator
export { generateAudioWebViewHtml } from "./webViewHtml";
export type { AudioWebViewConfig } from "./webViewHtml";

// Styles
export { styles } from "./styles";
