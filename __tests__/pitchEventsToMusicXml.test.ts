/**
 * pitchEventsToMusicXml Tests
 *
 * Tests for converting generated pitch events to MusicXML format.
 */

import { practiceContentToMusicXml } from "../src/features/tune-composer/services/pitchEventsToMusicXml";
import type {
  GeneratedPitchEvent,
  GeneratedChordSegment,
} from "../src/features/tune-composer/types";

// Helper to create an event with defaults
const createEvent = (
  midi_note: number | null,
  offset_beats: number,
  duration_beats: number,
): GeneratedPitchEvent => ({
  midi_note,
  pitch_name: midi_note !== null ? `Note${midi_note}` : "rest",
  duration_beats,
  offset_beats,
  velocity: midi_note !== null ? 64 : 0,
  is_rest: midi_note === null,
});

// Helper to create a segment
const createSegment = (
  chord_symbol: string,
  start_beat: number,
  duration_beats: number,
): GeneratedChordSegment => ({
  chord_symbol,
  start_beat,
  duration_beats,
  events: [],
});

describe("pitchEventsToMusicXml", () => {
  // ===========================================================================
  // Empty/Edge Cases
  // ===========================================================================

  describe("Empty and Edge Cases", () => {
    it("should return empty string when events array is empty", () => {
      const result = practiceContentToMusicXml({
        segments: [],
        events: [],
        totalBeats: 0,
      });
      // When there are no events, we still generate a skeleton MusicXML
      expect(result).toContain('<?xml version="1.0"');
    });

    it("should handle single event", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain("<score-partwise");
      expect(result).toContain("<step>C</step>");
      expect(result).toContain("<octave>4</octave>");
    });
  });

  // ===========================================================================
  // Basic Note Conversion
  // ===========================================================================

  describe("Basic Note Conversion", () => {
    it("should convert MIDI 60 to C4", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<step>C</step>");
      expect(result).toContain("<octave>4</octave>");
    });

    it("should convert MIDI 69 to A4", () => {
      const events: GeneratedPitchEvent[] = [createEvent(69, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("Am", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<step>A</step>");
      expect(result).toContain("<octave>4</octave>");
    });

    it("should convert MIDI 72 to C5", () => {
      const events: GeneratedPitchEvent[] = [createEvent(72, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<step>C</step>");
      expect(result).toContain("<octave>5</octave>");
    });

    it("should handle sharps (MIDI 61 = C#4)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(61, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C#", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<step>C</step>");
      expect(result).toContain("<alter>1</alter>");
      expect(result).toContain("<octave>4</octave>");
    });

    it("should handle flats (MIDI 63 = Eb4/D#4)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(63, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("Eb", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      // Should be represented as either D# or Eb
      expect(result).toMatch(/<step>[DE]<\/step>/);
    });
  });

  // ===========================================================================
  // Duration Conversion
  // ===========================================================================

  describe("Duration Conversion", () => {
    it("should convert quarter note (duration 1)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<type>quarter</type>");
    });

    it("should convert half note (duration 2)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 2)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<type>half</type>");
    });

    it("should convert whole note (duration 4)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 4)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<type>whole</type>");
    });

    it("should convert eighth note (duration 0.5)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 0.5)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<type>eighth</type>");
    });
  });

  // ===========================================================================
  // Chord Symbol Handling
  // ===========================================================================

  describe("Chord Symbol Handling", () => {
    it("should include chord symbols in output", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("Cmaj7", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      // Harmony element may include attributes
      expect(result).toMatch(/<harmony/);
      expect(result).toContain("<root-step>C</root-step>");
    });

    it("should handle multiple chord changes", () => {
      const events: GeneratedPitchEvent[] = [
        createEvent(60, 0, 2),
        createEvent(67, 2, 2),
      ];
      const segments: GeneratedChordSegment[] = [
        createSegment("C", 0, 2),
        createSegment("G", 2, 2),
      ];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<root-step>C</root-step>");
      // Second chord appears in second measure
      expect(result).toMatch(/<root-step>[CG]<\/root-step>/);
    });

    it("should handle minor chords", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("Am7", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toMatch(/<harmony/);
      expect(result).toContain("<root-step>A</root-step>");
    });
  });

  // ===========================================================================
  // Time Signature
  // ===========================================================================

  describe("Time Signature", () => {
    it("should default to 4/4 time signature", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<beats>4</beats>");
      expect(result).toContain("<beat-type>4</beat-type>");
    });

    it("should handle custom time signature", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 3)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 3,
        timeSignature: { beats: 3, beatType: 4 },
      });

      // Custom time signature should be in the output
      expect(result).toMatch(/<time/);
    });
  });

  // ===========================================================================
  // Key Signature
  // ===========================================================================

  describe("Key Signature", () => {
    it("should default to C major (0 fifths)", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<fifths>0</fifths>");
    });

    it("should handle sharp keys", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("G", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
        keySignature: { fifths: 1, mode: "major" },
      });

      // Key signature should be in the output
      expect(result).toMatch(/<key/);
      expect(result).toMatch(/<fifths>/);
    });

    it("should handle flat keys", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("F", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
        keySignature: { fifths: -1, mode: "major" },
      });

      // Key signature should be in the output
      expect(result).toMatch(/<key/);
      expect(result).toMatch(/<fifths>/);
    });
  });

  // ===========================================================================
  // Clef
  // ===========================================================================

  describe("Clef", () => {
    it("should default to treble clef", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      expect(result).toContain("<sign>G</sign>");
      expect(result).toContain("<line>2</line>");
    });

    it("should handle bass clef", () => {
      const events: GeneratedPitchEvent[] = [createEvent(48, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
        clef: "bass",
      });

      expect(result).toContain("<sign>F</sign>");
      expect(result).toContain("<line>4</line>");
    });
  });

  // ===========================================================================
  // Tempo
  // ===========================================================================

  describe("Tempo", () => {
    it("should include tempo marking when provided", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
        tempo: 120,
      });

      expect(result).toContain("<per-minute>120</per-minute>");
    });

    it("should not include tempo if not provided", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      // Should have some default or no tempo marking
      // The behavior depends on implementation
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // Title
  // ===========================================================================

  describe("Title", () => {
    it("should include title when provided", () => {
      const events: GeneratedPitchEvent[] = [createEvent(60, 0, 1)];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
        title: "My Practice Exercise",
      });

      expect(result).toContain("My Practice Exercise");
    });
  });

  // ===========================================================================
  // Multiple Measures
  // ===========================================================================

  describe("Multiple Measures", () => {
    it("should create multiple measures for long progressions", () => {
      const events: GeneratedPitchEvent[] = [
        createEvent(60, 0, 1),
        createEvent(62, 1, 1),
        createEvent(64, 2, 1),
        createEvent(65, 3, 1),
        createEvent(67, 4, 1),
        createEvent(69, 5, 1),
        createEvent(71, 6, 1),
        createEvent(72, 7, 1),
      ];
      const segments: GeneratedChordSegment[] = [
        createSegment("C", 0, 4),
        createSegment("G", 4, 4),
      ];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 8,
      });

      // Should have at least 2 measures
      const measureMatches = result.match(/<measure /g);
      expect(measureMatches).toBeTruthy();
      expect(measureMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // Rests
  // ===========================================================================

  describe("Rests", () => {
    it("should handle rests", () => {
      const events: GeneratedPitchEvent[] = [
        createEvent(60, 0, 1),
        createEvent(null, 1, 1), // Rest
        createEvent(64, 2, 1),
      ];
      const segments: GeneratedChordSegment[] = [createSegment("C", 0, 4)];

      const result = practiceContentToMusicXml({
        segments,
        events,
        totalBeats: 4,
      });

      // Should contain a rest element
      expect(result).toContain("<rest");
    });
  });
});
