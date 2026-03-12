/**
 * Clef type for staff display
 */
export type ClefType = "treble" | "bass";

/**
 * Props for StaffNotePicker component
 */
export interface StaffNotePickerProps {
  /** Which clef to show */
  clef?: ClefType;
  /** Current note name (e.g., "Bb3") */
  value?: string;
  /** Callback when note changes */
  onChange?: (noteName: string) => void;
  /** Callback to enable microphone pitch detection */
  onPlayToSelect?: () => void;
  /** Instrument name for context */
  instrument?: string;
}

/**
 * StaffNotePicker - Visual staff-based note selection using real MusicXML rendering
 *
 * Shows a musical staff with a movable note using OpenSheetMusicDisplay.
 * User can:
 * 1. Tap up/down arrows to move the note chromatically
 * 2. Use +/- buttons to change octave
 * 3. Use "I'll play it" mode to detect pitch from microphone
 */
declare function StaffNotePicker(
  props: StaffNotePickerProps,
): React.ReactElement;

export default StaffNotePicker;
