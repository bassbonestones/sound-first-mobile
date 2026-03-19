/**
 * usePracticeNotes Hook Tests
 *
 * Tests for extracting notes from imported scores for pitch matching.
 */

import { renderHook } from "@testing-library/react-native";
import { usePracticeNotes } from "../src/features/importMusic/hooks/usePracticeNotes";
import type { ImportedScore, ImportedNoteEvent, ImportedMeasure, ImportedPart } from "../src/types/import";

// Helper to create a note event matching the actual interface
const createNoteEvent = (
  step: string,
  octave: number,
  durationType: "whole" | "half" | "quarter" | "eighth" = "quarter",
  alter = 0,
): ImportedNoteEvent => ({
  type: "note",
  pitch: {
    step: step as "C" | "D" | "E" | "F" | "G" | "A" | "B",
    octave,
    alter,
    displayName: `${step}${alter === 1 ? "#" : alter === -1 ? "b" : ""}${octave}`,
  },
  pitches: null,
  duration: 1,
  durationType,
  dots: 0,
  articulations: [],
  dynamics: null,
  tiedToNext: false,
  tiedFromPrevious: false,
});

// Helper to create a rest
const createRestEvent = (
  durationType: "whole" | "half" | "quarter" | "eighth" = "quarter",
): ImportedNoteEvent => ({
  type: "rest",
  pitch: null,
  pitches: null,
  duration: 1,
  durationType,
  dots: 0,
  articulations: [],
  dynamics: null,
  tiedToNext: false,
  tiedFromPrevious: false,
});

const createMockScore = (overrides: Partial<ImportedScore> = {}): ImportedScore => ({
  id: "test-score-1",
  sourceInfo: {
    sourceType: "musicxml",
    originalFileName: "test.musicxml",
    importedAt: Date.now(),
    remoteAssetId: null,
  },
  metadata: {
    title: "Test Score",
    composer: null,
    arranger: null,
    movementTitle: null,
    workTitle: null,
    copyright: null,
    keySignature: null,
    timeSignature: { beats: 4, beatType: 4, displayName: "4/4" },
    tempo: null,
  },
  parts: [
    {
      id: "P1",
      name: "Piano",
      abbreviation: null,
      instrument: null,
      measures: [
        {
          number: 1,
          events: [
            createNoteEvent("C", 4, "quarter"),
            createNoteEvent("D", 4, "quarter"),
            createNoteEvent("E", 4, "quarter"),
            createRestEvent("quarter"),
          ],
          timeSignature: null,
          keySignature: null,
          confidence: null,
        },
        {
          number: 2,
          events: [
            createNoteEvent("F", 4, "half"),
            createNoteEvent("G", 4, "half"),
          ],
          timeSignature: null,
          keySignature: null,
          confidence: null,
        },
      ],
    },
  ],
  measureCount: 2,
  confidence: null,
  ...overrides,
});

describe("usePracticeNotes", () => {
  describe("getNoteAtPosition", () => {
    it("returns correct note for exact beat position", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note).not.toBeNull();
      expect(note?.noteName).toBe("C4");
      expect(note?.midiNote).toBe(60);
    });

    it("returns D4 for measure 1, beat 2", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(1, 2);
      expect(note?.noteName).toBe("D4");
      expect(note?.midiNote).toBe(62);
    });

    it("returns rest note for beat 4 of measure 1", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(1, 4);
      expect(note?.isRest).toBe(true);
    });

    it("returns half note for beats 1-2 of measure 2", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note1 = result.current.getNoteAtPosition(2, 1);
      const note2 = result.current.getNoteAtPosition(2, 2);
      
      expect(note1?.noteName).toBe("F4");
      expect(note1?.durationBeats).toBe(2);
      // Beat 2 should still be the same note
      expect(note2?.noteName).toBe("F4");
    });

    it("returns null for non-existent measure", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(99, 1);
      expect(note).toBeNull();
    });

    it("returns null when score is null", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: null }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note).toBeNull();
    });
  });

  describe("getNotesInMeasure", () => {
    it("returns all notes in measure 1", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const notes = result.current.getNotesInMeasure(1);
      expect(notes.length).toBe(4);
      expect(notes[0].noteName).toBe("C4");
      expect(notes[1].noteName).toBe("D4");
      expect(notes[2].noteName).toBe("E4");
      expect(notes[3].isRest).toBe(true);
    });

    it("returns notes in measure 2", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const notes = result.current.getNotesInMeasure(2);
      expect(notes.length).toBe(2);
      expect(notes[0].noteName).toBe("F4");
      expect(notes[1].noteName).toBe("G4");
    });

    it("returns empty array for non-existent measure", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const notes = result.current.getNotesInMeasure(99);
      expect(notes).toEqual([]);
    });
  });

  describe("totalNotes", () => {
    it("counts non-rest notes", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      // 3 notes in measure 1 (C, D, E) + 2 notes in measure 2 (F, G) = 5
      expect(result.current.totalNotes).toBe(5);
    });

    it("returns 0 for empty score", () => {
      const emptyScore = createMockScore({
        parts: [{ id: "P1", name: "Piano", abbreviation: null, instrument: null, measures: [] }],
      });
      const { result } = renderHook(() =>
        usePracticeNotes({ score: emptyScore }),
      );

      expect(result.current.totalNotes).toBe(0);
    });

    it("returns 0 for null score", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: null }),
      );

      expect(result.current.totalNotes).toBe(0);
    });
  });

  describe("partIndex", () => {
    it("uses first part by default", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note?.noteName).toBe("C4");
    });

    it("can select different part", () => {
      const multiPartScore = createMockScore({
        parts: [
          {
            id: "P1",
            name: "Part 1",
            abbreviation: null,
            instrument: null,
            measures: [
              {
                number: 1,
                events: [createNoteEvent("C", 4, "whole")],
                timeSignature: null,
                keySignature: null,
                confidence: null,
              },
            ],
          },
          {
            id: "P2",
            name: "Part 2",
            abbreviation: null,
            instrument: null,
            measures: [
              {
                number: 1,
                events: [createNoteEvent("G", 4, "whole")],
                timeSignature: null,
                keySignature: null,
                confidence: null,
              },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        usePracticeNotes({ score: multiPartScore, partIndex: 1 }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note?.noteName).toBe("G4");
    });
  });

  describe("note frequency calculation", () => {
    it("calculates correct frequency for C4", () => {
      const { result } = renderHook(() =>
        usePracticeNotes({ score: createMockScore() }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note?.frequency).toBeCloseTo(261.63, 1);
    });

    it("handles sharps correctly", () => {
      const sharpScore = createMockScore({
        parts: [
          {
            id: "P1",
            name: "Piano",
            abbreviation: null,
            instrument: null,
            measures: [
              {
                number: 1,
                events: [createNoteEvent("F", 4, "whole", 1)], // F#4
                timeSignature: null,
                keySignature: null,
                confidence: null,
              },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        usePracticeNotes({ score: sharpScore }),
      );

      const note = result.current.getNoteAtPosition(1, 1);
      expect(note?.noteName).toBe("F#4");
      expect(note?.midiNote).toBe(66);
    });
  });
});
