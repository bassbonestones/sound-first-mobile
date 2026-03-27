/**
 * Generator Mode Types
 *
 * State and action types for the generator mode reducer.
 * Centralizes all state related to scale/arpeggio generation.
 */
import type {
  GenerationType,
  ScaleType,
  ArpeggioType,
  ScalePattern,
  ArpeggioPattern,
  RhythmType,
  MusicalKey,
  GenerationResponse,
} from "../../../api/generation";
import type { ClefType } from "../../../utils/generationNotation";
import type { PlaybackState } from "../../../services/generationPlayback";
import type { RandomizeState } from "../constants/generatorConstants";

// =============================================================================
// State
// =============================================================================

/** Generation context for MusicXML generation */
export interface GenerationContext {
  title: string;
  key: MusicalKey;
  clef: ClefType;
  rhythm: RhythmType;
  mode?: string;
}

/** Parameter state for content generation */
export interface GeneratorParameterState {
  generationType: GenerationType;
  scaleType: ScaleType;
  arpeggioType: ArpeggioType;
  scalePattern: ScalePattern;
  arpeggioPattern: ArpeggioPattern;
  rhythmType: RhythmType;
  rootKey: MusicalKey;
  startOctave: number;
  numOctaves: number;
  clef: ClefType;
  tempo: number;
}

/** Pool mode state for random selection from a subset */
export interface GeneratorPoolState {
  poolModeEnabled: boolean;
  scalePool: ScaleType[];
  arpeggioPool: ArpeggioType[];
  keyPool: MusicalKey[];
}

/** Generation result state */
export interface GeneratorResultState {
  isGenerating: boolean;
  generationError: string | null;
  response: GenerationResponse | null;
  generationContext: GenerationContext | null;
}

/** Playback state for audio */
export interface GeneratorPlaybackState {
  playbackState: PlaybackState;
  currentNoteIndex: number | null;
}

/** Complete generator mode state */
export interface GeneratorModeState {
  parameters: GeneratorParameterState;
  randomize: RandomizeState;
  pool: GeneratorPoolState;
  result: GeneratorResultState;
  playback: GeneratorPlaybackState;
}

// =============================================================================
// Actions
// =============================================================================

/** All possible generator mode actions */
export type GeneratorModeAction =
  // Parameter actions
  | { type: "SET_GENERATION_TYPE"; payload: GenerationType }
  | { type: "SET_SCALE_TYPE"; payload: ScaleType }
  | { type: "SET_ARPEGGIO_TYPE"; payload: ArpeggioType }
  | { type: "SET_SCALE_PATTERN"; payload: ScalePattern }
  | { type: "SET_ARPEGGIO_PATTERN"; payload: ArpeggioPattern }
  | { type: "SET_RHYTHM_TYPE"; payload: RhythmType }
  | { type: "SET_ROOT_KEY"; payload: MusicalKey }
  | { type: "SET_START_OCTAVE"; payload: number }
  | { type: "SET_NUM_OCTAVES"; payload: number }
  | { type: "SET_CLEF"; payload: ClefType }
  | { type: "SET_TEMPO"; payload: number }
  // Randomize actions
  | { type: "TOGGLE_RANDOMIZE"; field: keyof RandomizeState }
  // Pool actions
  | { type: "SET_POOL_MODE_ENABLED"; payload: boolean }
  | { type: "SET_SCALE_POOL"; payload: ScaleType[] }
  | { type: "SET_ARPEGGIO_POOL"; payload: ArpeggioType[] }
  | { type: "SET_KEY_POOL"; payload: MusicalKey[] }
  // Generation actions
  | { type: "GENERATION_START" }
  | {
      type: "GENERATION_SUCCESS";
      payload: { response: GenerationResponse; context: GenerationContext };
    }
  | { type: "GENERATION_ERROR"; payload: string }
  // Playback actions
  | { type: "SET_PLAYBACK_STATE"; payload: PlaybackState }
  | { type: "SET_CURRENT_NOTE_INDEX"; payload: number | null }
  | { type: "PLAYBACK_COMPLETE" }
  // Batch parameter update (for random selections)
  | { type: "UPDATE_PARAMETERS"; payload: Partial<GeneratorParameterState> };

// =============================================================================
// Initial State
// =============================================================================

/** Default randomize state */
export const DEFAULT_RANDOMIZE_STATE: RandomizeState = {
  scaleType: false,
  arpeggioType: false,
  scalePattern: false,
  arpeggioPattern: false,
  rhythmType: false,
  rootKey: false,
  startOctave: false,
  numOctaves: false,
  clef: false,
};

/** Default initial state for generator mode */
export const initialGeneratorModeState: GeneratorModeState = {
  parameters: {
    generationType: "scale",
    scaleType: "ionian",
    arpeggioType: "major",
    scalePattern: "straight_up_down",
    arpeggioPattern: "straight_up_down",
    rhythmType: "quarter_notes",
    rootKey: "C",
    startOctave: 4,
    numOctaves: 1,
    clef: "treble",
    tempo: 120,
  },
  randomize: DEFAULT_RANDOMIZE_STATE,
  pool: {
    poolModeEnabled: false,
    scalePool: ["ionian", "dorian"],
    arpeggioPool: ["major", "minor"],
    keyPool: ["C", "G", "F"],
  },
  result: {
    isGenerating: false,
    generationError: null,
    response: null,
    generationContext: null,
  },
  playback: {
    playbackState: "stopped",
    currentNoteIndex: null,
  },
};
