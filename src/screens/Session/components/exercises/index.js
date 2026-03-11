/**
 * Exercise components index
 * Maps exercise_template_id to React components
 */
import AuralCompareExercise from "./AuralCompareExercise";
import PitchDirectionExercise from "./PitchDirectionExercise";
import ContourCopyExercise from "./ContourCopyExercise";
import TapAlongExercise from "./TapAlongExercise";
import EnterOnBeatOneExercise from "./EnterOnBeatOneExercise";
import StartOnCueExercise from "./StartOnCueExercise";
import FeelThePulseExercise from "./FeelThePulseExercise";
import RangeExpansionExercise from "./RangeExpansionExercise";
import WholeNoteLessonExercise from "./WholeNoteLessonExercise";
import WholeRestLessonExercise from "./WholeRestLessonExercise";
import TimeSignatureBasicsExercise from "./TimeSignatureBasicsExercise";
import TimeSignature44Exercise from "./TimeSignature44Exercise";

// Map template IDs to exercise components
export const EXERCISE_COMPONENTS = {
  aural_compare: AuralCompareExercise,
  pitch_direction: PitchDirectionExercise,
  contour_copy: ContourCopyExercise,
  tap_along: TapAlongExercise,
  tap_with_beat: TapAlongExercise, // alias
  enter_on_beat_one: EnterOnBeatOneExercise,
  start_on_cue: StartOnCueExercise,
  feel_the_pulse: FeelThePulseExercise,
  internal_pulse: FeelThePulseExercise, // alias
  range_expansion: RangeExpansionExercise,
  expand_range_up: RangeExpansionExercise,
  expand_range_down: RangeExpansionExercise,
  whole_note_lesson: WholeNoteLessonExercise,
  rhythm_whole_notes: WholeNoteLessonExercise, // alias for capability name
  whole_rest_lesson: WholeRestLessonExercise,
  rest_whole: WholeRestLessonExercise, // alias for capability name
  time_signature_basics: TimeSignatureBasicsExercise,
  time_signature_basics_lesson: TimeSignatureBasicsExercise, // alias
  time_signature_4_4: TimeSignature44Exercise,
  time_signature_44_lesson: TimeSignature44Exercise, // alias
};

export {
  AuralCompareExercise,
  PitchDirectionExercise,
  ContourCopyExercise,
  TapAlongExercise,
  EnterOnBeatOneExercise,
  StartOnCueExercise,
  FeelThePulseExercise,
  RangeExpansionExercise,
  WholeNoteLessonExercise,
  WholeRestLessonExercise,
  TimeSignatureBasicsExercise,
  TimeSignature44Exercise,
};

/**
 * Get the exercise component for a given template ID
 * @param {string} templateId - e.g., "aural_compare", "pitch_direction"
 * @returns {React.Component|null} The exercise component or null if not found
 */
export function getExerciseComponent(templateId) {
  return EXERCISE_COMPONENTS[templateId] || null;
}
