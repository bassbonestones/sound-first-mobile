/**
 * Fragment2LessonExercise - Teaches 2-note diatonic scale fragments
 *
 * Flow: Focus Card → Listen → Sing → Imagine → Play with Drone → Play → Feedback
 *
 * Patterns (all must be completed once for mastery):
 * - Linear Up: 1 → 2 (2 half notes)
 * - Linear Down: 2 → 1 (2 half notes)
 * - Arc Up: 1 → 2 → 1 (3 half notes)
 * - Arc Down: 2 → 1 → 2 (3 half notes)
 *
 * Features:
 * - Fixed tempo: 60 BPM (half notes for better pitch perception)
 * - Eighth note subdivision
 * - Focus card rotation (pitch, projection, core sound, rhythm)
 * - Tonic drone during "Play with Drone" phase
 * - Notation display with cursor
 */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";
import {
  parseNoteName,
  noteToMidi,
  midiToFrequency,
  noteToFrequency,
  createAudioContext,
  createClickSound,
  LESSON_PHASES,
  PITCH_DETECTION_OPTIONS,
  exercisePropTypes,
  exerciseDefaultProps,
} from "./shared";

// For notation display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  console.warn("NotationDisplay not available");
}

// Phases - extend LESSON_PHASES with play_with_drone
const PHASE = {
  ...LESSON_PHASES,
  PLAY_WITH_DRONE: "play_with_drone",
};

