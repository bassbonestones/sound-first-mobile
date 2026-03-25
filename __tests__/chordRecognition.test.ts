/**
 * Chord Recognition Service Tests
 *
 * Tests for chord symbol parsing, validation, autocomplete, MIDI spelling, and transposition.
 */

import {
  recognizeChord,
  getAutocompleteSuggestions,
  spellChord,
  transposeChord,
  isValidChordSymbol,
  getChordIntervals,
  getSupportedQualities,
  type ChordQuality,
} from "../src/features/tune-composer/services/chordRecognition";

describe("Chord Recognition Service", () => {
  describe("recognizeChord", () => {
    describe("basic triads", () => {
      it("should recognize major triads", () => {
        const result = recognizeChord("C");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.root).toBe("C");
        expect(result.parsed?.quality).toBe("major");
      });

      it("should recognize minor triads", () => {
        const result = recognizeChord("Cm");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.root).toBe("C");
        expect(result.parsed?.quality).toBe("minor");
      });

      it("should recognize diminished triads", () => {
        const result = recognizeChord("Cdim");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("diminished");
      });

      it("should recognize augmented triads", () => {
        const result = recognizeChord("Caug");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("augmented");
      });

      it("should recognize sus4 chords", () => {
        const result = recognizeChord("Csus4");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("sus4");
      });

      it("should recognize sus2 chords", () => {
        const result = recognizeChord("Csus2");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("sus2");
      });
    });

    describe("seventh chords", () => {
      it("should recognize major seventh chords", () => {
        const result = recognizeChord("Cmaj7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("maj7");
      });

      it("should recognize dominant seventh chords", () => {
        const result = recognizeChord("C7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7");
      });

      it("should recognize minor seventh chords", () => {
        const result = recognizeChord("Cm7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("m7");
      });

      it("should recognize minor-major seventh chords", () => {
        const result = recognizeChord("CmMaj7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("mMaj7");
      });

      it("should recognize diminished seventh chords", () => {
        const result = recognizeChord("Cdim7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("dim7");
      });

      it("should recognize half-diminished (m7b5) chords", () => {
        const result = recognizeChord("Cm7b5");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("m7b5");
      });

      it("should recognize 7sus4 chords", () => {
        const result = recognizeChord("C7sus4");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7sus4");
      });
    });

    describe("extended chords", () => {
      it("should recognize ninth chords", () => {
        expect(recognizeChord("C9").parsed?.quality).toBe("9");
        expect(recognizeChord("Cmaj9").parsed?.quality).toBe("maj9");
        expect(recognizeChord("Cm9").parsed?.quality).toBe("m9");
      });

      it("should recognize eleventh chords", () => {
        expect(recognizeChord("C11").parsed?.quality).toBe("11");
        expect(recognizeChord("Cmaj11").parsed?.quality).toBe("maj11");
        expect(recognizeChord("Cm11").parsed?.quality).toBe("m11");
      });

      it("should recognize thirteenth chords", () => {
        expect(recognizeChord("C13").parsed?.quality).toBe("13");
        expect(recognizeChord("Cmaj13").parsed?.quality).toBe("maj13");
        expect(recognizeChord("Cm13").parsed?.quality).toBe("m13");
      });
    });

    describe("altered dominant chords", () => {
      it("should recognize 7b9", () => {
        const result = recognizeChord("C7b9");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7b9");
      });

      it("should recognize 7#9", () => {
        const result = recognizeChord("C7#9");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7#9");
      });

      it("should recognize 7b5", () => {
        const result = recognizeChord("C7b5");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7b5");
      });

      it("should recognize 7#5", () => {
        const result = recognizeChord("C7#5");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7#5");
      });

      it("should recognize 7alt", () => {
        const result = recognizeChord("C7alt");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("7alt");
      });
    });

    describe("add chords", () => {
      it("should recognize add9", () => {
        const result = recognizeChord("Cadd9");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("add9");
      });

      it("should recognize add11", () => {
        const result = recognizeChord("Cadd11");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("add11");
      });

      it("should recognize 6 chords", () => {
        const result = recognizeChord("C6");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("6");
      });

      it("should recognize 6/9 chords", () => {
        const result = recognizeChord("C6/9");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("6/9");
      });
    });

    describe("slash chords", () => {
      it("should recognize slash chords with bass note", () => {
        const result = recognizeChord("C/E");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.root).toBe("C");
        expect(result.parsed?.quality).toBe("major");
        expect(result.parsed?.bass).toBe("E");
      });

      it("should recognize complex slash chords", () => {
        const result = recognizeChord("Dm7/G");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.root).toBe("D");
        expect(result.parsed?.quality).toBe("m7");
        expect(result.parsed?.bass).toBe("G");
      });

      it("should handle slash chords with accidentals", () => {
        const result = recognizeChord("F#m7/C#");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.root).toBe("F#");
        expect(result.parsed?.bass).toBe("C#");
      });
    });

    describe("root notes with accidentals", () => {
      it("should recognize sharp roots", () => {
        expect(recognizeChord("F#").parsed?.root).toBe("F#");
        expect(recognizeChord("C#m7").parsed?.root).toBe("C#");
        expect(recognizeChord("G#dim").parsed?.root).toBe("G#");
      });

      it("should recognize flat roots", () => {
        expect(recognizeChord("Bb").parsed?.root).toBe("Bb");
        expect(recognizeChord("Ebm7").parsed?.root).toBe("Eb");
        expect(recognizeChord("Abmaj7").parsed?.root).toBe("Ab");
      });

      it("should handle all chromatic roots", () => {
        const roots = [
          "C",
          "C#",
          "Db",
          "D",
          "D#",
          "Eb",
          "E",
          "F",
          "F#",
          "Gb",
          "G",
          "G#",
          "Ab",
          "A",
          "A#",
          "Bb",
          "B",
        ];
        for (const root of roots) {
          const result = recognizeChord(root);
          expect(result.recognized).toBe(true);
          expect(result.parsed?.root).toBe(root);
        }
      });
    });

    describe("alternative notations", () => {
      it("should recognize triangle notation for maj7", () => {
        const result = recognizeChord("CΔ7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("maj7");
      });

      it("should recognize circle notation for dim", () => {
        const result = recognizeChord("C°");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("diminished");
      });

      it("should recognize half-diminished symbol", () => {
        const result = recognizeChord("Cø");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("m7b5");
      });

      it("should recognize minus for minor", () => {
        const result = recognizeChord("C-7");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("m7");
      });

      it("should recognize plus for augmented", () => {
        const result = recognizeChord("C+");
        expect(result.recognized).toBe(true);
        expect(result.parsed?.quality).toBe("augmented");
      });
    });

    describe("normalization", () => {
      it("should build canonical symbol", () => {
        expect(recognizeChord("C-7").parsed?.symbol).toBe("Cm7");
        expect(recognizeChord("CΔ").parsed?.symbol).toBe("Cmaj7");
        expect(recognizeChord("C+").parsed?.symbol).toBe("Caug");
      });
    });

    describe("invalid inputs", () => {
      it("should return not recognized for empty input", () => {
        expect(recognizeChord("").recognized).toBe(false);
        expect(recognizeChord("  ").recognized).toBe(false);
      });

      it("should return not recognized for invalid root", () => {
        const result = recognizeChord("Xmaj7");
        expect(result.recognized).toBe(false);
        expect(result.error).toContain("Invalid root note");
      });

      it("should handle null/undefined gracefully", () => {
        expect(recognizeChord(null as unknown as string).recognized).toBe(
          false,
        );
        expect(recognizeChord(undefined as unknown as string).recognized).toBe(
          false,
        );
      });
    });
  });

  describe("getAutocompleteSuggestions", () => {
    it("should return empty array for empty input", () => {
      expect(getAutocompleteSuggestions("")).toEqual([]);
      expect(getAutocompleteSuggestions("  ")).toEqual([]);
    });

    it("should return suggestions starting with input", () => {
      const suggestions = getAutocompleteSuggestions("Cm");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.toLowerCase().startsWith("cm"))).toBe(
        true,
      );
    });

    it("should include common chord types", () => {
      const suggestions = getAutocompleteSuggestions("C");
      expect(suggestions).toContain("C");
      expect(suggestions).toContain("Cm");
    });

    it("should be case-insensitive", () => {
      const upper = getAutocompleteSuggestions("CM");
      const lower = getAutocompleteSuggestions("cm");
      expect(upper.length).toBe(lower.length);
    });

    it("should respect limit parameter", () => {
      const suggestions = getAutocompleteSuggestions("C", 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it("should sort by length then alphabetically", () => {
      const suggestions = getAutocompleteSuggestions("C", 20);
      // Shorter chords should come first
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i].length).toBeGreaterThanOrEqual(
          suggestions[i - 1].length,
        );
      }
    });

    it("should handle accidentals", () => {
      const sharpSuggestions = getAutocompleteSuggestions("F#");
      expect(sharpSuggestions.length).toBeGreaterThan(0);

      const flatSuggestions = getAutocompleteSuggestions("Bb");
      expect(flatSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe("spellChord", () => {
    describe("basic chords", () => {
      it("should spell C major triad", () => {
        const notes = spellChord("C");
        expect(notes).toEqual([60, 64, 67]); // C4, E4, G4
      });

      it("should spell C minor triad", () => {
        const notes = spellChord("Cm");
        expect(notes).toEqual([60, 63, 67]); // C4, Eb4, G4
      });

      it("should spell Cmaj7", () => {
        const notes = spellChord("Cmaj7");
        expect(notes).toEqual([60, 64, 67, 71]); // C4, E4, G4, B4
      });

      it("should spell Cm7", () => {
        const notes = spellChord("Cm7");
        expect(notes).toEqual([60, 63, 67, 70]); // C4, Eb4, G4, Bb4
      });

      it("should spell C7 (dominant)", () => {
        const notes = spellChord("C7");
        expect(notes).toEqual([60, 64, 67, 70]); // C4, E4, G4, Bb4
      });
    });

    describe("transposed roots", () => {
      it("should spell D major correctly", () => {
        const notes = spellChord("D");
        expect(notes).toEqual([62, 66, 69]); // D4, F#4, A4
      });

      it("should spell F#m7 correctly", () => {
        const notes = spellChord("F#m7");
        expect(notes).toEqual([66, 69, 73, 76]); // F#4, A4, C#5, E5
      });

      it("should spell Bbmaj7 correctly", () => {
        const notes = spellChord("Bbmaj7");
        expect(notes).toEqual([70, 74, 77, 81]); // Bb4, D5, F5, A5
      });
    });

    describe("slash chords", () => {
      it("should include bass note below chord", () => {
        const notes = spellChord("C/E");
        // Bass E below root C
        expect(notes[0]).toBeLessThan(60); // Bass below C4
        expect(notes).toContain(52); // E3
        expect(notes.slice(1)).toEqual([60, 64, 67]); // C, E, G
      });

      it("should handle Dm7/G", () => {
        const notes = spellChord("Dm7/G");
        expect(notes[0]).toBe(55); // G3 as bass
        expect(notes.slice(1)).toEqual([62, 65, 69, 72]); // D4, F4, A4, C5
      });
    });

    describe("extended chords", () => {
      it("should spell C9 correctly", () => {
        const notes = spellChord("C9");
        expect(notes).toEqual([60, 64, 67, 70, 74]); // C4, E4, G4, Bb4, D5
      });

      it("should spell Cmaj9 correctly", () => {
        const notes = spellChord("Cmaj9");
        expect(notes).toEqual([60, 64, 67, 71, 74]); // C4, E4, G4, B4, D5
      });
    });

    describe("custom octave", () => {
      it("should use provided root octave", () => {
        const notes = spellChord("C", 48); // C3
        expect(notes).toEqual([48, 52, 55]); // C3, E3, G3
      });
    });

    describe("invalid input", () => {
      it("should return empty array for unrecognized chord", () => {
        expect(spellChord("Xmaj7")).toEqual([]);
        expect(spellChord("")).toEqual([]);
      });
    });
  });

  describe("transposeChord", () => {
    describe("basic transposition", () => {
      it("should transpose up by semitones", () => {
        expect(transposeChord("C", 2)).toBe("D");
        expect(transposeChord("C", 5)).toBe("F");
        expect(transposeChord("C", 7)).toBe("G");
      });

      it("should transpose down by negative semitones", () => {
        expect(transposeChord("D", -2)).toBe("C");
        expect(transposeChord("G", -7)).toBe("C");
      });

      it("should wrap around octave", () => {
        expect(transposeChord("A", 5)).toBe("D");
        expect(transposeChord("C", -1)).toBe("B");
      });
    });

    describe("preserving chord quality", () => {
      it("should preserve major seventh", () => {
        expect(transposeChord("Cmaj7", 5)).toBe("Fmaj7");
        expect(transposeChord("Cmaj7", 7)).toBe("Gmaj7");
      });

      it("should preserve minor seventh", () => {
        expect(transposeChord("Dm7", 2)).toBe("Em7");
        expect(transposeChord("Am7", -2)).toBe("Gm7");
      });

      it("should preserve dominant seventh", () => {
        expect(transposeChord("G7", 5)).toBe("C7");
      });

      it("should preserve alterations", () => {
        expect(transposeChord("C7b9", 2)).toBe("D7b9");
        expect(transposeChord("G7#9", -2)).toBe("F7#9");
      });

      it("should preserve extended chords", () => {
        expect(transposeChord("Cmaj9", 5)).toBe("Fmaj9");
        expect(transposeChord("Dm11", 2)).toBe("Em11");
      });
    });

    describe("slash chords", () => {
      it("should transpose both root and bass", () => {
        expect(transposeChord("C/E", 2)).toBe("D/F#");
        expect(transposeChord("Dm7/G", 5)).toBe("Gm7/C");
      });
    });

    describe("accidental handling", () => {
      it("should prefer flats when original uses flats", () => {
        expect(transposeChord("Bb", 2)).toBe("C");
        expect(transposeChord("Ebm7", 1)).toBe("Em7");
      });

      it("should use preferFlats parameter", () => {
        expect(transposeChord("C", 1, true)).toBe("Db");
        expect(transposeChord("C", 1, false)).toBe("C#");
      });
    });

    describe("circle of fifths", () => {
      it("should transpose through all keys", () => {
        let chord = "C";
        const keys: string[] = [chord];
        for (let i = 0; i < 11; i++) {
          chord = transposeChord(chord, 7); // Up a fifth
          keys.push(chord);
        }
        // Should cycle through all 12 keys
        expect(new Set(keys).size).toBe(12);
      });
    });

    describe("invalid input", () => {
      it("should return original for unrecognized chord", () => {
        expect(transposeChord("Xmaj7", 2)).toBe("Xmaj7");
        expect(transposeChord("", 5)).toBe("");
      });
    });
  });

  describe("isValidChordSymbol", () => {
    it("should return true for valid chords", () => {
      expect(isValidChordSymbol("C")).toBe(true);
      expect(isValidChordSymbol("Dm7")).toBe(true);
      expect(isValidChordSymbol("F#m7b5")).toBe(true);
      expect(isValidChordSymbol("Bbmaj7")).toBe(true);
    });

    it("should return false for invalid chords", () => {
      expect(isValidChordSymbol("")).toBe(false);
      expect(isValidChordSymbol("X")).toBe(false);
    });
  });

  describe("getChordIntervals", () => {
    it("should return intervals for major", () => {
      expect(getChordIntervals("major")).toEqual([0, 4, 7]);
    });

    it("should return intervals for minor", () => {
      expect(getChordIntervals("minor")).toEqual([0, 3, 7]);
    });

    it("should return intervals for maj7", () => {
      expect(getChordIntervals("maj7")).toEqual([0, 4, 7, 11]);
    });

    it("should return intervals for m7", () => {
      expect(getChordIntervals("m7")).toEqual([0, 3, 7, 10]);
    });

    it("should return copy, not original array", () => {
      const intervals = getChordIntervals("major");
      intervals.push(99);
      expect(getChordIntervals("major")).toEqual([0, 4, 7]);
    });
  });

  describe("getSupportedQualities", () => {
    it("should return array of all qualities", () => {
      const qualities = getSupportedQualities();
      expect(Array.isArray(qualities)).toBe(true);
      expect(qualities.length).toBeGreaterThan(20);
    });

    it("should include common qualities", () => {
      const qualities = getSupportedQualities();
      expect(qualities).toContain("major");
      expect(qualities).toContain("minor");
      expect(qualities).toContain("maj7");
      expect(qualities).toContain("m7");
      expect(qualities).toContain("7");
      expect(qualities).toContain("dim7");
      expect(qualities).toContain("m7b5");
    });
  });
});
