/**
 * Imported Score Converter Tests
 */

import {
  importedScoreToComposerScore,
  extractChordsFromMeasures,
} from "../src/features/tune-composer/utils/importedScoreConverter";
import { generateMusicXml } from "../src/features/tune-composer/services/tuneComposerMusicXmlGenerator";
import { parseMusicXml } from "../src/features/importMusic/services/musicXmlParser";
import { resolveChordSymbol } from "../src/features/tune-composer/types/chordTypes";
import type {
  ImportedScore,
  ImportedMeasure,
  ImportedPart,
} from "../src/types/import";

/**
 * Helper to resolve a chord to its display symbol for test assertions.
 * Uses key of C (0 fifths) by default.
 */
function chordSymbol(chord: {
  rootOffset: number;
  quality: string;
  alterations: string[];
  bassOffset?: number;
}): string {
  return resolveChordSymbol(chord as any, 0) ?? "";
}

describe("importedScoreConverter", () => {
  describe("extractChordsFromMeasures", () => {
    it("should extract chords with correct beat positions", () => {
      const measures: ImportedMeasure[] = [
        {
          number: 0,
          events: [],
          timeSignature: { beats: 4, beatType: 4 },
          keySignature: null,
          confidence: null,
          harmony: [
            { symbol: "C", offset: 0 },
            { symbol: "G7", offset: 24 }, // offset 24 = 2 quarter notes in 4/4 (divisions=12)
          ],
        },
        {
          number: 1,
          events: [],
          timeSignature: null,
          keySignature: null,
          confidence: null,
          harmony: [{ symbol: "F", offset: 12 }], // offset 12 = 1 quarter note
        },
      ];

      const chords = extractChordsFromMeasures(measures, 0, 4); // keyFifths = 0, beatUnit = 4 (quarter)

      expect(chords).toHaveLength(3);

      // Measure 0, beat 0
      expect(chordSymbol(chords[0])).toBe("C");
      expect(chords[0].measureIndex).toBe(0);
      expect(chords[0].beatPosition).toBe(0);

      // Measure 0, beat 2 (offset 24 / 12 divisions = 2 quarter notes)
      expect(chordSymbol(chords[1])).toBe("G7");
      expect(chords[1].measureIndex).toBe(0);
      expect(chords[1].beatPosition).toBe(2);

      // Measure 1, beat 1 (offset 12 / 12 divisions = 1 quarter note)
      expect(chordSymbol(chords[2])).toBe("F");
      expect(chords[2].measureIndex).toBe(1);
      expect(chords[2].beatPosition).toBe(1);
    });

    it("should handle 6/8 time signature correctly", () => {
      const measures: ImportedMeasure[] = [
        {
          number: 0,
          events: [],
          timeSignature: { beats: 6, beatType: 8 },
          keySignature: null,
          confidence: null,
          harmony: [
            { symbol: "Am", offset: 0 },
            { symbol: "E7", offset: 18 }, // offset 18 = 1.5 quarter notes = 3 eighth notes
          ],
        },
      ];

      const chords = extractChordsFromMeasures(measures, 0, 8); // keyFifths = 0, beatUnit = 8 (eighth)

      expect(chords).toHaveLength(2);

      // Beat 0
      expect(chords[0].beatPosition).toBe(0);

      // Offset 18 divisions = 1.5 quarters = 3 eighths = beat 3
      expect(chordSymbol(chords[1])).toBe("E7");
      expect(chords[1].beatPosition).toBe(3);
    });

    it("should return empty array when no harmony", () => {
      const measures: ImportedMeasure[] = [
        {
          number: 0,
          events: [],
          timeSignature: null,
          keySignature: null,
          confidence: null,
        },
      ];

      const chords = extractChordsFromMeasures(measures, 0, 4);
      expect(chords).toHaveLength(0);
    });
  });

  describe("importedScoreToComposerScore", () => {
    it("should convert harmony to chordProgressions", async () => {
      const importedScore: ImportedScore = {
        metadata: {
          title: "Test",
          composer: null,
          arranger: null,
          copyright: null,
          keySignature: null,
          timeSignature: null,
          tempo: null,
        },
        parts: [
          {
            id: "P1",
            name: "Part 1",
            abbreviation: null,
            measures: [
              {
                number: 1,
                events: [
                  {
                    type: "note",
                    pitch: { step: "C", octave: 4, alter: 0 },
                    pitches: null,
                    duration: 48,
                    durationType: "whole",
                    dots: 0,
                    voice: 1,
                    tiedToNext: false,
                    tiedFromPrevious: false,
                    lyric: null,
                    dynamics: null,
                    expression: null,
                    articulations: [],
                    slurStart: false,
                    slurEnd: false,
                    slurPlacement: null,
                    beamStatus: null,
                    tuplet: null,
                  },
                ],
                timeSignature: { beats: 4, beatType: 4 },
                keySignature: { fifths: 0, mode: "major" },
                confidence: null,
                harmony: [
                  { symbol: "Cmaj7", offset: 0 },
                  { symbol: "Dm7", offset: 24 },
                ],
              },
            ],
          },
        ],
        sourceInfo: {
          sourceType: "musicxml",
          originalFileName: "test.xml",
          remoteAssetId: null,
        },
        warnings: [],
      };

      const composerScore = importedScoreToComposerScore(importedScore);

      // Should have one chord progression with imported chords
      expect(composerScore.chordProgressions).toHaveLength(1);
      expect(composerScore.chordProgressions[0].isDefault).toBe(true);
      expect(composerScore.chordProgressions[0].chords).toHaveLength(2);

      // First chord at beat 0
      expect(chordSymbol(composerScore.chordProgressions[0].chords[0])).toBe(
        "Cmaj7",
      );
      expect(composerScore.chordProgressions[0].chords[0].measureIndex).toBe(0);
      expect(composerScore.chordProgressions[0].chords[0].beatPosition).toBe(0);

      // Second chord at beat 2
      expect(chordSymbol(composerScore.chordProgressions[0].chords[1])).toBe(
        "Dm7",
      );
      expect(composerScore.chordProgressions[0].chords[1].measureIndex).toBe(0);
      expect(composerScore.chordProgressions[0].chords[1].beatPosition).toBe(2);
    });

    it("should create default empty progression when no harmony", () => {
      const importedScore: ImportedScore = {
        metadata: {
          title: "Test",
          composer: null,
          arranger: null,
          copyright: null,
          keySignature: null,
          timeSignature: null,
          tempo: null,
        },
        parts: [
          {
            id: "P1",
            name: "Part 1",
            abbreviation: null,
            measures: [
              {
                number: 1,
                events: [
                  {
                    type: "note",
                    pitch: { step: "C", octave: 4, alter: 0 },
                    pitches: null,
                    duration: 48,
                    durationType: "whole",
                    dots: 0,
                    voice: 1,
                    tiedToNext: false,
                    tiedFromPrevious: false,
                    lyric: null,
                    dynamics: null,
                    expression: null,
                    articulations: [],
                    slurStart: false,
                    slurEnd: false,
                    slurPlacement: null,
                    beamStatus: null,
                    tuplet: null,
                  },
                ],
                timeSignature: { beats: 4, beatType: 4 },
                keySignature: { fifths: 0, mode: "major" },
                confidence: null,
                // No harmony
              },
            ],
          },
        ],
        sourceInfo: {
          sourceType: "musicxml",
          originalFileName: "test.xml",
          remoteAssetId: null,
        },
        warnings: [],
      };

      const composerScore = importedScoreToComposerScore(importedScore);

      // Should have default empty progression
      expect(composerScore.chordProgressions).toHaveLength(1);
      expect(composerScore.chordProgressions[0].chords).toHaveLength(0);
    });
  });

  describe("round-trip: export→import preserves chords", () => {
    it("should preserve chord beat positions through MusicXML round-trip", async () => {
      // Create a score with chords at specific positions
      const originalScore = importedScoreToComposerScore({
        metadata: {
          title: "Round Trip Test",
          composer: null,
          arranger: null,
          copyright: null,
          keySignature: null,
          timeSignature: null,
          tempo: null,
        },
        parts: [
          {
            id: "P1",
            name: "Part 1",
            abbreviation: null,
            measures: [
              {
                number: 1,
                events: [
                  {
                    type: "note",
                    pitch: { step: "C", octave: 4, alter: 0 },
                    pitches: null,
                    duration: 48,
                    durationType: "whole",
                    dots: 0,
                    voice: 1,
                    tiedToNext: false,
                    tiedFromPrevious: false,
                    lyric: null,
                    dynamics: null,
                    expression: null,
                    articulations: [],
                    slurStart: false,
                    slurEnd: false,
                    slurPlacement: null,
                    beamStatus: null,
                    tuplet: null,
                  },
                ],
                timeSignature: { beats: 4, beatType: 4 },
                keySignature: { fifths: 0, mode: "major" },
                confidence: null,
                harmony: [
                  { symbol: "C", offset: 0 }, // Beat 0
                  { symbol: "F", offset: 42 }, // Beat 3.5 (42/12 = 3.5 quarter notes)
                ],
              },
            ],
          },
        ],
        sourceInfo: {
          sourceType: "musicxml",
          originalFileName: "test.xml",
          remoteAssetId: null,
        },
        warnings: [],
      });

      // Verify original has chords at expected positions
      expect(originalScore.chordProgressions[0].chords).toHaveLength(2);
      expect(originalScore.chordProgressions[0].chords[0].beatPosition).toBe(0);
      expect(originalScore.chordProgressions[0].chords[1].beatPosition).toBe(
        3.5,
      );

      // Export to MusicXML
      const musicXml = generateMusicXml(originalScore);

      // Verify exported MusicXML contains offset elements
      expect(musicXml).toContain("<harmony");
      expect(musicXml).toContain("<offset>42</offset>"); // offset for beat 3.5

      // Import back
      const parseResult = await parseMusicXml(musicXml, {
        sourceType: "musicxml",
        originalFileName: "roundtrip.xml",
        remoteAssetId: null,
      });
      expect(parseResult.success).toBe(true);

      const importedScore = importedScoreToComposerScore(parseResult.score!);

      // Verify chords survived with correct positions
      expect(importedScore.chordProgressions[0].chords).toHaveLength(2);
      expect(chordSymbol(importedScore.chordProgressions[0].chords[0])).toBe(
        "C",
      );
      expect(importedScore.chordProgressions[0].chords[0].beatPosition).toBe(0);
      expect(chordSymbol(importedScore.chordProgressions[0].chords[1])).toBe(
        "F",
      );
      expect(importedScore.chordProgressions[0].chords[1].beatPosition).toBe(
        3.5,
      );
    });
  });
});
