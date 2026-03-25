/**
 * Tune Composer MusicXML Generator Tests
 *
 * Tests for generating MusicXML from TuneComposerScore,
 * with focus on harmony (chord symbol) export.
 */

import {
  generateMusicXml,
  generateMusicXmlPreview,
  validateScoreForExport,
  generateHarmonyXml,
} from "../src/features/tune-composer/services";
import {
  createScore,
  createChordSymbol,
  createChordProgression,
  type TuneComposerScore,
  type ChordSymbol,
} from "../src/features/tune-composer/types";

describe("Tune Composer MusicXML Generator", () => {
  describe("generateMusicXml", () => {
    it("should generate valid MusicXML header", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain("<!DOCTYPE score-partwise");
      expect(xml).toContain('<score-partwise version="3.1">');
    });

    it("should include work title", () => {
      const score = createScore({ title: "My Tune" });
      const xml = generateMusicXml(score);

      expect(xml).toContain("<work-title>My Tune</work-title>");
    });

    it("should escape XML special characters in title", () => {
      const score = createScore({ title: "Test & <Score>" });
      const xml = generateMusicXml(score);

      expect(xml).toContain(
        "<work-title>Test &amp; &lt;Score&gt;</work-title>",
      );
    });

    it("should include identification with software name", () => {
      const score = createScore();
      const xml = generateMusicXml(score);

      expect(xml).toContain("<software>Sound First Tune Composer</software>");
    });

    it("should validate score for export", () => {
      const score = createScore();
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject score with no measures", () => {
      const score = createScore();
      score.measures = [];
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Score must have at least one measure");
    });

    it("should reject score with invalid tempo", () => {
      const score = createScore({ tempo: 500 });
      const result = validateScoreForExport(score);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Tempo must be between 20 and 400 BPM");
    });
  });

  describe("generateMusicXmlPreview", () => {
    it("should include header by default", () => {
      const score = createScore();
      const xml = generateMusicXmlPreview(score);

      expect(xml).toContain('<?xml version="1.0"');
    });
  });

  describe("Harmony Export", () => {
    describe("generateHarmonyXml", () => {
      it("should generate harmony for major chord", () => {
        const chord = createChordSymbol("C", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain('<harmony placement="above">');
        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>major</kind>");
        expect(xml).toContain("</harmony>");
      });

      it("should generate harmony for minor chord", () => {
        const chord = createChordSymbol("Am", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>A</root-step>");
        expect(xml).toContain("<kind>minor</kind>");
      });

      it("should generate harmony for major seventh", () => {
        const chord = createChordSymbol("Cmaj7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>major-seventh</kind>");
      });

      it("should generate harmony for dominant seventh", () => {
        const chord = createChordSymbol("G7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>G</root-step>");
        expect(xml).toContain("<kind>dominant</kind>");
      });

      it("should generate harmony for minor seventh", () => {
        const chord = createChordSymbol("Dm7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>D</root-step>");
        expect(xml).toContain("<kind>minor-seventh</kind>");
      });

      it("should generate harmony for half diminished", () => {
        const chord = createChordSymbol("Bm7b5", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>B</root-step>");
        expect(xml).toContain("<kind>half-diminished</kind>");
      });

      it("should generate harmony for diminished seventh", () => {
        const chord = createChordSymbol("Cdim7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>diminished-seventh</kind>");
      });

      it("should handle sharp root", () => {
        const chord = createChordSymbol("F#m7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>F</root-step>");
        expect(xml).toContain("<root-alter>1</root-alter>");
        expect(xml).toContain("<kind>minor-seventh</kind>");
      });

      it("should handle flat root", () => {
        const chord = createChordSymbol("Bbmaj7", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>B</root-step>");
        expect(xml).toContain("<root-alter>-1</root-alter>");
        expect(xml).toContain("<kind>major-seventh</kind>");
      });

      it("should generate harmony for slash chord", () => {
        const chord = createChordSymbol("C/E", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>major</kind>");
        expect(xml).toContain("<bass>");
        expect(xml).toContain("<bass-step>E</bass-step>");
        expect(xml).toContain("</bass>");
      });

      it("should handle slash chord with altered bass", () => {
        const chord = createChordSymbol("Am/G#", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>A</root-step>");
        expect(xml).toContain("<bass-step>G</bass-step>");
        expect(xml).toContain("<bass-alter>1</bass-alter>");
      });

      it("should generate harmony for sus4", () => {
        const chord = createChordSymbol("Gsus4", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>G</root-step>");
        expect(xml).toContain("<kind>suspended-fourth</kind>");
      });

      it("should generate harmony for sixth chord", () => {
        const chord = createChordSymbol("C6", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>major-sixth</kind>");
      });

      it("should generate harmony for ninth chord", () => {
        const chord = createChordSymbol("G9", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>G</root-step>");
        expect(xml).toContain("<kind>dominant-ninth</kind>");
      });

      it("should generate harmony for augmented", () => {
        const chord = createChordSymbol("Caug", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>augmented</kind>");
      });

      it("should generate harmony for diminished", () => {
        const chord = createChordSymbol("Cdim", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>diminished</kind>");
      });

      it("should return empty string for unrecognized chord", () => {
        const chord = createChordSymbol("XYZ123", 0);
        const xml = generateHarmonyXml(chord);

        expect(xml).toBe("");
      });
    });

    describe("generateMusicXml with chords", () => {
      it("should include harmony elements in exported XML", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [
          createChordSymbol("C", 0, 0),
          createChordSymbol("G7", 0, 2),
        ];

        const score = createScore();
        score.chordProgressions = [defaultProgression];

        const xml = generateMusicXml(score);

        expect(xml).toContain("<harmony");
        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<kind>major</kind>");
        expect(xml).toContain("<root-step>G</root-step>");
        expect(xml).toContain("<kind>dominant</kind>");
      });

      it("should include harmony in correct measure", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [
          createChordSymbol("Cmaj7", 0, 0),
          createChordSymbol("Dm7", 1, 0),
        ];

        const score = createScore();
        // Add a second measure
        score.measures.push({
          id: "measure-2",
          notes: [],
        });
        score.chordProgressions = [defaultProgression];

        const xml = generateMusicXml(score);

        // Verify both chords are present
        expect(xml).toContain("<kind>major-seventh</kind>");
        expect(xml).toContain("<kind>minor-seventh</kind>");
      });

      it("should not include harmony when no chords in progression", () => {
        const score = createScore();
        // Default progression has no chords

        const xml = generateMusicXml(score);

        expect(xml).not.toContain("<harmony");
      });

      it("should export slash chords with bass notes", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [createChordSymbol("C/G", 0, 0)];

        const score = createScore();
        score.chordProgressions = [defaultProgression];

        const xml = generateMusicXml(score);

        expect(xml).toContain("<root-step>C</root-step>");
        expect(xml).toContain("<bass>");
        expect(xml).toContain("<bass-step>G</bass-step>");
      });

      it("should include placement attribute for OSMD rendering", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [createChordSymbol("Cmaj7", 0, 0)];

        const score = createScore();
        score.chordProgressions = [defaultProgression];

        const xml = generateMusicXml(score);

        expect(xml).toContain('<harmony placement="above">');
      });

      it("should not include harmony when showChordSymbols is false", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [
          createChordSymbol("C", 0, 0),
          createChordSymbol("G7", 0, 2),
        ];

        const score = createScore();
        score.chordProgressions = [defaultProgression];
        score.displaySettings.showChordSymbols = false;

        const xml = generateMusicXml(score);

        expect(xml).not.toContain("<harmony");
        expect(xml).not.toContain("<root-step>");
        expect(xml).not.toContain("<kind>");
      });

      it("should include harmony when showChordSymbols is true", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [createChordSymbol("Dm7", 0, 0)];

        const score = createScore();
        score.chordProgressions = [defaultProgression];
        score.displaySettings.showChordSymbols = true;

        const xml = generateMusicXml(score);

        expect(xml).toContain("<harmony");
        expect(xml).toContain("<root-step>D</root-step>");
        expect(xml).toContain("<kind>minor-seventh</kind>");
      });
    });
  });
});
