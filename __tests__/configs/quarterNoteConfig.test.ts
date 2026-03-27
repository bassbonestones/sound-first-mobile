/**
 * Tests for quarterNoteConfig
 * Tests quarter note exercise configuration and helper functions
 */
import {
  QUARTER_NOTE_CONFIG,
  QUARTER_NOTE_FOCUS_CARD,
  QUARTER_NOTE_MINI_CARD,
  QUARTER_NOTE_THRESHOLDS,
  generateQuarterNoteInfo,
  generateQuarterNoteMusicXML,
  getQuarterNoteCursorConfig,
  quarterNoteConfig,
} from "../../src/screens/Session/components/exercises/configs/quarterNoteConfig";

describe("quarterNoteConfig", () => {
  describe("QUARTER_NOTE_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(QUARTER_NOTE_CONFIG.beatsPerNote).toBe(1);
      expect(QUARTER_NOTE_CONFIG.noteType).toBe("quarter");
    });

    it("has correct tempo", () => {
      expect(QUARTER_NOTE_CONFIG.defaultTempo).toBe(60);
    });

    it("has correct flags", () => {
      expect(QUARTER_NOTE_CONFIG.hasSubdivision).toBe(false);
      expect(QUARTER_NOTE_CONFIG.hasDronePhase).toBe(false);
    });
  });

  describe("QUARTER_NOTE_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(QUARTER_NOTE_FOCUS_CARD.title).toBe("Quarter Note");
      expect(QUARTER_NOTE_FOCUS_CARD.symbol).toBe("quarter_note");
    });

    it("has description and cue", () => {
      expect(QUARTER_NOTE_FOCUS_CARD.description).toContain("1 beat");
      expect(QUARTER_NOTE_FOCUS_CARD.cue).toContain("beat 2");
    });

    it("has details array", () => {
      expect(QUARTER_NOTE_FOCUS_CARD.details).toBeInstanceOf(Array);
      expect(QUARTER_NOTE_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("QUARTER_NOTE_MINI_CARD", () => {
    it("has title and text", () => {
      expect(QUARTER_NOTE_MINI_CARD.title).toBe("Quarter Note");
      expect(QUARTER_NOTE_MINI_CARD.text).toContain("1 beat");
    });
  });

  describe("QUARTER_NOTE_THRESHOLDS", () => {
    it("has required threshold values", () => {
      expect(QUARTER_NOTE_THRESHOLDS.sustainThreshold).toBeDefined();
      expect(QUARTER_NOTE_THRESHOLDS.pitchSuccessRatio).toBeDefined();
    });

    it("thresholds are between 0 and 1", () => {
      expect(QUARTER_NOTE_THRESHOLDS.sustainThreshold).toBeGreaterThanOrEqual(
        0,
      );
      expect(QUARTER_NOTE_THRESHOLDS.sustainThreshold).toBeLessThanOrEqual(1);
      expect(QUARTER_NOTE_THRESHOLDS.pitchSuccessRatio).toBeGreaterThanOrEqual(
        0,
      );
      expect(QUARTER_NOTE_THRESHOLDS.pitchSuccessRatio).toBeLessThanOrEqual(1);
    });

    it("has pitch tolerance configuration", () => {
      expect(QUARTER_NOTE_THRESHOLDS.pitchTolerance).toBeDefined();
    });
  });

  describe("generateQuarterNoteInfo", () => {
    it("generates note info for C4", () => {
      const noteInfo = generateQuarterNoteInfo("C4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("C4");
      expect(noteInfo!.letter).toBe("C");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(60);
      expect(noteInfo!.frequency).toBeCloseTo(261.63, 0);
    });

    it("generates note info for A4", () => {
      const noteInfo = generateQuarterNoteInfo("A4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("A4");
      expect(noteInfo!.letter).toBe("A");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(69);
      expect(noteInfo!.frequency).toBeCloseTo(440, 0);
    });

    it("handles sharp notes", () => {
      const noteInfo = generateQuarterNoteInfo("F#4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("F#4");
      expect(noteInfo!.letter).toBe("F");
      expect(noteInfo!.accidental).toBe("#");
      expect(noteInfo!.octave).toBe(4);
    });

    it("handles flat notes", () => {
      const noteInfo = generateQuarterNoteInfo("Bb3");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("Bb3");
      expect(noteInfo!.letter).toBe("B");
      expect(noteInfo!.accidental).toBe("b");
      expect(noteInfo!.octave).toBe(3);
    });

    it("handles different octaves", () => {
      const noteInfo2 = generateQuarterNoteInfo("C2");
      expect(noteInfo2).not.toBeNull();
      expect(noteInfo2!.octave).toBe(2);

      const noteInfo5 = generateQuarterNoteInfo("C5");
      expect(noteInfo5).not.toBeNull();
      expect(noteInfo5!.octave).toBe(5);
    });

    it("returns null for invalid note names", () => {
      expect(generateQuarterNoteInfo("invalid")).toBeNull();
      expect(generateQuarterNoteInfo("")).toBeNull();
    });
  });

  describe("generateQuarterNoteMusicXML", () => {
    it("generates valid MusicXML string", () => {
      const xml = generateQuarterNoteMusicXML("C4");
      expect(typeof xml).toBe("string");
      expect(xml.length).toBeGreaterThan(0);
    });

    it("contains required MusicXML elements", () => {
      const xml = generateQuarterNoteMusicXML("C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<part-list");
      expect(xml).toContain("<measure");
    });

    it("contains note element", () => {
      const xml = generateQuarterNoteMusicXML("C4");
      expect(xml).toContain("<note");
      expect(xml).toContain("<pitch");
    });

    it("contains quarter note type", () => {
      const xml = generateQuarterNoteMusicXML("C4");
      expect(xml).toContain("<type>quarter</type>");
    });

    it("handles different notes", () => {
      const xmlA4 = generateQuarterNoteMusicXML("A4");
      expect(xmlA4).toContain("<step>A</step>");

      const xmlG3 = generateQuarterNoteMusicXML("G3");
      expect(xmlG3).toContain("<step>G</step>");
    });

    it("includes correct octave", () => {
      const xml = generateQuarterNoteMusicXML("C4");
      expect(xml).toContain("<octave>4</octave>");

      const xml3 = generateQuarterNoteMusicXML("C3");
      expect(xml3).toContain("<octave>3</octave>");
    });
  });

  describe("getQuarterNoteCursorConfig", () => {
    it("returns cursor configuration object", () => {
      const config = getQuarterNoteCursorConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("has highlight position properties", () => {
      const config = getQuarterNoteCursorConfig();
      expect(config.highlightLeft).toBeDefined();
      expect(typeof config.highlightLeft).toBe("number");
      expect(config.highlightWidth).toBeDefined();
      expect(typeof config.highlightWidth).toBe("number");
      expect(config.highlightHeight).toBeDefined();
      expect(typeof config.highlightHeight).toBe("number");
    });
  });

  describe("quarterNoteConfig export object", () => {
    it("is a valid configuration object", () => {
      expect(quarterNoteConfig).toBeDefined();
      expect(typeof quarterNoteConfig).toBe("object");
    });

    it("contains expected properties from QUARTER_NOTE_CONFIG", () => {
      expect(quarterNoteConfig.beatsPerNote).toBe(1);
      expect(quarterNoteConfig.noteType).toBe("quarter");
    });

    it("contains focus card", () => {
      expect(quarterNoteConfig.focusCard).toBe(QUARTER_NOTE_FOCUS_CARD);
    });

    it("contains mini card", () => {
      expect(quarterNoteConfig.miniCard).toBe(QUARTER_NOTE_MINI_CARD);
    });

    it("contains thresholds", () => {
      expect(quarterNoteConfig.thresholds).toBe(QUARTER_NOTE_THRESHOLDS);
    });
  });
});
