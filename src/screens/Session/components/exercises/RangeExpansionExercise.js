/**
 * RangeExpansionExercise - Systematic range expansion one half-step at a time
 *
 * Flow: Listen → Sing → Imagine → Play (matches Day 0 FirstNote style)
 * Features focus cards and visual feedback like FirstNote stages.
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
} from "react-native";
import useExerciseAudio from "../../../../hooks/useExerciseAudio";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import {
  getAvailablePatterns,
  getSimplestPattern,
  PATTERNS_UP,
  PATTERNS_DOWN,
} from "../../../../constants/rangeExpansionPatterns";
import EDMVisualizer from "../../../../components/EDMVisualizer";
import { CircularVolumeIndicator } from "../../../../components/VolumeBar";
import { devLog, devWarn } from "../../../../utils/devLogger";
import { DAY0_FOCUS_CARDS } from "../../../FirstNote/data/focusCards";
import {
  parseNoteName,
  noteToMidi,
  midiToNote,
  midiToNoteInContext,
  shouldUseSharps,
  PITCH_DETECTION_OPTIONS,
  exercisePropTypes,
  exerciseDefaultProps,
} from "./shared";

// Constants for pitch detection
const CONTOUR_TOLERANCE_SEMITONES = 1; // How close intervals must be
const MIN_NOTE_DURATION_MS = 150; // Minimum time to consider a note change
const SILENCE_TIMEOUT_MS = 1500; // How long silence before analyzing

// For staff display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  devWarn("NotationDisplay not available");
}

// Simplified phases matching Day 0 flow
const PHASE = {
  INTRO: "intro",
  LISTEN: "listen",
  SING: "sing",
  IMAGINE: "imagine",
  PLAY: "play",
  FEEDBACK: "feedback",
};

/**
 * Lower a note chromatically while preserving the letter name.
 * Used for "di" → "do" relationships where di is a raised do.
 * B → Bb, C# → C, D → Db, etc.
 */
function chromaticLower(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return noteName;

  let newAccidental;
  if (parsed.accidental === "#") {
    newAccidental = ""; // sharp becomes natural
  } else if (parsed.accidental === "b") {
    newAccidental = "bb"; // flat becomes double-flat (rare)
  } else {
    newAccidental = "b"; // natural becomes flat
  }

  return `${parsed.letter}${newAccidental}${parsed.octave}`;
}

