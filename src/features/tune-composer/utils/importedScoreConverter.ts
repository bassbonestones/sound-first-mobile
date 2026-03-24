/**
 * Imported Score Converter
 *
 * Converts an ImportedScore (from MusicXML parsing) to a TuneComposerScore
 * for editing in the TuneComposer.
 */

import type {
  ImportedScore,
  ImportedNoteEvent,
  ImportedMeasure,
  PitchInfo,
  DurationType,
  LyricInfo,
  ArticulationType as ImportArticulationType,
} from "../../../types/import";
import type {
  TuneComposerScore,
  Measure,
  DurationValue,
  KeySignature,
  TimeSignature,
  Clef,
  Accidental,
  Note,
  Lyric,
  DynamicType,
  ArticulationType,
} from "../types/tuneComposerTypes";
import {
  generateId,
  createNote,
  createMeasure,
  DURATION,
} from "../types/tuneComposerTypes";

// =============================================================================
// Constants
// =============================================================================

/**
 * Map DurationType string to DurationValue number
 */
const DURATION_TYPE_MAP: Record<DurationType, DurationValue> = {
  whole: DURATION.WHOLE, // 4
  half: DURATION.HALF, // 2
  quarter: DURATION.QUARTER, // 1
  eighth: DURATION.EIGHTH, // 0.5
  "16th": DURATION.SIXTEENTH, // 0.25
  "32nd": 0.125 as DurationValue, // Not in standard DURATION enum
  "64th": 0.0625 as DurationValue,
  "128th": 0.03125 as DurationValue,
};

/**
 * Map PitchInfo step + octave to MIDI number
 * Middle C (C4) = MIDI 60
 */
const PITCH_STEP_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

// =============================================================================
// Conversion Functions
// =============================================================================

/**
 * Convert PitchInfo to MIDI number
 */
export function pitchInfoToMidi(pitch: PitchInfo): number {
  const baseSemitone = PITCH_STEP_TO_SEMITONE[pitch.step] ?? 0;
  // MIDI 60 = C4, so octave 4 starts at 60
  const octaveBase = (pitch.octave + 1) * 12;
  return octaveBase + baseSemitone + pitch.alter;
}

/**
 * Convert alter value to Accidental
 */
export function alterToAccidental(alter: number): Accidental | undefined {
  if (alter === 1) return "sharp";
  if (alter === -1) return "flat";
  if (alter === 0) return "natural"; // Explicit natural
  return undefined;
}

/**
 * Convert DurationType to DurationValue
 */
export function durationTypeToDurationValue(
  durationType: DurationType,
): DurationValue {
  return DURATION_TYPE_MAP[durationType] ?? DURATION.QUARTER;
}

/**
 * Convert LyricInfo to Lyric
 */
export function lyricInfoToLyric(lyricInfo: LyricInfo): Lyric {
  return {
    text: lyricInfo.text,
    syllabic: lyricInfo.syllabic,
    // If extend is true, this is a melisma continuation
    melismaLength: lyricInfo.extend ? 1 : undefined,
  };
}

/**
 * Valid dynamic markings for TuneComposer
 */
const VALID_DYNAMICS: Set<string> = new Set([
  "pp",
  "p",
  "mp",
  "mf",
  "f",
  "ff",
  "fp",
  "sf",
  "sfz",
]);

/**
 * Convert dynamics string to DynamicType
 */
export function dynamicsStringToDynamicType(
  dynamics: string | null,
): DynamicType | undefined {
  if (!dynamics) return undefined;
  const normalized = dynamics.toLowerCase();
  return VALID_DYNAMICS.has(normalized)
    ? (normalized as DynamicType)
    : undefined;
}

/**
 * Map import ArticulationType to TuneComposer ArticulationType
 */
export function mapArticulationType(
  art: ImportArticulationType,
): ArticulationType {
  switch (art) {
    case "staccato":
      return "staccato";
    case "accent":
      return "accent";
    case "tenuto":
      return "tenuto";
    case "marcato":
      return "strong-accent";
    case "fermata":
      return "fermata";
    default:
      return "staccato"; // Fallback
  }
}

/**
 * Convert an ImportedNoteEvent to a composer Note
 */
export function importedNoteEventToNote(event: ImportedNoteEvent): Note {
  // Convert lyric if present
  const lyric = event.lyric ? lyricInfoToLyric(event.lyric) : undefined;
  // Convert dynamic if present
  const dynamic = dynamicsStringToDynamicType(event.dynamics);
  // Convert articulation if present (take first one)
  const articulation =
    event.articulations.length > 0
      ? mapArticulationType(event.articulations[0])
      : undefined;
  // Convert expression if present
  const expression = event.expression ?? undefined;
  // Convert slurs
  const slurStart = event.slurStart || undefined;
  const slurEnd = event.slurEnd || undefined;

  if (event.type === "rest") {
    return createNote(null, durationTypeToDurationValue(event.durationType), {
      dotted: event.dots > 0,
    });
  }

  if (event.type === "note" && event.pitch) {
    const midi = pitchInfoToMidi(event.pitch);
    const accidental =
      event.pitch.alter !== 0
        ? alterToAccidental(event.pitch.alter)
        : undefined;

    return createNote(midi, durationTypeToDurationValue(event.durationType), {
      dotted: event.dots > 0,
      accidental,
      tieStart: event.tiedToNext,
      tieEnd: event.tiedFromPrevious,
      lyric,
      dynamic,
      articulation,
      expression,
      slurStart,
      slurEnd,
    });
  }

  // For chords, just take the first pitch (TuneComposer is monophonic)
  if (event.type === "chord" && event.pitches && event.pitches.length > 0) {
    const pitch = event.pitches[0];
    const midi = pitchInfoToMidi(pitch);
    const accidental =
      pitch.alter !== 0 ? alterToAccidental(pitch.alter) : undefined;

    return createNote(midi, durationTypeToDurationValue(event.durationType), {
      dotted: event.dots > 0,
      accidental,
      tieStart: event.tiedToNext,
      tieEnd: event.tiedFromPrevious,
      lyric,
      dynamic,
      articulation,
      expression,
      slurStart,
      slurEnd,
    });
  }

  // Fallback: quarter rest
  return createNote(null, DURATION.QUARTER);
}

