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

/**
 * Helper to check if XML contains a <kind> element with the given type.
 * Handles the text attribute that may be present for display purposes.
 */
function expectKind(xml: string, kindType: string): void {
  const pattern = new RegExp(`<kind[^>]*>${kindType}</kind>`);
  expect(xml).toMatch(pattern);
}

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
        // generateHarmonyXml now takes a resolved symbol string
        const xml = generateHarmonyXml("C");

        expect(xml).toContain('<harmony placement="above">');
        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "major");
        expect(xml).toContain("</harmony>");
      });

      it("should generate harmony for minor chord", () => {
        const xml = generateHarmonyXml("Am");

        expect(xml).toContain("<root-step>A</root-step>");
        expectKind(xml, "minor");
      });

      it("should generate harmony for major seventh", () => {
        const xml = generateHarmonyXml("Cmaj7");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "major-seventh");
      });

      it("should generate harmony for dominant seventh", () => {
        const xml = generateHarmonyXml("G7");

        expect(xml).toContain("<root-step>G</root-step>");
        expectKind(xml, "dominant");
      });

      it("should generate harmony for minor seventh", () => {
        const xml = generateHarmonyXml("Dm7");

        expect(xml).toContain("<root-step>D</root-step>");
        expectKind(xml, "minor-seventh");
      });

      it("should generate harmony for half diminished", () => {
        const xml = generateHarmonyXml("Bm7b5");

        expect(xml).toContain("<root-step>B</root-step>");
        expectKind(xml, "half-diminished");
      });

      it("should generate harmony for diminished seventh", () => {
        const xml = generateHarmonyXml("Cdim7");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "diminished-seventh");
      });

      it("should handle sharp root", () => {
        const xml = generateHarmonyXml("F#m7");

        expect(xml).toContain("<root-step>F</root-step>");
        expect(xml).toContain("<root-alter>1</root-alter>");
        expectKind(xml, "minor-seventh");
      });

      it("should handle flat root", () => {
        const xml = generateHarmonyXml("Bbmaj7");

        expect(xml).toContain("<root-step>B</root-step>");
        expect(xml).toContain("<root-alter>-1</root-alter>");
        expectKind(xml, "major-seventh");
      });

      it("should generate harmony for slash chord", () => {
        const xml = generateHarmonyXml("C/E");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "major");
        expect(xml).toContain("<bass>");
        expect(xml).toContain("<bass-step>E</bass-step>");
        expect(xml).toContain("</bass>");
      });

      it("should handle slash chord with altered bass", () => {
        const xml = generateHarmonyXml("Am/G#");

        expect(xml).toContain("<root-step>A</root-step>");
        expect(xml).toContain("<bass-step>G</bass-step>");
        expect(xml).toContain("<bass-alter>1</bass-alter>");
      });

      it("should generate harmony for sus4", () => {
        const xml = generateHarmonyXml("Gsus4");

        expect(xml).toContain("<root-step>G</root-step>");
        expectKind(xml, "suspended-fourth");
      });

      it("should generate harmony for 7sus4", () => {
        const xml = generateHarmonyXml("C7sus4");

        expect(xml).toContain("<root-step>C</root-step>");
        // 7sus4 uses suspended-fourth kind with added 7th degree
        expectKind(xml, "suspended-fourth");
        expect(xml).toContain('text="7sus4"');
        // Hidden degree element for the 7th (OSMD needs this)
        expect(xml).toContain("<degree-value>7</degree-value>");
        expect(xml).toContain('print-object="no"');
      });

      it("should generate harmony for sixth chord", () => {
        const xml = generateHarmonyXml("C6");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "major-sixth");
      });

      it("should generate harmony for ninth chord", () => {
        const xml = generateHarmonyXml("G9");

        expect(xml).toContain("<root-step>G</root-step>");
        expectKind(xml, "dominant-ninth");
      });

      it("should generate harmony for augmented", () => {
        const xml = generateHarmonyXml("Caug");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "augmented");
      });

      it("should generate harmony for diminished", () => {
        const xml = generateHarmonyXml("Cdim");

        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "diminished");
      });

      it("should return empty string for unrecognized chord", () => {
        const xml = generateHarmonyXml("XYZ123");

        expect(xml).toBe("");
      });
    });

    describe("generateMusicXml with chords", () => {
      it("should include harmony elements in exported XML", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [
          createChordSymbol("C", 0, 0, 0)!,
          createChordSymbol("G7", 0, 0, 2)!,
        ];

        const score = createScore();
        score.chordProgressions = [defaultProgression];

        const xml = generateMusicXml(score);

        expect(xml).toContain("<harmony");
        expect(xml).toContain("<root-step>C</root-step>");
        expectKind(xml, "major");
        expect(xml).toContain("<root-step>G</root-step>");
        expectKind(xml, "dominant");
      });

      it("should include harmony in correct measure", () => {
        const defaultProgression = createChordProgression("Default", {
          isDefault: true,
        });
        defaultProgression.chords = [
          createChordSymbol("Cmaj7", 0, 0, 0)!,
          createChordSymbol("Dm7", 0, 1, 0)!,
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
        expectKind(xml, "major-seventh");
        expectKind(xml, "minor-seventh");
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
        defaultProgression.chords = [createChordSymbol("C/G", 0, 0, 0)!];

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
        defaultProgression.chords = [createChordSymbol("Cmaj7", 0, 0, 0)!];

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
          createChordSymbol("C", 0, 0, 0)!,
          createChordSymbol("G7", 0, 0, 2)!,
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
        defaultProgression.chords = [createChordSymbol("Dm7", 0, 0, 0)!];

        const score = createScore();
        score.chordProgressions = [defaultProgression];
        score.displaySettings.showChordSymbols = true;

        const xml = generateMusicXml(score);

        expect(xml).toContain("<harmony");
        expect(xml).toContain("<root-step>D</root-step>");
        expectKind(xml, "minor-seventh");
      });
    });
  });
});
