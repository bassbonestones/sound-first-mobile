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
};

export {
  AuralCompareExercise,
  PitchDirectionExercise,
  ContourCopyExercise,
  TapAlongExercise,
  EnterOnBeatOneExercise,
  StartOnCueExercise,
  FeelThePulseExercise,
};

/**
 * Get the exercise component for a given template ID
 * @param {string} templateId - e.g., "aural_compare", "pitch_direction"
 * @returns {React.Component|null} The exercise component or null if not found
 */
export function getExerciseComponent(templateId) {
  return EXERCISE_COMPONENTS[templateId] || null;
}
