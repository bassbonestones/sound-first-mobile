/**
 * useGeneratorMode
 *
 * Custom hook for managing the generator mode state and actions.
 * Uses useReducer for centralized state management.
 */
import { useReducer, useCallback, useEffect, useMemo } from "react";
import { devLog, devError } from "../../../utils/devLogger";
import {
  generateContent,
  type GenerationType,
  type ScaleType,
  type ArpeggioType,
  type ScalePattern,
  type ArpeggioPattern,
  type RhythmType,
  type GenerationResponse,
  type MusicalKey,
} from "../../../api/generation";
import {
  generationPlayback,
  type PlaybackState,
} from "../../../services/generationPlayback";
import {
  eventsToMusicXml,
  generateDisplayTitle,
  getMeasureIndexForNote,
  type ClefType,
} from "../../../utils/generationNotation";
import {
  SCALE_TYPES,
  SCALE_PATTERNS,
  ARPEGGIO_TYPES,
  ARPEGGIO_PATTERNS,
  RHYTHM_TYPES,
  ROOT_KEYS,
  OCTAVES,
  CLEFS,
  SCALE_PATTERN_CONSTRAINTS,
  ASYMMETRIC_SCALES,
  getAvailableRhythmsForPattern,
  getScaleNoteCount,
  pickRandom,
  type RandomizeState,
} from "../constants";
import { generatorModeReducer } from "../reducers";
import {
  type GenerationContext,
  type GeneratorModeState,
  initialGeneratorModeState,
} from "../types";

// =============================================================================
// Types
// =============================================================================

// Re-export GenerationContext for backwards compatibility
export type { GenerationContext } from "../types";

/** Return type for useGeneratorMode */
export interface UseGeneratorModeReturn {
  // Parameter state
  generationType: GenerationType;
  setGenerationType: (type: GenerationType) => void;
  scaleType: ScaleType;
  setScaleType: (type: ScaleType) => void;
  arpeggioType: ArpeggioType;
  setArpeggioType: (type: ArpeggioType) => void;
  scalePattern: ScalePattern;
  setScalePattern: (pattern: ScalePattern) => void;
  arpeggioPattern: ArpeggioPattern;
  setArpeggioPattern: (pattern: ArpeggioPattern) => void;
  rhythmType: RhythmType;
  setRhythmType: (type: RhythmType) => void;
  rootKey: MusicalKey;
  setRootKey: (key: MusicalKey) => void;
  startOctave: number;
  setStartOctave: (octave: number) => void;
  numOctaves: number;
  setNumOctaves: (octaves: number) => void;
  clef: ClefType;
  setClef: (clef: ClefType) => void;
  tempo: number;
  setTempo: (tempo: number) => void;

  // Randomization
  randomize: RandomizeState;
  toggleRandomize: (field: keyof RandomizeState) => void;

  // Pool mode
  poolModeEnabled: boolean;
  setPoolModeEnabled: (enabled: boolean) => void;
  scalePool: ScaleType[];
  setScalePool: (pool: ScaleType[]) => void;
  arpeggioPool: ArpeggioType[];
  setArpeggioPool: (pool: ArpeggioType[]) => void;
  keyPool: MusicalKey[];
  setKeyPool: (pool: MusicalKey[]) => void;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;
  response: GenerationResponse | null;
  generationContext: GenerationContext | null;

  // Playback state
  playbackState: PlaybackState;
  currentNoteIndex: number | null;

  // Computed
  musicXml: string | null;
  playbackMeasureIndex: number | undefined;
  availableScalePatterns: ScalePattern[];
  availableScaleTypes: ScaleType[];
  maxOctaves: number;
  availableRhythms: RhythmType[];

