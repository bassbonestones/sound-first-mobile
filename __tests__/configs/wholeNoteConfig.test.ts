/**
 * Tests for wholeNoteConfig
 * Tests whole note exercise configuration and helper functions
 */
import {
  WHOLE_NOTE_CONFIG,
  WHOLE_NOTE_FOCUS_CARD,
  WHOLE_NOTE_MINI_CARD,
  WHOLE_NOTE_THRESHOLDS,
  generateWholeNoteInfo,
  generateWholeNoteMusicXML,
  getWholeNoteCursorConfig,
  wholeNoteConfig,
} from "../../src/screens/Session/components/exercises/configs/wholeNoteConfig";

describe("wholeNoteConfig", () => {
  describe("WHOLE_NOTE_CONFIG", () => {
    it("has correct beat configuration", () => {
      expect(WHOLE_NOTE_CONFIG.beatsPerNote).toBe(4);
      expect(WHOLE_NOTE_CONFIG.noteType).toBe("whole");
    });

    it("has correct tempo", () => {
      expect(WHOLE_NOTE_CONFIG.defaultTempo).toBe(60);
    });

    it("has correct flags", () => {
      expect(WHOLE_NOTE_CONFIG.hasSubdivision).toBe(false);
      expect(WHOLE_NOTE_CONFIG.hasDronePhase).toBe(false);
    });
  });

  describe("WHOLE_NOTE_FOCUS_CARD", () => {
    it("has correct title and symbol", () => {
      expect(WHOLE_NOTE_FOCUS_CARD.title).toBe("Whole Note");
      expect(WHOLE_NOTE_FOCUS_CARD.symbol).toBe("whole_note");
    });

    it("has description and cue", () => {
      expect(WHOLE_NOTE_FOCUS_CARD.description).toContain("4 beats");
      expect(WHOLE_NOTE_FOCUS_CARD.cue).toContain("ONE");
    });

    it("has details array", () => {
      expect(WHOLE_NOTE_FOCUS_CARD.details).toBeInstanceOf(Array);
      expect(WHOLE_NOTE_FOCUS_CARD.details.length).toBeGreaterThan(0);
    });
  });

  describe("WHOLE_NOTE_MINI_CARD", () => {
    it("has title and text", () => {
      expect(WHOLE_NOTE_MINI_CARD.title).toBe("Whole Note");
      expect(WHOLE_NOTE_MINI_CARD.text).toContain("4 beats");
    });
  });

  describe("WHOLE_NOTE_THRESHOLDS", () => {
    it("has required threshold values", () => {
      expect(WHOLE_NOTE_THRESHOLDS.sustainThreshold).toBeDefined();
      expect(WHOLE_NOTE_THRESHOLDS.pitchSuccessRatio).toBeDefined();
      expect(WHOLE_NOTE_THRESHOLDS.stopThreshold).toBeDefined();
    });

    it("thresholds are between 0 and 1", () => {
      expect(WHOLE_NOTE_THRESHOLDS.sustainThreshold).toBeGreaterThanOrEqual(0);
      expect(WHOLE_NOTE_THRESHOLDS.sustainThreshold).toBeLessThanOrEqual(1);
      expect(WHOLE_NOTE_THRESHOLDS.pitchSuccessRatio).toBeGreaterThanOrEqual(0);
      expect(WHOLE_NOTE_THRESHOLDS.pitchSuccessRatio).toBeLessThanOrEqual(1);
      expect(WHOLE_NOTE_THRESHOLDS.stopThreshold).toBeGreaterThanOrEqual(0);
      expect(WHOLE_NOTE_THRESHOLDS.stopThreshold).toBeLessThanOrEqual(1);
    });

    it("has pitch tolerance configuration", () => {
      expect(WHOLE_NOTE_THRESHOLDS.pitchTolerance).toBeDefined();
      expect(WHOLE_NOTE_THRESHOLDS.pitchTolerance.sing).toBeDefined();
      expect(WHOLE_NOTE_THRESHOLDS.pitchTolerance.play).toBeDefined();
    });
  });

  describe("generateWholeNoteInfo", () => {
    it("generates note info for C4", () => {
      const noteInfo = generateWholeNoteInfo("C4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("C4");
      expect(noteInfo!.letter).toBe("C");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(60);
      expect(noteInfo!.frequency).toBeCloseTo(261.63, 0);
    });

    it("generates note info for A4", () => {
      const noteInfo = generateWholeNoteInfo("A4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("A4");
      expect(noteInfo!.letter).toBe("A");
      expect(noteInfo!.octave).toBe(4);
      expect(noteInfo!.midi).toBe(69);
      expect(noteInfo!.frequency).toBeCloseTo(440, 0);
    });

    it("handles sharp notes", () => {
      const noteInfo = generateWholeNoteInfo("F#4");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("F#4");
      expect(noteInfo!.letter).toBe("F");
      expect(noteInfo!.accidental).toBe("#");
      expect(noteInfo!.octave).toBe(4);
    });

    it("handles flat notes", () => {
      const noteInfo = generateWholeNoteInfo("Bb3");
      expect(noteInfo).not.toBeNull();
      expect(noteInfo!.noteName).toBe("Bb3");
      expect(noteInfo!.letter).toBe("B");
      expect(noteInfo!.accidental).toBe("b");
      expect(noteInfo!.octave).toBe(3);
    });

    it("handles different octaves", () => {
      const noteInfo2 = generateWholeNoteInfo("C2");
      expect(noteInfo2).not.toBeNull();
      expect(noteInfo2!.octave).toBe(2);

      const noteInfo5 = generateWholeNoteInfo("C5");
      expect(noteInfo5).not.toBeNull();
      expect(noteInfo5!.octave).toBe(5);
    });

    it("returns null for invalid note names", () => {
      expect(generateWholeNoteInfo("invalid")).toBeNull();
      expect(generateWholeNoteInfo("")).toBeNull();
    });
  });

  describe("generateWholeNoteMusicXML", () => {
    it("generates valid MusicXML string", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(typeof xml).toBe("string");
      expect(xml!.length).toBeGreaterThan(0);
    });

    it("contains required MusicXML elements", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<part-list");
      expect(xml).toContain("<measure");
    });

    it("contains note element", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(xml).toContain("<note");
      expect(xml).toContain("<pitch");
    });

    it("contains whole note type", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(xml).toContain("<type>whole</type>");
    });

    it("handles different notes", () => {
      const xmlA4 = generateWholeNoteMusicXML("A4");
      expect(xmlA4).toContain("<step>A</step>");

      const xmlG3 = generateWholeNoteMusicXML("G3");
      expect(xmlG3).toContain("<step>G</step>");
    });

    it("includes correct octave", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(xml).toContain("<octave>4</octave>");

      const xml3 = generateWholeNoteMusicXML("C3");
      expect(xml3).toContain("<octave>3</octave>");
    });

    it("supports treble clef by default", () => {
      const xml = generateWholeNoteMusicXML("C4");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
    });

    it("supports bass clef", () => {
      const xml = generateWholeNoteMusicXML("C3", "bass");
      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("handles sharp notes in MusicXML", () => {
      const xml = generateWholeNoteMusicXML("F#4");
      expect(xml).toContain("<alter>1</alter>");
      expect(xml).toContain("<accidental>sharp</accidental>");
    });

    it("handles flat notes in MusicXML", () => {
      const xml = generateWholeNoteMusicXML("Bb3");
      expect(xml).toContain("<alter>-1</alter>");
      expect(xml).toContain("<accidental>flat</accidental>");
    });

    it("returns null for invalid notes", () => {
      expect(generateWholeNoteMusicXML("invalid")).toBeNull();
      expect(generateWholeNoteMusicXML("")).toBeNull();
    });
  });

  describe("getWholeNoteCursorConfig", () => {
    it("returns cursor configuration object", () => {
      const config = getWholeNoteCursorConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe("object");
    });

    it("has highlight position properties", () => {
      const config = getWholeNoteCursorConfig();
      expect(config.highlightLeft).toBeDefined();
      expect(typeof config.highlightLeft).toBe("number");
      expect(config.highlightWidth).toBeDefined();
      expect(typeof config.highlightWidth).toBe("number");
      expect(config.highlightHeight).toBeDefined();
      expect(typeof config.highlightHeight).toBe("number");
    });

    it("returns correct dimension values", () => {
      const config = getWholeNoteCursorConfig();
      expect(config.highlightLeft).toBe(135);
      expect(config.highlightWidth).toBe(70);
      expect(config.highlightHeight).toBe(160);
    });
  });

  describe("wholeNoteConfig export object", () => {
    it("is a valid configuration object", () => {
      expect(wholeNoteConfig).toBeDefined();
      expect(typeof wholeNoteConfig).toBe("object");
    });

    it("contains expected properties from WHOLE_NOTE_CONFIG", () => {
      expect(wholeNoteConfig.beatsPerNote).toBe(4);
      expect(wholeNoteConfig.noteType).toBe("whole");
    });

    it("contains focus card", () => {
      expect(wholeNoteConfig.focusCard).toBe(WHOLE_NOTE_FOCUS_CARD);
    });

    it("contains mini card", () => {
      expect(wholeNoteConfig.miniCard).toBe(WHOLE_NOTE_MINI_CARD);
    });

    it("contains thresholds", () => {
      expect(wholeNoteConfig.thresholds).toBe(WHOLE_NOTE_THRESHOLDS);
    });
  });
});
