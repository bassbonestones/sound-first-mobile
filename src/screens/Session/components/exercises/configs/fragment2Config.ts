/**
 * Fragment2LessonExercise Configuration
 *
 * Defines all Fragment2-specific patterns, note generation,
 * MusicXML generation, and focus card content.
 *
 * Patterns: 2-note diatonic scale fragments
 * - Linear Up: 1 → 2
 * - Linear Down: 2 → 1
 * - Arc Up: 1 → 2 → 1
 * - Arc Down: 2 → 1 → 2
 */

import { noteToMidi, midiToFrequency, midiToNote } from "../shared";

// ============================================================================
// Types
// ============================================================================

export interface Fragment2Pattern {
  id: string;
  name: string;
  scaleDegrees: number[];
  description: string;
}

export interface FocusCardContent {
  category: string;
  name: string;
  description: string;
  cue: string;
}

export interface Fragment2NoteInfo {
  midi: number;
  frequency: number;
  noteName: string;
  step: string;
  octave: string;
  alterXML: string;
  accidentalXML: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Fragment2 uses half notes at 60 BPM for better pitch perception
 */
export const FRAGMENT2_CONFIG = {
  tempo: 60,
  beatsPerNote: 2, // Half notes
  hasSubdivision: true, // Eighth note subdivision
  hasDronePhase: true,
} as const;

/**
 * Pattern definitions for fragment-2 exercises
 */
export const FRAGMENT2_PATTERNS: Record<string, Fragment2Pattern> = {
  LINEAR_UP: {
    id: "linear_up",
    name: "Linear Up",
    scaleDegrees: [1, 2],
    description: "1 → 2",
  },
  LINEAR_DOWN: {
    id: "linear_down",
    name: "Linear Down",
    scaleDegrees: [2, 1],
    description: "2 → 1",
  },
  ARC_UP: {
    id: "arc_up",
    name: "Arc Up",
    scaleDegrees: [1, 2, 1],
    description: "1 → 2 → 1",
  },
  ARC_DOWN: {
    id: "arc_down",
    name: "Arc Down",
    scaleDegrees: [2, 1, 2],
    description: "2 → 1 → 2",
  },
};

/**
 * Order in which patterns should be completed
 */
export const FRAGMENT2_PATTERN_ORDER = [
  "linear_up",
  "linear_down",
  "arc_up",
  "arc_down",
];

/**
 * Focus card categories for rotation through patterns
 */
export const FRAGMENT2_FOCUS_CARDS: FocusCardContent[] = [
  {
    category: "pitch",
    name: "Pitch Center",
    description: "Lock your ear onto the exact center of each pitch.",
    cue: "Hear the center. Sing the center. Play the center.",
  },
  {
    category: "projection",
    name: "Projection Intent",
    description: "Aim your sound at a point beyond the room.",
    cue: "Pick a target. Direct the sound. Fill the space.",
  },
  {
    category: "core_sound",
    name: "Core Sound",
    description: "Focus on the fundamental, centered tone.",
    cue: "Hear the fundamental. Center the tone. Maintain the core.",
  },
  {
    category: "rhythm",
    name: "Internal Pulse",
    description: "Feel the pulse inside you—steady and independent.",
    cue: "Find your pulse. Lock in. Trust your time.",
  },
];

/**
 * Major scale intervals (semitones from root)
 */
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];

// ============================================================================
// Note Generation Functions
// ============================================================================

/**
 * Get MIDI note for a scale degree relative to a root note
 */
export function getScaleDegreeMidi(
  rootMidi: number,
  scaleDegree: number,
): number {
  // Scale degree is 1-based
  const interval = MAJOR_SCALE_INTERVALS[scaleDegree - 1] ?? 0;
  return rootMidi + interval;
}

/**
 * Generate note info for a pattern given a starting note
 */
export function generatePatternNotes(
  scaleDegrees: number[],
  startingNote: string,
): Fragment2NoteInfo[] {
  const rootMidi = noteToMidi(startingNote);

  return scaleDegrees.map((degree) => {
    const midi = getScaleDegreeMidi(rootMidi, degree);
    const noteName = midiToNote(midi, false);
    const frequency = midiToFrequency(midi);

    // Parse for MusicXML generation
    let alterXML = "";
    let accidentalXML = "";
    const step = noteName.charAt(0);
    const octave = noteName.charAt(noteName.length - 1);

    if (noteName.includes("#")) {
      alterXML = `        <alter>1</alter>\n`;
      accidentalXML = `        <accidental>sharp</accidental>\n`;
    } else if (noteName.includes("b")) {
      alterXML = `        <alter>-1</alter>\n`;
      accidentalXML = `        <accidental>flat</accidental>\n`;
    }

    return {
      midi,
      frequency,
      noteName,
      step,
      octave,
      alterXML,
      accidentalXML,
    };
  });
}