// Generate MusicXML for single note on staff
function generateSingleNoteMusicXML(noteName, clef = "treble") {
  const parsed = parseNoteName(noteName);
  if (!parsed) return null;

  let alter = 0;
  if (parsed.accidental === "b") alter = -1;
  if (parsed.accidental === "#") alter = 1;

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";
  const alterXML = alter !== 0 ? `        <alter>${alter}</alter>\n` : "";

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
        <divisions>1</divisions>
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
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

// Generate MusicXML for multiple notes (the full pattern)
function generatePatternMusicXML(noteNames, clef = "treble") {
  if (!noteNames || noteNames.length === 0) return null;

  const clefSign = clef === "bass" ? "F" : "G";
  const clefLine = clef === "bass" ? "4" : "2";

  // Track which accidentals we've seen for each letter in this measure
  // to determine when we need to show courtesy accidentals
  const lastAccidentalForLetter = {};

  const notesXML = noteNames
    .map((noteName, index) => {
      const parsed = parseNoteName(noteName);
      if (!parsed) return "";

      let alter = 0;
      let accidentalName = "natural";
      if (parsed.accidental === "b") {
        alter = -1;
        accidentalName = "flat";
      } else if (parsed.accidental === "#") {
        alter = 1;
        accidentalName = "sharp";
      }

      const alterXML = alter !== 0 ? `        <alter>${alter}</alter>\n` : "";

      // Always show accidental explicitly for each note to avoid confusion
      // when the same letter appears multiple times with different accidentals
      const accidentalXML = `        <accidental>${accidentalName}</accidental>\n`;

      return `      <note>
        <pitch>
          <step>${parsed.letter}</step>
${alterXML}          <octave>${parsed.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
${accidentalXML}      </note>`;
    })
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
        <divisions>1</divisions>
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

// Calculate frequency from note name
function noteToFrequency(noteName) {
  const midi = noteToMidi(noteName);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export default function RangeExpansionExercise({
  config,
  mastery,
  onComplete,
  onProgress,
  userRangeLow = "Bb3",
  userRangeHigh = "Bb3",
  direction: directionProp = "up", // 'up', 'down', or 'auto'
  clef = "treble",
  forcedPatternId = null, // Override pattern selection for testing
}) {
  const audio = useExerciseAudio();

  // Resolve 'auto' direction to actual direction
  // Logic: prefer expanding upward first, then alternate or choose based on range balance
  const direction = useMemo(() => {
    if (directionProp !== "auto") return directionProp;

    // Simple heuristic: if range is centered or bottom-heavy, go up; if top-heavy, go down
    // Could later be more sophisticated based on instrument typical ranges
    const lowMidi = noteToMidi(userRangeLow);
    const highMidi = noteToMidi(userRangeHigh);
    const rangeMidpoint = (lowMidi + highMidi) / 2;

    // For most instruments, middle C (60) is a reasonable reference
    // If user's range midpoint is above middle C, expand down; otherwise expand up
    return rangeMidpoint > 60 ? "down" : "up";
  }, [directionProp, userRangeLow, userRangeHigh]);

  // Calculate user's current range in semitones
  const currentRangeSemitones = useMemo(() => {
    const lowMidi = noteToMidi(userRangeLow);
    const highMidi = noteToMidi(userRangeHigh);
    return highMidi - lowMidi;
  }, [userRangeLow, userRangeHigh]);

  // Select pattern based on direction and range (forcedPatternId overrides)
  const pattern = useMemo(() => {
    const patternId = forcedPatternId || config?.pattern_id;
    if (patternId) {
      // When forcing a pattern, search ALL patterns (not filtered by range)
      const allPatterns = direction === "up" ? PATTERNS_UP : PATTERNS_DOWN;
      const found = allPatterns.find((p) => p.id === patternId);
      if (found) return found;
      // Fallback to filtered list if not found
      const available = getAvailablePatterns(direction, currentRangeSemitones);
      return (
        available.find((p) => p.id === patternId) ||
        getSimplestPattern(direction, currentRangeSemitones)
      );
    }
    return getSimplestPattern(direction, currentRangeSemitones);
  }, [forcedPatternId, config?.pattern_id, direction, currentRangeSemitones]);

  // Determine anchor note (the boundary we're expanding from)
  const anchorNote = direction === "up" ? userRangeHigh : userRangeLow;
  const anchorMidi = noteToMidi(anchorNote);
  const anchorFreq = noteToFrequency(anchorNote);

  devLog("[RangeExpansion] Props:", {
    userRangeLow,
    userRangeHigh,
    direction,
  });
  devLog("[RangeExpansion] Computed:", {
    anchorNote,
    anchorMidi,
    anchorFreq,
  });

  // Target note (the new note being added) - uses pattern's targetInterval
  // For "do di do" (interval 1): target = anchor + 1
  // For "do re do" (interval 2): target = anchor + 2
  const targetMidi = anchorMidi + pattern.targetInterval;
  const targetNote = midiToNoteInContext(targetMidi, anchorNote);

  // State - start directly at LISTEN (combined with former INTRO)
  const [phase, setPhase] = useState(PHASE.LISTEN);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHeardItButton, setShowHeardItButton] = useState(false);

  // Notation display state - on demand
  const [showNotation, setShowNotation] = useState(false);
  const [notationMode, setNotationMode] = useState("starting"); // 'starting' or 'full'

  // Hide notation when phase changes to avoid buggy re-rendering
  useEffect(() => {
    setShowNotation(false);
  }, [phase]);

  // Focus card rotation - cycle through cards each round
  const focusCardIndex = successfulRounds % DAY0_FOCUS_CARDS.length;
  const currentFocusCard = DAY0_FOCUS_CARDS[focusCardIndex];

  const masteryThreshold = mastery?.correct_streak || 3;
  const unmountedRef = useRef(false);

  // Pitch detection state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState(null); // 'sing' or 'play'
  const pitchHistoryRef = useRef([]); // Array of { midi, timestamp }
  const lastPitchTimeRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentPitchRef = useRef(null);
  const analyzeContourRef = useRef(null); // Ref to avoid circular dependency

  // Pitch detection hook - use static options to avoid infinite re-render loop
  const { currentPitch, isSounding, isListening, volume } = usePitchDetection({
    ...PITCH_DETECTION_OPTIONS,
    enabled: isRecording,
  });

  // Keep currentPitchRef in sync
  useEffect(() => {
    currentPitchRef.current = currentPitch;
  }, [currentPitch]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // Track pending pitch for debouncing
  const pendingPitchRef = useRef(null); // { midi, startTime }
  const PITCH_STABLE_MS = 150; // Pitch must be stable for 150ms to filter transition overshoots

  // Record pitch changes during recording (with debouncing)
  useEffect(() => {
    if (!isRecording || !currentPitch?.midiNote) return;

    const now = Date.now();
    const roundedMidi = Math.round(currentPitch.midiNote);

    const history = pitchHistoryRef.current;
    const lastRecorded = history[history.length - 1]?.midi;

    // If this pitch is same as last recorded, nothing to do
    if (roundedMidi === lastRecorded) {
      pendingPitchRef.current = null;
      lastPitchTimeRef.current = now;
      return;
    }

    // Check if this is a new pending pitch or continuation
    if (
      pendingPitchRef.current &&
      pendingPitchRef.current.midi === roundedMidi
    ) {
      // Same pending pitch - check if stable long enough
      const elapsed = now - pendingPitchRef.current.startTime;
      if (elapsed >= PITCH_STABLE_MS) {
        // Pitch has been stable - record it
        pitchHistoryRef.current.push({
          midi: roundedMidi,
          timestamp: pendingPitchRef.current.startTime,
        });
        devLog(
          `[RangeExpansion] Recorded pitch: MIDI ${roundedMidi} (${midiToNote(roundedMidi)}) after ${elapsed}ms`,
        );
        pendingPitchRef.current = null;
      }
    } else {
      // New pitch - start pending
      pendingPitchRef.current = { midi: roundedMidi, startTime: now };
    }

    lastPitchTimeRef.current = now;
  }, [currentPitch, isRecording]);

  // Commit pending pitch when sound stops (fixes bug where last note never gets recorded)
  useEffect(() => {
    if (!isRecording) return;

    // When sound stops, commit any pending pitch immediately
    if (!isSounding && pendingPitchRef.current) {
      const elapsed = Date.now() - pendingPitchRef.current.startTime;
      // Only commit if it was held for at least half the stable time
      if (elapsed >= PITCH_STABLE_MS / 2) {
        pitchHistoryRef.current.push({
          midi: pendingPitchRef.current.midi,
          timestamp: pendingPitchRef.current.startTime,
        });
        devLog(
          `[RangeExpansion] Committed pending pitch on silence: MIDI ${pendingPitchRef.current.midi} (${midiToNote(pendingPitchRef.current.midi)}) after ${elapsed}ms`,
        );
      }
      pendingPitchRef.current = null;
    }
  }, [isSounding, isRecording]);

  // Handle silence detection - analyze after user stops
  useEffect(() => {
    if (!isRecording) return;

    // Clear any existing timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (isSounding) {
      // User is making sound, reset silence timer
      return;
    }

    // User stopped - wait for silence timeout then analyze
    if (pitchHistoryRef.current.length > 0) {
      silenceTimerRef.current = setTimeout(() => {
        if (!unmountedRef.current && isRecording && analyzeContourRef.current) {
          analyzeContourRef.current();
        }
      }, SILENCE_TIMEOUT_MS);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isSounding, isRecording]);

  /**
   * Finish recording and update state
   */
  const finishRecording = useCallback(
    (success, message) => {
      devLog(
        `[RangeExpansion] Recording finished: ${success ? "SUCCESS" : "FAIL"} - ${message}`,
      );

      setIsRecording(false);
      pitchHistoryRef.current = [];
      lastPitchTimeRef.current = null;
      pendingPitchRef.current = null;

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // Just set the result - don't change phases (Day 0 style: user clicks "Done")
      if (recordingMode === "sing") {
        setSingResult({ success, message });
      } else if (recordingMode === "play") {
        setPlayResult({ success, message });
      }

      setRecordingMode(null);
    },
    [recordingMode],
  );

  /**
   * Analyze recorded pitches and compare to expected pattern
   * Uses vote-counting and fundamental detection like StartOnCueExercise
   */
  const analyzeContour = useCallback(() => {
    const history = pitchHistoryRef.current;
    devLog(`[RangeExpansion] Analyzing ${history.length} pitch readings...`);

    if (history.length < 2) {
      // Not enough data
      finishRecording(false, "Couldn't detect your melody - try again");
      return;
    }

    // Segment pitches into distinct notes using vote counting
    // Group consecutive similar pitches into "notes"
    const notes = [];
    let currentGroup = [history[0].midi];
    let groupStart = history[0].timestamp;

    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      const timeSinceLast = entry.timestamp - history[i - 1].timestamp;
      const avgMidi =
        currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length;
      const diff = Math.abs(entry.midi - avgMidi);

      // If pitch changed significantly or there's a gap, start a new note
      if (diff > 1.5 || timeSinceLast > 500) {
        // Save current group as a note (use median for stability)
        const sortedGroup = [...currentGroup].sort((a, b) => a - b);
        const medianMidi = sortedGroup[Math.floor(sortedGroup.length / 2)];
        notes.push(Math.round(medianMidi));

        currentGroup = [entry.midi];
        groupStart = entry.timestamp;
      } else {
        currentGroup.push(entry.midi);
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      const sortedGroup = [...currentGroup].sort((a, b) => a - b);
      const medianMidi = sortedGroup[Math.floor(sortedGroup.length / 2)];
      notes.push(Math.round(medianMidi));
    }

    devLog(
      `[RangeExpansion] Detected notes: ${notes.map((m) => midiToNote(m)).join(" → ")}`,
    );

    // Check if we have enough notes
    if (notes.length < pattern.intervals.length) {
      finishRecording(
        false,
        `Expected ${pattern.intervals.length} notes, heard ${notes.length}`,
      );
      return;
    }

    // For singing, check that they hit each expected pitch in the right order
    // This is more forgiving - allows overtone blips or transition notes between targets
    // Uses pitch class matching to allow octave equivalence (tuba player can sing up an octave)

    // Calculate expected pitch classes from pattern intervals (relative to anchor pitch class)
    const anchorPitchClass = anchorMidi % 12;
    const expectedPitchClasses = pattern.intervals.map(
      (interval) => (anchorPitchClass + interval + 120) % 12, // +120 to handle negative intervals
    );

    devLog(
      `[RangeExpansion] Expected pitch classes: [${expectedPitchClasses.join(", ")}] (from anchor ${anchorNote})`,
    );
    devLog(
      `[RangeExpansion] Detected notes: [${notes.map((m) => `${midiToNote(m)}(${m % 12})`).join(", ")}]`,
    );

    // Scan through detected notes to find each expected pitch class in order
    let searchFrom = 0;
    let allFound = true;
    const foundIndices = [];

    for (let i = 0; i < expectedPitchClasses.length; i++) {
      const targetPC = expectedPitchClasses[i];
      let found = false;

      // Look for this pitch class starting from where we left off
      for (let j = searchFrom; j < notes.length; j++) {
        const notePC = notes[j] % 12;
        // Allow tolerance of 1 semitone for pitch class comparison
        const pcDistance = Math.min(
          Math.abs(notePC - targetPC),
          12 - Math.abs(notePC - targetPC),
        );

        if (pcDistance < CONTOUR_TOLERANCE_SEMITONES) {
          found = true;
          foundIndices.push(j);
          searchFrom = j + 1; // Next search starts after this note
          devLog(
            `[RangeExpansion] Found expected pitch ${i + 1}/${expectedPitchClasses.length}: ` +
              `${midiToNote(notes[j])} (PC ${notePC}) matches target PC ${targetPC}`,
          );
          break;
        }
      }

      if (!found) {
        devLog(
          `[RangeExpansion] Missing pitch ${i + 1}/${expectedPitchClasses.length}: ` +
            `couldn't find pitch class ${targetPC} after index ${searchFrom}`,
        );
        allFound = false;
        break;
      }
    }

    if (allFound) {
      finishRecording(true, "Perfect contour!");
    } else {
      finishRecording(false, "Contour didn't match - try again");
    }
  }, [pattern, anchorMidi, anchorNote, finishRecording]);

  // Keep ref updated with latest analyzeContour
  useEffect(() => {
    analyzeContourRef.current = analyzeContour;
  }, [analyzeContour]);

  // Calculate the first note of the pattern (may differ from anchor for patterns like "Descend from Above")
  const firstNoteMidi = anchorMidi + (pattern?.intervals?.[0] || 0);
  const firstNote = midiToNoteInContext(firstNoteMidi, anchorNote);

  // Generate MusicXML for first note display (what user will hear/sing first)
  const anchorMusicXML = useMemo(() => {
    return generateSingleNoteMusicXML(firstNote, clef);
  }, [firstNote, clef]);

  // Generate all pattern notes for full notation display
  // For interval 0, use the anchor note directly to ensure consistency
  const patternNotes = useMemo(() => {
    if (!pattern?.intervals) return [];
    devLog("[PatternNotes] anchorNote:", anchorNote, "anchorMidi:", anchorMidi);
    devLog("[PatternNotes] intervals:", pattern.intervals);
    const notes = pattern.intervals.map((interval, idx) => {
      if (interval === 0) {
        // Return anchor note directly for "home" positions
        devLog(
          `[PatternNotes] idx ${idx}: interval=0, returning anchorNote=${anchorNote}`,
        );
        return anchorNote;
      }
      const midi = anchorMidi + interval;
      const note = midiToNoteInContext(midi, anchorNote);
      devLog(
        `[PatternNotes] idx ${idx}: interval=${interval}, midi=${midi}, note=${note}`,
      );
      return note;
    });
    devLog("[PatternNotes] result:", notes);
    return notes;
  }, [pattern?.intervals, anchorMidi, anchorNote]);

  // Generate MusicXML for full pattern display
  const patternMusicXML = useMemo(() => {
    return generatePatternMusicXML(patternNotes, clef);
  }, [patternNotes, clef]);

  // Get the currently detected note name for display
  const detectedNoteName = useMemo(() => {
    if (!currentPitch?.midiNote || !isSounding) return null;
    const roundedMidi = Math.round(currentPitch.midiNote);
    return midiToNote(roundedMidi, true); // prefer flats
  }, [currentPitch?.midiNote, isSounding]);

  // Play the pattern as model
  const playPattern = useCallback(async () => {
    if (!pattern || !audio.playNote) return;

    setIsPlaying(true);
    const noteDuration = pattern.holdFinal ? 1.5 : 0.8;
    const pauseBetween = 0.3;

    for (let i = 0; i < pattern.intervals.length; i++) {
      if (unmountedRef.current) break;

      const interval = pattern.intervals[i];
      const freq = anchorFreq * Math.pow(2, interval / 12);
      const isLast = i === pattern.intervals.length - 1;
      const duration =
        isLast && pattern.holdFinal ? noteDuration * 1.5 : noteDuration;

      await audio.playNote(freq, duration);

      if (!isLast) {
        await new Promise((r) => setTimeout(r, pauseBetween * 1000));
      }
    }

    if (!unmountedRef.current) {
      setIsPlaying(false);
    }
  }, [pattern, audio, anchorFreq]);

  // Handle phase transitions - simpler Day 0 style flow
  const handlePlayModel = useCallback(async () => {
    setShowHeardItButton(false);
    await playPattern();
    if (!unmountedRef.current) {
      setShowHeardItButton(true);
    }
  }, [playPattern]);

  const handleHeardIt = useCallback(() => {
    setPhase(PHASE.SING);
    setSingResult(null);
    pitchHistoryRef.current = [];
    setRecordingMode("sing");
    setIsRecording(true);
    devLog("[RangeExpansion] Started recording for SING phase");
  }, []);

  const handleDoneSinging = useCallback(() => {
    // Stop recording and move to imagine - results are already set by finishRecording
    if (isRecording) {
      // Force analyze if still recording
      if (analyzeContourRef.current) {
        analyzeContourRef.current();
      }
    }
    setPhase(PHASE.IMAGINE);
    devLog("[RangeExpansion] Moving to IMAGINE phase");
  }, [isRecording]);

  const handleTrySingAgain = useCallback(() => {
    // Reset singing state and try again
    setSingResult(null);
    pitchHistoryRef.current = [];
    setRecordingMode("sing");
    setIsRecording(true);
    devLog("[RangeExpansion] Trying sing again");
  }, []);

  const handleDoneImagining = useCallback(() => {
    setPhase(PHASE.PLAY);
    setPlayResult(null);
    pitchHistoryRef.current = [];
    setRecordingMode("play");
    setIsRecording(true);
    devLog("[RangeExpansion] Started recording for PLAY phase");
  }, []);

  const handleDonePlaying = useCallback(() => {
    // Force analyze if still recording, then move to feedback
    if (isRecording && analyzeContourRef.current) {
      analyzeContourRef.current();
    }
    setPhase(PHASE.FEEDBACK);
    devLog("[RangeExpansion] Moving to FEEDBACK phase");
  }, [isRecording]);

  const handleTryPlayAgain = useCallback(() => {
    // Reset playing state and try again
    setPlayResult(null);
    pitchHistoryRef.current = [];
    setRecordingMode("play");
    setIsRecording(true);
    devLog("[RangeExpansion] Trying play again");
  }, []);

  const handleFeedbackComplete = useCallback(() => {
    const wasSuccessful = singResult?.success && playResult?.success;

    if (wasSuccessful) {
      const newSuccessful = successfulRounds + 1;
      setSuccessfulRounds(newSuccessful);

      if (newSuccessful >= masteryThreshold) {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete?.({
            success: true,
            direction,
            targetNote,
            roundsCompleted: newSuccessful,
          });
        }, 2000);
        return;
      }

      onProgress?.({
        roundsCompleted: newSuccessful,
        masteryRequired: masteryThreshold,
        direction,
      });
    }

    // Reset for next round
    setSingResult(null);
    setPlayResult(null);
    setShowHeardItButton(false);
    setPhase(PHASE.LISTEN);
  }, [
    singResult,
    playResult,
    successfulRounds,
    masteryThreshold,
    direction,
    targetNote,
    onComplete,
    onProgress,
  ]);

  if (!pattern) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          No expansion pattern available for your current range.
        </Text>
      </View>
    );
  }

  // Staff display component - shows based on notationMode
  const StaffDisplay = ({ compact = false }) => {
    const musicXML = notationMode === "full" ? patternMusicXML : anchorMusicXML;
    const width =
      notationMode === "full" ? (compact ? 300 : 350) : compact ? 200 : 280;

    return (
      <View
        style={[styles.staffContainer, compact && styles.staffContainerCompact]}
      >
        {NotationDisplay && musicXML ? (
          <NotationDisplay
            musicxml={musicXML}
            width={width}
            height={compact ? 180 : 250}
            showTitle={false}
          />
        ) : (
          <View style={styles.staffPlaceholder}>
            <Text style={styles.staffNoteText}>
              {notationMode === "full" ? patternNotes.join(" → ") : anchorNote}
            </Text>
            <Text style={styles.staffLabel}>
              {notationMode === "full" ? "Full pattern" : "Starting note"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Notation toggle component - on-demand notation with mode selection
  const NotationToggle = () => (
    <View style={styles.notationToggle}>
      {!showNotation ? (
        <TouchableOpacity
          accessibilityLabel="Show notation"
          accessibilityRole="button"
          style={styles.notationToggleButton}
          onPress={() => setShowNotation(true)}
        >
          <Text style={styles.notationToggleText}>📜 Show Notation</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.notationToggleContainer}>
          <View style={styles.notationModeRow}>
            <TouchableOpacity
              accessibilityLabel="Show starting note"
              accessibilityRole="button"
              style={[
                styles.notationModeButton,
                notationMode === "starting" && styles.notationModeButtonActive,
              ]}
              onPress={() => setNotationMode("starting")}
            >
              <Text
                style={[
                  styles.notationModeText,
                  notationMode === "starting" && styles.notationModeTextActive,
                ]}
              >
                Starting Note
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Show full pattern"
              accessibilityRole="button"
              style={[
                styles.notationModeButton,
                notationMode === "full" && styles.notationModeButtonActive,
              ]}
              onPress={() => setNotationMode("full")}
            >
              <Text
                style={[
                  styles.notationModeText,
                  notationMode === "full" && styles.notationModeTextActive,
                ]}
              >
                Full Pattern
              </Text>
            </TouchableOpacity>
          </View>
          <StaffDisplay />
          <TouchableOpacity
            accessibilityLabel="Hide notation"
            accessibilityRole="button"
            style={styles.notationHideButton}
            onPress={() => setShowNotation(false)}
          >
            <Text style={styles.notationHideText}>Hide Notation</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Focus card display component
  const FocusCardDisplay = () => (
    <View style={styles.focusCard}>
      <Text style={styles.focusCardTitle}>{currentFocusCard.name}</Text>
      <Text style={styles.focusCardDescription}>
        {currentFocusCard.description}
      </Text>
      <Text style={styles.focusCardCue}>{currentFocusCard.cue}</Text>
    </View>
  );

  // Progress dots - Day 0 style
  const ProgressDots = () => (
    <View style={styles.progressBar}>
      {[...Array(masteryThreshold)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i < successfulRounds && styles.progressDotComplete,
            i === successfulRounds && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  // LISTEN PHASE - Combined intro + listen (Day 0 style)
  if (phase === PHASE.LISTEN) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <ProgressDots />

          <Text style={styles.stageTitle}>Expand Your Range</Text>

          <Text style={styles.noteDisplay}>{targetNote}</Text>
          <Text style={styles.subtitle}>
            {direction === "up" ? "Reaching higher" : "Reaching lower"} from{" "}
            {anchorNote}
          </Text>

          <FocusCardDisplay />

          <View style={styles.patternBox}>
            <Text style={styles.patternSolfege}>{pattern.solfege}</Text>
            <Text style={styles.patternDesc}>{pattern.description}</Text>
          </View>

          <Text style={styles.instruction}>
            Tap "Hear Pattern" to listen, then confirm when you've got it.
          </Text>

          <NotationToggle />
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {showHeardItButton ? (
            <>
              <TouchableOpacity
                accessibilityLabel={
                  isPlaying ? "Playing pattern" : "Hear again"
                }
                accessibilityRole="button"
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={handlePlayModel}
                disabled={isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="I heard it, continue"
                accessibilityRole="button"
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={handleHeardIt}
              >
                <Text style={styles.primaryButtonText}>I Heard It →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              accessibilityLabel={
                isPlaying ? "Playing pattern" : "Hear pattern"
              }
              accessibilityRole="button"
              style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
              onPress={handlePlayModel}
              disabled={isPlaying}
            >
              <Text style={styles.primaryButtonText}>
                {isPlaying ? "🔊 Playing..." : "🔊 Hear Pattern"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // SING PHASE - Day 0 style with EDMVisualizer
  if (phase === PHASE.SING) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <ProgressDots />

          <Text style={styles.stageTitle}>Sing</Text>

          <FocusCardDisplay />

          <Text style={styles.instruction}>
            Sing the pattern on solfege.{"\n"}Match the pitches you just heard.
          </Text>

          {!singResult && (
            <>
              <EDMVisualizer
                volume={volume}
                pitchAccuracy={isSounding ? "listening" : null}
              />

              {detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </>
          )}

          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>

          {singResult && (
            <Text
              style={
                singResult.success ? styles.successText : styles.feedbackError
              }
            >
              {singResult.success ? "✓ Great!" : singResult.message}
            </Text>
          )}

          <Text style={styles.hint}>
            Sing each syllable clearly: {pattern.solfege}
          </Text>

          <NotationToggle />
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {singResult && !singResult.success ? (
            <>
              <TouchableOpacity
                accessibilityLabel="Try singing again"
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={handleTrySingAgain}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Continue anyway"
                accessibilityRole="button"
                style={[styles.secondaryButton, { marginTop: 8 }]}
                onPress={handleDoneSinging}
              >
                <Text style={styles.secondaryButtonText}>
                  Continue Anyway →
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              accessibilityLabel={
                singResult?.success ? "Continue" : "Done singing, continue"
              }
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={handleDoneSinging}
            >
              <Text style={styles.primaryButtonText}>
                {singResult?.success ? "Continue →" : "Done Singing →"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // IMAGINE PHASE - Day 0 style with CircularVolumeIndicator
  if (phase === PHASE.IMAGINE) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <ProgressDots />

          <Text style={styles.stageTitle}>Imagine</Text>

          <FocusCardDisplay />

          <Text style={styles.instruction}>
            Hear the pattern clearly in your head.{"\n\n"}
            Imagine your instrument's sound—with resonance and projection.
          </Text>

          <CircularVolumeIndicator
            volume={0.3}
            pitchAccuracy="listening"
            size={120}
          />

          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>

          <Text style={styles.hint}>
            Take a few seconds to really hear it internally...
          </Text>

          <NotationToggle />
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isPlaying && styles.buttonDisabled,
              ]}
              onPress={handlePlayModel}
              disabled={isPlaying}
            >
              <Text style={styles.secondaryButtonText}>
                {isPlaying ? "Playing..." : "Listen Again"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setPhase(PHASE.SING);
                setSingResult(null);
                pitchHistoryRef.current = [];
                setRecordingMode("sing");
                setIsRecording(true);
              }}
            >
              <Text style={styles.secondaryButtonText}>Sing Again</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDoneImagining}
          >
            <Text style={styles.primaryButtonText}>Play →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PLAY PHASE - Day 0 style with EDMVisualizer
  if (phase === PHASE.PLAY) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <ProgressDots />

          <Text style={styles.stageTitle}>Play</Text>

          <FocusCardDisplay />

          <Text style={styles.instruction}>
            Play the pattern on your instrument.
          </Text>

          {!playResult && (
            <>
              <EDMVisualizer
                volume={volume}
                pitchAccuracy={isSounding ? "listening" : null}
              />

              {detectedNoteName && (
                <Text style={styles.hearingText}>
                  Hearing: {detectedNoteName}
                </Text>
              )}
            </>
          )}

          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>

          {playResult && (
            <Text
              style={
                playResult.success ? styles.successText : styles.feedbackError
              }
            >
              {playResult.success ? "✓ Great!" : playResult.message}
            </Text>
          )}

          <Text style={styles.hint}>
            Play each note of the pattern with focus and intention.
          </Text>

          <NotationToggle />
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          {playResult && !playResult.success ? (
            // Show Try Again when playing was incorrect
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleTryPlayAgain}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 8 }]}
                onPress={handleDonePlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  Continue Anyway →
                </Text>
              </TouchableOpacity>
            </>
          ) : playResult?.success ? (
            // Success - Hear Again on top, Continue below (closest to thumb)
            <>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  isPlaying && styles.buttonDisabled,
                ]}
                onPress={handlePlayModel}
                disabled={isPlaying}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPlaying ? "🔊 Playing..." : "🔊 Hear Again"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 8 }]}
                onPress={handleDonePlaying}
              >
                <Text style={styles.primaryButtonText}>Continue →</Text>
              </TouchableOpacity>
            </>
          ) : (
            // No result yet - just show Done Playing
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDonePlaying}
            >
              <Text style={styles.primaryButtonText}>Done Playing →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // FEEDBACK PHASE - Day 0 style results
  if (phase === PHASE.FEEDBACK) {
    const overallSuccess = singResult?.success && playResult?.success;

    if (showSuccess) {
      return (
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.successTitle}>🎉 Range Expanded!</Text>
            <Text style={styles.successNote}>
              New {direction === "up" ? "high" : "low"} note: {targetNote}
            </Text>
            <NotationToggle />
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <ProgressDots />

          <Text style={styles.stageTitle}>
            {overallSuccess ? "Well Done!" : "Try Again"}
          </Text>

          <View style={styles.resultSummary}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>🎤 Sing</Text>
              <Text
                style={
                  singResult?.success ? styles.resultSuccess : styles.resultFail
                }
              >
                {singResult?.success ? "✓" : "✗"}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>🎺 Play</Text>
              <Text
                style={
                  playResult?.success ? styles.resultSuccess : styles.resultFail
                }
              >
                {playResult?.success ? "✓" : "✗"}
              </Text>
            </View>
          </View>

          <Text style={styles.progressText}>
            Round {successfulRounds + (overallSuccess ? 1 : 0)} of{" "}
            {masteryThreshold}
          </Text>

          <NotationToggle />
        </ScrollView>

        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleFeedbackComplete}
          >
            <Text style={styles.primaryButtonText}>
              {overallSuccess ? "Continue →" : "Try Again"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// PropTypes validation
RangeExpansionExercise.propTypes = exercisePropTypes;
RangeExpansionExercise.defaultProps = exerciseDefaultProps;

const styles = StyleSheet.create({
  // Container - Day 0 warm theme
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#1a1410",
  },

  // Progress bar - Day 0 style dots
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b2c1a",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  progressDotActive: {
    backgroundColor: "#FFD700",
    transform: [{ scale: 1.3 }],
  },
  progressDotComplete: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },

  // Stage title - Day 0 style
  stageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },

  // Note display - large prominent note
  noteDisplay: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#FFD700",
    marginVertical: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 16,
    textAlign: "center",
  },

  // Focus cards - Day 0 style
  focusCard: {
    backgroundColor: "#2a1f15",
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: "100%",
    maxWidth: 400,
  },
  focusCardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  focusCardDescription: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  focusCardCue: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Staff container
  staffContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
  },
  staffContainerCompact: {
    marginVertical: 8,
  },
  staffPlaceholder: {
    alignItems: "center",
    padding: 20,
  },
  staffNoteText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
  },
  staffLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 20,
  },

  // Notation toggle styles
  notationToggle: {
    width: "100%",
    alignItems: "center",
    marginVertical: 16,
  },
  notationToggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    backgroundColor: "transparent",
  },
  notationToggleText: {
    color: "#FFD700",
    fontSize: 16,
  },
  notationToggleContainer: {
    width: "100%",
    alignItems: "center",
  },
  notationModeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  notationModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3b2c1a",
    backgroundColor: "#2a1f15",
  },
  notationModeButtonActive: {
    borderColor: "#FFD700",
    backgroundColor: "#3b2c1a",
  },
  notationModeText: {
    color: "#888",
    fontSize: 14,
  },
  notationModeTextActive: {
    color: "#FFD700",
    fontWeight: "600",
  },
  notationHideButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  notationHideText: {
    color: "#888",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // Pattern display
  patternBox: {
    backgroundColor: "#2a1f15",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  patternSolfege: {
    fontSize: 20,
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
  patternSolfegeLarge: {
    fontSize: 28,
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
    marginVertical: 12,
  },
  patternDesc: {
    fontSize: 14,
    color: "#a09080",
    textAlign: "center",
  },

  // Instruction text
  instruction: {
    fontSize: 18,
    color: "#fffbe6",
    textAlign: "center",
    lineHeight: 28,
    marginVertical: 16,
    paddingHorizontal: 10,
  },

  hint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },

  // Progress text
  progressText: {
    fontSize: 16,
    color: "#a09080",
    textAlign: "center",
    marginVertical: 8,
  },

  // Buttons - Day 0 style
  fixedBottomButtons: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginVertical: 8,
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },

  // Feedback text
  successText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
    marginVertical: 8,
  },
  feedbackError: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginVertical: 8,
  },
  hearingText: {
    fontSize: 20,
    color: "#FFD700",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },

  // Results summary - Day 0 style
  resultSummary: {
    backgroundColor: "#2a1f15",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 300,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  resultLabel: {
    fontSize: 16,
    color: "#fffbe6",
  },
  resultSuccess: {
    fontSize: 20,
    color: "#4CAF50",
  },
  resultFail: {
    fontSize: 20,
    color: "#ff6b6b",
  },

  // Success screen
  successTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  successNote: {
    fontSize: 20,
    color: "#fffbe6",
    marginBottom: 20,
    textAlign: "center",
  },

  // Error
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
});