  // Actions
  handleGenerate: () => Promise<void>;
  handlePlay: () => Promise<void>;
  handlePause: () => void;
  handleStop: () => void;
  handleTempoChange: (bpm: number) => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useGeneratorMode(): UseGeneratorModeReturn {
  // Single reducer for all state
  const [state, dispatch] = useReducer(
    generatorModeReducer,
    initialGeneratorModeState,
  );

  // Destructure state for easier access
  const { parameters, randomize, pool, result, playback } = state;

  // ==========================================================================
  // Setters (dispatch wrappers for backward compatibility)
  // ==========================================================================

  const setGenerationType = useCallback((type: GenerationType) => {
    dispatch({ type: "SET_GENERATION_TYPE", payload: type });
  }, []);

  const setScaleType = useCallback((type: ScaleType) => {
    dispatch({ type: "SET_SCALE_TYPE", payload: type });
  }, []);

  const setArpeggioType = useCallback((type: ArpeggioType) => {
    dispatch({ type: "SET_ARPEGGIO_TYPE", payload: type });
  }, []);

  const setScalePattern = useCallback((pattern: ScalePattern) => {
    dispatch({ type: "SET_SCALE_PATTERN", payload: pattern });
  }, []);

  const setArpeggioPattern = useCallback((pattern: ArpeggioPattern) => {
    dispatch({ type: "SET_ARPEGGIO_PATTERN", payload: pattern });
  }, []);

  const setRhythmType = useCallback((type: RhythmType) => {
    dispatch({ type: "SET_RHYTHM_TYPE", payload: type });
  }, []);

  const setRootKey = useCallback((key: MusicalKey) => {
    dispatch({ type: "SET_ROOT_KEY", payload: key });
  }, []);

  const setStartOctave = useCallback((octave: number) => {
    dispatch({ type: "SET_START_OCTAVE", payload: octave });
  }, []);

  const setNumOctaves = useCallback((octaves: number) => {
    dispatch({ type: "SET_NUM_OCTAVES", payload: octaves });
  }, []);

  const setClef = useCallback((clef: ClefType) => {
    dispatch({ type: "SET_CLEF", payload: clef });
  }, []);

  const setTempo = useCallback((tempo: number) => {
    dispatch({ type: "SET_TEMPO", payload: tempo });
  }, []);

  const toggleRandomize = useCallback((field: keyof RandomizeState) => {
    dispatch({ type: "TOGGLE_RANDOMIZE", field });
  }, []);

  const setPoolModeEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_POOL_MODE_ENABLED", payload: enabled });
  }, []);

  const setScalePool = useCallback((poolItems: ScaleType[]) => {
    dispatch({ type: "SET_SCALE_POOL", payload: poolItems });
  }, []);

  const setArpeggioPool = useCallback((poolItems: ArpeggioType[]) => {
    dispatch({ type: "SET_ARPEGGIO_POOL", payload: poolItems });
  }, []);

  const setKeyPool = useCallback((poolItems: MusicalKey[]) => {
    dispatch({ type: "SET_KEY_POOL", payload: poolItems });
  }, []);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  // Computed: MusicXML from response
  const musicXml = useMemo(() => {
    if (
      !result.response?.events ||
      result.response.events.length === 0 ||
      !result.generationContext
    ) {
      return null;
    }
    return eventsToMusicXml(result.response.events, {
      title: result.generationContext.title,
      tempo: parameters.tempo,
      key: result.generationContext.key,
      clef: result.generationContext.clef,
      rhythm: result.generationContext.rhythm,
      mode: result.generationContext.mode,
    });
  }, [result.response, result.generationContext, parameters.tempo]);

  // Computed: Playback measure index for auto-scroll
  const playbackMeasureIndex = useMemo(() => {
    if (playback.currentNoteIndex === null || !result.response?.events) {
      return undefined;
    }
    return getMeasureIndexForNote(
      result.response.events,
      playback.currentNoteIndex,
      4,
    );
  }, [playback.currentNoteIndex, result.response]);

  // Computed: Available scale patterns based on selected scale type
  const availableScalePatterns = useMemo(() => {
    if (randomize.scaleType) return SCALE_PATTERNS;

    const isAsymmetric = ASYMMETRIC_SCALES.includes(parameters.scaleType);
    const scaleNoteCount = getScaleNoteCount(parameters.scaleType);

    return SCALE_PATTERNS.filter((pattern) => {
      const constraints = SCALE_PATTERN_CONSTRAINTS[pattern];
      if (!constraints) return true;
      if (
        constraints.minScaleNotes &&
        scaleNoteCount < constraints.minScaleNotes
      ) {
        return false;
      }
      if (constraints.requiresSymmetric && isAsymmetric) return false;
      if (constraints.blockedScaleTypes?.includes(parameters.scaleType))
        return false;
      if (
        constraints.onlyForScaleTypes &&
        !constraints.onlyForScaleTypes.includes(parameters.scaleType)
      ) {
        return false;
      }
      return true;
    });
  }, [parameters.scaleType, randomize.scaleType]);

  // Computed: Available scale types based on selected pattern
  const availableScaleTypes = useMemo(() => {
    if (randomize.scalePattern) return SCALE_TYPES;

    const constraints = SCALE_PATTERN_CONSTRAINTS[parameters.scalePattern];
    if (!constraints) return SCALE_TYPES;

    let filtered = SCALE_TYPES;

    if (constraints.onlyForScaleTypes) {
      filtered = filtered.filter((type) =>
        constraints.onlyForScaleTypes?.includes(type),
      );
    }
    if (constraints.minScaleNotes) {
      filtered = filtered.filter(
        (type) => getScaleNoteCount(type) >= (constraints.minScaleNotes ?? 0),
      );
    }
    if (constraints.requiresSymmetric) {
      filtered = filtered.filter((type) => !ASYMMETRIC_SCALES.includes(type));
    }

    return filtered;
  }, [parameters.scalePattern, randomize.scalePattern]);

  // Computed: Max octaves for current pattern
  const maxOctaves = useMemo(() => {
    if (randomize.scalePattern) return 3;

    const constraints = SCALE_PATTERN_CONSTRAINTS[parameters.scalePattern];
    if (
      parameters.scaleType === "chromatic" &&
      constraints?.chromaticMaxOctaves !== undefined
    ) {
      return constraints.chromaticMaxOctaves;
    }
    return constraints?.maxOctaves ?? 3;
  }, [parameters.scaleType, parameters.scalePattern, randomize.scalePattern]);

  // Computed: Available rhythms for current pattern
  const availableRhythms = useMemo(() => {
    if (parameters.generationType !== "scale") return RHYTHM_TYPES;
    return getAvailableRhythmsForPattern(parameters.scalePattern);
  }, [parameters.generationType, parameters.scalePattern]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      generationPlayback.stop();
    };
  }, []);

  // ==========================================================================
  // Action Handlers
  // ==========================================================================

  // Generate content handler
  const handleGenerate = useCallback(async () => {
    devLog("[GeneratorMode] Generating content...");
    dispatch({ type: "GENERATION_START" });
    generationPlayback.stop();

    try {
      const selectedType = parameters.generationType;

      // Resolve random selections based on checkbox state
      let selectedScaleType: ScaleType = randomize.scaleType
        ? pickRandom(availableScaleTypes)
        : parameters.scaleType;
      let selectedArpeggioType: ArpeggioType = randomize.arpeggioType
        ? pickRandom(ARPEGGIO_TYPES)
        : parameters.arpeggioType;
      let selectedKey: MusicalKey = randomize.rootKey
        ? pickRandom(ROOT_KEYS)
        : parameters.rootKey;
      let selectedScalePattern: ScalePattern = randomize.scalePattern
        ? pickRandom(availableScalePatterns)
        : parameters.scalePattern;
      const selectedArpeggioPattern: ArpeggioPattern = randomize.arpeggioPattern
        ? pickRandom(ARPEGGIO_PATTERNS)
        : parameters.arpeggioPattern;

      const patternRhythms =
        selectedType === "scale"
          ? getAvailableRhythmsForPattern(selectedScalePattern)
          : RHYTHM_TYPES;
      const selectedRhythm: RhythmType = randomize.rhythmType
        ? pickRandom(patternRhythms)
        : parameters.rhythmType;
      const selectedStartOctave: number = randomize.startOctave
        ? pickRandom([...OCTAVES])
        : parameters.startOctave;
      let selectedNumOctaves: number = randomize.numOctaves
        ? pickRandom([1, 2, 3].filter((n) => n <= maxOctaves))
        : parameters.numOctaves;
      const selectedClef: ClefType = randomize.clef
        ? pickRandom(CLEFS)
        : parameters.clef;

      // Pool mode overrides individual random selections
      if (pool.poolModeEnabled) {
        if (
          parameters.generationType === "scale" &&
          pool.scalePool.length > 0
        ) {
          const patternConstraints =
            SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
          let validPool = pool.scalePool;
          if (patternConstraints?.onlyForScaleTypes) {
            validPool = pool.scalePool.filter((type) =>
              patternConstraints.onlyForScaleTypes?.includes(type),
            );
          }
          if (patternConstraints?.blockedScaleTypes) {
            validPool = validPool.filter(
              (type) => !patternConstraints.blockedScaleTypes?.includes(type),
            );
          }
          if (patternConstraints?.requiresSymmetric) {
            validPool = validPool.filter(
              (type) => !ASYMMETRIC_SCALES.includes(type),
            );
          }
          if (validPool.length > 0) {
            selectedScaleType = pickRandom(validPool);
          } else if (pool.scalePool.length > 0) {
            selectedScalePattern = "straight_up_down";
            selectedScaleType = pickRandom(pool.scalePool);
          }
        }
        if (
          parameters.generationType === "arpeggio" &&
          pool.arpeggioPool.length > 0
        ) {
          selectedArpeggioType = pickRandom(pool.arpeggioPool);
        }
        if (pool.keyPool.length > 0) {
          selectedKey = pickRandom(pool.keyPool);
        }
      }

      // Validate scale/pattern combination
      const finalConstraints = SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
      if (finalConstraints?.onlyForScaleTypes) {
        if (!finalConstraints.onlyForScaleTypes.includes(selectedScaleType)) {
          selectedScalePattern = "straight_up_down";
        }
      }
      if (finalConstraints?.blockedScaleTypes?.includes(selectedScaleType)) {
        selectedScalePattern = "straight_up_down";
      }

      // Compute effective max octaves
      const selectedConstraints =
        SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
      let effectiveMaxOctaves = selectedConstraints?.maxOctaves ?? 3;
      if (
        selectedScaleType === "chromatic" &&
        selectedConstraints?.chromaticMaxOctaves !== undefined
      ) {
        effectiveMaxOctaves = selectedConstraints.chromaticMaxOctaves;
      }

      // Clamp octaves
      if (selectedNumOctaves > effectiveMaxOctaves) {
        selectedNumOctaves = effectiveMaxOctaves;
      }

      // Build batch parameter update based on random selections
      const parameterUpdates: Partial<typeof parameters> = {};
      if (randomize.scaleType) parameterUpdates.scaleType = selectedScaleType;
      if (randomize.arpeggioType)
        parameterUpdates.arpeggioType = selectedArpeggioType;
      if (randomize.rootKey) parameterUpdates.rootKey = selectedKey;
      if (
        randomize.scalePattern ||
        selectedScalePattern !== parameters.scalePattern
      ) {
        parameterUpdates.scalePattern = selectedScalePattern;
      }
      if (randomize.arpeggioPattern)
        parameterUpdates.arpeggioPattern = selectedArpeggioPattern;
      if (randomize.rhythmType) parameterUpdates.rhythmType = selectedRhythm;
      if (randomize.startOctave)
        parameterUpdates.startOctave = selectedStartOctave;
      if (randomize.numOctaves)
        parameterUpdates.numOctaves = selectedNumOctaves;
      if (randomize.clef) parameterUpdates.clef = selectedClef;

      // Dispatch batch update if any parameters changed
      if (Object.keys(parameterUpdates).length > 0) {
        dispatch({ type: "UPDATE_PARAMETERS", payload: parameterUpdates });
      }

      const definition =
        selectedType === "arpeggio" ? selectedArpeggioType : selectedScaleType;

      const pattern =
        selectedType === "arpeggio"
          ? selectedArpeggioPattern
          : selectedScalePattern;

      const request: Parameters<typeof generateContent>[0] = {
        content_type: selectedType,
        definition,
        octaves: selectedNumOctaves as 1 | 2 | 3,
        pattern,
        rhythm: selectedRhythm,
        key: selectedKey,
        range_low_midi: (selectedStartOctave + 1) * 12,
      };

      devLog("[GeneratorMode] Request:", request);

      const generatedResult = await generateContent(request);

      devLog("[GeneratorMode] Response:", generatedResult);

      if (generatedResult.events && generatedResult.events.length > 0) {
        const title = generateDisplayTitle(
          selectedType,
          definition,
          selectedKey,
          pattern,
        );

        const context: GenerationContext = {
          title,
          key: selectedKey,
          clef: selectedClef,
          rhythm: selectedRhythm,
          mode: selectedType === "scale" ? definition : undefined,
        };

        dispatch({
          type: "GENERATION_SUCCESS",
          payload: { response: generatedResult, context },
        });

        generationPlayback.load(generatedResult.events, {
          tempo: parameters.tempo,
          onStateChange: (newPlaybackState) =>
            dispatch({ type: "SET_PLAYBACK_STATE", payload: newPlaybackState }),
          onProgress: (noteIndex) =>
            dispatch({ type: "SET_CURRENT_NOTE_INDEX", payload: noteIndex }),
          onComplete: () => {
            dispatch({ type: "PLAYBACK_COMPLETE" });
            devLog("[GeneratorMode] Playback complete");
          },
        });
      } else {
        dispatch({
          type: "GENERATION_SUCCESS",
          payload: { response: generatedResult, context: null as never },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      devError("[GeneratorMode] Generation failed:", error);
      dispatch({ type: "GENERATION_ERROR", payload: message });
    }
  }, [
    parameters,
    pool,
    randomize,
    maxOctaves,
    availableScalePatterns,
    availableScaleTypes,
  ]);

  // Playback controls
  const handlePlay = useCallback(async () => {
    await generationPlayback.resume();
    await generationPlayback.play();
  }, []);

  const handlePause = useCallback(() => {
    generationPlayback.pause();
  }, []);

  const handleStop = useCallback(() => {
    generationPlayback.stop();
    dispatch({ type: "SET_CURRENT_NOTE_INDEX", payload: null });
  }, []);

  const handleTempoChange = useCallback((bpm: number) => {
    dispatch({ type: "SET_TEMPO", payload: bpm });
    generationPlayback.setTempo(bpm);
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    // Parameter state
    generationType: parameters.generationType,
    setGenerationType,
    scaleType: parameters.scaleType,
    setScaleType,
    arpeggioType: parameters.arpeggioType,
    setArpeggioType,
    scalePattern: parameters.scalePattern,
    setScalePattern,
    arpeggioPattern: parameters.arpeggioPattern,
    setArpeggioPattern,
    rhythmType: parameters.rhythmType,
    setRhythmType,
    rootKey: parameters.rootKey,
    setRootKey,
    startOctave: parameters.startOctave,
    setStartOctave,
    numOctaves: parameters.numOctaves,
    setNumOctaves,
    clef: parameters.clef,
    setClef,
    tempo: parameters.tempo,
    setTempo,

    // Randomization
    randomize,
    toggleRandomize,

    // Pool mode
    poolModeEnabled: pool.poolModeEnabled,
    setPoolModeEnabled,
    scalePool: pool.scalePool,
    setScalePool,
    arpeggioPool: pool.arpeggioPool,
    setArpeggioPool,
    keyPool: pool.keyPool,
    setKeyPool,

    // Generation state
    isGenerating: result.isGenerating,
    generationError: result.generationError,
    response: result.response,
    generationContext: result.generationContext,

    // Playback state
    playbackState: playback.playbackState,
    currentNoteIndex: playback.currentNoteIndex,

    // Computed
    musicXml,
    playbackMeasureIndex,
    availableScalePatterns,
    availableScaleTypes,
    maxOctaves,
    availableRhythms,

    // Actions
    handleGenerate,
    handlePlay,
    handlePause,
    handleStop,
    handleTempoChange,
  };
}
