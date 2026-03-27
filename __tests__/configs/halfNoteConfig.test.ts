/**
 * Tests for halfNoteConfig
 * Tests half note exercise configuration and helper functions
 */
import {
  HALF_NOTE_CONFIG,
  HALF_NOTE_FOCUS_CARD,
  HALF_NOTE_MINI_CARD,
  HALF_NOTE_THRESHOLDS,
  generateHalfNoteInfo,
  generateHalfNoteMusicXML,
  getHalfNoteCursorConfig,
  halfNoteConfig,
} from "../../src/screens/Session/components/exercises/configs/halfNoteConfig";

describe("halfNoteConfig", () => {
  describe("HALF_NOTE_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(HALF_NOTE_CONFIG.beatsPerNote).toBe(2);
      expect(HALF_NOTE_CONFIG.noteType).toBe("half");
    });

    it("has correct tempo", () => {
      expect(HALF_NOTE_CONFIG.defaultTempo).toBe(60);
    });

    it("has correct flags", () => {
      expect(HALF_NOTE_CONFIG.hasSubdivision).toBe(false);
      expect(HALF_NOTE_CONFIG.hasDronePhase).toBe(false);
    });
  });

  describe("HALF_NOTE_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(HALF_NOTE_FOCUS_CARD.title).toBe("Half Note");
      expect(HALF_NOTE_FOCUS_CARD.symbol).toBe("half_note");
    });

    it("has description and cue", () => {
      expect(HALF_NOTE_FOCUS_CARD.description).toContain("2 beats");
      expect(HALF_NOTE_FOCUS_CARD.cue).toContain("beat 3");
    });

    it("has details array", () => {
      expect(HALF_NOTE_FOCUS_CARD.details).toBeInstanceOf(Array);
      expect(HALF_NOTE_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("HALF_NOTE_MINI_CARD", () => {
    it("has title and text", () => {
      expect(HALF_NOTE_MINI_CARD.title).toBe("Half Note");
      expect(HALF_NOTE_MINI_CARD.text).toContain("2 beats");
    });
  });

  describe("HALF_NOTE_THRESHOLDS", () => {
    it("has required threshold values", () => {
      expect(HALF_NOTE_THRESHOLDS.sustainThreshold).toBeDefined();
      expect(HALF_NOTE_THRESHOLDS.pitchSuccessRatio).toBeDefined();
    });

    it("thresholds are between 0 and 1", () => {
      expect(HALF_NOTE_THRESHOLDS.sustainThreshold).toBeGreaterThanOrEqual(0);
      expect(HALF_NOTE_THRESHOLDS.sustainThreshold).toBeLessThanOrEqual(1);
      expect(HALF_NOTE_THRESHOLDS.pitchSuccessRatio).toBeGreaterThanOrEqual(0);
      expect(HALF_NOTE_THRESHOLDS.pitchSuccessRatio).toBeLessThanOrEqual(1);
    });

    it("has pitch tolerance configuration", () => {
      expect(HALF_NOTE_THRESHOLDS.pitchTolerance).toBeDefined();
    });
  });

  describe("generateHalfNoteInfo", () => {
    it("generates note info for C4", () => {
      const noteInfo = generateHalfNoteInfo("C4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("C4");
      expect(noteInfo!.letter).toBe("C");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(60);
      expect(noteInfo!.frequency).toBeCloseTo(261.63, 0);
    });

    it("generates note info for A4", () => {
      const noteInfo = generateHalfNoteInfo("A4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("A4");
      expect(noteInfo!.letter).toBe("A");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(69);
      expect(noteInfo!.frequency).toBeCloseTo(440, 0);
    });

    it("handles sharp notes", () => {
      const noteInfo = generateHalfNoteInfo("F#4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("F#4");
      expect(noteInfo!.letter).toBe("F");
      expect(noteInfo!.accidental).toBe("#");
      expect(noteInfo!.octave).toBe(4);
    });

    it("handles flat notes", () => {
      const noteInfo = generateHalfNoteInfo("Bb3");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("Bb3");
      expect(noteInfo!.letter).toBe("B");
      expect(noteInfo!.accidental).toBe("b");
      expect(noteInfo!.octave).toBe(3);
    });

    it("handles different octaves", () => {
      const noteInfo2 = generateHalfNoteInfo("C2");
      expect(noteInfo2).not.toBeNull();
      expect(noteInfo2!.octave).toBe(2);

      const noteInfo5 = generateHalfNoteInfo("C5");
      expect(noteInfo5).not.toBeNull();
      expect(noteInfo5!.octave).toBe(5);
    });

    it("returns null for invalid note names", () => {
      expect(generateHalfNoteInfo("invalid")).toBeNull();
      expect(generateHalfNoteInfo("")).toBeNull();
    });
  });

  describe("generateHalfNoteMusicXML", () => {
    it("generates valid MusicXML string", () => {
      const xml = generateHalfNoteMusicXML("C4");
      expect(typeof xml).toBe("string");
      expect(xml.length).toBeGreaterThan(0);
    });

    it("contains required MusicXML elements", () => {
      const xml = generateHalfNoteMusicXML("C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<part-list");
      expect(xml).toContain("<measure");
    });

    it("contains note element", () => {
      const xml = generateHalfNoteMusicXML("C4");
      expect(xml).toContain("<note");
      expect(xml).toContain("<pitch");
    });

    it("contains half note type", () => {
      const xml = generateHalfNoteMusicXML("C4");
      expect(xml).toContain("<type>half</type>");
    });

    it("handles different notes", () => {
      const xmlA4 = generateHalfNoteMusicXML("A4");
      expect(xmlA4).toContain("<step>A</step>");

      const xmlG3 = generateHalfNoteMusicXML("G3");
      expect(xmlG3).toContain("<step>G</step>");
    });

    it("includes correct octave", () => {
      const xml = generateHalfNoteMusicXML("C4");
      expect(xml).toContain("<octave>4</octave>");

      const xml3 = generateHalfNoteMusicXML("C3");
      expect(xml3).toContain("<octave>3</octave>");
    });
  });

  describe("getHalfNoteCursorConfig", () => {
    it("returns cursor configuration object", () => {
      const config = getHalfNoteCursorConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("has highlight position properties", () => {
      const config = getHalfNoteCursorConfig();
      expect(config.highlightLeft).toBeDefined();
      expect(typeof config.highlightLeft).toBe("number");
      expect(config.highlightWidth).toBeDefined();
      expect(typeof config.highlightWidth).toBe("number");
      expect(config.highlightHeight).toBeDefined();
      expect(typeof config.highlightHeight).toBe("number");
    });
  });

  describe("halfNoteConfig export object", () => {
    it("is a valid configuration object", () => {
      expect(halfNoteConfig).toBeDefined();
      expect(typeof halfNoteConfig).toBe("object");
    });

    it("contains expected properties from HALF_NOTE_CONFIG", () => {
      expect(halfNoteConfig.beatsPerNote).toBe(2);
      expect(halfNoteConfig.noteType).toBe("half");
    });

    it("contains focus card", () => {
      expect(halfNoteConfig.focusCard).toBe(HALF_NOTE_FOCUS_CARD);
    });

    it("contains mini card", () => {
      expect(halfNoteConfig.miniCard).toBe(HALF_NOTE_MINI_CARD);
    });

    it("contains thresholds", () => {
      expect(halfNoteConfig.thresholds).toBe(HALF_NOTE_THRESHOLDS);
    });
  });
});