/**
 * Get pattern by ID
 */
export function getFragment2Pattern(
  patternId: string,
): Fragment2Pattern | undefined {
  return Object.values(FRAGMENT2_PATTERNS).find((p) => p.id === patternId);
}

/**
 * Get focus card for a pattern index (rotates through cards)
 */
export function getFragment2FocusCard(index: number): FocusCardContent {
  return FRAGMENT2_FOCUS_CARDS[index % FRAGMENT2_FOCUS_CARDS.length];
}

// ============================================================================
// MusicXML Generation
// ============================================================================

/**
 * Generate MusicXML for a fragment pattern
 *
 * For 2-note patterns: Single 4/4 measure with 2 half notes
 * For 3-note patterns: Two 4/4 measures (2 halves + half + rest)
 */
export function generateFragment2MusicXML(
  scaleDegrees: number[],
  startingNote: string,
  clef: "treble" | "bass" = "treble",
): string {
  const notes = generatePatternNotes(scaleDegrees, startingNote);
  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  // For 3-note patterns, split into 2 measures
  if (scaleDegrees.length === 3) {
    return generateThreeNoteMeasures(notes, clefSign, clefLine);
  }

  // For 2-note patterns, use single 4/4 measure
  return generateTwoNoteMeasure(notes, clefSign, clefLine);
}

/**
 * Generate MusicXML for 2-note pattern (single 4/4 measure)
 */
