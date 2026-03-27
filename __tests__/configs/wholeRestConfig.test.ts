/**
 * Tests for wholeRestConfig
 * Tests whole rest exercise configuration and helper functions
 */
import {
  WHOLE_REST_CONFIG,
  WHOLE_REST_FOCUS_CARD,
  WHOLE_REST_MINI_CARD,
  WHOLE_REST_THRESHOLDS,
  WHOLE_REST_BEATS,
  WHOLE_REST_AUDIO_THRESHOLDS,
  generateWholeRestNoteInfo,
  shouldBeatHaveSound,
  isRestBeat,
  getMeasureForBeat,
  getWholeRestCursorConfig,
  generateWholeRestPatternMusicXML,
  wholeRestConfig,
} from "../../src/screens/Session/components/exercises/configs/wholeRestConfig";

describe("wholeRestConfig", () => {
  describe("WHOLE_REST_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(WHOLE_REST_CONFIG.beatsPerRest).toBe(4);
      expect(WHOLE_REST_CONFIG.beatsPerNote).toBe(4);
      expect(WHOLE_REST_CONFIG.totalBeats).toBe(12);
      expect(WHOLE_REST_CONFIG.restType).toBe("whole");
    });

    it("has correct tempo", () => {
      expect(WHOLE_REST_CONFIG.defaultTempo).toBe(60);
    });

    it("has correct flags", () => {
      expect(WHOLE_REST_CONFIG.hasSubdivision).toBe(false);
      expect(WHOLE_REST_CONFIG.hasDronePhase).toBe(false);
    });

    it("has correct measures structure", () => {
      expect(WHOLE_REST_CONFIG.measures).toHaveLength(3);
      // First measure is a note
      expect(WHOLE_REST_CONFIG.measures[0].type).toBe("note");
      expect(WHOLE_REST_CONFIG.measures[0].shouldSound).toBe(true);
      // Second measure is a rest
      expect(WHOLE_REST_CONFIG.measures[1].type).toBe("rest");
      expect(WHOLE_REST_CONFIG.measures[1].shouldSound).toBe(false);
      // Third measure is a note
      expect(WHOLE_REST_CONFIG.measures[2].type).toBe("note");
      expect(WHOLE_REST_CONFIG.measures[2].shouldSound).toBe(true);
    });

    it("has correct beat ranges for each measure", () => {
      // First whole note: beats 1-4
      expect(WHOLE_REST_CONFIG.measures[0].startBeat).toBe(1);
      expect(WHOLE_REST_CONFIG.measures[0].endBeat).toBe(4);
      // Whole rest: beats 5-8
      expect(WHOLE_REST_CONFIG.measures[1].startBeat).toBe(5);
      expect(WHOLE_REST_CONFIG.measures[1].endBeat).toBe(8);
      // Second whole note: beats 9-12
      expect(WHOLE_REST_CONFIG.measures[2].startBeat).toBe(9);
      expect(WHOLE_REST_CONFIG.measures[2].endBeat).toBe(12);
    });
  });

  describe("WHOLE_REST_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(WHOLE_REST_FOCUS_CARD.title).toBe("Whole Rest");
      expect(WHOLE_REST_FOCUS_CARD.symbol).toBe("whole_rest");
    });

    it("has description and cue", () => {
      expect(WHOLE_REST_FOCUS_CARD.description).toContain("4 beats of silence");
      expect(WHOLE_REST_FOCUS_CARD.cue).toContain("BELOW");
    });

    it("has details array", () => {
      expect(WHOLE_REST_FOCUS_CARD.details).toBeInstanceOf(Array);
      expect(WHOLE_REST_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("WHOLE_REST_MINI_CARD", () => {
    it("has title and text", () => {
      expect(WHOLE_REST_MINI_CARD.title).toBe("Whole Rest");
      expect(WHOLE_REST_MINI_CARD.text).toContain("4 beats");
    });
  });

  describe("WHOLE_REST_THRESHOLDS", () => {
    it("has required threshold values", () => {
      expect(WHOLE_REST_THRESHOLDS.sustainThreshold).toBeDefined();
      expect(WHOLE_REST_THRESHOLDS.restSilenceThreshold).toBeDefined();
      expect(WHOLE_REST_THRESHOLDS.pitchSuccessRatio).toBeDefined();
    });

    it("thresholds are between 0 and 1", () => {
      expect(WHOLE_REST_THRESHOLDS.sustainThreshold).toBeGreaterThanOrEqual(0);
      expect(WHOLE_REST_THRESHOLDS.sustainThreshold).toBeLessThanOrEqual(1);
      expect(WHOLE_REST_THRESHOLDS.restSilenceThreshold).toBeGreaterThanOrEqual(
        0,
      );
      expect(WHOLE_REST_THRESHOLDS.restSilenceThreshold).toBeLessThanOrEqual(1);
      expect(WHOLE_REST_THRESHOLDS.pitchSuccessRatio).toBeGreaterThanOrEqual(0);
      expect(WHOLE_REST_THRESHOLDS.pitchSuccessRatio).toBeLessThanOrEqual(1);
    });

    it("has pitch tolerance configuration", () => {
      expect(WHOLE_REST_THRESHOLDS.pitchTolerance).toBeDefined();
      expect(WHOLE_REST_THRESHOLDS.pitchTolerance.sing).toBe(1);
      expect(WHOLE_REST_THRESHOLDS.pitchTolerance.play).toBe(1);
    });
  });

  describe("WHOLE_REST_BEATS", () => {
    it("has 12 beats", () => {
      expect(WHOLE_REST_BEATS).toHaveLength(12);
    });

    it("has correct beat numbers", () => {
      WHOLE_REST_BEATS.forEach((beat, idx) => {
        expect(beat.beat).toBe(idx + 1);
      });
    });

    it("has correct note/rest assignment", () => {
      // Beats 1-4 are notes (first whole note)
      for (let i = 0; i < 4; i++) {
        expect(WHOLE_REST_BEATS[i].isNote).toBe(true);
      }
      // Beats 5-8 are rests (whole rest)
      for (let i = 4; i < 8; i++) {
        expect(WHOLE_REST_BEATS[i].isNote).toBe(false);
      }
      // Beats 9-12 are notes (second whole note)
      for (let i = 8; i < 12; i++) {
        expect(WHOLE_REST_BEATS[i].isNote).toBe(true);
      }
    });

    it("has correct measure assignments", () => {
      // Beats 1-4 in measure 1
      for (let i = 0; i < 4; i++) {
        expect(WHOLE_REST_BEATS[i].measure).toBe(1);
      }
      // Beats 5-8 in measure 2
      for (let i = 4; i < 8; i++) {
        expect(WHOLE_REST_BEATS[i].measure).toBe(2);
      }
      // Beats 9-12 in measure 3
      for (let i = 8; i < 12; i++) {
        expect(WHOLE_REST_BEATS[i].measure).toBe(3);
      }
    });

    it("has correct measureBeat values (1-4 cycle)", () => {
      WHOLE_REST_BEATS.forEach((beat) => {
        expect(beat.measureBeat).toBeGreaterThanOrEqual(1);
        expect(beat.measureBeat).toBeLessThanOrEqual(4);
      });
      // First beat of measure 1
      expect(WHOLE_REST_BEATS[0].measureBeat).toBe(1);
      // First beat of measure 2
      expect(WHOLE_REST_BEATS[4].measureBeat).toBe(1);
      // First beat of measure 3
      expect(WHOLE_REST_BEATS[8].measureBeat).toBe(1);
    });
  });

  describe("WHOLE_REST_AUDIO_THRESHOLDS", () => {
    it("has sustainThreshold", () => {
      expect(WHOLE_REST_AUDIO_THRESHOLDS.sustainThreshold).toBeDefined();
      expect(typeof WHOLE_REST_AUDIO_THRESHOLDS.sustainThreshold).toBe(
        "number",
      );
    });

    it("has silenceThreshold", () => {
      expect(WHOLE_REST_AUDIO_THRESHOLDS.silenceThreshold).toBeDefined();
      expect(typeof WHOLE_REST_AUDIO_THRESHOLDS.silenceThreshold).toBe(
        "number",
      );
    });

    it("has pitchSuccessRatio", () => {
      expect(WHOLE_REST_AUDIO_THRESHOLDS.pitchSuccessRatio).toBeDefined();
      expect(typeof WHOLE_REST_AUDIO_THRESHOLDS.pitchSuccessRatio).toBe(
        "number",
      );
    });
  });

  describe("generateWholeRestNoteInfo", () => {
    it("generates note info for C4", () => {
      const noteInfo = generateWholeRestNoteInfo("C4");
      expect(noteInfo.noteName).toBe("C4");
      expect(noteInfo.letter).toBe("C");
      expect(noteInfo.octave).toBe(4);
      expect(noteInfo.midi).toBe(60);
      expect(noteInfo.frequency).toBeCloseTo(261.63, 0);
    });

    it("generates note info for A4", () => {
      const noteInfo = generateWholeRestNoteInfo("A4");
      expect(noteInfo.noteName).toBe("A4");
      expect(noteInfo.letter).toBe("A");
      expect(noteInfo.octave).toBe(4);
      expect(noteInfo.midi).toBe(69);
      expect(noteInfo.frequency).toBeCloseTo(440, 0);
    });

    it("handles sharp notes", () => {
      const noteInfo = generateWholeRestNoteInfo("F#4");
      expect(noteInfo.noteName).toBe("F#4");
      expect(noteInfo.letter).toBe("F");
      expect(noteInfo.accidental).toBe("#");
      expect(noteInfo.octave).toBe(4);
    });

    it("handles flat notes", () => {
      const noteInfo = generateWholeRestNoteInfo("Bb3");
      expect(noteInfo.noteName).toBe("Bb3");
      expect(noteInfo.letter).toBe("B");
      expect(noteInfo.accidental).toBe("b");
      expect(noteInfo.octave).toBe(3);
    });

    it("handles different octaves", () => {
      const noteInfo2 = generateWholeRestNoteInfo("C2");
      expect(noteInfo2.octave).toBe(2);

      const noteInfo5 = generateWholeRestNoteInfo("C5");
      expect(noteInfo5.octave).toBe(5);
    });
  });

  describe("shouldBeatHaveSound", () => {
    it("returns true for beats 1-4 (first whole note)", () => {
      expect(shouldBeatHaveSound(1)).toBe(true);
      expect(shouldBeatHaveSound(2)).toBe(true);
      expect(shouldBeatHaveSound(3)).toBe(true);
      expect(shouldBeatHaveSound(4)).toBe(true);
    });

    it("returns false for beats 5-8 (whole rest)", () => {
      expect(shouldBeatHaveSound(5)).toBe(false);
      expect(shouldBeatHaveSound(6)).toBe(false);
      expect(shouldBeatHaveSound(7)).toBe(false);
      expect(shouldBeatHaveSound(8)).toBe(false);
    });

    it("returns true for beats 9-12 (second whole note)", () => {
      expect(shouldBeatHaveSound(9)).toBe(true);
      expect(shouldBeatHaveSound(10)).toBe(true);
      expect(shouldBeatHaveSound(11)).toBe(true);
      expect(shouldBeatHaveSound(12)).toBe(true);
    });

    it("handles edge cases", () => {
      // Beat 0 or negative should return false
      expect(shouldBeatHaveSound(0)).toBe(false);
      // Beat beyond 12 should return false
      expect(shouldBeatHaveSound(13)).toBe(false);
    });
  });

  describe("isRestBeat", () => {
    it("returns false for beats 1-4 (first whole note)", () => {
      expect(isRestBeat(1)).toBe(false);
      expect(isRestBeat(2)).toBe(false);
      expect(isRestBeat(3)).toBe(false);
      expect(isRestBeat(4)).toBe(false);
    });

    it("returns true for beats 5-8 (whole rest)", () => {
      expect(isRestBeat(5)).toBe(true);
      expect(isRestBeat(6)).toBe(true);
      expect(isRestBeat(7)).toBe(true);
      expect(isRestBeat(8)).toBe(true);
    });

    it("returns false for beats 9-12 (second whole note)", () => {
      expect(isRestBeat(9)).toBe(false);
      expect(isRestBeat(10)).toBe(false);
      expect(isRestBeat(11)).toBe(false);
      expect(isRestBeat(12)).toBe(false);
    });
  });

  describe("getMeasureForBeat", () => {
    it("returns 1 for beats 1-4", () => {
      expect(getMeasureForBeat(1)).toBe(1);
      expect(getMeasureForBeat(2)).toBe(1);
      expect(getMeasureForBeat(3)).toBe(1);
      expect(getMeasureForBeat(4)).toBe(1);
    });

    it("returns 2 for beats 5-8", () => {
      expect(getMeasureForBeat(5)).toBe(2);
      expect(getMeasureForBeat(6)).toBe(2);
      expect(getMeasureForBeat(7)).toBe(2);
      expect(getMeasureForBeat(8)).toBe(2);
    });

    it("returns 3 for beats 9-12", () => {
      expect(getMeasureForBeat(9)).toBe(3);
      expect(getMeasureForBeat(10)).toBe(3);
      expect(getMeasureForBeat(11)).toBe(3);
      expect(getMeasureForBeat(12)).toBe(3);
    });
  });

  describe("getWholeRestCursorConfig", () => {
    it("returns cursor configuration object", () => {
      const config = getWholeRestCursorConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("has highlight left position", () => {
      const config = getWholeRestCursorConfig();
      expect(config.highlightLeft).toBeDefined();
      expect(typeof config.highlightLeft).toBe("number");
      expect(config.highlightLeft).toBe(200);
    });

    it("has highlight width", () => {
      const config = getWholeRestCursorConfig();
      expect(config.highlightWidth).toBeDefined();
      expect(typeof config.highlightWidth).toBe("number");
      expect(config.highlightWidth).toBe(80);
    });

    it("has highlight height", () => {
      const config = getWholeRestCursorConfig();
      expect(config.highlightHeight).toBeDefined();
      expect(typeof config.highlightHeight).toBe("number");
      expect(config.highlightHeight).toBe(40);
    });
  });

  describe("generateWholeRestPatternMusicXML", () => {
    it("generates valid MusicXML string", () => {
      const xml = generateWholeRestPatternMusicXML("C4");
      expect(typeof xml).toBe("string");
      expect(xml.length).toBeGreaterThan(0);
    });

    it("contains required MusicXML elements", () => {
      const xml = generateWholeRestPatternMusicXML("C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<part-list");
      expect(xml).toContain("<measure");
    });

    it("contains note elements", () => {
      const xml = generateWholeRestPatternMusicXML("C4");
      expect(xml).toContain("<note");
      expect(xml).toContain("<pitch");
    });

    it("contains rest element", () => {
      const xml = generateWholeRestPatternMusicXML("C4");
      expect(xml).toContain("<rest");
    });

    it("handles different notes", () => {
      const xmlA4 = generateWholeRestPatternMusicXML("A4");
      expect(xmlA4).toContain("<step>A</step>");

      const xmlG3 = generateWholeRestPatternMusicXML("G3");
      expect(xmlG3).toContain("<step>G</step>");
    });

    it("includes correct octave", () => {
      const xml = generateWholeRestPatternMusicXML("C4");
      expect(xml).toContain("<octave>4</octave>");

      const xml3 = generateWholeRestPatternMusicXML("C3");
      expect(xml3).toContain("<octave>3</octave>");
    });
  });

  describe("wholeRestConfig export object", () => {
    it("is a valid configuration object", () => {
      expect(wholeRestConfig).toBeDefined();
      expect(typeof wholeRestConfig).toBe("object");
    });

    it("contains expected properties", () => {
      expect(wholeRestConfig.beatsPerRest).toBe(4);
      expect(wholeRestConfig.beatsPerNote).toBe(4);
      expect(wholeRestConfig.totalBeats).toBe(12);
      expect(wholeRestConfig.restType).toBe("whole");
    });

    it("contains focus card", () => {
      expect(wholeRestConfig.focusCard).toBe(WHOLE_REST_FOCUS_CARD);
    });

    it("contains mini card", () => {
      expect(wholeRestConfig.miniCard).toBe(WHOLE_REST_MINI_CARD);
    });

    it("contains thresholds", () => {
      expect(wholeRestConfig.thresholds).toBe(WHOLE_REST_THRESHOLDS);
    });
  });
});
