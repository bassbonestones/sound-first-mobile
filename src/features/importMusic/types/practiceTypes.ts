/**
 * Practice Session Types
 *
 * Types for tracking practice session results,
 * pitch accuracy, and performance metrics.
 */

// ============================================================================
// Performance Tracking
// ============================================================================

/**
 * Result for a single note played during practice
 */
export interface NotePerformance {
  /** MIDI note number of the target note */
  targetMidiNote: number;
  /** MIDI note number that was played (null if no sound detected) */
  playedMidiNote: number | null;
  /** Cents deviation from target pitch (-50 to +50) */
  centsDeviation: number | null;
  /** Whether the note was considered correct */
  wasCorrect: boolean;
  /** Index of the note in the measure */
  noteIndex: number;
  /** Measure number (1-indexed) */
  measureNumber: number;
  /** Beat number (1-indexed) */
  beatNumber: number;
  /** Timestamp when the note was expected */
  expectedTime: number;
  /** Timestamp when sound was detected (null if none) */
  detectedTime: number | null;
}

/**
 * Statistics for a practice session
 */
export interface PracticeSessionStats {
  /** Total number of notes in the practiced section */
  totalNotes: number;
  /** Number of notes played correctly */
  correctNotes: number;
  /** Number of notes played incorrectly */
  incorrectNotes: number;
  /** Number of notes not played (silence) */
  missedNotes: number;
  /** Overall accuracy percentage (0-100) */
  accuracy: number;
  /** Average cents deviation for played notes (absolute) */
  averageCentsDeviation: number;
  /** Total practice time in seconds */
  practiceTimeSeconds: number;
  /** Tempo used during practice */
  tempoBpm: number;
  /** Measures practiced (start-end) */
  measuresRange: { start: number; end: number };
}

// ============================================================================
// Current Note Target
// ============================================================================

/**
 * Currently expected note for pitch matching
 */
export interface CurrentNoteTarget {
  /** MIDI note number (60 = C4) */
  midiNote: number;
  /** Note name (e.g., "C4", "F#5") */
  noteName: string;
  /** Frequency in Hz */
  frequency: number;
  /** Measure number (1-indexed) */
  measureNumber: number;
  /** Beat position in measure */
  beatPosition: number;
  /** Duration in beats */
  durationBeats: number;
  /** Whether this is a rest (no pitch expected) */
  isRest: boolean;
}

// ============================================================================
// Pitch Match State
// ============================================================================

/**
 * Real-time pitch matching state
 */
export interface PitchMatchState {
  /** Current target note (null if rest or no notes) */
  targetNote: CurrentNoteTarget | null;
  /** Currently detected pitch (null if silence) */
  detectedMidiNote: number | null;
  /** Detected note name */
  detectedNoteName: string | null;
  /** Cents deviation from target (-50 to +50) */
  centsDeviation: number;
  /** Whether current pitch matches target */
  isMatching: boolean;
  /** Confidence of the pitch detection (0-1) */
  confidence: number;
  /** Volume level (0-1) */
  volume: number;
  /** Whether sound is currently being detected */
  isSounding: boolean;
}

// ============================================================================
// Practice Result
// ============================================================================

/**
 * Complete practice session result
 */
export interface PracticeSessionResult {
  /** Unique session ID */
  sessionId: string;
  /** Score ID that was practiced */
  scoreId: string;
  /** When the session started */
  startedAt: number;
  /** When the session ended */
  endedAt: number;
  /** Session statistics */
  stats: PracticeSessionStats;
  /** Individual note performances */
  notePerformances: NotePerformance[];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * MIDI note number to note name
 */
export function midiToNoteName(midiNote: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Note name to MIDI note number
 */
export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return 60; // Default to C4

  const [, letter, accidental, octaveStr] = match;
  const noteMap: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  
  const baseNote = noteMap[letter.toUpperCase()] ?? 0;
  const alter = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const octave = parseInt(octaveStr, 10);
  
  return (octave + 1) * 12 + baseNote + alter;
}

/**
 * MIDI note to frequency in Hz
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Calculate cents deviation between two frequencies
 */
export function calculateCents(detected: number, target: number): number {
  return 1200 * Math.log2(detected / target);
}

/**
 * Check if a pitch match is within acceptable tolerance
 */
export function isPitchMatch(
  detectedMidi: number,
  targetMidi: number,
  centsDeviation: number,
  options?: {
    allowOctaveEquivalent?: boolean;
    centsTolerance?: number;
  },
): boolean {
  const { allowOctaveEquivalent = true, centsTolerance = 50 } = options ?? {};
  
  // Check cents deviation first
  if (Math.abs(centsDeviation) > centsTolerance) {
    return false;
  }
  
  // Check octave equivalence
  if (allowOctaveEquivalent) {
    return (detectedMidi % 12) === (targetMidi % 12);
  }
  
  return detectedMidi === targetMidi;
}

/**
 * Create empty practice statistics
 */
export function createEmptyStats(): PracticeSessionStats {
  return {
    totalNotes: 0,
    correctNotes: 0,
    incorrectNotes: 0,
    missedNotes: 0,
    accuracy: 0,
    averageCentsDeviation: 0,
    practiceTimeSeconds: 0,
    tempoBpm: 0,
    measuresRange: { start: 1, end: 1 },
  };
}

/**
 * Calculate practice statistics from note performances
 */
export function calculateStats(
  performances: NotePerformance[],
  practiceTimeSeconds: number,
  tempoBpm: number,
): PracticeSessionStats {
  if (performances.length === 0) {
    return createEmptyStats();
  }
  
  const correctNotes = performances.filter((p) => p.wasCorrect).length;
  const missedNotes = performances.filter((p) => p.playedMidiNote === null).length;
  const incorrectNotes = performances.length - correctNotes - missedNotes;
  
  const playedPerformances = performances.filter((p) => p.centsDeviation !== null);
  const totalCentsDeviation = playedPerformances.reduce(
    (sum, p) => sum + Math.abs(p.centsDeviation!),
    0,
  );
  
  const measureNumbers = performances.map((p) => p.measureNumber);
  
  return {
    totalNotes: performances.length,
    correctNotes,
    incorrectNotes,
    missedNotes,
    accuracy: (correctNotes / performances.length) * 100,
    averageCentsDeviation: playedPerformances.length > 0
      ? totalCentsDeviation / playedPerformances.length
      : 0,
    practiceTimeSeconds,
    tempoBpm,
    measuresRange: {
      start: Math.min(...measureNumbers),
      end: Math.max(...measureNumbers),
    },
  };
}