function generateTwoNoteMeasure(
  notes: Fragment2NoteInfo[],
  clefSign: string,
  clefLine: string,
): string {
  const notesXML = notes
    .map(
      (n) => `      <note>
        <pitch>
          <step>${n.step}</step>
${n.alterXML}          <octave>${n.octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${n.accidentalXML}      </note>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
${notesXML}
    </measure>
  </part>
</score-partwise>`;
}

/**
 * Generate MusicXML for 3-note pattern (two 4/4 measures)
 * Measure 1: notes 0 and 1
 * Measure 2: note 2 + half rest
 */
function generateThreeNoteMeasures(
  notes: Fragment2NoteInfo[],
  clefSign: string,
  clefLine: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name></part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <key>
          <fifths>0</fifths>
        </key>
        <clef>
          <sign>${clefSign}</sign>
          <line>${clefLine}</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>${notes[0].step}</step>
${notes[0].alterXML}          <octave>${notes[0].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${notes[0].accidentalXML}      </note>
      <note>
        <pitch>
          <step>${notes[1].step}</step>
${notes[1].alterXML}          <octave>${notes[1].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${notes[1].accidentalXML}      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>${notes[2].step}</step>
${notes[2].alterXML}          <octave>${notes[2].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${notes[2].accidentalXML}      </note>
      <note>
        <rest/>
        <duration>2</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// ============================================================================
// Valid Starting Notes Calculation
// ============================================================================

/**
 * Calculate valid starting notes based on user's range
 * For 2-note fragments, we need at least M2 (2 semitones) of space
 */
export function calculateValidStartingNotes(
  userFirstNote: string,
  userRangeLow?: string,
  userRangeHigh?: string,
): string[] {
  const lowMidi = userRangeLow
    ? noteToMidi(userRangeLow)
    : noteToMidi(userFirstNote);
  const highMidi = userRangeHigh ? noteToMidi(userRangeHigh) : lowMidi + 2;

  // For do-re patterns, starting note must allow re (do + 2 semitones) to fit
  const maxStartingMidi = highMidi - 2;
  const notes: string[] = [];

  for (let midi = lowMidi; midi <= maxStartingMidi; midi++) {
    notes.push(midiToNote(midi, false));
  }

  // If no valid notes (range too small), fall back to userFirstNote
  if (notes.length === 0) {
    return [userFirstNote];
  }

  return notes;
}

/**
 * Select a random starting note for a session
 */
export function selectSessionStartingNote(validNotes: string[]): string {
  const randomIndex = Math.floor(Math.random() * validNotes.length);
  return validNotes[randomIndex];
}

// ============================================================================
// Cursor Position Calculation for Notation Display
// ============================================================================

export interface NotationCursorConfig {
  notePositions: number[];
  highlightWidth: number;
}

/**
 * Get cursor position configuration for notation display
 * Based on note count in pattern
 */
export function getNotationCursorConfig(
  noteCount: number,
): NotationCursorConfig {
  if (noteCount === 2) {
    // Single 4/4 measure: clef+timesig ~100px, then 2 half notes
    return {
      notePositions: [135, 215],
      highlightWidth: 60,
    };
  } else {
    // Two 4/4 measures: notes 1&2 in measure 1, note 3 in measure 2
    return {
      notePositions: [95, 155, 225],
      highlightWidth: 45,
    };
  }
}

/**
 * Calculate cursor highlight position based on current beat
 */
export function calculateCursorPosition(
  currentBeat: number,
  showCursor: boolean,
  noteCount: number,
): number | null {
  if (!showCursor || currentBeat < 1) return null;

  const noteIndex = Math.floor((currentBeat - 1) / 2);
  const config = getNotationCursorConfig(noteCount);

  if (noteIndex < config.notePositions.length) {
    return config.notePositions[noteIndex];
  }

  return null;
}

// ============================================================================
// Performance Analysis Thresholds
// ============================================================================

export const FRAGMENT2_THRESHOLDS = {
  /**
   * Per-note pitch threshold: 40% of samples for each note must match
   */
  perNotePitch: 0.4,

  /**
   * Overall pitch success ratio
   */
  overallPitch: 0.3,

  /**
   * Sustain threshold: must sound for 60% of note duration
   */
  sustain: 0.6,

  /**
   * Cents tolerance for pitch matching (for singing, allows octave)
   */
  pitchTolerance: {
    sing: 1, // Semitone tolerance within octave
    play: 0, // Exact semitone for playing
  },
} as const;

// ============================================================================
// Phase Configuration
// ============================================================================

/**
 * Fragment2 phases (extends standard lesson phases with PLAY_WITH_DRONE)
 */
export const FRAGMENT2_PHASES = {
  FOCUS_CARD: "focus_card",
  LISTEN: "listen",
  SING: "sing",
  IMAGINE: "imagine",
  PLAY_WITH_DRONE: "play_with_drone",
  PLAY: "play",
  FEEDBACK: "feedback",
} as const;

export type Fragment2Phase =
  (typeof FRAGMENT2_PHASES)[keyof typeof FRAGMENT2_PHASES];

/**
 * Phase transition order
 */
export const FRAGMENT2_PHASE_ORDER: Fragment2Phase[] = [
  FRAGMENT2_PHASES.FOCUS_CARD,
  FRAGMENT2_PHASES.LISTEN,
  FRAGMENT2_PHASES.SING,
  FRAGMENT2_PHASES.IMAGINE,
  FRAGMENT2_PHASES.PLAY_WITH_DRONE,
  FRAGMENT2_PHASES.PLAY,
  FRAGMENT2_PHASES.FEEDBACK,
];

/**
 * Get the next phase in the sequence
 */
export function getNextPhase(
  currentPhase: Fragment2Phase,
): Fragment2Phase | null {
  const currentIndex = FRAGMENT2_PHASE_ORDER.indexOf(currentPhase);
  if (
    currentIndex === -1 ||
    currentIndex === FRAGMENT2_PHASE_ORDER.length - 1
  ) {
    return null;
  }
  return FRAGMENT2_PHASE_ORDER[currentIndex + 1];
}

// ============================================================================
// Export default config object for convenience
// ============================================================================

export const fragment2Config = {
  ...FRAGMENT2_CONFIG,
  patterns: FRAGMENT2_PATTERNS,
  patternOrder: FRAGMENT2_PATTERN_ORDER,
  focusCards: FRAGMENT2_FOCUS_CARDS,
  phases: FRAGMENT2_PHASES,
  phaseOrder: FRAGMENT2_PHASE_ORDER,
  thresholds: FRAGMENT2_THRESHOLDS,
  scaleIntervals: MAJOR_SCALE_INTERVALS,
};

export default fragment2Config;