/**
 * Convert an ImportedMeasure to a composer Measure
 */
export function importedMeasureToMeasure(
  importedMeasure: ImportedMeasure,
): Measure {
  const notes = importedMeasure.events.map(importedNoteEventToNote);

  return {
    id: generateId(),
    notes: notes.length > 0 ? notes : [createNote(null, DURATION.WHOLE)],
  };
}

/**
 * Infer clef from MIDI pitch range
 * If average pitch is below middle C (60), use bass clef
 */
export function inferClefFromPitches(notes: Note[]): Clef {
  const pitchedNotes = notes.filter((n) => n.midi !== null);
  if (pitchedNotes.length === 0) return "treble";

  const totalMidi = pitchedNotes.reduce((sum, n) => sum + (n.midi ?? 0), 0);
  const avgMidi = totalMidi / pitchedNotes.length;

  // Middle C is 60. If average is significantly below, use bass clef
  return avgMidi < 55 ? "bass" : "treble";
}

/**
 * Convert key signature fifths value to KeySignature
 * Both use the same -7 to +7 range
 */
export function keyFifthsToKeySignature(fifths: number): KeySignature {
  const clamped = Math.max(-7, Math.min(7, fifths));
  return clamped as KeySignature;
}

/**
 * Convert ImportedScore to ComposerScore
 *
 * @param importedScore - The parsed MusicXML score
 * @param options - Optional overrides for title, etc.
 * @returns A TuneComposerScore ready for editing
 */
export function importedScoreToComposerScore(
  importedScore: ImportedScore,
  options?: {
    title?: string;
    scoreId?: string;
  },
): TuneComposerScore {
  const now = new Date().toISOString();
  const metadata = importedScore.metadata;

  // Get the first part (TuneComposer is single-part)
  const firstPart = importedScore.parts[0];
  if (!firstPart || firstPart.measures.length === 0) {
    // Return empty score if no content
    const timeSig: TimeSignature = { beats: 4, beatUnit: 4 };
    return {
      id: options?.scoreId ?? generateId(),
      title: options?.title ?? metadata.title ?? "Untitled",
      clef: "treble",
      keySignature: 0,
      timeSignature: timeSig,
      tempo: metadata.tempo?.bpm ?? 120,
      measures: [createMeasure(timeSig)],
      createdAt: now,
      updatedAt: now,
    };
  }

  // Convert all measures
  const measures = firstPart.measures.map(importedMeasureToMeasure);

  // Collect all notes for clef inference
  const allNotes = measures.flatMap((m) => m.notes);
  const clef = inferClefFromPitches(allNotes);

  // Extract time signature from first measure or metadata
  const firstMeasure = firstPart.measures[0];
  const timeSig: TimeSignature = firstMeasure?.timeSignature
    ? {
        beats: firstMeasure.timeSignature.beats,
        beatUnit: firstMeasure.timeSignature.beatType,
      }
    : metadata.timeSignature
      ? {
          beats: metadata.timeSignature.beats,
          beatUnit: metadata.timeSignature.beatType,
        }
      : { beats: 4, beatUnit: 4 };

  // Extract key signature
  const keyFifths =
    firstMeasure?.keySignature?.fifths ?? metadata.keySignature?.fifths ?? 0;
  const keySignature = keyFifthsToKeySignature(keyFifths);

  // Extract tempo
  const tempo = metadata.tempo?.bpm ?? 120;

  return {
    id: options?.scoreId ?? generateId(),
    title: options?.title ?? metadata.title ?? "Untitled",
    clef,
    keySignature,
    timeSignature: timeSig,
    tempo,
    measures,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Result of conversion attempt
 */
export interface ConversionResult {
  success: boolean;
  score: TuneComposerScore | null;
  error: string | null;
  warnings: string[];
}

/**
 * Safe conversion with error handling
 */
export function safeConvertImportedScore(
  importedScore: ImportedScore,
  options?: {
    title?: string;
    scoreId?: string;
  },
): ConversionResult {
  const warnings: string[] = [];

  try {
    // Check for multi-part scores
    if (importedScore.parts.length > 1) {
      warnings.push(
        `Score has ${importedScore.parts.length} parts. Only the first part will be loaded.`,
      );
    }

    // Check for chords
    const hasChords = importedScore.parts.some((part) =>
      part.measures.some((measure) =>
        measure.events.some((event) => event.type === "chord"),
      ),
    );
    if (hasChords) {
      warnings.push("Chords detected. Only the top note will be used.");
    }

    const score = importedScoreToComposerScore(importedScore, options);

    return {
      success: true,
      score,
      error: null,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      score: null,
      error: err instanceof Error ? err.message : "Conversion failed",
      warnings,
    };
  }
}
