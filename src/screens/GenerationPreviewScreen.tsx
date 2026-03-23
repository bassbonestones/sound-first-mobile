/**
 * GenerationPreviewScreen
 *
 * Dev tool for previewing the generation engine.
 * Allows parameter configuration, generation, playback, and notation display.
 */
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

import { devLog, devError } from "../utils/devLogger";
import colors from "../constants/colors";
import { ScoreViewport } from "../components/ScoreViewport";
import { TempoSlider } from "../components/TempoSlider";
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
} from "../api/generation";
import {
  generationPlayback,
  type PlaybackState,
} from "../services/generationPlayback";
import {
  eventsToMusicXml,
  generateDisplayTitle,
  getMeasureIndexForNote,
  type ClefType,
} from "../utils/generationNotation";

// =============================================================================
// Constants
// =============================================================================

/** Pick a random item from an array */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const GENERATION_TYPES: GenerationType[] = ["scale", "arpeggio", "lick"];

// Pattern constraints - patterns with limits on octaves or scale compatibility
interface PatternConstraints {
  maxOctaves?: number;
  chromaticMaxOctaves?: number; // Override maxOctaves specifically for chromatic scale
  requiresSymmetric?: boolean; // If true, incompatible with asymmetric scales
  blockedScaleTypes?: string[]; // Scale types that cannot use this pattern
  onlyForScaleTypes?: string[]; // If set, pattern only available for these scales
  chromaticDisplayName?: string; // Display name when applied to chromatic scale
}

// Scales with more than 7 notes per octave (can use extended patterns)
const EXTENDED_SCALES: ScaleType[] = [
  "chromatic", // 12 notes
  "diminished_hw", // 8 notes
  "diminished_wh", // 8 notes
  "bebop_dominant", // 8 notes
  "bebop_major", // 8 notes
  "bebop_dorian", // 8 notes
];

const SCALE_PATTERN_CONSTRAINTS: Record<string, PatternConstraints> = {
  // Interval patterns - show chromatic-specific names
  // _in_interval(n) pairs notes at (pos, pos+n-1), so skip = n-1 notes
  // In chromatic (12 notes/octave), skip N = N semitones
  in_3rds: { chromaticDisplayName: "Chromatic Major 2nds" }, // skip 2 = 2 semitones
  in_4ths: { chromaticDisplayName: "Chromatic minor 3rds" }, // skip 3 = 3 semitones
  in_5ths: { maxOctaves: 2, chromaticDisplayName: "Chromatic Major 3rds" }, // skip 4 = 4 semitones
  in_6ths: { maxOctaves: 2, chromaticDisplayName: "Chromatic Perfect 4ths" }, // skip 5 = 5 semitones
  in_7ths: { maxOctaves: 2, chromaticDisplayName: "Chromatic Tritones" }, // skip 6 = 6 semitones
  in_octaves: { chromaticDisplayName: "Chromatic Perfect 5ths" }, // skip 7 = 7 semitones
  // Extended intervals - only for chromatic scale (need 8+ notes/octave)
  in_9ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic minor 6ths",
  },
  in_10ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Major 6ths",
  },
  in_11ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic minor 7ths",
  },
  in_12ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Major 7ths",
  },
  in_13ths: {
    onlyForScaleTypes: ["chromatic"],
    chromaticDisplayName: "Chromatic Octaves",
  },
  // Large group patterns - chromatic needs fewer octaves due to note density
  groups_of_3: { chromaticMaxOctaves: 2 },
  groups_of_4: { chromaticMaxOctaves: 2 },
  groups_of_5: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  groups_of_6: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  groups_of_7: { maxOctaves: 2, chromaticMaxOctaves: 1 },
  // Extended groups - only for scales with 8+ notes
  groups_of_8: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: [
      "chromatic",
      "diminished_hw",
      "diminished_wh",
      "bebop_dominant",
      "bebop_major",
      "bebop_dorian",
    ],
  },
  groups_of_9: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_10: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_11: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  groups_of_12: {
    maxOctaves: 2,
    chromaticMaxOctaves: 1,
    onlyForScaleTypes: ["chromatic"],
  },
  // Diatonic chord patterns - don't make sense for chromatic/whole_tone
  diatonic_triads: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  diatonic_7ths: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  broken_chords: {
    maxOctaves: 2,
    blockedScaleTypes: ["chromatic", "whole_tone"],
  },
  // Special patterns
  broken_thirds_neighbor: {
    maxOctaves: 1,
    requiresSymmetric: true,
    blockedScaleTypes: ["chromatic"],
  },
  // Pyramid patterns grow quadratically (~n² notes)
  pyramid_ascend: { maxOctaves: 1 },
  pyramid_descend: { maxOctaves: 1 },
};

// Asymmetric scales (different pitches ascending vs descending)
const ASYMMETRIC_SCALES: ScaleType[] = ["melodic_minor_classical"];

const SCALE_TYPES: ScaleType[] = [
  // Major modes
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  // Pentatonic & Blues
  "pentatonic_major",
  "pentatonic_minor",
  "blues",
  "blues_major",
  // Harmonic minor modes
  "harmonic_minor",
  "phrygian_dominant",
  "lydian_sharp2",
  // Melodic minor modes
  "melodic_minor",
  "melodic_minor_classical",
  "lydian_augmented",
  "lydian_dominant",
  "mixolydian_flat6",
  "altered",
  // Harmonic major
  "harmonic_major",
  // Symmetric
  "whole_tone",
  "diminished_hw",
  "diminished_wh",
  "chromatic",
  // Bebop
  "bebop_dominant",
  "bebop_major",
  "bebop_dorian",
];

