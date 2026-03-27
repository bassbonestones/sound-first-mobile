/**
 * Exercise Configuration Barrel Exports
 *
 * Each exercise has a config file that defines:
 * - Patterns and pattern order
 * - Focus card content
 * - Note/pitch generation functions
 * - MusicXML generation
 * - Performance thresholds
 * - Phase configuration
 */

// Fragment2 (2-note diatonic scale fragments)
export {
  // Config object
  fragment2Config,
  default as Fragment2Config,
  // Constants
  FRAGMENT2_CONFIG,
  FRAGMENT2_PATTERNS,
  FRAGMENT2_PATTERN_ORDER,
  FRAGMENT2_FOCUS_CARDS,
  FRAGMENT2_PHASES,
  FRAGMENT2_PHASE_ORDER,
  FRAGMENT2_THRESHOLDS,
  MAJOR_SCALE_INTERVALS,
  // Functions
  getScaleDegreeMidi,
  generatePatternNotes,
  getFragment2Pattern,
  getFragment2FocusCard,
  generateFragment2MusicXML,
  calculateValidStartingNotes,
  selectSessionStartingNote,
  getNotationCursorConfig,
  calculateCursorPosition,
  getNextPhase,
} from "./fragment2Config";

export type {
  Fragment2Pattern,
  FocusCardContent,
  Fragment2NoteInfo,
  Fragment2Phase,
  NotationCursorConfig,
} from "./fragment2Config";

// WholeNote (single whole note lesson)
export {
  // Config object
  wholeNoteConfig,
  default as WholeNoteConfig,
  // Constants
  WHOLE_NOTE_CONFIG,
  WHOLE_NOTE_FOCUS_CARD,
  WHOLE_NOTE_MINI_CARD,
  WHOLE_NOTE_THRESHOLDS,
  // Functions
  generateWholeNoteInfo,
  generateWholeNoteMusicXML,
  getWholeNoteCursorConfig,
} from "./wholeNoteConfig";

export type { WholeNoteInfo, WholeNoteFocusCard } from "./wholeNoteConfig";

// HalfNote (single half note lesson)
export {
  // Config object
  halfNoteConfig,
  default as HalfNoteConfig,
  // Constants
  HALF_NOTE_CONFIG,
  HALF_NOTE_FOCUS_CARD,
  HALF_NOTE_MINI_CARD,
  HALF_NOTE_THRESHOLDS,
  // Functions
  generateHalfNoteInfo,
  generateHalfNoteMusicXML,
  getHalfNoteCursorConfig,
} from "./halfNoteConfig";

export type { HalfNoteInfo, HalfNoteFocusCard } from "./halfNoteConfig";

// QuarterNote (single quarter note lesson)
export {
  // Config object
  quarterNoteConfig,
  default as QuarterNoteConfig,
  // Constants
  QUARTER_NOTE_CONFIG,
  QUARTER_NOTE_FOCUS_CARD,
  QUARTER_NOTE_MINI_CARD,
  QUARTER_NOTE_THRESHOLDS,
  // Functions
  generateQuarterNoteInfo,
  generateQuarterNoteMusicXML,
  getQuarterNoteCursorConfig,
} from "./quarterNoteConfig";

export type {
  QuarterNoteInfo,
  QuarterNoteFocusCard,
} from "./quarterNoteConfig";

// WholeRest (whole rest lesson - note + rest + note pattern)
export {
  // Config object
  wholeRestConfig,
  default as WholeRestConfig,
  // Constants
  WHOLE_REST_CONFIG,
  WHOLE_REST_FOCUS_CARD,
  WHOLE_REST_MINI_CARD,
  WHOLE_REST_THRESHOLDS,
  // Functions
  generateWholeRestNoteInfo,
  generateWholeRestPatternMusicXML,
  getWholeRestCursorConfig,
  shouldBeatHaveSound,
  getMeasureForBeat,
  isRestBeat,
} from "./wholeRestConfig";

export type { WholeRestNoteInfo, WholeRestFocusCard } from "./wholeRestConfig";

// QuarterRest (quarter rest lesson - note-rest-note-rest pattern)
export {
  // Config object
  quarterRestConfig,
  default as QuarterRestConfig,
  // Constants
  QUARTER_REST_CONFIG,
  QUARTER_REST_FOCUS_CARD,
  QUARTER_REST_MINI_CARD,
  QUARTER_REST_THRESHOLDS,
  // Functions
  generateQuarterRestNoteInfo,
  generateQuarterRestPatternMusicXML,
  getQuarterRestCursorConfig,
  shouldBeatHaveSound as quarterRestShouldBeatHaveSound,
  getMeasureForBeat as quarterRestGetMeasureForBeat,
  getMeasureBeat,
  isRestBeat as quarterRestIsRestBeat,
  isAccentBeat,
  analyzeQuarterRestPerformance,
} from "./quarterRestConfig";

export type {
  QuarterRestNoteInfo,
  QuarterRestFocusCard,
  QuarterRestBeat,
} from "./quarterRestConfig";

// HalfRest (half rest lesson - half note + half rest + half note pattern)
export {
  // Config object
  halfRestConfig,
  default as HalfRestConfig,
  // Constants
  HALF_REST_CONFIG,
  HALF_REST_FOCUS_CARD,
  HALF_REST_MINI_CARD,
  HALF_REST_THRESHOLDS,
  // Functions
  generateHalfRestNoteInfo,
  generateHalfRestPatternMusicXML,
  getHalfRestCursorConfig,
  shouldBeatHaveSound as halfRestShouldBeatHaveSound,
  getMeasureForBeat as halfRestGetMeasureForBeat,
  getMeasureBeat as halfRestGetMeasureBeat,
  isRestBeat as halfRestIsRestBeat,
  isAccentBeat as halfRestIsAccentBeat,
  isEndBeat,
  analyzeHalfRestPerformance,
} from "./halfRestConfig";

export type {
  HalfRestNoteInfo,
  HalfRestFocusCard,
  HalfRestBeat,
} from "./halfRestConfig";
