/**
 * Tests for fragment2Config
 * Tests Fragment2 exercise configuration and helper functions
 */
import {
  FRAGMENT2_CONFIG,
  FRAGMENT2_PATTERNS,
  FRAGMENT2_PATTERN_ORDER,
  FRAGMENT2_FOCUS_CARDS,
  MAJOR_SCALE_INTERVALS,
  getScaleDegreeMidi,
  generatePatternNotes,
  getFragment2Pattern,
  getFragment2FocusCard,
  generateFragment2MusicXML,
} from "../../src/screens/Session/components/exercises/configs/fragment2Config";

describe("fragment2Config", () => {
  describe("FRAGMENT2_CONFIG", () => {
    it("has correct tempo", () => {
      expect(FRAGMENT2_CONFIG.tempo).toBe(60);
    });

    it("has correct beats per note", () => {
      expect(FRAGMENT2_CONFIG.beatsPerNote).toBe(2);
    });

    it("has subdivision enabled", () => {
      expect(FRAGMENT2_CONFIG.hasSubdivision).toBe(true);
    });

    it("has drone phase enabled", () => {
      expect(FRAGMENT2_CONFIG.hasDronePhase).toBe(true);
    });
  });

  describe("FRAGMENT2_PATTERNS", () => {
    it("has LINEAR_UP pattern", () => {
      expect(FRAGMENT2_PATTERNS.LINEAR_UP).toBeDefined();
      expect(FRAGMENT2_PATTERNS.LINEAR_UP.id).toBe("linear_up");
      expect(FRAGMENT2_PATTERNS.LINEAR_UP.scaleDegrees).toEqual([1, 2]);
    });

    it("has LINEAR_DOWN pattern", () => {
      expect(FRAGMENT2_PATTERNS.LINEAR_DOWN).toBeDefined();
      expect(FRAGMENT2_PATTERNS.LINEAR_DOWN.id).toBe("linear_down");
      expect(FRAGMENT2_PATTERNS.LINEAR_DOWN.scaleDegrees).toEqual([2, 1]);
    });

    it("has ARC_UP pattern", () => {
      expect(FRAGMENT2_PATTERNS.ARC_UP).toBeDefined();
      expect(FRAGMENT2_PATTERNS.ARC_UP.id).toBe("arc_up");
      expect(FRAGMENT2_PATTERNS.ARC_UP.scaleDegrees).toEqual([1, 2, 1]);
    });

    it("has ARC_DOWN pattern", () => {
      expect(FRAGMENT2_PATTERNS.ARC_DOWN).toBeDefined();
      expect(FRAGMENT2_PATTERNS.ARC_DOWN.id).toBe("arc_down");
      expect(FRAGMENT2_PATTERNS.ARC_DOWN.scaleDegrees).toEqual([2, 1, 2]);
    });

    it("all patterns have required properties", () => {
      Object.values(FRAGMENT2_PATTERNS).forEach((pattern) => {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.scaleDegrees).toBeInstanceOf(Array);
        expect(pattern.description).toBeDefined();
      });
    });
  });

  describe("FRAGMENT2_PATTERN_ORDER", () => {
    it("contains all pattern ids", () => {
      expect(FRAGMENT2_PATTERN_ORDER).toContain("linear_up");
      expect(FRAGMENT2_PATTERN_ORDER).toContain("linear_down");
      expect(FRAGMENT2_PATTERN_ORDER).toContain("arc_up");
      expect(FRAGMENT2_PATTERN_ORDER).toContain("arc_down");
    });

    it("has 4 patterns", () => {
      expect(FRAGMENT2_PATTERN_ORDER.length).toBe(4);
    });
  });

  describe("FRAGMENT2_FOCUS_CARDS", () => {
    it("has multiple focus cards", () => {
      expect(FRAGMENT2_FOCUS_CARDS.length).toBeGreaterThan(0);
    });

    it("each focus card has required properties", () => {
      FRAGMENT2_FOCUS_CARDS.forEach((card) => {
        expect(card.category).toBeDefined();
        expect(card.name).toBeDefined();
        expect(card.description).toBeDefined();
        expect(card.cue).toBeDefined();
      });
    });

    it("includes pitch category", () => {
      const pitchCard = FRAGMENT2_FOCUS_CARDS.find(
        (c) => c.category === "pitch",
      );
      expect(pitchCard).toBeDefined();
    });

    it("includes rhythm category", () => {
      const rhythmCard = FRAGMENT2_FOCUS_CARDS.find(
        (c) => c.category === "rhythm",
      );
      expect(rhythmCard).toBeDefined();
    });
  });

  describe("MAJOR_SCALE_INTERVALS", () => {
    it("has 8 intervals (root to octave)", () => {
      expect(MAJOR_SCALE_INTERVALS.length).toBe(8);
    });

    it("starts with unison (0)", () => {
      expect(MAJOR_SCALE_INTERVALS[0]).toBe(0);
    });

    it("ends with octave (12)", () => {
      expect(MAJOR_SCALE_INTERVALS[7]).toBe(12);
    });

    it("has correct whole and half step pattern", () => {
      expect(MAJOR_SCALE_INTERVALS).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
    });
  });

  describe("getScaleDegreeMidi", () => {
    it("returns root for scale degree 1", () => {
      expect(getScaleDegreeMidi(60, 1)).toBe(60); // C4
    });

    it("returns whole step up for scale degree 2", () => {
      expect(getScaleDegreeMidi(60, 2)).toBe(62); // D4
    });

    it("returns major third for scale degree 3", () => {
      expect(getScaleDegreeMidi(60, 3)).toBe(64); // E4
    });

    it("returns perfect fourth for scale degree 4", () => {
      expect(getScaleDegreeMidi(60, 4)).toBe(65); // F4
    });

    it("returns perfect fifth for scale degree 5", () => {
      expect(getScaleDegreeMidi(60, 5)).toBe(67); // G4
    });

    it("returns octave for scale degree 8", () => {
      expect(getScaleDegreeMidi(60, 8)).toBe(72); // C5
    });

    it("works with different root notes", () => {
      expect(getScaleDegreeMidi(69, 1)).toBe(69); // A4
      expect(getScaleDegreeMidi(69, 2)).toBe(71); // B4
    });
  });

  describe("generatePatternNotes", () => {
    it("generates correct notes for linear up pattern", () => {
      const notes = generatePatternNotes([1, 2], "C4");
      expect(notes.length).toBe(2);
      expect(notes[0].midi).toBe(60);
      expect(notes[1].midi).toBe(62);
    });

    it("generates correct notes for linear down pattern", () => {
      const notes = generatePatternNotes([2, 1], "C4");
      expect(notes.length).toBe(2);
      expect(notes[0].midi).toBe(62);
      expect(notes[1].midi).toBe(60);
    });

    it("generates correct notes for arc up pattern", () => {
      const notes = generatePatternNotes([1, 2, 1], "C4");
      expect(notes.length).toBe(3);
      expect(notes[0].midi).toBe(60);
      expect(notes[1].midi).toBe(62);
      expect(notes[2].midi).toBe(60);
    });

    it("includes frequency for each note", () => {
      const notes = generatePatternNotes([1, 2], "A4");
      expect(notes[0].frequency).toBeCloseTo(440, 0);
    });

    it("includes MusicXML parts for each note", () => {
      const notes = generatePatternNotes([1], "C4");
      expect(notes[0].step).toBe("C");
      expect(notes[0].octave).toBe("4");
    });

    it("handles sharp notes", () => {
      const notes = generatePatternNotes([1], "F#4");
      expect(notes[0].noteName).toContain("F");
      expect(notes[0].alterXML).toContain("1");
      expect(notes[0].accidentalXML).toContain("sharp");
    });
  });

  describe("getFragment2Pattern", () => {
    it("returns LINEAR_UP pattern", () => {
      const pattern = getFragment2Pattern("linear_up");
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe("Linear Up");
    });

    it("returns LINEAR_DOWN pattern", () => {
      const pattern = getFragment2Pattern("linear_down");
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe("Linear Down");
    });

    it("returns ARC_UP pattern", () => {
      const pattern = getFragment2Pattern("arc_up");
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe("Arc Up");
    });

    it("returns ARC_DOWN pattern", () => {
      const pattern = getFragment2Pattern("arc_down");
      expect(pattern).toBeDefined();
      expect(pattern?.name).toBe("Arc Down");
    });

    it("returns undefined for unknown pattern", () => {
      expect(getFragment2Pattern("unknown")).toBeUndefined();
    });
  });

  describe("getFragment2FocusCard", () => {
    it("returns focus card for index 0", () => {
      const card = getFragment2FocusCard(0);
      expect(card).toBeDefined();
      expect(card.name).toBeDefined();
    });

    it("returns focus card for index 1", () => {
      const card = getFragment2FocusCard(1);
      expect(card).toBeDefined();
    });

    it("cycles through cards for higher indices", () => {
      const cardCount = FRAGMENT2_FOCUS_CARDS.length;
      const card0 = getFragment2FocusCard(0);
      const cardCycled = getFragment2FocusCard(cardCount);
      expect(card0.name).toBe(cardCycled.name);
    });
  });

  describe("generateFragment2MusicXML", () => {
    it("generates valid MusicXML for 2-note pattern", () => {
      const xml = generateFragment2MusicXML([1, 2], "C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<type>half</type>");
    });

    it("generates valid MusicXML for 3-note pattern", () => {
      const xml = generateFragment2MusicXML([1, 2, 1], "C4");
      expect(xml).toContain("<?xml");
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain('measure number="1"');
      expect(xml).toContain('measure number="2"');
    });

    it("includes correct note pitches", () => {
      const xml = generateFragment2MusicXML([1, 2], "C4");
      expect(xml).toContain("<step>C</step>");
      expect(xml).toContain("<step>D</step>");
    });

    it("supports treble clef by default", () => {
      const xml = generateFragment2MusicXML([1, 2], "C4");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
    });

    it("supports bass clef", () => {
      const xml = generateFragment2MusicXML([1, 2], "C3", "bass");
      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("includes rest in 3-note pattern second measure", () => {
      const xml = generateFragment2MusicXML([1, 2, 1], "C4");
      expect(xml).toContain("<rest/>");
    });
  });
});