/** Format scale type for display, adding common name aliases */
function formatScaleLabel(scaleType: ScaleType): string {
  const labels: Partial<Record<ScaleType, string>> = {
    ionian: "Ionian (Major)",
    aeolian: "Aeolian (Natural Minor)",
    melodic_minor: "Minor-Major",
    melodic_minor_classical: "Melodic Minor (Classical)",
    harmonic_major: "Harmonic Major (b6)",
    mixolydian_flat6: "Major-Minor (b6 b7)",
    blues_major: "Blues Major",
    phrygian_dominant: "Phrygian Dominant (Spanish)",
    lydian_dominant: "Lydian Dominant",
    lydian_augmented: "Lydian Augmented",
    altered: "Altered (Super Locrian)",
    diminished_hw: "Diminished (Half-Whole)",
    diminished_wh: "Diminished (Whole-Half)",
    bebop_dominant: "Bebop Dominant",
    bebop_major: "Bebop Major",
    bebop_dorian: "Bebop Dorian",
    lydian_sharp2: "Lydian #2",
  };
  return (
    labels[scaleType] ??
    scaleType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

const ARPEGGIO_TYPES: ArpeggioType[] = [
  // Triads
  "major",
  "minor",
  "augmented",
  "diminished",
  "sus4",
  "sus2",
  // 7th chords
  "maj7",
  "dom7",
  "min7",
  "min_maj7",
  "half_dim7",
  "dim7",
  "aug_maj7",
  "aug7",
  "dom7sus4",
  // Extended
  "maj9",
  "dom9",
  "min9",
];

/** Format arpeggio type for display */
function formatArpeggioLabel(arpeggioType: ArpeggioType): string {
  const labels: Partial<Record<ArpeggioType, string>> = {
    maj7: "Major 7",
    dom7: "Dominant 7",
    min7: "Minor 7",
    min_maj7: "Minor-Major 7",
    half_dim7: "Half-Diminished 7",
    dim7: "Diminished 7",
    aug_maj7: "Augmented Major 7",
    aug7: "Augmented 7",
    dom7sus4: "Dominant 7 sus4",
    maj9: "Major 9",
    dom9: "Dominant 9",
    min9: "Minor 9",
    sus4: "Suspended 4th",
    sus2: "Suspended 2nd",
  };
  return (
    labels[arpeggioType] ??
    arpeggioType.charAt(0).toUpperCase() + arpeggioType.slice(1)
  );
}

const SCALE_PATTERNS: ScalePattern[] = [
  // Basic
  "straight_up",
  "straight_down",
  "straight_up_down",
  "straight_down_up",
  // Pyramid
  "pyramid_ascend",
  "pyramid_descend",
  // Intervals
  "in_3rds",
  "in_4ths",
  "in_5ths",
  "in_6ths",
  "in_7ths",
  "in_octaves",
  "in_9ths",
  "in_10ths",
  "in_11ths",
  "in_12ths",
  "in_13ths",
  // Groups
  "groups_of_3",
  "groups_of_4",
  "groups_of_5",
  "groups_of_6",
  "groups_of_7",
  "groups_of_8",
  "groups_of_9",
  "groups_of_10",
  "groups_of_11",
  "groups_of_12",
  // Weaving
  "broken_thirds_neighbor",
  // Arpeggio-based
  "diatonic_triads",
  "diatonic_7ths",
  "broken_chords",
];

/** Format scale pattern for display, using chromatic-specific names when applicable */
function formatScalePatternLabel(
  pattern: ScalePattern,
  scaleType?: ScaleType,
): string {
  // Check for chromatic-specific display name
  if (scaleType === "chromatic") {
    const constraints = SCALE_PATTERN_CONSTRAINTS[pattern];
    if (constraints?.chromaticDisplayName) {
      return constraints.chromaticDisplayName;
    }
  }

  const labels: Partial<Record<ScalePattern, string>> = {
    straight_up: "Straight Up",
    straight_down: "Straight Down",
    straight_up_down: "Up & Down",
    straight_down_up: "Down & Up",
    pyramid_ascend: "Pyramid Ascend",
    pyramid_descend: "Pyramid Descend",
    in_3rds: "In 3rds",
    in_4ths: "In 4ths",
    in_5ths: "In 5ths",
    in_6ths: "In 6ths",
    in_7ths: "In 7ths",
    in_octaves: "In Octaves",
    in_9ths: "In 9ths",
    in_10ths: "In 10ths",
    in_11ths: "In 11ths",
    in_12ths: "In 12ths",
    in_13ths: "In 13ths",
    groups_of_3: "Groups of 3",
    groups_of_4: "Groups of 4",
    groups_of_5: "Groups of 5",
    groups_of_6: "Groups of 6",
    groups_of_7: "Groups of 7",
    groups_of_8: "Groups of 8",
    groups_of_9: "Groups of 9",
    groups_of_10: "Groups of 10",
    groups_of_11: "Groups of 11",
    groups_of_12: "Groups of 12",
    broken_thirds_neighbor: "Broken 3rds w/ Neighbor",
    diatonic_triads: "Diatonic Triads",
    diatonic_7ths: "Diatonic 7ths",
    broken_chords: "Broken Chords",
  };
  return labels[pattern] ?? pattern.replace(/_/g, " ");
}

const ARPEGGIO_PATTERNS: ArpeggioPattern[] = [
  "straight_up",
  "straight_down",
  "straight_up_down",
  "weaving_ascend",
  "weaving_descend",
  "broken_skip_1",
  "inversion_root",
  "inversion_1st",
  "inversion_2nd",
  "inversion_3rd",
  "rolling_alberti",
  "spread_voicings",
  "approach_notes",
  "enclosures",
];

/** Format arpeggio pattern for display */
function formatArpeggioPatternLabel(pattern: ArpeggioPattern): string {
  const labels: Partial<Record<ArpeggioPattern, string>> = {
    straight_up: "Straight Up",
    straight_down: "Straight Down",
    straight_up_down: "Up & Down",
    weaving_ascend: "Weaving Ascend",
    weaving_descend: "Weaving Descend",
    broken_skip_1: "Broken (Skip 1)",
    inversion_root: "Root Position",
    inversion_1st: "1st Inversion",
    inversion_2nd: "2nd Inversion",
    inversion_3rd: "3rd Inversion",
    rolling_alberti: "Alberti Bass",
    spread_voicings: "Spread Voicings",
    approach_notes: "Approach Notes",
    enclosures: "Enclosures",
    diatonic_sequence: "Diatonic Sequence",
    circle_4ths: "Circle of 4ths",
    circle_5ths: "Circle of 5ths",
  };
  return labels[pattern] ?? pattern.replace(/_/g, " ");
}

const RHYTHM_TYPES: RhythmType[] = [
  // Sustained
  "whole_notes",
  "half_notes",
  // Pulse
  "quarter_notes",
  // Subdivisions
  "eighth_notes",
  "sixteenth_notes",
  // Triplets
  "eighth_triplets",
  // Swing
  "swing_eighths",
  "scotch_snap",
  // Dotted
  "dotted_quarter_eighth",
  "dotted_eighth_sixteenth",
  // Compound
  "sixteenth_eighth_sixteenth",
  "eighth_sixteenth_sixteenth",
  "sixteenth_sixteenth_eighth",
  "syncopated",
];

/** Display labels for rhythm types */
const RHYTHM_DISPLAY_LABELS: Record<RhythmType, string> = {
  quarter_notes: "Quarter Notes",
  eighth_notes: "Eighth Notes",
  eighth_triplets: "Eighth Triplets",
  swing_eighths: "Swung Eighths",
  whole_notes: "Whole Notes",
  half_notes: "Half Notes",
  sixteenth_notes: "Sixteenth Notes",
  scotch_snap: "Scotch Snap",
  dotted_quarter_eighth: "Dotted Quarter-Eighth",
  dotted_eighth_sixteenth: "Dotted Eighth-Sixteenth",
  sixteenth_eighth_sixteenth: "16th-8th-16th",
  eighth_sixteenth_sixteenth: "8th-16th-16th",
  sixteenth_sixteenth_eighth: "16th-16th-8th",
  syncopated: "Syncopated",
};

// =============================================================================
// Rhythm-Pattern Compatibility
// =============================================================================
// Slow rhythms (whole notes, half notes) are only allowed with simple patterns

/** Patterns that allow WHOLE_NOTES rhythm */
const WHOLE_NOTE_PATTERNS: Set<ScalePattern> = new Set([
  "straight_up",
  "straight_down",
]);

/** Patterns that allow HALF_NOTES rhythm */
const HALF_NOTE_PATTERNS: Set<ScalePattern> = new Set([
  "straight_up",
  "straight_down",
  "straight_up_down",
  "straight_down_up",
]);

/**
 * Get available rhythm types for a given pattern.
 * Whole/half notes are only available for simple patterns.
 */
function getAvailableRhythmsForPattern(
  pattern: ScalePattern | null,
): RhythmType[] {
  return RHYTHM_TYPES.filter((rhythm) => {
    // If no pattern, allow all rhythms
    if (!pattern) return true;
    // Check whole note compatibility
    if (rhythm === "whole_notes" && !WHOLE_NOTE_PATTERNS.has(pattern)) {
      return false;
    }
    // Check half note compatibility
    if (rhythm === "half_notes" && !HALF_NOTE_PATTERNS.has(pattern)) {
      return false;
    }
    return true;
  });
}

const ROOT_KEYS: MusicalKey[] = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const OCTAVES = [1, 2, 3, 4, 5, 6, 7];

const CLEFS: ClefType[] = ["treble", "bass"];

// =============================================================================
// Component
// =============================================================================

export default function GenerationPreviewScreen() {
  const navigation = useNavigation();

  // Parameter state
  const [generationType, setGenerationType] = useState<GenerationType>("scale");
  const [scaleType, setScaleType] = useState<ScaleType>("ionian");
  const [arpeggioType, setArpeggioType] = useState<ArpeggioType>("major");
  const [scalePattern, setScalePattern] =
    useState<ScalePattern>("straight_up_down");
  const [arpeggioPattern, setArpeggioPattern] =
    useState<ArpeggioPattern>("straight_up_down");
  const [rhythmType, setRhythmType] = useState<RhythmType>("quarter_notes");
  const [rootKey, setRootKey] = useState<MusicalKey>("C");
  const [startOctave, setStartOctave] = useState<number>(4);
  const [numOctaves, setNumOctaves] = useState<number>(1);
  const [clef, setClef] = useState<ClefType>("treble");
  const [tempo, setTempo] = useState(120);

  // Random toggle checkboxes - when checked, field randomizes on each generate
  const [randomize, setRandomize] = useState({
    scaleType: false,
    arpeggioType: false,
    scalePattern: false,
    arpeggioPattern: false,
    rhythmType: false,
    rootKey: false,
    startOctave: false,
    numOctaves: false,
    clef: false,
  });

  // Helper to toggle a randomize field
  const toggleRandomize = (field: keyof typeof randomize) => {
    setRandomize((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Pool selection mode
  const [poolModeEnabled, setPoolModeEnabled] = useState(false);
  const [scalePool, setScalePool] = useState<ScaleType[]>(["ionian", "dorian"]);
  const [arpeggioPool, setArpeggioPool] = useState<ArpeggioType[]>([
    "major",
    "minor",
  ]);
  const [keyPool, setKeyPool] = useState<MusicalKey[]>(["C", "G", "F"]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [response, setResponse] = useState<GenerationResponse | null>(null);
  // Store generation context for MusicXML generation
  const [generationContext, setGenerationContext] = useState<{
    title: string;
    key: MusicalKey;
    clef: ClefType;
    rhythm: RhythmType;
    mode?: string;
  } | null>(null);

  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const isPlaybackInitialized = useRef(false);

  // Compute MusicXML (only changes when content changes, not playback position)
  const musicXml = useMemo(() => {
    if (
      !response?.events ||
      response.events.length === 0 ||
      !generationContext
    ) {
      return null;
    }
    return eventsToMusicXml(response.events, {
      title: generationContext.title,
      tempo,
      key: generationContext.key,
      clef: generationContext.clef,
      rhythm: generationContext.rhythm,
      mode: generationContext.mode,
    });
  }, [response, generationContext, tempo]);

  // Compute playback measure index for auto-scroll
  const playbackMeasureIndex = useMemo(() => {
    if (currentNoteIndex === null || !response?.events) {
      return undefined;
    }
    return getMeasureIndexForNote(response.events, currentNoteIndex, 4);
  }, [currentNoteIndex, response]);

  // Filter scale patterns based on selected scale type
  const availableScalePatterns = useMemo(() => {
    // When randomizing scale type, allow all patterns
    if (randomize.scaleType) return SCALE_PATTERNS;
    const isAsymmetric = ASYMMETRIC_SCALES.includes(scaleType);
    return SCALE_PATTERNS.filter((pattern) => {
      const constraints = SCALE_PATTERN_CONSTRAINTS[pattern];
      if (!constraints) return true;
      // Exclude patterns that require symmetric scales when an asymmetric scale is selected
      if (constraints.requiresSymmetric && isAsymmetric) return false;
      // Exclude patterns blocked for this scale type
      if (constraints.blockedScaleTypes?.includes(scaleType)) return false;
      // Exclude patterns that are only for specific scale types
      if (
        constraints.onlyForScaleTypes &&
        !constraints.onlyForScaleTypes.includes(scaleType)
      )
        return false;
      return true;
    });
  }, [scaleType, randomize.scaleType]);

  // Filter scales based on selected pattern
  const availableScaleTypes = useMemo(() => {
    if (randomize.scalePattern) return SCALE_TYPES;
    const constraints = SCALE_PATTERN_CONSTRAINTS[scalePattern];
    if (!constraints) return SCALE_TYPES;

    let filtered = SCALE_TYPES;

    // If pattern only works for specific scales, limit to those
    if (constraints.onlyForScaleTypes) {
      filtered = filtered.filter((type) =>
        constraints.onlyForScaleTypes!.includes(type),
      );
    }

    // Exclude asymmetric scales when pattern requires symmetric
    if (constraints.requiresSymmetric) {
      filtered = filtered.filter((type) => !ASYMMETRIC_SCALES.includes(type));
    }

    return filtered;
  }, [scalePattern, randomize.scalePattern]);

  // Get max octaves for current pattern (use chromaticMaxOctaves if chromatic)
  const maxOctaves = useMemo(() => {
    if (randomize.scalePattern) return 3;
    const constraints = SCALE_PATTERN_CONSTRAINTS[scalePattern];
    if (
      scaleType === "chromatic" &&
      constraints?.chromaticMaxOctaves !== undefined
    ) {
      return constraints.chromaticMaxOctaves;
    }
    return constraints?.maxOctaves ?? 3;
  }, [scalePattern, scaleType, randomize.scalePattern]);

  // Reset scale pattern if it becomes unavailable due to scale selection
  useEffect(() => {
    if (
      !randomize.scalePattern &&
      !availableScalePatterns.includes(scalePattern)
    ) {
      setScalePattern("straight_up_down");
    }
  }, [availableScalePatterns, scalePattern, randomize.scalePattern]);

  // Reset scale type if it becomes unavailable due to pattern selection
  useEffect(() => {
    if (!randomize.scaleType && !availableScaleTypes.includes(scaleType)) {
      setScaleType("ionian");
    }
  }, [availableScaleTypes, scaleType, randomize.scaleType]);

  // Clamp numOctaves if it exceeds max for current pattern
  useEffect(() => {
    if (!randomize.numOctaves && numOctaves > maxOctaves) {
      setNumOctaves(maxOctaves);
    }
  }, [maxOctaves, numOctaves, randomize.numOctaves]);

  // Reset rhythm if it becomes unavailable due to pattern selection
  // (whole/half notes only allowed for simple patterns)
  useEffect(() => {
    if (!randomize.rhythmType && generationType === "scale") {
      const availableRhythms = getAvailableRhythmsForPattern(scalePattern);
      if (!availableRhythms.includes(rhythmType)) {
        setRhythmType("quarter_notes");
      }
    }
  }, [scalePattern, rhythmType, generationType, randomize.rhythmType]);

  // Initialize playback service
  useEffect(() => {
    const initPlayback = async () => {
      if (!isPlaybackInitialized.current) {
        await generationPlayback.init();
        isPlaybackInitialized.current = true;
      }
    };
    initPlayback();

    return () => {
      generationPlayback.stop();
    };
  }, []);

  // Generate content handler
  const handleGenerate = useCallback(async () => {
    devLog("[GenerationPreview] Generating content...");
    setIsGenerating(true);
    setGenerationError(null);
    generationPlayback.stop();

    try {
      // Build request based on type
      const selectedType = generationType;

      // Resolve random selections based on checkbox state
      let selectedScaleType: ScaleType = randomize.scaleType
        ? pickRandom(availableScaleTypes)
        : scaleType;
      let selectedArpeggioType: ArpeggioType = randomize.arpeggioType
        ? pickRandom(ARPEGGIO_TYPES)
        : arpeggioType;
      let selectedKey: MusicalKey = randomize.rootKey
        ? pickRandom(ROOT_KEYS)
        : rootKey;
      let selectedScalePattern: ScalePattern = randomize.scalePattern
        ? pickRandom(availableScalePatterns)
        : scalePattern;
      let selectedArpeggioPattern: ArpeggioPattern = randomize.arpeggioPattern
        ? pickRandom(ARPEGGIO_PATTERNS)
        : arpeggioPattern;
      // Get available rhythms for the selected pattern (scales only)
      const availableRhythms =
        selectedType === "scale"
          ? getAvailableRhythmsForPattern(selectedScalePattern)
          : RHYTHM_TYPES;
      let selectedRhythm: RhythmType = randomize.rhythmType
        ? pickRandom(availableRhythms)
        : rhythmType;
      let selectedStartOctave: number = randomize.startOctave
        ? pickRandom(OCTAVES)
        : startOctave;
      let selectedNumOctaves: number = randomize.numOctaves
        ? pickRandom([1, 2, 3].filter((n) => n <= maxOctaves))
        : numOctaves;
      let selectedClef: ClefType = randomize.clef ? pickRandom(CLEFS) : clef;

      // Pool mode overrides individual random selections
      if (poolModeEnabled) {
        if (generationType === "scale" && scalePool.length > 0) {
          // Filter pool to respect pattern constraints
          const patternConstraints =
            SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
          let validPool = scalePool;
          if (patternConstraints?.onlyForScaleTypes) {
            validPool = scalePool.filter((type) =>
              patternConstraints.onlyForScaleTypes!.includes(type),
            );
          }
          if (patternConstraints?.blockedScaleTypes) {
            validPool = validPool.filter(
              (type) => !patternConstraints.blockedScaleTypes!.includes(type),
            );
          }
          if (patternConstraints?.requiresSymmetric) {
            validPool = validPool.filter(
              (type) => !ASYMMETRIC_SCALES.includes(type),
            );
          }
          // If no valid options in pool, fall back to full pool or default
          if (validPool.length > 0) {
            selectedScaleType = pickRandom(validPool);
          } else if (scalePool.length > 0) {
            // Pool has items but none are valid for pattern - use straight_up_down
            selectedScalePattern = "straight_up_down";
            selectedScaleType = pickRandom(scalePool);
          }
        }
        if (generationType === "arpeggio" && arpeggioPool.length > 0) {
          selectedArpeggioType = pickRandom(arpeggioPool);
        }
        if (keyPool.length > 0) {
          selectedKey = pickRandom(keyPool);
        }
      }

      // Validate scale/pattern combination after all selections
      // (handles cases where non-pool random picked invalid combo)
      const finalConstraints = SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
      if (finalConstraints?.onlyForScaleTypes) {
        if (!finalConstraints.onlyForScaleTypes.includes(selectedScaleType)) {
          // Invalid combo - reset pattern to straight_up_down
          selectedScalePattern = "straight_up_down";
        }
      }
      if (finalConstraints?.blockedScaleTypes?.includes(selectedScaleType)) {
        selectedScalePattern = "straight_up_down";
      }

      // Compute effective max octaves based on final selected values
      const selectedConstraints =
        SCALE_PATTERN_CONSTRAINTS[selectedScalePattern];
      let effectiveMaxOctaves = selectedConstraints?.maxOctaves ?? 3;
      if (
        selectedScaleType === "chromatic" &&
        selectedConstraints?.chromaticMaxOctaves !== undefined
      ) {
        effectiveMaxOctaves = selectedConstraints.chromaticMaxOctaves;
      }

      // Clamp octaves to effective max for selected pattern/scale combo
      if (selectedNumOctaves > effectiveMaxOctaves) {
        selectedNumOctaves = effectiveMaxOctaves;
      }

      // Update dropdowns to show what was randomly selected
      // Also update pattern if it was changed due to constraint validation
      if (randomize.scaleType) setScaleType(selectedScaleType);
      if (randomize.arpeggioType) setArpeggioType(selectedArpeggioType);
      if (randomize.rootKey) setRootKey(selectedKey);
      if (randomize.scalePattern || selectedScalePattern !== scalePattern)
        setScalePattern(selectedScalePattern);
      if (randomize.arpeggioPattern)
        setArpeggioPattern(selectedArpeggioPattern);
      if (randomize.rhythmType) setRhythmType(selectedRhythm);
      if (randomize.startOctave) setStartOctave(selectedStartOctave);
      if (randomize.numOctaves) setNumOctaves(selectedNumOctaves);
      if (randomize.clef) setClef(selectedClef);

      // Determine definition (scale type or arpeggio type)
      const definition =
        selectedType === "arpeggio" ? selectedArpeggioType : selectedScaleType;

      // Determine pattern
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
        // Convert start octave to MIDI note: C4 = 60, so CX = (X+1)*12
        range_low_midi: (selectedStartOctave + 1) * 12,
      };

      devLog("[GenerationPreview] Request:", request);

      const result = await generateContent(request);

      devLog("[GenerationPreview] Response:", result);
      setResponse(result);

      // Convert to MusicXML for display
      if (result.events && result.events.length > 0) {
        const title = generateDisplayTitle(
          selectedType,
          definition,
          selectedKey,
          pattern,
        );

        // Store context for reactive MusicXML generation
        setGenerationContext({
          title,
          key: selectedKey,
          clef: selectedClef,
          rhythm: selectedRhythm,
          mode: selectedType === "scale" ? definition : undefined,
        });

        // Load into playback service
        generationPlayback.load(result.events, {
          tempo,
          onStateChange: setPlaybackState,
          onProgress: setCurrentNoteIndex,
          onComplete: () => {
            setCurrentNoteIndex(null);
            devLog("[GenerationPreview] Playback complete");
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      devError("[GenerationPreview] Generation failed:", error);
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    generationType,
    scaleType,
    arpeggioType,
    scalePattern,
    arpeggioPattern,
    rhythmType,
    rootKey,
    numOctaves,
    startOctave,
    clef,
    tempo,
    poolModeEnabled,
    scalePool,
    arpeggioPool,
    keyPool,
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
    setCurrentNoteIndex(null);
  }, []);

  // Tempo control - updates state and playback service
  const handleTempoChange = useCallback((bpm: number) => {
    setTempo(bpm);
    generationPlayback.setTempo(bpm);
  }, []);

  // Toggle pool item
  const togglePoolItem = <T extends string>(
    pool: T[],
    setPool: React.Dispatch<React.SetStateAction<T[]>>,
    item: T,
  ) => {
    if (pool.includes(item)) {
      setPool(pool.filter((p) => p !== item));
    } else {
      setPool([...pool, item]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generation Preview</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Generation Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Content Type</Text>
          <View style={styles.buttonRow}>
            {GENERATION_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  generationType === type && styles.typeButtonSelected,
                ]}
                onPress={() => setGenerationType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    generationType === type && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Scale/Arpeggio Type */}
        {generationType === "scale" || generationType === "lick" ? (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <TouchableOpacity
                style={styles.randomCheckbox}
                onPress={() => toggleRandomize("scaleType")}
              >
                <Text style={styles.checkboxText}>
                  {randomize.scaleType ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}>Scale Type</Text>
              {randomize.scaleType && (
                <Text style={styles.randomBadge}>🎲</Text>
              )}
            </View>
            <View
              style={[
                styles.pickerContainer,
                randomize.scaleType && styles.pickerDisabled,
              ]}
            >
              <Picker
                selectedValue={scaleType}
                onValueChange={(value) => setScaleType(value as ScaleType)}
                style={styles.picker}
                enabled={!randomize.scaleType}
              >
                {availableScaleTypes.map((type) => (
                  <Picker.Item
                    key={type}
                    label={formatScaleLabel(type)}
                    value={type}
                  />
                ))}
              </Picker>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <TouchableOpacity
                style={styles.randomCheckbox}
                onPress={() => toggleRandomize("arpeggioType")}
              >
                <Text style={styles.checkboxText}>
                  {randomize.arpeggioType ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}>Arpeggio Type</Text>
              {randomize.arpeggioType && (
                <Text style={styles.randomBadge}>🎲</Text>
              )}
            </View>
            <View
              style={[
                styles.pickerContainer,
                randomize.arpeggioType && styles.pickerDisabled,
              ]}
            >
              <Picker
                selectedValue={arpeggioType}
                onValueChange={(value) =>
                  setArpeggioType(value as ArpeggioType)
                }
                style={styles.picker}
                enabled={!randomize.arpeggioType}
              >
                {ARPEGGIO_TYPES.map((type) => (
                  <Picker.Item
                    key={type}
                    label={formatArpeggioLabel(type)}
                    value={type}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Pattern */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <TouchableOpacity
              style={styles.randomCheckbox}
              onPress={() =>
                toggleRandomize(
                  generationType === "scale"
                    ? "scalePattern"
                    : "arpeggioPattern",
                )
              }
            >
              <Text style={styles.checkboxText}>
                {(
                  generationType === "scale"
                    ? randomize.scalePattern
                    : randomize.arpeggioPattern
                )
                  ? "☑"
                  : "☐"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Pattern</Text>
            {(generationType === "scale"
              ? randomize.scalePattern
              : randomize.arpeggioPattern) && (
              <Text style={styles.randomBadge}>🎲</Text>
            )}
          </View>
          <View
            style={[
              styles.pickerContainer,
              (generationType === "scale"
                ? randomize.scalePattern
                : randomize.arpeggioPattern) && styles.pickerDisabled,
            ]}
          >
            {generationType === "scale" ? (
              <Picker
                selectedValue={scalePattern}
                onValueChange={(value) =>
                  setScalePattern(value as ScalePattern)
                }
                style={styles.picker}
                enabled={!randomize.scalePattern}
              >
                {availableScalePatterns.map((pattern) => (
                  <Picker.Item
                    key={pattern}
                    label={formatScalePatternLabel(pattern, scaleType)}
                    value={pattern}
                  />
                ))}
              </Picker>
            ) : (
              <Picker
                selectedValue={arpeggioPattern}
                onValueChange={(value) =>
                  setArpeggioPattern(value as ArpeggioPattern)
                }
                style={styles.picker}
                enabled={!randomize.arpeggioPattern}
              >
                {ARPEGGIO_PATTERNS.map((pattern) => (
                  <Picker.Item
                    key={pattern}
                    label={formatArpeggioPatternLabel(pattern)}
                    value={pattern}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>

        {/* Rhythm Type */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <TouchableOpacity
              style={styles.randomCheckbox}
              onPress={() => toggleRandomize("rhythmType")}
            >
              <Text style={styles.checkboxText}>
                {randomize.rhythmType ? "☑" : "☐"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Rhythm</Text>
            {randomize.rhythmType && <Text style={styles.randomBadge}>🎲</Text>}
          </View>
          <View
            style={[
              styles.pickerContainer,
              randomize.rhythmType && styles.pickerDisabled,
            ]}
          >
            <Picker
              selectedValue={rhythmType}
              onValueChange={(value) => setRhythmType(value as RhythmType)}
              style={styles.picker}
              enabled={!randomize.rhythmType}
            >
              {getAvailableRhythmsForPattern(
                generationType === "scale" ? scalePattern : null,
              ).map((r) => (
                <Picker.Item
                  key={r}
                  label={RHYTHM_DISPLAY_LABELS[r] ?? r.replace(/_/g, " ")}
                  value={r}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Key */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <TouchableOpacity
              style={styles.randomCheckbox}
              onPress={() => toggleRandomize("rootKey")}
            >
              <Text style={styles.checkboxText}>
                {randomize.rootKey ? "☑" : "☐"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Root Key</Text>
            {randomize.rootKey && <Text style={styles.randomBadge}>🎲</Text>}
          </View>
          <View
            style={[
              styles.pickerContainer,
              randomize.rootKey && styles.pickerDisabled,
            ]}
          >
            <Picker
              selectedValue={rootKey}
              onValueChange={(value) => setRootKey(value as MusicalKey)}
              style={styles.picker}
              enabled={!randomize.rootKey}
            >
              {ROOT_KEYS.map((key) => (
                <Picker.Item key={key} label={key} value={key} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Octave and Range */}
        <View style={styles.rowSection}>
          <View style={styles.halfSection}>
            <View style={styles.labelRow}>
              <TouchableOpacity
                style={styles.randomCheckbox}
                onPress={() => toggleRandomize("startOctave")}
              >
                <Text style={styles.checkboxText}>
                  {randomize.startOctave ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}>Start Oct</Text>
              {randomize.startOctave && (
                <Text style={styles.randomBadge}>🎲</Text>
              )}
            </View>
            <View
              style={[
                styles.pickerContainer,
                randomize.startOctave && styles.pickerDisabled,
              ]}
            >
              <Picker
                selectedValue={startOctave}
                onValueChange={(value) => setStartOctave(Number(value))}
                style={styles.picker}
                enabled={!randomize.startOctave}
              >
                {OCTAVES.map((oct) => (
                  <Picker.Item key={oct} label={String(oct)} value={oct} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.halfSection}>
            <View style={styles.labelRow}>
              <TouchableOpacity
                style={styles.randomCheckbox}
                onPress={() => toggleRandomize("numOctaves")}
              >
                <Text style={styles.checkboxText}>
                  {randomize.numOctaves ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionLabel}># Octs</Text>
              {randomize.numOctaves && (
                <Text style={styles.randomBadge}>🎲</Text>
              )}
            </View>
            <View
              style={[
                styles.pickerContainer,
                randomize.numOctaves && styles.pickerDisabled,
              ]}
            >
              <Picker
                selectedValue={numOctaves}
                onValueChange={(value) =>
                  setNumOctaves(Number(value) as 1 | 2 | 3)
                }
                style={styles.picker}
                enabled={!randomize.numOctaves}
              >
                {[1, 2, 3]
                  .filter((n) => n <= maxOctaves)
                  .map((n) => (
                    <Picker.Item key={n} label={String(n)} value={n} />
                  ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Clef Selection */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <TouchableOpacity
              style={styles.randomCheckbox}
              onPress={() => toggleRandomize("clef")}
            >
              <Text style={styles.checkboxText}>
                {randomize.clef ? "☑" : "☐"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionLabel}>Clef</Text>
            {randomize.clef && <Text style={styles.randomBadge}>🎲</Text>}
          </View>
          <View
            style={[
              styles.pickerContainer,
              randomize.clef && styles.pickerDisabled,
            ]}
          >
            <Picker
              selectedValue={clef}
              onValueChange={(value) => setClef(value as ClefType)}
              style={styles.picker}
              enabled={!randomize.clef}
            >
              {CLEFS.map((c) => (
                <Picker.Item
                  key={c}
                  label={c.charAt(0).toUpperCase() + c.slice(1)}
                  value={c}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Pool Mode Toggle */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.poolToggle,
              poolModeEnabled && styles.poolToggleEnabled,
            ]}
            onPress={() => setPoolModeEnabled(!poolModeEnabled)}
          >
            <Text style={styles.poolToggleText}>
              {poolModeEnabled ? "🎲 Pool Mode ON" : "Pool Mode OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pool Selection (when enabled) */}
        {poolModeEnabled && (
          <View style={styles.poolSection}>
            <Text style={styles.poolTitle}>Random Selection Pools</Text>

            <Text style={styles.poolSubtitle}>Keys:</Text>
            <View style={styles.poolChipContainer}>
              {ROOT_KEYS.slice(0, 12).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.poolChip,
                    keyPool.includes(key) && styles.poolChipSelected,
                  ]}
                  onPress={() => togglePoolItem(keyPool, setKeyPool, key)}
                >
                  <Text style={styles.poolChipText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {generationType === "scale" && (
              <>
                <Text style={styles.poolSubtitle}>Scales:</Text>
                <View style={styles.poolChipContainer}>
                  {SCALE_TYPES.slice(0, 8).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.poolChip,
                        scalePool.includes(type) && styles.poolChipSelected,
                      ]}
                      onPress={() =>
                        togglePoolItem(scalePool, setScalePool, type)
                      }
                    >
                      <Text style={styles.poolChipText}>
                        {type.replace(/_/g, " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {generationType === "arpeggio" && (
              <>
                <Text style={styles.poolSubtitle}>Arpeggios:</Text>
                <View style={styles.poolChipContainer}>
                  {ARPEGGIO_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.poolChip,
                        arpeggioPool.includes(type) && styles.poolChipSelected,
                      ]}
                      onPress={() =>
                        togglePoolItem(arpeggioPool, setArpeggioPool, type)
                      }
                    >
                      <Text style={styles.poolChipText}>
                        {formatArpeggioLabel(type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Generate Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>
                {poolModeEnabled ? "🎲 Randomize & Generate" : "Generate"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {generationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generationError}</Text>
          </View>
        )}

        {/* Notation Display */}
        {musicXml && (
          <View style={styles.notationSection}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 16 }]}>
              Generated Content
            </Text>
            <ScoreViewport
              musicXml={musicXml}
              height={350}
              fixedWidth={2000}
              playbackState={playbackState}
              playbackMeasureIndex={playbackMeasureIndex}
              highlightedNoteIndex={currentNoteIndex ?? undefined}
              testID="notation-display"
            />
          </View>
        )}

        {/* Playback Controls */}
        {response && response.events && response.events.length > 0 && (
          <View style={styles.playbackSection}>
            <Text style={styles.sectionLabel}>Playback</Text>
            <View style={styles.playbackControls}>
              {playbackState === "playing" ? (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePause}
                >
                  <Text style={styles.playButtonText}>⏸ Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlay}
                >
                  <Text style={styles.playButtonText}>▶️ Play</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.stopButtonText}>⏹ Stop</Text>
              </TouchableOpacity>
            </View>
            <TempoSlider
              tempo={tempo}
              tempoRange={response.tempo_range}
              onTempoChange={handleTempoChange}
              trackColor={colors.primary}
              thumbColor={colors.primary}
            />
            <Text style={styles.playbackStatus}>
              State: {playbackState}
              {currentNoteIndex !== null &&
                ` | Note: ${currentNoteIndex + 1}/${response.events.length}`}
            </Text>
          </View>
        )}

        {/* Response Debug Info */}
        {response && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Response Info</Text>
            <Text style={styles.debugText}>
              Events: {response.events?.length ?? 0}
              {"\n"}Total Beats: {response.total_beats}
              {"\n"}Key: {response.key} | Octaves: {response.effective_octaves}
              {"\n"}Definition: {response.definition}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  randomCheckbox: {
    padding: 4,
  },
  checkboxText: {
    fontSize: 20,
    color: colors.primary,
  },
  randomBadge: {
    fontSize: 14,
    marginLeft: "auto",
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: "#fff",
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  rowSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  halfSection: {
    flex: 1,
  },
  poolToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  poolToggleEnabled: {
    backgroundColor: colors.primary,
  },
  poolToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  poolSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  poolTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  poolSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  poolChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  poolChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
  },
  poolChipSelected: {
    backgroundColor: colors.primary,
  },
  poolChipText: {
    fontSize: 12,
    color: colors.text,
  },
  generateButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  errorBox: {
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  notationSection: {
    marginBottom: 16,
    marginHorizontal: -16, // Escape parent padding to use full width
  },
  playbackSection: {
    marginBottom: 16,
  },
  playbackControls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  playButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#22c55e",
    alignItems: "center",
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  stopButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  stopButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  playbackStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  debugSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },
  bottomSpacer: {
    height: 40,
  },
});
