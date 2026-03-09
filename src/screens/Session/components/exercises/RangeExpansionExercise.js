/**
 * RangeExpansionExercise - Systematic range expansion one half-step at a time
 * 
 * Flow: INTRO → LISTEN → SING → PLAY → FEEDBACK
 * Anchor note displayed on staff throughout all phases.
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import useExerciseAudio from "../../../../hooks/useExerciseAudio";
import { usePitchDetection } from "../../../../hooks/usePitchDetection";
import { getAvailablePatterns, getSimplestPattern } from "../../../../constants/rangeExpansionPatterns";

// Constants for pitch detection
const CONTOUR_TOLERANCE_SEMITONES = 1; // How close intervals must be
const MIN_NOTE_DURATION_MS = 150; // Minimum time to consider a note change
const SILENCE_TIMEOUT_MS = 1500; // How long silence before analyzing

// For staff display
let NotationDisplay = null;
try {
  NotationDisplay = require("../../../../components/NotationDisplay").default;
} catch (e) {
  console.warn("NotationDisplay not available");
}

// Phases
const PHASE = {
  INTRO: 'intro',
  LISTEN: 'listen',
  SING_PREP: 'sing_prep',
  SING: 'sing',
  PLAY_PREP: 'play_prep',
  PLAY: 'play',
  FEEDBACK: 'feedback',
};

// Parse note name to components
function parseNoteName(noteName) {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  return {
    letter: letter.toUpperCase(),
    accidental,
    octave: parseInt(octaveStr, 10),
  };
}

// Convert note name to MIDI number
function noteToMidi(noteName) {
  const parsed = parseNoteName(noteName);
  if (!parsed) return 60;
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[parsed.letter];
  let noteIndex = letterIndex;
  if (parsed.accidental === '#') noteIndex += 1;
  if (parsed.accidental === 'b') noteIndex -= 1;
  return (parsed.octave + 1) * 12 + noteIndex;
}

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_EQUIVALENTS = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

function midiToNote(midi, preferFlats = true) {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  let noteName = CHROMATIC_NOTES[noteIndex];
  if (preferFlats && FLAT_EQUIVALENTS[noteName]) {
    noteName = FLAT_EQUIVALENTS[noteName];
  }
  return `${noteName}${octave}`;
}

// Generate MusicXML for single note on staff
function generateSingleNoteMusicXML(noteName, clef = 'treble') {
  const parsed = parseNoteName(noteName);
  if (!parsed) return null;
  
  let alter = 0;
  if (parsed.accidental === 'b') alter = -1;
  if (parsed.accidental === '#') alter = 1;
  
  const clefSign = clef === 'bass' ? 'F' : 'G';
  const clefLine = clef === 'bass' ? '4' : '2';
  const alterXML = alter !== 0 ? `        <alter>${alter}</alter>\n` : '';
  
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
  direction = "up",  // 'up' or 'down'
  clef = "treble",
}) {
  const audio = useExerciseAudio();
  
  // Calculate user's current range in semitones
  const currentRangeSemitones = useMemo(() => {
    const lowMidi = noteToMidi(userRangeLow);
    const highMidi = noteToMidi(userRangeHigh);
    return highMidi - lowMidi;
  }, [userRangeLow, userRangeHigh]);
  
  // Select pattern based on direction and range
  const pattern = useMemo(() => {
    const patternId = config?.pattern_id;
    if (patternId) {
      const available = getAvailablePatterns(direction, currentRangeSemitones);
      return available.find(p => p.id === patternId) || getSimplestPattern(direction, currentRangeSemitones);
    }
    return getSimplestPattern(direction, currentRangeSemitones);
  }, [config?.pattern_id, direction, currentRangeSemitones]);
  
  // Determine anchor note (the boundary we're expanding from)
  const anchorNote = direction === 'up' ? userRangeHigh : userRangeLow;
  const anchorMidi = noteToMidi(anchorNote);
  const anchorFreq = noteToFrequency(anchorNote);
  
  // Target note (the new note being added)
  const targetMidi = direction === 'up' ? anchorMidi + 1 : anchorMidi - 1;
  const targetNote = midiToNote(targetMidi, true);
  
  // State
  const [phase, setPhase] = useState(PHASE.INTRO);
  const [successfulRounds, setSuccessfulRounds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [singResult, setSingResult] = useState(null);
  const [playResult, setPlayResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const masteryThreshold = mastery?.correct_streak || 3;
  const unmountedRef = useRef(false);
  
  // Pitch detection state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMode, setRecordingMode] = useState(null); // 'sing' or 'play'
  const pitchHistoryRef = useRef([]); // Array of { midi, timestamp }
  const lastPitchTimeRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentPitchRef = useRef(null);
  
  // Pitch detection hook
  const {
    currentPitch,
    isSounding,
    isListening,
    volume,
  } = usePitchDetection({
    enabled: isRecording,
    volumeThreshold: 0.05,
    silenceDuration: 300,
    soundingFrequencyRange: { min: 60, max: 1200 },
  });
  
  // Keep currentPitchRef in sync
  useEffect(() => {
    currentPitchRef.current = currentPitch;
  }, [currentPitch]);
  
  useEffect(() => {
    return () => { unmountedRef.current = true; };
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
    if (pendingPitchRef.current && pendingPitchRef.current.midi === roundedMidi) {
      // Same pending pitch - check if stable long enough
      const elapsed = now - pendingPitchRef.current.startTime;
      if (elapsed >= PITCH_STABLE_MS) {
        // Pitch has been stable - record it
        pitchHistoryRef.current.push({ midi: roundedMidi, timestamp: pendingPitchRef.current.startTime });
        console.log(`[RangeExpansion] Recorded pitch: MIDI ${roundedMidi} (${midiToNote(roundedMidi)}) after ${elapsed}ms`);
        pendingPitchRef.current = null;
      }
    } else {
      // New pitch - start pending
      pendingPitchRef.current = { midi: roundedMidi, startTime: now };
    }
    
    lastPitchTimeRef.current = now;
  }, [currentPitch, isRecording]);
  
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
        if (!unmountedRef.current && isRecording) {
          analyzeContour();
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
   * Analyze recorded pitches and compare to expected pattern
   * Uses vote-counting and fundamental detection like StartOnCueExercise
   */
  const analyzeContour = useCallback(() => {
    const history = pitchHistoryRef.current;
    console.log(`[RangeExpansion] Analyzing ${history.length} pitch readings...`);
    
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
      const avgMidi = currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length;
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
    
    console.log(`[RangeExpansion] Detected notes: ${notes.map(m => midiToNote(m)).join(' → ')}`);
    
    // Check if we have enough notes
    if (notes.length < pattern.intervals.length) {
      finishRecording(false, `Expected ${pattern.intervals.length} notes, heard ${notes.length}`);
      return;
    }
    
    // Check first note is the same pitch class as anchor (octave equivalence)
    // This allows a tuba player to sing an octave higher, etc.
    const firstNotePitchClass = notes[0] % 12;
    const anchorPitchClass = anchorMidi % 12;
    const pitchClassDistance = Math.min(
      Math.abs(firstNotePitchClass - anchorPitchClass),
      12 - Math.abs(firstNotePitchClass - anchorPitchClass)
    );
    console.log(`[RangeExpansion] First note ${midiToNote(notes[0])} vs anchor ${anchorNote} (pitch class distance: ${pitchClassDistance})`);
    if (pitchClassDistance > 1) {
      finishRecording(false, `Start on ${anchorNote} (any octave)`);
      return;
    }
    
    // Calculate intervals from FIRST DETECTED NOTE (not anchor)
    // This checks the contour/shape they sang, regardless of slight pitch variance at start
    const detectedIntervals = notes.slice(0, pattern.intervals.length).map((midi, i) => {
      if (i === 0) return 0; // First interval is always 0 (relative to self)
      return midi - notes[0];
    });
    
    console.log(`[RangeExpansion] Detected intervals: [${detectedIntervals.join(', ')}]`);
    console.log(`[RangeExpansion] Expected intervals: [${pattern.intervals.join(', ')}]`);
    
    // Compare intervals - must be exact match (within 1 semitone means off by a half step!)
    let allMatch = true;
    for (let i = 0; i < pattern.intervals.length; i++) {
      const expected = pattern.intervals[i];
      const detected = detectedIntervals[i];
      const diff = Math.abs(expected - detected);
      
      // Strict: must match exactly (diff >= 1 means at least a half-step off)
      if (diff >= CONTOUR_TOLERANCE_SEMITONES) {
        console.log(`[RangeExpansion] Interval ${i} mismatch: expected ${expected}, got ${detected} (diff=${diff})`);
        allMatch = false;
        break;
      }
    }
    
    if (allMatch) {
      finishRecording(true, "Perfect contour!");
    } else {
      finishRecording(false, "Contour didn't match - try again");
    }
  }, [pattern]);
  
  /**
   * Finish recording and update state
   */
  const finishRecording = useCallback((success, message) => {
    console.log(`[RangeExpansion] Recording finished: ${success ? 'SUCCESS' : 'FAIL'} - ${message}`);
    
    setIsRecording(false);
    pitchHistoryRef.current = [];
    lastPitchTimeRef.current = null;
    pendingPitchRef.current = null;
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (recordingMode === 'sing') {
      setSingResult({ success, message });
      if (!unmountedRef.current) {
        setPhase(PHASE.PLAY_PREP);
      }
    } else if (recordingMode === 'play') {
      setPlayResult({ success, message });
      if (!unmountedRef.current) {
        setPhase(PHASE.FEEDBACK);
      }
    }
    
    setRecordingMode(null);
  }, [recordingMode]);
  
  // Generate MusicXML for anchor note display
  const anchorMusicXML = useMemo(() => {
    return generateSingleNoteMusicXML(anchorNote, clef);
  }, [anchorNote, clef]);
  
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
      const duration = (isLast && pattern.holdFinal) ? noteDuration * 1.5 : noteDuration;
      
      await audio.playNote(freq, duration);
      
      if (!isLast) {
        await new Promise(r => setTimeout(r, pauseBetween * 1000));
      }
    }
    
    if (!unmountedRef.current) {
      setIsPlaying(false);
    }
  }, [pattern, audio, anchorFreq]);
  
  // Handle phase transitions
  const handleStartListening = useCallback(async () => {
    setPhase(PHASE.LISTEN);
    await playPattern();
    if (!unmountedRef.current) {
      setPhase(PHASE.SING_PREP);
    }
  }, [playPattern]);
  
  const handleStartSinging = useCallback(() => {
    setPhase(PHASE.SING);
    // Start real pitch detection
    pitchHistoryRef.current = [];
    setRecordingMode('sing');
    setIsRecording(true);
    console.log('[RangeExpansion] Started recording for SING phase');
  }, []);
  
  const handleStartPlaying = useCallback(() => {
    setPhase(PHASE.PLAY);
    // Start real pitch detection
    pitchHistoryRef.current = [];
    setRecordingMode('play');
    setIsRecording(true);
    console.log('[RangeExpansion] Started recording for PLAY phase');
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
    setPhase(PHASE.INTRO);
  }, [singResult, playResult, successfulRounds, masteryThreshold, direction, targetNote, onComplete, onProgress]);
  
  const handleReplayModel = useCallback(async () => {
    await playPattern();
  }, [playPattern]);
  
  if (!pattern) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No expansion pattern available for your current range.</Text>
      </View>
    );
  }
  
  // Staff display component
  const StaffDisplay = () => (
    <View style={styles.staffContainer}>
      {NotationDisplay && anchorMusicXML ? (
        <NotationDisplay 
          musicxml={anchorMusicXML} 
          width={280} 
          height={180}
          zoom={0.5}
          showTitle={false}
        />
      ) : (
        <View style={styles.staffPlaceholder}>
          <Text style={styles.staffNoteText}>{anchorNote}</Text>
          <Text style={styles.staffLabel}>Your starting note</Text>
        </View>
      )}
    </View>
  );
  
  // INTRO PHASE
  if (phase === PHASE.INTRO) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎵 Expand Your Range</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Current {direction === 'up' ? 'high' : 'low'} note:</Text>
          <Text style={styles.infoNote}>{anchorNote}</Text>
          <Text style={styles.infoLabel}>Target:</Text>
          <Text style={styles.infoNote}>{targetNote}</Text>
        </View>
        
        <StaffDisplay />
        
        <View style={styles.patternBox}>
          <Text style={styles.patternName}>{pattern.name}</Text>
          <Text style={styles.patternSolfege}>{pattern.solfege}</Text>
          <Text style={styles.patternDesc}>{pattern.description}</Text>
        </View>
        
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Progress: {successfulRounds} / {masteryThreshold}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartListening}>
          <Text style={styles.primaryButtonText}>Listen to Model</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // LISTEN PHASE
  if (phase === PHASE.LISTEN) {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>👂 Listen...</Text>
        
        <StaffDisplay />
        
        <View style={styles.patternDisplay}>
          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>
        </View>
        
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <ActivityIndicator color="#4CAF50" size="large" />
            <Text style={styles.playingText}>Playing...</Text>
          </View>
        )}
      </View>
    );
  }
  
  // SING PREP PHASE
  if (phase === PHASE.SING_PREP) {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>🎤 Now Sing It Back</Text>
        
        <StaffDisplay />
        
        <View style={styles.patternDisplay}>
          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>
        </View>
        
        <Text style={styles.instruction}>
          Imagine the sound, then sing the pattern
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReplayModel}>
            <Text style={styles.secondaryButtonText}>🔊 Hear Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartSinging}>
            <Text style={styles.primaryButtonText}>Ready to Sing</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // SING PHASE
  if (phase === PHASE.SING) {
    const detectedNote = currentPitch?.midiNote ? midiToNote(Math.round(currentPitch.midiNote)) : null;
    const notesRecorded = pitchHistoryRef.current.length;
    
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>🎤 Sing Now...</Text>
        
        <StaffDisplay />
        
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, isSounding && styles.recordingDotActive]} />
          <Text style={styles.recordingText}>
            {isSounding ? `Hearing: ${detectedNote || '...'}` : 'Listening...'}
          </Text>
        </View>
        
        {/* Volume indicator */}
        <View style={styles.volumeBarContainer}>
          <View style={[styles.volumeBar, { width: `${Math.min(volume * 100, 100)}%` }]} />
        </View>
        
        <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>
        
        <Text style={styles.hintText}>
          {notesRecorded > 0 ? `Notes recorded: ${notesRecorded}` : 'Start singing the pattern'}
        </Text>
        <Text style={styles.hintTextSmall}>
          Stop singing and wait 1.5s to analyze
        </Text>
      </View>
    );
  }
  
  // PLAY PREP PHASE
  if (phase === PHASE.PLAY_PREP) {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>🎺 Now Play It</Text>
        
        <StaffDisplay />
        
        {singResult && (
          <View style={[styles.resultBox, singResult.success ? styles.resultSuccess : styles.resultFail]}>
            <Text style={styles.resultText}>Sing: {singResult.message}</Text>
          </View>
        )}
        
        <View style={styles.patternDisplay}>
          <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>
        </View>
        
        <Text style={styles.instruction}>
          Play the pattern on your instrument
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReplayModel}>
            <Text style={styles.secondaryButtonText}>🔊 Hear Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartPlaying}>
            <Text style={styles.primaryButtonText}>Ready to Play</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // PLAY PHASE
  if (phase === PHASE.PLAY) {
    const detectedNote = currentPitch?.midiNote ? midiToNote(Math.round(currentPitch.midiNote)) : null;
    const notesRecorded = pitchHistoryRef.current.length;
    
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>🎺 Play Now...</Text>
        
        <StaffDisplay />
        
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, isSounding && styles.recordingDotActive]} />
          <Text style={styles.recordingText}>
            {isSounding ? `Hearing: ${detectedNote || '...'}` : 'Listening...'}
          </Text>
        </View>
        
        {/* Volume indicator */}
        <View style={styles.volumeBarContainer}>
          <View style={[styles.volumeBar, { width: `${Math.min(volume * 100, 100)}%` }]} />
        </View>
        
        <Text style={styles.patternSolfegeLarge}>{pattern.solfege}</Text>
        
        <Text style={styles.hintText}>
          {notesRecorded > 0 ? `Notes recorded: ${notesRecorded}` : 'Start playing the pattern'}
        </Text>
        <Text style={styles.hintTextSmall}>
          Stop playing and wait 1.5s to analyze
        </Text>
      </View>
    );
  }
  
  // FEEDBACK PHASE
  if (phase === PHASE.FEEDBACK) {
    const overallSuccess = singResult?.success && playResult?.success;
    
    if (showSuccess) {
      return (
        <View style={styles.container}>
          <Text style={styles.successTitle}>🎉 Range Expanded!</Text>
          <Text style={styles.successNote}>New {direction === 'up' ? 'high' : 'low'} note: {targetNote}</Text>
          <StaffDisplay />
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>{overallSuccess ? '✅ Great!' : '🔄 Try Again'}</Text>
        
        <StaffDisplay />
        
        {singResult && (
          <View style={[styles.resultBox, singResult.success ? styles.resultSuccess : styles.resultFail]}>
            <Text style={styles.resultText}>🎤 Sing: {singResult.message}</Text>
          </View>
        )}
        
        {playResult && (
          <View style={[styles.resultBox, playResult.success ? styles.resultSuccess : styles.resultFail]}>
            <Text style={styles.resultText}>🎺 Play: {playResult.message}</Text>
          </View>
        )}
        
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Progress: {successfulRounds + (overallSuccess ? 1 : 0)} / {masteryThreshold}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleFeedbackComplete}>
          <Text style={styles.primaryButtonText}>
            {overallSuccess ? 'Continue' : 'Try Again'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  
  // Info box
  infoBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoNote: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 16,
  },
  
  // Staff
  staffContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    minHeight: 200,
  },
  staffPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  staffNoteText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  staffLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  
  // Pattern box
  patternBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  patternName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  patternSolfege: {
    fontSize: 20,
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  patternSolfegeLarge: {
    fontSize: 28,
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
    marginVertical: 16,
  },
  patternDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  patternDisplay: {
    marginVertical: 16,
  },
  
  // Progress
  progressRow: {
    marginVertical: 12,
  },
  progressText: {
    fontSize: 16,
    color: '#888',
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  
  // Playing indicator
  playingIndicator: {
    alignItems: 'center',
    marginTop: 20,
  },
  playingText: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
  },
  
  // Recording indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
  },
  recordingDotActive: {
    backgroundColor: '#f44336',
  },
  recordingText: {
    fontSize: 16,
    color: '#f44336',
  },
  
  // Volume indicator
  volumeBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginVertical: 8,
    overflow: 'hidden',
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  
  // Hints
  hintText: {
    fontSize: 14,
    color: '#888',
    marginTop: 16,
  },
  hintTextSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  
  // Instruction
  instruction: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 12,
  },
  
  // Results
  resultBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  resultSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  resultFail: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  resultText: {
    fontSize: 16,
    color: '#fff',
  },
  
  // Success
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  successNote: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  
  // Error
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
});
