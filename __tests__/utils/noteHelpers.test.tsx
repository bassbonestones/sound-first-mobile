/**
 * @fileoverview Tests for noteHelpers utility functions
 */

import {
  parseNoteName,
  noteToMusicXMLPitch,
  generateSingleNoteMusicXML,
} from "../../src/screens/FirstNote/utils/noteHelpers";

describe("noteHelpers", () => {
  // ==========================================================================
  // parseNoteName Tests
  // ==========================================================================
  describe("parseNoteName", () => {
    it("parses simple natural note", () => {
      const result = parseNoteName("C4");
      expect(result.letter).toBe("C");
      expect(result.accidental).toBe("");
      expect(result.octave).toBe(4);
    });

    it("parses sharp note", () => {
      const result = parseNoteName("F#3");
      expect(result.letter).toBe("F");
      expect(result.accidental).toBe("♯");
      expect(result.rawAccidental).toBe("#");
      expect(result.octave).toBe(3);
      expect(result.hasAccidental).toBe(true);
    });

    it("parses flat note", () => {
      const result = parseNoteName("Bb4");
      expect(result.letter).toBe("B");
      expect(result.accidental).toBe("♭");
      expect(result.rawAccidental).toBe("b");
      expect(result.octave).toBe(4);
      expect(result.hasAccidental).toBe(true);
    });

    it("handles lowercase letters", () => {
      const result = parseNoteName("a3");
      expect(result.letter).toBe("A");
      expect(result.octave).toBe(3);
    });

    it("returns default for null input", () => {
      const result = parseNoteName(null);
      expect(result.letter).toBe("C");
      expect(result.octave).toBe(4);
    });

    it("returns default for invalid input", () => {
      const result = parseNoteName("invalid");
      expect(result.letter).toBe("C");
      expect(result.octave).toBe(4);
    });

    it("returns default for empty string", () => {
      const result = parseNoteName("");
      expect(result.letter).toBe("C");
      expect(result.octave).toBe(4);
    });

    it("hasAccidental is false for natural notes", () => {
      const result = parseNoteName("D4");
      expect(result.hasAccidental).toBe(false);
    });

    it("parses notes in different octaves", () => {
      expect(parseNoteName("C2").octave).toBe(2);
      expect(parseNoteName("G5").octave).toBe(5);
      expect(parseNoteName("E6").octave).toBe(6);
    });

    it("parses all note letters", () => {
      const letters = ["A", "B", "C", "D", "E", "F", "G"];
      letters.forEach((letter) => {
        const result = parseNoteName(`${letter}4`);
        expect(result.letter).toBe(letter);
      });
    });
  });

  // ==========================================================================
  // noteToMusicXMLPitch Tests
  // ==========================================================================
  describe("noteToMusicXMLPitch", () => {
    it("converts natural note to MusicXML pitch", () => {
      const pitch = noteToMusicXMLPitch("C4");
      expect(pitch.step).toBe("C");
      expect(pitch.octave).toBe(4);
      expect(pitch.alter).toBe(0);
    });

    it("converts sharp note to MusicXML pitch", () => {
      const pitch = noteToMusicXMLPitch("F#3");
      expect(pitch.step).toBe("F");
      expect(pitch.octave).toBe(3);
      expect(pitch.alter).toBe(1);
    });

    it("converts flat note to MusicXML pitch", () => {
      const pitch = noteToMusicXMLPitch("Bb4");
      expect(pitch.step).toBe("B");
      expect(pitch.octave).toBe(4);
      expect(pitch.alter).toBe(-1);
    });

    it("handles null input", () => {
      const pitch = noteToMusicXMLPitch(null);
      expect(pitch.step).toBe("C");
      expect(pitch.octave).toBe(4);
      expect(pitch.alter).toBe(0);
    });
  });

  // ==========================================================================
  // generateSingleNoteMusicXML Tests
  // ==========================================================================
  describe("generateSingleNoteMusicXML", () => {
    it("generates MusicXML for treble clef", () => {
      const xml = generateSingleNoteMusicXML("C4", "treble");
      expect(xml).toContain("<sign>G</sign>");
      expect(xml).toContain("<line>2</line>");
      expect(xml).toContain("<step>C</step>");
      expect(xml).toContain("<octave>4</octave>");
    });

    it("generates MusicXML for bass clef", () => {
      const xml = generateSingleNoteMusicXML("C3", "bass");
      expect(xml).toContain("<sign>F</sign>");
      expect(xml).toContain("<line>4</line>");
    });

    it("defaults to treble clef", () => {
      const xml = generateSingleNoteMusicXML("A4");
      expect(xml).toContain("<sign>G</sign>");
    });

    it("includes alter for sharp notes", () => {
      const xml = generateSingleNoteMusicXML("C#4", "treble");
      expect(xml).toContain("<alter>1</alter>");
    });

    it("includes alter for flat notes", () => {
      const xml = generateSingleNoteMusicXML("Bb3", "treble");
      expect(xml).toContain("<alter>-1</alter>");
    });

    it("does not include alter for natural notes", () => {
      const xml = generateSingleNoteMusicXML("G4", "treble");
      expect(xml).not.toContain("<alter>");
    });

    it("returns valid XML structure", () => {
      const xml = generateSingleNoteMusicXML("E4", "treble");
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain("<score-partwise");
      expect(xml).toContain("<part-list>");
      expect(xml).toContain('<measure number="1">');
    });
  });
});
