/**
 * Tests for exercises/index.js
 * Tests the EXERCISE_COMPONENTS mapping and getExerciseComponent function
 */
import {
  EXERCISE_COMPONENTS,
  getExerciseComponent,
  AuralCompareExercise,
  PitchDirectionExercise,
  TapAlongExercise,
  FeelThePulseExercise,
  RangeExpansionExercise,
} from "../src/screens/Session/components/exercises/index";

describe("Exercise Components Index", () => {
  describe("EXERCISE_COMPONENTS mapping", () => {
    it("exports EXERCISE_COMPONENTS object", () => {
      expect(EXERCISE_COMPONENTS).toBeDefined();
      expect(typeof EXERCISE_COMPONENTS).toBe("object");
    });

    it("contains aural_compare exercise", () => {
      expect(EXERCISE_COMPONENTS.aural_compare).toBeDefined();
    });

    it("contains pitch_direction exercise", () => {
      expect(EXERCISE_COMPONENTS.pitch_direction).toBeDefined();
    });

    it("contains tap_along exercise", () => {
      expect(EXERCISE_COMPONENTS.tap_along).toBeDefined();
    });

    it("contains tap_with_beat as alias for tap_along", () => {
      expect(EXERCISE_COMPONENTS.tap_with_beat).toBe(
        EXERCISE_COMPONENTS.tap_along,
      );
    });

    it("contains feel_the_pulse exercise", () => {
      expect(EXERCISE_COMPONENTS.feel_the_pulse).toBeDefined();
    });

    it("contains internal_pulse as alias for feel_the_pulse", () => {
      expect(EXERCISE_COMPONENTS.internal_pulse).toBe(
        EXERCISE_COMPONENTS.feel_the_pulse,
      );
    });

    it("contains range_expansion exercise", () => {
      expect(EXERCISE_COMPONENTS.range_expansion).toBeDefined();
    });

    it("contains note value exercises", () => {
      expect(EXERCISE_COMPONENTS.whole_note_lesson).toBeDefined();
      expect(EXERCISE_COMPONENTS.half_note_lesson).toBeDefined();
      expect(EXERCISE_COMPONENTS.quarter_note_lesson).toBeDefined();
    });

    it("contains rest exercises", () => {
      expect(EXERCISE_COMPONENTS.whole_rest_lesson).toBeDefined();
      expect(EXERCISE_COMPONENTS.half_rest_lesson).toBeDefined();
      expect(EXERCISE_COMPONENTS.quarter_rest_lesson).toBeDefined();
    });

    it("contains time signature exercises", () => {
      expect(EXERCISE_COMPONENTS.time_signature_basics).toBeDefined();
      expect(EXERCISE_COMPONENTS.time_signature_4_4).toBeDefined();
    });

    it("contains note name exercises", () => {
      expect(EXERCISE_COMPONENTS.note_name_pattern).toBeDefined();
      expect(EXERCISE_COMPONENTS.note_name_quiz).toBeDefined();
    });

    it("contains octave exercises", () => {
      expect(EXERCISE_COMPONENTS.octave_concept).toBeDefined();
      expect(EXERCISE_COMPONENTS.octave_matching).toBeDefined();
      expect(EXERCISE_COMPONENTS.octave_play).toBeDefined();
    });

    it("contains theory exercises", () => {
      expect(EXERCISE_COMPONENTS.half_steps_theory).toBeDefined();
      expect(EXERCISE_COMPONENTS.whole_steps_theory).toBeDefined();
    });

    it("contains accidental exercises", () => {
      expect(EXERCISE_COMPONENTS.accidental_flat).toBeDefined();
      expect(EXERCISE_COMPONENTS.accidental_sharp).toBeDefined();
      expect(EXERCISE_COMPONENTS.accidental_natural).toBeDefined();
    });

    it("contains diatonic scale exercises", () => {
      expect(EXERCISE_COMPONENTS.diatonic_scale_pattern).toBeDefined();
    });

    it("contains key signature exercises", () => {
      expect(EXERCISE_COMPONENTS.key_signature_basics).toBeDefined();
    });
  });

  describe("getExerciseComponent function", () => {
    it("returns component for valid template ID", () => {
      const component = getExerciseComponent("aural_compare");
      expect(component).toBeDefined();
      expect(component).toBe(EXERCISE_COMPONENTS.aural_compare);
    });

    it("returns component for alias template ID", () => {
      const component = getExerciseComponent("tap_with_beat");
      expect(component).toBe(EXERCISE_COMPONENTS.tap_along);
    });

    it("returns null for unknown template ID", () => {
      const component = getExerciseComponent("unknown_exercise");
      expect(component).toBeNull();
    });

    it("returns null for empty string", () => {
      const component = getExerciseComponent("");
      expect(component).toBeNull();
    });

    it("returns null for undefined", () => {
      const component = getExerciseComponent(undefined);
      expect(component).toBeNull();
    });

    it("handles all note lesson exercises", () => {
      expect(getExerciseComponent("whole_note_lesson")).toBeDefined();
      expect(getExerciseComponent("half_note_lesson")).toBeDefined();
      expect(getExerciseComponent("quarter_note_lesson")).toBeDefined();
    });

    it("handles capability name aliases", () => {
      // rhythm aliases
      expect(getExerciseComponent("rhythm_whole_notes")).toBe(
        getExerciseComponent("whole_note_lesson"),
      );
      expect(getExerciseComponent("rhythm_half_notes")).toBe(
        getExerciseComponent("half_note_lesson"),
      );
      expect(getExerciseComponent("rhythm_quarter_notes")).toBe(
        getExerciseComponent("quarter_note_lesson"),
      );
    });

    it("handles rest lesson exercises", () => {
      expect(getExerciseComponent("whole_rest_lesson")).toBeDefined();
      expect(getExerciseComponent("half_rest_lesson")).toBeDefined();
      expect(getExerciseComponent("quarter_rest_lesson")).toBeDefined();
    });

    it("handles rest capability aliases", () => {
      expect(getExerciseComponent("rest_whole")).toBe(
        getExerciseComponent("whole_rest_lesson"),
      );
      expect(getExerciseComponent("rest_half")).toBe(
        getExerciseComponent("half_rest_lesson"),
      );
      expect(getExerciseComponent("rest_quarter")).toBe(
        getExerciseComponent("quarter_rest_lesson"),
      );
    });
  });

  describe("Named exports", () => {
    it("exports individual exercise components", () => {
      expect(AuralCompareExercise).toBeDefined();
      expect(PitchDirectionExercise).toBeDefined();
      expect(TapAlongExercise).toBeDefined();
      expect(FeelThePulseExercise).toBeDefined();
      expect(RangeExpansionExercise).toBeDefined();
    });
  });
});