// Pattern definitions for fragment-2
const PATTERNS = {
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

const PATTERN_ORDER = ["linear_up", "linear_down", "arc_up", "arc_down"];

// Focus card categories for rotation
const FOCUS_CARD_ROTATION = [
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

// Get note name from MIDI
function midiToNoteName(midi) {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return noteNames[noteIndex] + octave;
}

// Major scale intervals (semitones from root)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];

// Get scale degree pitch from first note
function getScaleDegreePitch(firstNoteMidi, scaleDegree) {
  // Scale degree is 1-based
  const interval = MAJOR_SCALE_INTERVALS[scaleDegree - 1];
  return firstNoteMidi + interval;
}

// Generate MusicXML for a fragment pattern
function generateFragmentMusicXML(scaleDegrees, firstNote, clef = "treble") {
  const firstNoteMidi = noteToMidi(firstNote);

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  let notes = scaleDegrees
    .map((degree) => {
      const midi = getScaleDegreePitch(firstNoteMidi, degree);
      const noteName = midiToNoteName(midi);
      const parsed = parseNoteName(noteName);

      let alter = 0;
      let alterXML = "";
      let accidentalXML = "";

      if (noteName.includes("#")) {
        alter = 1;
        alterXML = `        <alter>1</alter>\n`;
        accidentalXML = `        <accidental>sharp</accidental>\n`;
      } else if (noteName.includes("b")) {
        alter = -1;
        alterXML = `        <alter>-1</alter>\n`;
        accidentalXML = `        <accidental>flat</accidental>\n`;
      }

      const step = noteName.charAt(0);
      const octave = noteName.charAt(noteName.length - 1);

      return `      <note>
        <pitch>
          <step>${step}</step>
${alterXML}          <octave>${octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${accidentalXML}      </note>`;
    })
    .join("\n");

  // Always use 4/4 time signature
  // For 3-note patterns (6 beats), add a half rest at the end to fill the bar
  const noteBeats = scaleDegrees.length * 2;
  const needsRest = noteBeats < 4; // 2 or 3 notes don't fill 4 beats? Actually 3 notes = 6 beats, need different logic

  // If we have 3 half notes (6 beats), we need 2 measures in 4/4, or use 6/4
  // For simplicity, let's use a time signature that fits the notes but display as 4/4
  // Actually user wants 4/4 with a rest. 3 half notes = 6 beats. In 4/4, that's 1.5 measures.
  // Let's put 2 half notes in measure 1, 1 half note + half rest in measure 2

  // For 2-note patterns: 4 beats, fits perfectly in 4/4
  // For 3-note patterns: 6 beats, use 2 measures of 4/4 (4 beats + 2 beats + 2 beat rest)

  if (scaleDegrees.length === 3) {
    // Split into 2 measures for 3-note patterns
    const allNotes = scaleDegrees.map((degree) => {
      const midi = getScaleDegreePitch(firstNoteMidi, degree);
      const noteName = midiToNoteName(midi);

      let alterXML = "";
      let accidentalXML = "";

      if (noteName.includes("#")) {
        alterXML = `        <alter>1</alter>\n`;
        accidentalXML = `        <accidental>sharp</accidental>\n`;
      } else if (noteName.includes("b")) {
        alterXML = `        <alter>-1</alter>\n`;
        accidentalXML = `        <accidental>flat</accidental>\n`;
      }

      const step = noteName.charAt(0);
      const octave = noteName.charAt(noteName.length - 1);

      return { step, octave, alterXML, accidentalXML };
    });

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
          <step>${allNotes[0].step}</step>
${allNotes[0].alterXML}          <octave>${allNotes[0].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[0].accidentalXML}      </note>
      <note>
        <pitch>
          <step>${allNotes[1].step}</step>
${allNotes[1].alterXML}          <octave>${allNotes[1].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[1].accidentalXML}      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch>
          <step>${allNotes[2].step}</step>
${allNotes[2].alterXML}          <octave>${allNotes[2].octave}</octave>
        </pitch>
        <duration>2</duration>
        <type>half</type>
${allNotes[2].accidentalXML}      </note>
      <note>
        <rest/>
        <duration>2</duration>
        <type>half</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
  }

  // For 2-note patterns, use single 4/4 measure
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
${notes}
    </measure>
  </part>
</score-partwise>`;
}

// Create a softer subdivision click for eighth notes
function createSubdivisionClick(audioContext) {
  const sampleRate = audioContext.sampleRate;
  const duration = 0.02;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + duration,
  );

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(audioContext.currentTime);
}

export default function Fragment2LessonExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  userFirstNote = "F3",
  userRangeLow,
  userRangeHigh,
}) {
  // State
  const [phase, setPhase] = useState(PHASE.FOCUS_CARD);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isSubdivision, setIsSubdivision] = useState(false);
  const [showNotation, setShowNotation] = useState(false);
  const [showCursor, setShowCursor] = useState(false); // Whether to show note cursor
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasHeardPattern, setHasHeardPattern] = useState(false);
  const [singAttempts, setSingAttempts] = useState(0);
  const [playAttempts, setPlayAttempts] = useState(0);
  const [showAttestModal, setShowAttestModal] = useState(false);
  const [attestPhase, setAttestPhase] = useState(null);
  const [droneActive, setDroneActive] = useState(false);

  // Pattern state
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [completedPatterns, setCompletedPatterns] = useState({});
  const [focusCardIndex, setFocusCardIndex] = useState(0);

  // Fixed tempo for half notes
  const tempo = 60;

  // Refs
  const audioContextRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const samplingIntervalRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const droneOscillatorRef = useRef(null);
  const droneGainRef = useRef(null);
  const unmountedRef = useRef(false);
  const isSoundingRef = useRef(false);
  const hasHitTargetPitchRef = useRef(false);
  const onPitchCountRef = useRef(0);
  const totalSoundingCountRef = useRef(0);
  const soundingOnBeatsRef = useRef([]);
  const noteStartedOnTimeRef = useRef([]); // Track if each note started on time
  const notePitchAccuracyRef = useRef([]); // Track pitch accuracy per note [{ onPitch: N, total: N }]
  const startedEarlyRef = useRef(false);
  const onCompleteRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Config
  const clef = config?.clef || "treble";

  // Current pattern
  const currentPatternId = PATTERN_ORDER[currentPatternIndex];
  const currentPattern = Object.values(PATTERNS).find(
    (p) => p.id === currentPatternId,
  );
  const patternNotes = currentPattern?.scaleDegrees || [1, 2];

  // Current focus card (rotate through on each pattern)
  const currentFocusCard =
    FOCUS_CARD_ROTATION[focusCardIndex % FOCUS_CARD_ROTATION.length];

  // Calculate valid starting notes based on user's range
  // For 2-note fragments (do-re), we need at least M2 (2 semitones) of space
  const validStartingNotes = useMemo(() => {
    const lowMidi = userRangeLow
      ? noteToMidi(userRangeLow)
      : noteToMidi(userFirstNote);
    const highMidi = userRangeHigh ? noteToMidi(userRangeHigh) : lowMidi + 2; // At least M2

    // For do-re patterns, starting note must allow re (do + 2 semitones) to fit
    const maxStartingMidi = highMidi - 2;
    const notes = [];

    for (let midi = lowMidi; midi <= maxStartingMidi; midi++) {
      notes.push(midiToNoteName(midi));
    }

    // If no valid notes (range too small), fall back to userFirstNote
    if (notes.length === 0) {
      return [userFirstNote];
    }

    return notes;
  }, [userRangeLow, userRangeHigh, userFirstNote]);

  // Select ONE starting note for the entire session (all 4 patterns use the same key)
  // This is selected randomly once when the component mounts
  const [sessionStartingNote, setSessionStartingNote] = useState(null);

  // Initialize session starting note when validStartingNotes becomes available
  useEffect(() => {
    if (!sessionStartingNote && validStartingNotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * validStartingNotes.length);
      const selectedNote = validStartingNotes[randomIndex];
      setSessionStartingNote(selectedNote);
      console.log(
        `[SESSION] Selected starting note for session: ${selectedNote} from [${validStartingNotes.join(", ")}]`,
      );
    }
  }, [validStartingNotes, sessionStartingNote]);

  // Use the session's single starting note for all patterns
  const currentStartingNote =
    sessionStartingNote || validStartingNotes[0] || userFirstNote;

  // Parse note info
  const noteInfo = useMemo(() => {
    const parsed = parseNoteName(currentStartingNote);
    return parsed || { letter: "F", accidental: "", octave: 3 };
  }, [currentStartingNote]);

  const firstNoteMidi = useMemo(
    () => noteToMidi(currentStartingNote),
    [currentStartingNote],
  );

  // Generate pitches for current pattern
  const patternPitches = useMemo(() => {
    return patternNotes.map((degree) =>
      getScaleDegreePitch(firstNoteMidi, degree),
    );
  }, [patternNotes, firstNoteMidi]);

  const patternFrequencies = useMemo(() => {
    return patternPitches.map((midi) => midiToFrequency(midi));
  }, [patternPitches]);

  // Generate MusicXML
  const musicXML = useMemo(
    () => generateFragmentMusicXML(patternNotes, currentStartingNote, clef),
    [patternNotes, currentStartingNote, clef],
  );

  // Pitch detection - NOT during PLAY_WITH_DRONE (drone interferes)
  const { currentPitch, volume, isSounding } = usePitchDetection({
    enabled:
      (phase === PHASE.SING && !singResult) ||
      (phase === PHASE.PLAY && !playResult),
    ...PITCH_DETECTION_OPTIONS,
  });

  // Track pitch accuracy - need to detect the sequence of pitches
  useEffect(() => {
    if (!isSounding || !currentPitch?.noteName) return;

    const detectedMidi = noteToMidi(currentPitch.noteName);
    if (detectedMidi === null) return;

    totalSoundingCountRef.current += 1;

    // Check if detected pitch matches any of the pattern pitches
    const isOnPitch = patternPitches.some((targetMidi) => {
      const diff = Math.abs(detectedMidi - targetMidi);
      return phase === PHASE.SING
        ? diff % 12 <= 1 || diff % 12 >= 11
        : diff === 0; // Play phase: must be exact semitone
    });

    if (isOnPitch) {
      hasHitTargetPitchRef.current = true;
      onPitchCountRef.current += 1;
    }

    // Track per-note pitch accuracy (which specific note they should be on)
    if (isPlaying && currentBeat >= 1) {
      const noteIndex = Math.floor((currentBeat - 1) / 2);
      if (
        noteIndex >= 0 &&
        noteIndex < patternPitches.length &&
        notePitchAccuracyRef.current[noteIndex]
      ) {
        notePitchAccuracyRef.current[noteIndex].total += 1;

        // Check if pitch matches THIS specific note's target
        const targetMidi = patternPitches[noteIndex];
        const diff = Math.abs(detectedMidi - targetMidi);
        const matchesThisNote =
          phase === PHASE.SING ? diff % 12 <= 1 || diff % 12 >= 11 : diff === 0; // Play phase: must be exact semitone

        if (matchesThisNote) {
          notePitchAccuracyRef.current[noteIndex].onPitch += 1;
        }
      }
    }
  }, [
    currentPitch?.noteName,
    isSounding,
    patternPitches,
    phase,
    isPlaying,
    currentBeat,
  ]);

  useEffect(() => {
    isSoundingRef.current = isSounding;
  }, [isSounding]);

  // Reset tracking when phase changes
  useEffect(() => {
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    soundingOnBeatsRef.current = new Array(patternNotes.length).fill(0);
    startedEarlyRef.current = false;
    notePitchAccuracyRef.current = patternNotes.map(() => ({
      onPitch: 0,
      total: 0,
    }));
  }, [phase, patternNotes.length]);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = createAudioContext();

    return () => {
      unmountedRef.current = true;
      stopPlayback();
      stopDrone();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    setShowNotation(false);
  }, [phase]);

  // Check if all patterns are completed
  const allPatternsCompleted = useMemo(() => {
    return PATTERN_ORDER.every((id) => completedPatterns[id]);
  }, [completedPatterns]);

  // Play the fragment pattern (half notes - each note is 2 beats)
  const playPattern = useCallback(
    (onComplete) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setIsSubdivision(false);
      setShowCursor(true);

      const beatMs = (60 / tempo) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat
      const totalBeats = patternNotes.length * 2; // 2 beats per half note

      createClickSound(ctx, true);
      setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          return;
        }

        if (isAnd) {
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            const isAccent = beat === 1 || beat % 2 === 1; // Accent on odd beats (note starts)
            createClickSound(ctx, beat === 1);
            setCurrentBeat(beat);

            // Play the note only on odd beats (1, 3, 5...)
            if (beat % 2 === 1) {
              const noteIndex = Math.floor((beat - 1) / 2);
              const freq = patternFrequencies[noteIndex];
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              const now = ctx.currentTime;
              const duration = (beatMs * 1.9) / 1000; // ~1.9 beats (half note duration)

              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0, now);
              gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
              gain.gain.setValueAtTime(0.4, now + duration - 0.1);
              gain.gain.linearRampToValueAtTime(0, now + duration);

              // Add harmonic
              const osc2 = ctx.createOscillator();
              const gain2 = ctx.createGain();
              osc2.frequency.setValueAtTime(freq * 2, now);
              gain2.gain.setValueAtTime(0.15, now);
              gain2.gain.linearRampToValueAtTime(0, now + duration);

              osc.connect(gain);
              gain.connect(ctx.destination);
              osc2.connect(gain2);
              gain2.connect(ctx.destination);

              osc.start(now);
              osc.stop(now + duration + 0.05);
              osc2.start(now);
              osc2.stop(now + duration + 0.05);

              oscillatorsRef.current.push(osc, osc2);
            }
          } else if (beat === totalBeats + 1) {
            // Final beat (stop)
            createClickSound(ctx, true);
            setCurrentBeat(beat);
          } else {
            clearInterval(beatIntervalRef.current);
            beatIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setIsSubdivision(false);
            setShowCursor(false);
            oscillatorsRef.current = [];
            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true;
        }
      }, eighthMs);
    },
    [tempo, patternNotes.length, patternFrequencies, isPlaying],
  );

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (beatIntervalRef.current) {
      clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    if (samplingIntervalRef.current) {
      clearInterval(samplingIntervalRef.current);
      samplingIntervalRef.current = null;
    }
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
    setCurrentBeat(0);
    setIsSubdivision(false);
    setShowCursor(false);
  }, []);

  // Start tonic drone
  const startDrone = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || droneActive) return;

    const freq = midiToFrequency(firstNoteMidi);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    droneOscillatorRef.current = osc;
    droneGainRef.current = gain;
    setDroneActive(true);
  }, [firstNoteMidi, droneActive]);

  // Stop tonic drone
  const stopDrone = useCallback(() => {
    if (droneOscillatorRef.current && droneGainRef.current) {
      const ctx = audioContextRef.current;
      if (ctx) {
        droneGainRef.current.gain.linearRampToValueAtTime(
          0,
          ctx.currentTime + 0.3,
        );
        setTimeout(() => {
          try {
            droneOscillatorRef.current?.stop();
          } catch (e) {}
          droneOscillatorRef.current = null;
          droneGainRef.current = null;
        }, 350);
      }
    }
    setDroneActive(false);
  }, []);

  // Play metronome only (for sing/play phases) - half notes = 2 beats per note
  const playMetronomeOnly = useCallback(
    (onComplete, withDrone = false) => {
      const ctx = audioContextRef.current;
      if (!ctx || isPlaying) return;

      if (withDrone) {
        startDrone();
      }

      onCompleteRef.current =
        typeof onComplete === "function" ? onComplete : null;

      setIsPlaying(true);
      setCurrentBeat(-4);
      setIsSubdivision(false);
      setShowCursor(true);
      soundingOnBeatsRef.current = new Array(patternNotes.length).fill(0);
      noteStartedOnTimeRef.current = new Array(patternNotes.length).fill(false);
      notePitchAccuracyRef.current = patternNotes.map(() => ({
        onPitch: 0,
        total: 0,
      }));
      startedEarlyRef.current = false;

      const beatMs = (60 / tempo) * 1000;
      const eighthMs = beatMs / 2;
      let beat = -4;
      let isAnd = true; // First interval tick is subdivision after initial beat
      const totalBeats = patternNotes.length * 2; // 2 beats per half note

      let noteSoundingSamples = {
        noteIndex: -1,
        samples: 0,
        soundingCount: 0,
        firstHalfSoundingCount: 0,
      };
      let earlySoundingSamples = 0;
      let samplesBeforeChecking = 3;
      // At 50ms sampling and 1000ms per beat (60bpm), we get ~20 samples per beat, ~40 per half note
      // First half of note = first ~20 samples
      const samplesPerHalfNote = Math.round((beatMs * 2) / 50);
      const firstHalfThreshold = Math.round(samplesPerHalfNote / 2);

      const samplingInterval = setInterval(() => {
        if (samplesBeforeChecking > 0) {
          samplesBeforeChecking--;
          return;
        }

        if (beat >= -4 && beat <= -1) {
          if (isSoundingRef.current) {
            earlySoundingSamples++;
            if (earlySoundingSamples >= 3) {
              startedEarlyRef.current = true;
            }
          } else {
            earlySoundingSamples = 0;
          }
        }

        // Track sounding by note index (each note is 2 beats)
        if (beat >= 1 && beat <= totalBeats) {
          const currentNoteIndex = Math.floor((beat - 1) / 2);
          if (noteSoundingSamples.noteIndex !== currentNoteIndex) {
            // Save previous note's data
            if (
              noteSoundingSamples.noteIndex >= 0 &&
              noteSoundingSamples.samples > 0
            ) {
              const percentage =
                noteSoundingSamples.soundingCount / noteSoundingSamples.samples;
              const idx = noteSoundingSamples.noteIndex;
              if (idx < soundingOnBeatsRef.current.length) {
                soundingOnBeatsRef.current[idx] = Math.max(
                  soundingOnBeatsRef.current[idx],
                  percentage,
                );
              }
              // Check if note started on time (sound in first half of note duration)
              const firstHalfPct =
                noteSoundingSamples.firstHalfSoundingCount /
                Math.min(noteSoundingSamples.samples, firstHalfThreshold);
              if (
                idx < noteStartedOnTimeRef.current.length &&
                firstHalfPct >= 0.5
              ) {
                noteStartedOnTimeRef.current[idx] = true;
              }
            }
            noteSoundingSamples = {
              noteIndex: currentNoteIndex,
              samples: 0,
              soundingCount: 0,
              firstHalfSoundingCount: 0,
            };
          }
          noteSoundingSamples.samples++;
          if (isSoundingRef.current) {
            noteSoundingSamples.soundingCount++;
            // Track first half separately
            if (noteSoundingSamples.samples <= firstHalfThreshold) {
              noteSoundingSamples.firstHalfSoundingCount++;
            }
          }
        }
      }, 50);
      samplingIntervalRef.current = samplingInterval;

      createClickSound(ctx, true);
      setIsSubdivision(false);

      beatIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) {
          clearInterval(beatIntervalRef.current);
          clearInterval(samplingInterval);
          return;
        }

        if (isAnd) {
          createSubdivisionClick(ctx);
          setIsSubdivision(true);
          isAnd = false;
        } else {
          beat++;
          if (beat === 0) beat = 1;
          setIsSubdivision(false);

          if (beat >= -3 && beat <= -1) {
            createClickSound(ctx, false);
            setCurrentBeat(beat);
          } else if (beat >= 1 && beat <= totalBeats) {
            const isNoteStart = beat % 2 === 1; // Notes start on odd beats
            createClickSound(ctx, beat === 1);
            setCurrentBeat(beat);
          } else if (beat === totalBeats + 1) {
            createClickSound(ctx, true);
            setCurrentBeat(beat);
          } else {
            // Save final note's data
            if (
              noteSoundingSamples.noteIndex >= 0 &&
              noteSoundingSamples.samples > 0
            ) {
              const percentage =
                noteSoundingSamples.soundingCount / noteSoundingSamples.samples;
              const idx = noteSoundingSamples.noteIndex;
              if (idx < soundingOnBeatsRef.current.length) {
                soundingOnBeatsRef.current[idx] = Math.max(
                  soundingOnBeatsRef.current[idx],
                  percentage,
                );
              }
              // Check if final note started on time
              const firstHalfPct =
                noteSoundingSamples.firstHalfSoundingCount /
                Math.min(noteSoundingSamples.samples, firstHalfThreshold);
              if (
                idx < noteStartedOnTimeRef.current.length &&
                firstHalfPct >= 0.5
              ) {
                noteStartedOnTimeRef.current[idx] = true;
              }
            }
            clearInterval(beatIntervalRef.current);
            clearInterval(samplingInterval);
            beatIntervalRef.current = null;
            samplingIntervalRef.current = null;
            setIsPlaying(false);
            setCurrentBeat(0);
            setIsSubdivision(false);
            setShowCursor(false);

            if (withDrone) {
              stopDrone();
            }

            if (onCompleteRef.current) {
              onCompleteRef.current();
              onCompleteRef.current = null;
            }
            return;
          }
          isAnd = true;
        }
      }, eighthMs);
    },
    [tempo, patternNotes.length, isPlaying, startDrone, stopDrone],
  );

  // Analyze performance
  const analyzePerformance = useCallback(() => {
    const totalCount = totalSoundingCountRef.current;
    const pitchCount = onPitchCountRef.current;
    const hitTarget = hasHitTargetPitchRef.current;

    const beatSoundPct = soundingOnBeatsRef.current;
    const noteStartedOnTime = noteStartedOnTimeRef.current;
    const startedEarly = startedEarlyRef.current;
    const perNotePitch = notePitchAccuracyRef.current;

    if (totalCount === 0) {
      return {
        success: false,
        pitchOk: false,
        rhythmOk: false,
        message: "No sound detected",
      };
    }

    // Check per-note pitch accuracy - each note must match its specific target
    const PER_NOTE_PITCH_THRESHOLD = 0.4; // 40% of samples for each note must match that note's target
    const perNotePitchOk = perNotePitch.every((note) => {
      if (note.total === 0) return false; // No samples for this note
      return note.onPitch / note.total >= PER_NOTE_PITCH_THRESHOLD;
    });

    // Log per-note accuracy for debugging
    console.log(
      "[PITCH] Per-note accuracy:",
      perNotePitch
        .map(
          (n, i) =>
            `Note ${i}: ${n.total > 0 ? Math.round((n.onPitch / n.total) * 100) : 0}% (${n.onPitch}/${n.total})`,
        )
        .join(", "),
    );

    const successRatio = pitchCount / totalCount;
    const pitchOk = hitTarget && perNotePitchOk && successRatio >= 0.3;

    // Check sustain (need to sound for most of each note)
    const SUSTAIN_THRESHOLD = 0.6;
    const allBeatsOk = beatSoundPct.every((pct) => pct >= SUSTAIN_THRESHOLD);

    // Check entrances (need to start each note on time)
    const allEntrancesOk = noteStartedOnTime.every(
      (started) => started === true,
    );

    const rhythmOk = !startedEarly && allBeatsOk && allEntrancesOk;

    const success = pitchOk && rhythmOk;

    let message = "";
    if (success) {
      message = "Great job! You played the pattern accurately.";
    } else if (!pitchOk && rhythmOk) {
      message = "Good rhythm! Focus on matching the pitches more closely.";
    } else if (pitchOk && !rhythmOk) {
      if (startedEarly) {
        message = "Good pitches! Wait for beat 1 to start.";
      } else if (!allEntrancesOk) {
        message = "Good pitches! Start each note right on the beat.";
      } else {
        message = "Good pitches! Hold each note for the full 2 beats.";
      }
    } else {
      message = "Keep practicing! Listen to the pattern again.";
    }

    return { success, pitchOk, rhythmOk, message };
  }, []);

  // Handle phase transitions and results
  const handlePhaseComplete = useCallback(
    (result) => {
      if (phase === PHASE.SING) {
        setSingResult(result);
        if (result?.success) {
          setSingAttempts(0);
        } else {
          setSingAttempts((prev) => prev + 1);
        }
      } else if (phase === PHASE.PLAY || phase === PHASE.PLAY_WITH_DRONE) {
        setPlayResult(result);
        if (result?.success) {
          setPlayAttempts(0);
        } else {
          setPlayAttempts((prev) => prev + 1);
        }
      }
    },
    [phase],
  );

  // Go to next phase
  const goToNextPhase = useCallback(() => {
    switch (phase) {
      case PHASE.FOCUS_CARD:
        setPhase(PHASE.LISTEN);
        break;
      case PHASE.LISTEN:
        setHasHeardPattern(true);
        setPhase(PHASE.SING);
        break;
      case PHASE.SING:
        setSingResult(null);
        setPhase(PHASE.IMAGINE);
        break;
      case PHASE.IMAGINE:
        setPhase(PHASE.PLAY_WITH_DRONE);
        break;
      case PHASE.PLAY_WITH_DRONE:
        setPlayResult(null);
        setPhase(PHASE.PLAY);
        break;
      case PHASE.PLAY:
        setPhase(PHASE.FEEDBACK);
        break;
      case PHASE.FEEDBACK:
        // Mark current pattern as completed
        setCompletedPatterns((prev) => ({ ...prev, [currentPatternId]: true }));

        // Check if all patterns done
        const newCompleted = { ...completedPatterns, [currentPatternId]: true };
        const allDone = PATTERN_ORDER.every((id) => newCompleted[id]);

        if (allDone) {
          setShowSuccess(true);
        } else {
          // Move to next incomplete pattern
          const nextIndex = PATTERN_ORDER.findIndex(
            (id, idx) => idx > currentPatternIndex && !newCompleted[id],
          );
          if (nextIndex !== -1) {
            setCurrentPatternIndex(nextIndex);
          } else {
            // Find first incomplete pattern
            const firstIncomplete = PATTERN_ORDER.findIndex(
              (id) => !newCompleted[id],
            );
            if (firstIncomplete !== -1) {
              setCurrentPatternIndex(firstIncomplete);
            }
          }
          // Rotate focus card
          setFocusCardIndex((prev) => prev + 1);
          // Reset for new pattern
          setHasHeardPattern(false);
          setSingResult(null);
          setPlayResult(null);
          setPhase(PHASE.FOCUS_CARD);
        }
        break;
    }
  }, [phase, currentPatternId, completedPatterns, currentPatternIndex]);

  // Handle attestation
  const handleAttestConfirm = useCallback(() => {
    setShowAttestModal(false);
    if (attestPhase === "sing") {
      setSingResult({ success: true, attested: true });
      setSingAttempts(0);
    } else if (attestPhase === "play") {
      setPlayResult({ success: true, attested: true });
      setPlayAttempts(0);
    }
    setAttestPhase(null);
  }, [attestPhase]);

  // Handle done singing
  const handleDoneSinging = useCallback(() => {
    const result = analyzePerformance();
    handlePhaseComplete(result);
  }, [analyzePerformance, handlePhaseComplete]);

  // Handle try sing again
  const handleTrySingAgain = useCallback(() => {
    setSingResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    notePitchAccuracyRef.current = patternNotes.map(() => ({
      onPitch: 0,
      total: 0,
    }));
  }, [patternNotes]);

  // Handle done playing
  const handleDonePlaying = useCallback(() => {
    const result = analyzePerformance();
    handlePhaseComplete(result);
  }, [analyzePerformance, handlePhaseComplete]);

  // Handle done playing with drone (no strict judgment - just practice)
  const handleDonePlayingWithDrone = useCallback(() => {
    // Just show options without strict evaluation
    setPlayResult({ success: true, message: "Practice complete!" });
  }, []);

  // Handle try play again
  const handleTryPlayAgain = useCallback(() => {
    setPlayResult(null);
    hasHitTargetPitchRef.current = false;
    onPitchCountRef.current = 0;
    totalSoundingCountRef.current = 0;
    notePitchAccuracyRef.current = patternNotes.map(() => ({
      onPitch: 0,
      total: 0,
    }));
  }, [patternNotes]);

  // Handle done imagining
  const handleDoneImagining = useCallback(() => {
    goToNextPhase();
  }, [goToNextPhase]);

  // Progress indicator for patterns
  const PatternProgress = () => (
    <View style={styles.patternProgress}>
      {PATTERN_ORDER.map((id, index) => {
        const pattern = Object.values(PATTERNS).find((p) => p.id === id);
        const isCompleted = completedPatterns[id];
        const isCurrent = index === currentPatternIndex;

        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.patternDot,
              isCompleted && styles.patternDotCompleted,
              isCurrent && styles.patternDotCurrent,
            ]}
            onPress={() => {
              if (allPatternsCompleted || showSuccess) {
                // Allow replay of any pattern after completion
                setCurrentPatternIndex(index);
                setHasHeardPattern(false);
                setSingResult(null);
                setPlayResult(null);
                setPhase(PHASE.LISTEN);
                setShowSuccess(false);
              }
            }}
          >
            <Text
              style={[
                styles.patternDotText,
                (isCompleted || isCurrent) && styles.patternDotTextActive,
              ]}
            >
              {isCompleted ? "✓" : index + 1}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Mini focus card display
  const renderFocusCardMini = () => (
    <View style={styles.focusCardMini}>
      <View style={styles.focusCardMiniIcon}>
        <Text style={styles.focusCardMiniIconText}>🎯</Text>
      </View>
      <View style={styles.focusCardMiniRight}>
        <Text style={styles.focusCardMiniTitle}>{currentFocusCard.name}</Text>
        <Text style={styles.focusCardMiniText}>{currentFocusCard.cue}</Text>
      </View>
    </View>
  );

  // Beat indicator with subdivision (half notes = 2 beats per note)
  const BeatIndicator = () => {
    const numBeats = patternNotes.length * 2; // 2 beats per half note

    return (
      <View style={styles.beatIndicatorContainer}>
        <View style={styles.countInRow}>
          <Text style={styles.countInLabel}>Count in:</Text>
          <View style={styles.countInBeats}>
            {[-4, -3, -2, -1].map((beat, index) => (
              <React.Fragment key={beat}>
                <View
                  style={[
                    styles.countInDot,
                    beat <= currentBeat &&
                      currentBeat < 0 &&
                      styles.countInDotActive,
                    beat === -4 && styles.countInDotAccent,
                  ]}
                >
                  <Text
                    style={[
                      styles.countInNumber,
                      beat <= currentBeat &&
                        currentBeat < 0 &&
                        styles.countInNumberActive,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.singRow}>
          <Text style={styles.singLabel}>Play:</Text>
          <View style={styles.beatIndicator}>
            {Array.from({ length: numBeats }, (_, i) => i + 1).map((beat) => {
              const isActive = currentBeat >= beat && currentBeat > 0;
              const isNoteStart = beat % 2 === 1; // Notes start on odd beats

              return (
                <React.Fragment key={beat}>
                  <View
                    style={[
                      styles.beatDot,
                      isNoteStart && styles.beatDotAccent,
                      isActive && styles.beatDotActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.beatNumber,
                        isActive && styles.beatNumberActive,
                      ]}
                    >
                      {beat}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
            {/* Stop indicator */}
            <View
              style={[
                styles.beatDot,
                styles.beatDotStop,
                currentBeat === numBeats + 1 && styles.beatDotStopActive,
              ]}
            >
              <Text
                style={[
                  styles.beatNumber,
                  currentBeat === numBeats + 1 && styles.beatNumberStopActive,
                ]}
              >
                ●
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Compute note index for cursor (each note = 2 beats, beats 1-2 = note 0, beats 3-4 = note 1, etc.)
  const cursorNoteIndex = useMemo(() => {
    if (!showCursor || currentBeat < 1) return null;
    return Math.floor((currentBeat - 1) / 2);
  }, [showCursor, currentBeat]);

  // Scroll to top when notation is opened (notation now shows at top)
  const handleShowNotation = useCallback(() => {
    setShowNotation(true);
    // Scroll to top so notation is visible
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  }, []);

  // Render notation toggle
  const renderNotationToggle = () => {
    // Calculate highlight position for custom cursor overlay
    // For 2-note patterns: single measure, notes evenly spaced
    // For 3-note patterns: 2 measures (notes 1-2 in m1, note 3 + rest in m2)
    const noteCount = patternNotes.length;
    let notePositions;
    let highlightWidth;

    if (noteCount === 2) {
      // Single 4/4 measure: clef+timesig ~100px, then 2 half notes
      notePositions = [135, 215];
      highlightWidth = 60;
    } else {
      // Two 4/4 measures: notes 1&2 in measure 1, note 3 in measure 2
      // Positions: ~95, ~155 for m1, then bar line, ~225 for m2
      notePositions = [95, 155, 225];
      highlightWidth = 45;
    }

    const highlightLeft =
      cursorNoteIndex !== null && cursorNoteIndex < notePositions.length
        ? notePositions[cursorNoteIndex]
        : null;

    return (
      <View style={styles.notationContainer}>
        {!showNotation ? (
          <TouchableOpacity
            style={styles.showNotationButton}
            onPress={handleShowNotation}
          >
            <Text style={styles.showNotationText}>Show Notation 📝</Text>
          </TouchableOpacity>
        ) : (
          <>
            {NotationDisplay && (
              <View style={[styles.notationWrapper, { position: "relative" }]}>
                <NotationDisplay
                  musicxml={musicXML}
                  width={300}
                  height={200}
                  showTimeSignature={true}
                />
                {/* Custom cursor highlight overlay */}
                {highlightLeft !== null && (
                  <View
                    style={{
                      position: "absolute",
                      left: highlightLeft,
                      top: 40,
                      width: highlightWidth,
                      height: 120,
                      backgroundColor: "rgba(76, 175, 80, 0.25)",
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: "rgba(76, 175, 80, 0.6)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.hideNotationButton}
              onPress={() => setShowNotation(false)}
            >
              <Text style={styles.hideNotationText}>Hide Notation</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  // Attestation Modal
  const attestationModal = useMemo(
    () => (
      <Modal
        visible={showAttestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm</Text>
            <Text style={styles.modalText}>
              I attest that I {attestPhase === "sing" ? "sang" : "played"} this
              correctly, but due to background noise or technical issues it was
              not able to register.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAttestModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAttestConfirm}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    ),
    [showAttestModal, attestPhase, handleAttestConfirm],
  );

  // FOCUS CARD PHASE
  if (phase === PHASE.FOCUS_CARD) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.focusCard}>
            <Text style={styles.focusCardCategory}>
              {currentFocusCard.category.toUpperCase()}
            </Text>
            <Text style={styles.focusCardTitle}>{currentFocusCard.name}</Text>
            <Text style={styles.focusCardDescription}>
              {currentFocusCard.description}
            </Text>
            <View style={styles.focusCardCueBox}>
              <Text style={styles.focusCardCue}>{currentFocusCard.cue}</Text>
            </View>
          </View>

          <View style={styles.patternInfo}>
            <Text style={styles.patternTitle}>
              Pattern: {currentPattern?.name}
            </Text>
            <Text style={styles.patternDescription}>
              {currentPattern?.description}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>Begin →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // LISTEN PHASE
  if (phase === PHASE.LISTEN) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Listen</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Listen to the {currentPattern?.name} pattern.{"\n"}
            Scale degrees: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
            onPress={() => playPattern(() => goToNextPhase())}
            disabled={isPlaying}
          >
            <Text style={styles.primaryButtonText}>
              {isPlaying ? "🎵 Listening..." : "🎵 Play Pattern"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // SING PHASE
  if (phase === PHASE.SING) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Sing</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Sing the pattern: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!singResult && !showNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}

          {singResult && (
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultText,
                  singResult.success ? styles.resultSuccess : styles.resultFail,
                ]}
              >
                {singResult.success ? "Great singing!" : singResult.message}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {singResult && !singResult.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTrySingAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDoneSinging, false),
                      100,
                    );
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎤 Try Again</Text>
                </TouchableOpacity>
              </View>
              {singAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    setAttestPhase("sing");
                    setShowAttestModal(true);
                  }}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I sang it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : singResult?.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTrySingAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDoneSinging, false),
                      100,
                    );
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎤 Sing Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playPattern()}
                disabled={isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 8 },
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playMetronomeOnly(handleDoneSinging, false)}
                disabled={isPlaying}
              >
                <Text style={styles.primaryButtonText}>
                  {isPlaying ? "🎤 Sing Now..." : "🎤 Start Singing"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // IMAGINE PHASE
  if (phase === PHASE.IMAGINE) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Imagine</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Imagine playing this pattern on your instrument.{"\n"}
            Hear the sound in your mind: {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!showNotation && (
            <View style={styles.imagineVisual}>
              <Text style={styles.imagineEmoji}>🎵</Text>
              <Text style={styles.imagineHint}>
                Hear your instrument: {patternNotes.join(" - ")}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
            onPress={() => playMetronomeOnly(null, false)}
            disabled={isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {isPlaying ? "🥁 Counting..." : "🥁 Count with Clicks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 8 }]}
            onPress={handleDoneImagining}
          >
            <Text style={styles.primaryButtonText}>I Imagined It →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PLAY WITH DRONE PHASE
  if (phase === PHASE.PLAY_WITH_DRONE) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Play with Drone</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Play the pattern with the tonic drone for intonation support.{"\n"}
            {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {droneActive && (
            <View style={styles.droneIndicator}>
              <Text style={styles.droneText}>
                🎵 Drone: {noteInfo.letter}
                {noteInfo.accidental}
              </Text>
            </View>
          )}

          {isPlaying && <BeatIndicator />}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {playResult ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    setPlayResult(null);
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlayingWithDrone, true),
                      100,
                    );
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    🎵 Again with Drone
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🔊 Hear Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={() => {
                  setPlayResult(null);
                  goToNextPhase();
                }}
              >
                <Text style={styles.primaryButtonText}>🎺 Play Alone →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={() =>
                playMetronomeOnly(handleDonePlayingWithDrone, true)
              }
              disabled={isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🎺 Play Now..." : "🎺 Start with Drone"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // PLAY PHASE (without drone)
  if (phase === PHASE.PLAY) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {renderFocusCardMini()}

          <Text style={styles.phaseTitle}>Play</Text>
          <Text style={styles.patternDisplay}>
            {currentPattern?.description}
          </Text>
          <Text style={styles.instruction}>
            Now play without the drone - full independence!{"\n"}
            {patternNotes.join(" → ")}
          </Text>

          {/* Show notation at top when open */}
          {showNotation && renderNotationToggle()}

          {isPlaying && <BeatIndicator />}

          {!playResult && !showNotation && (
            <View style={styles.volumeContainer}>
              <CircularVolumeIndicator volume={volume} size={100} />
              {isSounding && currentPitch?.noteName && (
                <Text style={styles.hearingText}>
                  Hearing: {currentPitch.noteName}
                </Text>
              )}
            </View>
          )}

          {playResult && (
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultText,
                  playResult.success ? styles.resultSuccess : styles.resultFail,
                ]}
              >
                {playResult.success ? "Excellent!" : playResult.message}
              </Text>
            </View>
          )}

          {/* Show notation button at bottom when closed */}
          {!showNotation && renderNotationToggle()}
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {playResult && !playResult.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTryPlayAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlaying, false),
                      100,
                    );
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.primaryButtonText}>🎵 Try Again</Text>
                </TouchableOpacity>
              </View>
              {playAttempts >= 3 && (
                <TouchableOpacity
                  style={[styles.tertiaryButton, { marginTop: 8 }]}
                  onPress={() => {
                    setAttestPhase("play");
                    setShowAttestModal(true);
                  }}
                >
                  <Text style={styles.tertiaryButtonText}>
                    I played it correctly →
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : playResult?.success ? (
            <>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => playPattern()}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    { flex: 1 },
                    isPlaying && styles.buttonDisabled,
                  ]}
                  onPress={() => {
                    handleTryPlayAgain();
                    setTimeout(
                      () => playMetronomeOnly(handleDonePlaying, false),
                      100,
                    );
                  }}
                  disabled={isPlaying}
                >
                  <Text style={styles.secondaryButtonText}>🎵 Play Again</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={goToNextPhase}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playPattern()}
                disabled={isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 8 },
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={() => playMetronomeOnly(handleDonePlaying, false)}
                disabled={isPlaying}
              >
                <Text style={styles.primaryButtonText}>
                  {isPlaying ? "🎺 Play Now..." : "🎺 Start Playing"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {attestationModal}
      </View>
    );
  }

  // SUCCESS / ALL COMPLETE - check this BEFORE FEEDBACK so it takes priority
  if (showSuccess) {
    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.successContainer}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>All Patterns Complete!</Text>
            <Text style={styles.successText}>
              You've successfully played all 4 fragment patterns.
            </Text>
            <Text style={styles.successSubtext}>
              Tap any pattern above to practice again.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              onComplete?.({
                success: true,
                capability: "diatonic_scale_fragment_2",
                key: sessionStartingNote, // Report the session's starting note for multi-key tracking
              })
            }
          >
            <Text style={styles.primaryButtonText}>Complete Lesson →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // FEEDBACK PHASE
  if (phase === PHASE.FEEDBACK) {
    // Count completed patterns, adding 1 for current only if not already completed
    const patternsComplete = completedPatterns[currentPatternId]
      ? Object.keys(completedPatterns).length
      : Object.keys(completedPatterns).length + 1;
    const totalPatterns = PATTERN_ORDER.length;

    return (
      <View style={styles.container}>
        <PatternProgress />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackEmoji}>✅</Text>
            <Text style={styles.feedbackTitle}>Pattern Complete!</Text>
            <Text style={styles.feedbackPattern}>{currentPattern?.name}</Text>
            <Text style={styles.feedbackDescription}>
              {currentPattern?.description}
            </Text>

            <View style={styles.progressSummary}>
              <Text style={styles.progressText}>
                {patternsComplete} of {totalPatterns} patterns completed
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToNextPhase}
          >
            <Text style={styles.primaryButtonText}>
              {patternsComplete >= totalPatterns
                ? "Finish →"
                : "Next Pattern →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// PropTypes validation
Fragment2LessonExercise.propTypes = exercisePropTypes;
Fragment2LessonExercise.defaultProps = exerciseDefaultProps;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200,
  },

  // Pattern Progress
  patternProgress: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#2d241a",
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  patternDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1410",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    marginHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  patternDotCompleted: {
    backgroundColor: "#4a7c59",
    borderColor: "#4a7c59",
  },
  patternDotCurrent: {
    borderColor: "#d4a574",
    borderWidth: 3,
  },
  patternDotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  patternDotTextActive: {
    color: "#fff",
  },

  // Tempo Control
  tempoControl: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#2d241a",
    borderRadius: 12,
  },
  tempoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 12,
  },
  tempoSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempoSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  tempoMin: {
    fontSize: 12,
    color: "#8a7a6a",
  },
  tempoMax: {
    fontSize: 12,
    color: "#8a7a6a",
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  focusCardCategory: {
    fontSize: 12,
    color: "#8a7a6a",
    letterSpacing: 1,
    marginBottom: 8,
  },
  focusCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
  },
  focusCardDescription: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 16,
  },
  focusCardCueBox: {
    backgroundColor: "#1a1410",
    borderRadius: 8,
    padding: 12,
  },
  focusCardCue: {
    fontSize: 14,
    color: "#d4a574",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Focus Card Mini
  focusCardMini: {
    flexDirection: "row",
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  focusCardMiniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  focusCardMiniIconText: {
    fontSize: 20,
  },
  focusCardMiniRight: {
    flex: 1,
  },
  focusCardMiniTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5e6d3",
  },
  focusCardMiniText: {
    fontSize: 12,
    color: "#8a7a6a",
    marginTop: 2,
  },

  // Pattern Info
  patternInfo: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 24,
    color: "#d4a574",
    fontWeight: "bold",
  },

  // Phase content
  phaseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 8,
  },
  patternDisplay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },

  // Beat Indicator
  beatIndicatorContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  countInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  countInLabel: {
    fontSize: 14,
    color: "#8a7a6a",
    marginRight: 12,
    width: 70,
  },
  countInBeats: {
    flexDirection: "row",
    alignItems: "center",
  },
  countInDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  countInDotActive: {
    backgroundColor: "#6b5a4a",
    borderColor: "#6b5a4a",
  },
  countInDotAccent: {
    borderColor: "#8a7a6a",
  },
  countInNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  countInNumberActive: {
    color: "#f5e6d3",
  },
  singRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  singLabel: {
    fontSize: 14,
    color: "#d4a574",
    marginRight: 12,
    width: 70,
    fontWeight: "600",
  },
  beatIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  beatDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  beatDotActive: {
    backgroundColor: "#d4a574",
    borderColor: "#d4a574",
  },
  beatDotAccent: {
    borderColor: "#f5e6d3",
  },
  beatDotStop: {
    borderColor: "#e57373",
  },
  beatDotStopActive: {
    backgroundColor: "#e57373",
    borderColor: "#e57373",
  },
  beatNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  beatNumberActive: {
    color: "#1a1410",
  },
  beatNumberStopActive: {
    color: "#fff",
  },
  subdivisionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2d241a",
    borderWidth: 1,
    borderColor: "#3b2c1a",
    marginHorizontal: 4,
    alignSelf: "center",
  },
  subdivisionDotActive: {
    backgroundColor: "#8b7355",
    borderColor: "#8b7355",
  },

  // Volume/visualizer
  volumeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  hearingText: {
    fontSize: 16,
    color: "#d4a574",
    marginTop: 12,
  },

  // Drone indicator
  droneIndicator: {
    backgroundColor: "#2d4a3a",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: "center",
  },
  droneText: {
    fontSize: 16,
    color: "#8fd4a4",
    fontWeight: "600",
  },

  // Results
  resultContainer: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  resultText: {
    fontSize: 16,
    textAlign: "center",
  },
  resultSuccess: {
    color: "#8fd4a4",
  },
  resultFail: {
    color: "#e5a574",
  },

  // Imagine
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
  },
  imagineEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagineHint: {
    fontSize: 16,
    color: "#8a7a6a",
    fontStyle: "italic",
  },

  // Notation
  notationContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  showNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  showNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 200,
    overflow: "visible",
  },
  hideNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  hideNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },

  // Feedback
  feedbackContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  feedbackPattern: {
    fontSize: 20,
    color: "#d4a574",
    marginBottom: 4,
  },
  feedbackDescription: {
    fontSize: 18,
    color: "#8a7a6a",
  },
  progressSummary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#2d241a",
    borderRadius: 12,
  },
  progressText: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
  },

  // Success
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8fd4a4",
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
  },

  // Buttons
  fixedBottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#2d241a",
  },
  primaryButton: {
    backgroundColor: "#d4a574",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1410",
  },
  secondaryButton: {
    backgroundColor: "#2d241a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#d4a574",
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: "#8a7a6a",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#1a1410",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#8a7a6a",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#d4a574",
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1410",
  },
});
