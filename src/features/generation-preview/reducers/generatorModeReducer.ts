/**
 * Generator Mode Reducer
 *
 * Pure reducer function for managing generator mode state.
 * All state transitions are explicit and type-safe.
 */
import type {
  GeneratorModeState,
  GeneratorModeAction,
} from "../types/generatorModeTypes";

/**
 * Reducer for generator mode state.
 * Handles all state transitions for scale/arpeggio generation.
 */
export function generatorModeReducer(
  state: GeneratorModeState,
  action: GeneratorModeAction,
): GeneratorModeState {
  switch (action.type) {
    // ==========================================================================
    // Parameter Actions
    // ==========================================================================

    case "SET_GENERATION_TYPE":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          generationType: action.payload,
        },
      };

    case "SET_SCALE_TYPE":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          scaleType: action.payload,
        },
      };

    case "SET_ARPEGGIO_TYPE":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          arpeggioType: action.payload,
        },
      };

    case "SET_SCALE_PATTERN":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          scalePattern: action.payload,
        },
      };

    case "SET_ARPEGGIO_PATTERN":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          arpeggioPattern: action.payload,
        },
      };

    case "SET_RHYTHM_TYPE":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          rhythmType: action.payload,
        },
      };

    case "SET_ROOT_KEY":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          rootKey: action.payload,
        },
      };

    case "SET_START_OCTAVE":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          startOctave: action.payload,
        },
      };

    case "SET_NUM_OCTAVES":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          numOctaves: action.payload,
        },
      };

    case "SET_CLEF":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          clef: action.payload,
        },
      };

    case "SET_TEMPO":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          tempo: action.payload,
        },
      };

    // ==========================================================================
    // Randomize Actions
    // ==========================================================================

    case "TOGGLE_RANDOMIZE":
      return {
        ...state,
        randomize: {
          ...state.randomize,
          [action.field]: !state.randomize[action.field],
        },
      };

    // ==========================================================================
    // Pool Actions
    // ==========================================================================

    case "SET_POOL_MODE_ENABLED":
      return {
        ...state,
        pool: {
          ...state.pool,
          poolModeEnabled: action.payload,
        },
      };

    case "SET_SCALE_POOL":
      return {
        ...state,
        pool: {
          ...state.pool,
          scalePool: action.payload,
        },
      };

    case "SET_ARPEGGIO_POOL":
      return {
        ...state,
        pool: {
          ...state.pool,
          arpeggioPool: action.payload,
        },
      };

    case "SET_KEY_POOL":
      return {
        ...state,
        pool: {
          ...state.pool,
          keyPool: action.payload,
        },
      };

    // ==========================================================================
    // Generation Actions
    // ==========================================================================

    case "GENERATION_START":
      return {
        ...state,
        result: {
          ...state.result,
          isGenerating: true,
          generationError: null,
        },
      };

    case "GENERATION_SUCCESS":
      return {
        ...state,
        result: {
          ...state.result,
          isGenerating: false,
          response: action.payload.response,
          generationContext: action.payload.context,
          generationError: null,
        },
      };

    case "GENERATION_ERROR":
      return {
        ...state,
        result: {
          ...state.result,
          isGenerating: false,
          generationError: action.payload,
        },
      };

    // ==========================================================================
    // Playback Actions
    // ==========================================================================

    case "SET_PLAYBACK_STATE":
      return {
        ...state,
        playback: {
          ...state.playback,
          playbackState: action.payload,
        },
      };

    case "SET_CURRENT_NOTE_INDEX":
      return {
        ...state,
        playback: {
          ...state.playback,
          currentNoteIndex: action.payload,
        },
      };

    case "PLAYBACK_COMPLETE":
      return {
        ...state,
        playback: {
          ...state.playback,
          currentNoteIndex: null,
        },
      };

    // ==========================================================================
    // Batch Update
    // ==========================================================================

    case "UPDATE_PARAMETERS":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}
