/**
 * Score Conversion Tests
 *
 * Tests for converting between ComposerScore and ImportedScore formats.
 */

import { composerScoreToImportedScore } from "../src/features/composer/utils/scoreConversion";
import {
  createScore,
  createNote,
  createMeasure,
  DURATION,
} from "../src/features/composer/types";

describe("composerScoreToImportedScore", () => {
  describe("basic conversion", () => {
    it("converts a simple score with metadata", () => {
      const score = createScore({
        title: "Test Score",
        clef: "treble",
        keySignature: 0,
        timeSignature: { beats: 4, beatUnit: 4 },
        tempo: 120,
      });

      const imported = composerScoreToImportedScore(score);

      expect(imported.id).toBe(score.id);
      expect(imported.metadata.title).toBe("Test Score");
      expect(imported.metadata.keySignature?.fifths).toBe(0);
      expect(imported.metadata.keySignature?.displayName).toBe("C Major");
      expect(imported.metadata.timeSignature?.beats).toBe(4);
      expect(imported.metadata.timeSignature?.beatType).toBe(4);
      expect(imported.metadata.tempo?.bpm).toBe(120);
    });

    it("fallbacks to 'Untitled' for empty title", () => {
      const score = createScore({ title: "" });
      const imported = composerScoreToImportedScore(score);

      expect(imported.metadata.title).toBe("Untitled");
    });

    it("converts key signatures correctly", () => {
      const keys = [
        { keySignature: -3, expected: "E♭ Major" },
        { keySignature: 2, expected: "D Major" },
        { keySignature: 5, expected: "B Major" },
      ] as const;

      keys.forEach(({ keySignature, expected }) => {
        const score = createScore({ keySignature });
        const imported = composerScoreToImportedScore(score);

        expect(imported.metadata.keySignature?.fifths).toBe(keySignature);
        expect(imported.metadata.keySignature?.displayName).toBe(expected);
      });
    });
  });

  describe("measure conversion", () => {
    it("converts measure count correctly", () => {
      const measure1 = createMeasure();
      const measure2 = createMeasure();
      const score = createScore();
      score.measures = [measure1, measure2];

      const imported = composerScoreToImportedScore(score);

      expect(imported.measureCount).toBe(2);
      expect(imported.parts[0].measures).toHaveLength(2);
    });

    it("sets time/key signature only on first measure", () => {
      const measure1 = createMeasure();
      const measure2 = createMeasure();
      const score = createScore();
      score.measures = [measure1, measure2];

      const imported = composerScoreToImportedScore(score);

      expect(imported.parts[0].measures[0].timeSignature).not.toBeNull();
      expect(imported.parts[0].measures[0].keySignature).not.toBeNull();
      expect(imported.parts[0].measures[1].timeSignature).toBeNull();
      expect(imported.parts[0].measures[1].keySignature).toBeNull();
    });
  });

  describe("note conversion", () => {
    it("converts notes with correct pitch info", () => {
      const note = createNote(60, DURATION.QUARTER); // C4
      const measure = createMeasure();
      measure.notes = [note];
      const score = createScore();
      score.measures = [measure];

      const imported = composerScoreToImportedScore(score);
      const event = imported.parts[0].measures[0].events[0];

      expect(event.type).toBe("note");
      expect(event.pitch?.step).toBe("C");
      expect(event.pitch?.octave).toBe(4);
      expect(event.pitch?.alter).toBe(0);
      expect(event.duration).toBe(DURATION.QUARTER);
      expect(event.durationType).toBe("quarter");
    });

    it("converts rests correctly", () => {
      const rest = createNote(null, DURATION.HALF); // Rest
      const measure = createMeasure();
      measure.notes = [rest];
      const score = createScore();
      score.measures = [measure];

      const imported = composerScoreToImportedScore(score);
      const event = imported.parts[0].measures[0].events[0];

      expect(event.type).toBe("rest");
      expect(event.pitch).toBeNull();
      expect(event.duration).toBe(DURATION.HALF);
      expect(event.durationType).toBe("half");
    });

    it("handles accidentals", () => {
      const sharpNote = createNote(61, DURATION.QUARTER, {
        accidental: "sharp",
      }); // C#4
      const flatNote = createNote(62, DURATION.QUARTER, { accidental: "flat" }); // Db4
      const measure = createMeasure();
      measure.notes = [sharpNote, flatNote];
      const score = createScore();
      score.measures = [measure];

      const imported = composerScoreToImportedScore(score);
      const events = imported.parts[0].measures[0].events;

      expect(events[0].pitch?.alter).toBe(1);
      expect(events[1].pitch?.alter).toBe(-1);
    });

    it("converts tie information", () => {
      const note1 = createNote(60, DURATION.QUARTER, { tieStart: true });
      const note2 = createNote(60, DURATION.QUARTER, { tieEnd: true });
      const measure = createMeasure();
      measure.notes = [note1, note2];
      const score = createScore();
      score.measures = [measure];

      const imported = composerScoreToImportedScore(score);
      const events = imported.parts[0].measures[0].events;

      expect(events[0].tiedToNext).toBe(true);
      expect(events[0].tiedFromPrevious).toBe(false);
      expect(events[1].tiedToNext).toBe(false);
      expect(events[1].tiedFromPrevious).toBe(true);
    });

    it("converts all duration types", () => {
      const durations = [
        { value: DURATION.WHOLE, type: "whole" },
        { value: DURATION.HALF, type: "half" },
        { value: DURATION.QUARTER, type: "quarter" },
        { value: DURATION.EIGHTH, type: "eighth" },
        { value: DURATION.SIXTEENTH, type: "16th" },
      ];

      durations.forEach(({ value, type }) => {
        const note = createNote(60, value);
        const measure = createMeasure();
        measure.notes = [note];
        const score = createScore();
        score.measures = [measure];

        const imported = composerScoreToImportedScore(score);
        const event = imported.parts[0].measures[0].events[0];

        expect(event.durationType).toBe(type);
      });
    });

    it("defaults to quarter for unrecognized durations", () => {
      // Create a note with an invalid/unknown duration value
      const note = createNote(60, 999 as unknown as number);
      const measure = createMeasure();
      measure.notes = [note];
      const score = createScore();
      score.measures = [measure];

      const imported = composerScoreToImportedScore(score);
      const event = imported.parts[0].measures[0].events[0];

      expect(event.durationType).toBe("quarter");
    });
  });

  describe("source info", () => {
    it("sets sourceType to musicxml", () => {
      const score = createScore();
      const imported = composerScoreToImportedScore(score);

      expect(imported.sourceInfo.sourceType).toBe("musicxml");
    });

    it("uses score title in filename", () => {
      const score = createScore({ title: "My Song" });
      const imported = composerScoreToImportedScore(score);

      expect(imported.sourceInfo.originalFileName).toBe("My Song.xml");
    });

    it("sets timestamp", () => {
      const before = Date.now();
      const score = createScore();
      const imported = composerScoreToImportedScore(score);
      const after = Date.now();

      expect(imported.sourceInfo.importedAt).toBeGreaterThanOrEqual(before);
      expect(imported.sourceInfo.importedAt).toBeLessThanOrEqual(after);
    });
  });

  describe("confidence", () => {
    it("sets full confidence for composed scores", () => {
      const score = createScore();
      const imported = composerScoreToImportedScore(score);

      expect(imported.confidence?.overall).toBe(1.0);
      expect(imported.confidence?.needsReview).toBe(false);
    });

    it("sets per-measure confidence", () => {
      const measure1 = createMeasure();
      const measure2 = createMeasure();
      const measure3 = createMeasure();
      const score = createScore();
      score.measures = [measure1, measure2, measure3];

      const imported = composerScoreToImportedScore(score);

      expect(imported.confidence?.measureConfidence).toEqual([1.0, 1.0, 1.0]);
    });
  });

  describe("parts", () => {
    it("creates single part named Part 1", () => {
      const score = createScore();
      const imported = composerScoreToImportedScore(score);

      expect(imported.parts).toHaveLength(1);
      expect(imported.parts[0].id).toBe("P1");
      expect(imported.parts[0].name).toBe("Part 1");
      expect(imported.parts[0].abbreviation).toBe("P1");
    });
  });
});
