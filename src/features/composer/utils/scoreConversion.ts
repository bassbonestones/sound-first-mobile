/**
 * Score Conversion Utilities
 *
 * Functions for converting between ComposerScore and ImportedScore formats.
 */

import type { ComposerScore, Note as ComposerNote, Measure } from "../types";
import { isRest, DURATION } from "../types";
import { midiToNoteName, midiToOctave, formatMidiNote } from "./pitchUtils";
import type {
  ImportedScore,
  ImportedPart,
  ImportedMeasure,
  ImportedNoteEvent,
  ImportedMetadata,
  ImportSourceInfo,
  KeySignatureInfo,
  TimeSignatureInfo,
  TempoInfo,
  PitchInfo,
  NoteLetter,
  DurationType,
  ScoreConfidence,
} from "../../../types/import";

// =============================================================================
// Key Names
// =============================================================================

const KEY_NAMES: Record<number, { major: string; minor: string }> = {
  [-7]: { major: "Cb Major", minor: "Ab Minor" },
  [-6]: { major: "Gb Major", minor: "Eb Minor" },
  [-5]: { major: "Db Major", minor: "Bb Minor" },
  [-4]: { major: "Ab Major", minor: "F Minor" },
  [-3]: { major: "Eb Major", minor: "C Minor" },
  [-2]: { major: "Bb Major", minor: "G Minor" },
  [-1]: { major: "F Major", minor: "D Minor" },
  [0]: { major: "C Major", minor: "A Minor" },
  [1]: { major: "G Major", minor: "E Minor" },
  [2]: { major: "D Major", minor: "B Minor" },
  [3]: { major: "A Major", minor: "F# Minor" },
  [4]: { major: "E Major", minor: "C# Minor" },
  [5]: { major: "B Major", minor: "G# Minor" },
  [6]: { major: "F# Major", minor: "D# Minor" },
  [7]: { major: "C# Major", minor: "A# Minor" },
};

// =============================================================================
// Duration Conversion
// =============================================================================

/** Convert duration value to DurationType */
function durationToDurationType(duration: number): DurationType {
  switch (duration) {
    case DURATION.WHOLE:
      return "whole";
    case DURATION.HALF:
      return "half";
    case DURATION.QUARTER:
      return "quarter";
    case DURATION.EIGHTH:
      return "eighth";
    case DURATION.SIXTEENTH:
      return "16th";
    default:
      return "quarter";
  }
}

// =============================================================================
// Pitch Conversion
// =============================================================================

/**
 * Convert MIDI number to PitchInfo
 */
function midiToPitchInfo(midi: number, accidental?: string): PitchInfo {
  const step = midiToNoteName(midi) as NoteLetter;
  const octave = midiToOctave(midi);
  const alter = accidental === "sharp" ? 1 : accidental === "flat" ? -1 : 0;
  const displayName = formatMidiNote(
    midi,
    accidental as "sharp" | "flat" | undefined,
  );

  return {
    step,
    octave,
    alter,
    displayName,
  };
}

// =============================================================================
// Main Conversion Function
// =============================================================================

/**
 * Converts a ComposerScore to ImportedScore format.
 *
 * This enables practicing composed scores using the ImportedScorePractice screen.
 */
export function composerScoreToImportedScore(
  composerScore: ComposerScore,
): ImportedScore {
  // Build key signature info
  const keySignature: KeySignatureInfo = {
    fifths: composerScore.keySignature,
    mode: "major",
    displayName: KEY_NAMES[composerScore.keySignature]?.major ?? "C Major",
  };

  // Build time signature info
  const timeSignature: TimeSignatureInfo = {
    beats: composerScore.timeSignature.beats,
    beatType: composerScore.timeSignature.beatUnit,
    displayName: `${composerScore.timeSignature.beats}/${composerScore.timeSignature.beatUnit}`,
  };

  // Build tempo info
  const tempo: TempoInfo = {
    bpm: composerScore.tempo,
    beatUnit: "quarter",
    marking: null,
  };

  // Build metadata
  const metadata: ImportedMetadata = {
    title: composerScore.title || "Untitled",
    composer: null,
    arranger: null,
    movementTitle: null,
    workTitle: null,
    copyright: null,
    keySignature,
    timeSignature,
    tempo,
  };

  // Build source info
  const sourceInfo: ImportSourceInfo = {
    sourceType: "musicxml",
    originalFileName: `${composerScore.title || "composition"}.xml`,
    importedAt: Date.now(),
    remoteAssetId: null,
  };

  // Convert measures
  const measures = composerScore.measures.map((measure, measureIndex) =>
    convertMeasure(measure, measureIndex, composerScore),
  );

  // Build single part
  const part: ImportedPart = {
    id: "P1",
    name: "Part 1",
    abbreviation: "P1",
    instrument: null,
    measures,
  };

  // Build confidence info
  const confidence: ScoreConfidence = {
    overall: 1.0,
    measureConfidence: composerScore.measures.map(() => 1.0),
    needsReview: false,
  };

  // Build imported score
  const importedScore: ImportedScore = {
    id: composerScore.id,
    metadata,
    parts: [part],
    measureCount: composerScore.measures.length,
    sourceInfo,
    confidence,
  };

  return importedScore;
}

/**
 * Converts a Measure to ImportedMeasure format
 */
function convertMeasure(
  measure: Measure,
  measureIndex: number,
  score: ComposerScore,
): ImportedMeasure {
  const noteEvents: ImportedNoteEvent[] = measure.notes.map((note) =>
    convertNote(note),
  );

  return {
    number: measureIndex + 1,
    events: noteEvents,
    timeSignature:
      measureIndex === 0
        ? {
            beats: score.timeSignature.beats,
            beatType: score.timeSignature.beatUnit,
            displayName: `${score.timeSignature.beats}/${score.timeSignature.beatUnit}`,
          }
        : null,
    keySignature:
      measureIndex === 0
        ? {
            fifths: score.keySignature,
            mode: "major",
            displayName: KEY_NAMES[score.keySignature]?.major ?? "C Major",
          }
        : null,
    confidence: 1.0,
  };
}

/**
 * Converts a Note to ImportedNoteEvent format
 */
function convertNote(note: ComposerNote): ImportedNoteEvent {
  const isRestNote = isRest(note);

  // Get pitch info for non-rest notes
  let pitch: PitchInfo | null = null;

  if (!isRestNote && note.midi !== null) {
    pitch = midiToPitchInfo(note.midi, note.accidental);
  }

  return {
    type: isRestNote ? "rest" : "note",
    pitch,
    pitches: null,
    duration: note.duration,
    durationType: durationToDurationType(note.duration),
    dots: 0,
    articulations: [],
    dynamics: null,
    tiedToNext: note.tieStart || false,
    tiedFromPrevious: note.tieEnd || false,
  };
}

// =============================================================================
// Exports
// =============================================================================

export default composerScoreToImportedScore;
