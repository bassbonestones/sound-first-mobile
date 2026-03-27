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
import HalfNoteLessonExercise from "./HalfNoteLessonExercise";
import HalfRestLessonExercise from "./HalfRestLessonExercise";
import QuarterNoteLessonExercise from "./QuarterNoteLessonExercise";
import QuarterRestLessonExercise from "./QuarterRestLessonExercise";
import TimeSignatureBasicsExercise from "./TimeSignatureBasicsExercise";
import TimeSignature44Exercise from "./TimeSignature44Exercise";
import Fragment2LessonExercise from "./Fragment2LessonExercise";
import NoteNamePatternExercise from "./NoteNamePatternExercise";
import NoteNameQuizExercise from "./NoteNameQuizExercise";
import OctaveConceptExercise from "./OctaveConceptExercise";
import OctaveMatchingExercise from "./OctaveMatchingExercise";
import OctavePlayExercise from "./OctavePlayExercise";
import HalfStepsTheoryExercise from "./HalfStepsTheoryExercise";
import FlatAccidentalExercise from "./FlatAccidentalExercise";
import SharpAccidentalExercise from "./SharpAccidentalExercise";
import NaturalAccidentalExercise from "./NaturalAccidentalExercise";
import WholeStepsTheoryExercise from "./WholeStepsTheoryExercise";
import DiatonicScalePatternExercise from "./DiatonicScalePatternExercise";
import KeySignatureBasicsExercise from "./KeySignatureBasicsExercise";
import type { ExerciseProps } from "./shared/propTypes";

/** Exercise component type */
export type ExerciseComponent = React.ComponentType<ExerciseProps>;

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
  half_note_lesson: HalfNoteLessonExercise,
  rhythm_half_notes: HalfNoteLessonExercise, // alias for capability name
  half_rest_lesson: HalfRestLessonExercise,
  rest_half: HalfRestLessonExercise, // alias for capability name
  quarter_note_lesson: QuarterNoteLessonExercise,
  rhythm_quarter_notes: QuarterNoteLessonExercise, // alias for capability name
  quarter_rest_lesson: QuarterRestLessonExercise,
  rest_quarter: QuarterRestLessonExercise, // alias for capability name
  time_signature_basics: TimeSignatureBasicsExercise,
  time_signature_basics_lesson: TimeSignatureBasicsExercise, // alias
  time_signature_4_4: TimeSignature44Exercise,
  time_signature_44_lesson: TimeSignature44Exercise, // alias
  fragment_2_lesson: Fragment2LessonExercise,
  diatonic_scale_fragment_2: Fragment2LessonExercise, // alias for capability name
  // Note name recognition exercises
  note_name_pattern: NoteNamePatternExercise,
  note_name_quiz: NoteNameQuizExercise,
  note_name_recognition: NoteNamePatternExercise, // alias for capability name
  // Octave equivalence exercises
  octave_concept: OctaveConceptExercise,
  octave_matching: OctaveMatchingExercise,
  octave_play: OctavePlayExercise,
  octave_equivalence: OctaveConceptExercise, // alias for capability name
  // Half steps theory exercises
  half_steps_theory: HalfStepsTheoryExercise,
  // Accidental exercises
  accidental_flat: FlatAccidentalExercise,
  accidental_sharp: SharpAccidentalExercise,
  accidental_natural: NaturalAccidentalExercise,
  // Whole steps theory
  whole_steps_theory: WholeStepsTheoryExercise,
  // Diatonic scale pattern
  diatonic_scale_pattern: DiatonicScalePatternExercise,
  // Key signature basics
  key_signature_basics: KeySignatureBasicsExercise,
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
  HalfNoteLessonExercise,
  HalfRestLessonExercise,
  QuarterNoteLessonExercise,
  QuarterRestLessonExercise,
  TimeSignatureBasicsExercise,
  TimeSignature44Exercise,
  Fragment2LessonExercise,
  NoteNamePatternExercise,
  NoteNameQuizExercise,
  OctaveConceptExercise,
  OctaveMatchingExercise,
  OctavePlayExercise,
  HalfStepsTheoryExercise,
  FlatAccidentalExercise,
  SharpAccidentalExercise,
  NaturalAccidentalExercise,
  WholeStepsTheoryExercise,
  DiatonicScalePatternExercise,
  KeySignatureBasicsExercise,
};

/** Exercise template ID type */
export type ExerciseTemplateId = keyof typeof EXERCISE_COMPONENTS;

/**
 * Get the exercise component for a given template ID
 * @param templateId - e.g., "aural_compare", "pitch_direction"
 * @returns The exercise component or null if not found
 */
export function getExerciseComponent(
  templateId: string,
): ExerciseComponent | null {
  return (
    (EXERCISE_COMPONENTS as Record<string, ExerciseComponent>)[templateId] ??
    null
  );
}
