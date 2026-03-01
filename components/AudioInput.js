import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";

/**
 * AudioInput Component for capturing and analyzing microphone input
 * 
 * Used in Day 0 first-note experience for:
 * - Detecting when user is singing/playing (volume threshold)
 * - Detecting pitch to verify they're playing the correct note
 * 
 * Props:
 * - onVolumeChange: Callback with volume level (0-1)
 * - onPitchDetected: Callback with detected pitch info { frequency, noteName, cents }
 * - onSoundStart: Callback when sound starts (above threshold)
 * - onSoundEnd: Callback when sound ends (below threshold for duration)
 * - targetNote: Target note name for pitch comparison (e.g., "Bb3")
 * - onPitchMatch: Callback when playing correct pitch (within margin)
 * - volumeThreshold: Minimum volume to consider "sound" (default 0.02)
 * - silenceDuration: Ms of silence before onSoundEnd fires (default 1500)
 * - enabled: Whether to actively listen (default true)
 * - showDebug: Show debug info (default false)
 */

// Note frequencies for pitch detection (equal temperament, A4 = 440Hz)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function frequencyToNote(frequency) {
  if (!frequency || frequency < 20 || frequency > 5000) {
    return null;
  }
  
  // Calculate semitones from A4 (440Hz)
  const semitones = 12 * Math.log2(frequency / 440);
  const midiNote = Math.round(semitones) + 69; // A4 = MIDI 69
  
  // Get note name and octave
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  
  // Calculate cents off from perfect pitch
  const exactMidi = semitones + 69;
  const cents = Math.round((exactMidi - midiNote) * 100);
  
  return {
    frequency,
    noteName: `${noteName}${octave}`,
    noteNameShort: noteName,
    octave,
    midiNote,
    cents,
    isInTune: Math.abs(cents) < 20, // Within 20 cents = in tune
  };
}

function noteNameToMidi(noteName) {
  // Parse note name like "Bb3", "F#4", "C5"
  if (!noteName) return null;
  
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  
  const [, letter, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter.toUpperCase()];
  if (letterIndex === undefined) return null;
  
  let noteIndex = letterIndex;
  if (accidental === '#') noteIndex += 1;
  if (accidental === 'b') noteIndex -= 1;
  noteIndex = ((noteIndex % 12) + 12) % 12;
  
  return (octave + 1) * 12 + noteIndex;
}

function autoCorrelate(buffer, sampleRate) {
  // Simplified pitch detection using true autocorrelation
  // Optimized for voice and instrument detection
  
  const SIZE = buffer.length;
  let rms = 0;
  
  // Calculate RMS for volume
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  if (rms < 0.005) {
    // Not enough signal
    return { frequency: -1, rms, confidence: 0 };
  }
  
  console.log('[PITCH] RMS:', rms.toFixed(4));
  
  // Improved autocorrelation - look for first significant peak after initial decline
  // Minimum frequency we care about: ~70Hz (below bass voice)
  // Maximum frequency we care about: ~1400Hz (above soprano)
  const minPeriod = Math.floor(sampleRate / 1400); // ~31 samples at 44100
  const maxPeriod = Math.floor(sampleRate / 70);   // ~630 samples at 44100
  
  let correlations = [];
  
  // Compute autocorrelation for each lag
  for (let lag = minPeriod; lag <= maxPeriod && lag < SIZE / 2; lag++) {
    let sum = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }
    
    // Normalized correlation (-1 to 1)
    const norm = Math.sqrt(norm1 * norm2);
    const correlation = norm > 0 ? sum / norm : 0;
    correlations.push({ lag, correlation });
  }
  
  if (correlations.length === 0) {
    console.log('[PITCH] No correlations computed');
    return { frequency: -1, rms, confidence: 0 };
  }
  
  // Find the first significant peak (local maximum above threshold)
  let bestLag = -1;
  let bestCorrelation = 0;
  
  for (let i = 1; i < correlations.length - 1; i++) {
    const prev = correlations[i - 1].correlation;
    const curr = correlations[i].correlation;
    const next = correlations[i + 1].correlation;
    
    // Is this a local maximum?
    if (curr > prev && curr > next && curr > 0.3 && curr > bestCorrelation) {
      bestCorrelation = curr;
      bestLag = correlations[i].lag;
      
      // Parabolic interpolation for sub-sample accuracy
      const denom = 2 * curr - prev - next;
      if (denom !== 0) {
        const delta = (next - prev) / (2 * denom);
        bestLag += delta;
      }
      
      // Take the first good peak (fundamental frequency)
      if (bestCorrelation > 0.5) break;
    }
  }
  
  console.log('[PITCH] Best correlation:', bestCorrelation.toFixed(3), 'lag:', bestLag);
  
  if (bestCorrelation > 0.3 && bestLag > 0) {
    const frequency = sampleRate / bestLag;
    console.log('[PITCH] Detected:', frequency.toFixed(1), 'Hz');
    return { frequency, rms, confidence: bestCorrelation };
  }
  
  console.log('[PITCH] No pitch detected');
  return { frequency: -1, rms, confidence: 0 };
}

export default function AudioInput({
  onVolumeChange,
  onPitchDetected,
  onRealtimePitch,  // NEW: fires during active sound with current pitch
  onSoundStart,
  onSoundEnd,
  targetNote,
  onPitchMatch,
  volumeThreshold = 0.02,
  silenceDuration = 1500,
  pitchMargin = 100, // cents margin for "correct" pitch
  enabled = true,
  showDebug = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [isSounding, setIsSounding] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const soundStartedRef = useRef(false);
  
  // Pitch stability tracking - buffer all readings during sound, then average
  const pitchBufferRef = useRef([]); // Array of {midi, timestamp}
  const stablePitchRef = useRef(null);
  const AVERAGING_WINDOW_MS = 1000; // Average over last 1 second of sound
  
  const targetMidi = targetNote ? noteNameToMidi(targetNote) : null;
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);
  
  // Start/stop based on enabled prop - auto-request permission
  useEffect(() => {
    if (enabled && !isListening && Platform.OS === "web") {
      // startListening already handles permission request
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled]);
  
  const startListening = useCallback(async () => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      
      mediaStreamRef.current = stream;
      setPermissionGranted(true);
      
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start analyzing
      setIsListening(true);
      setError(null);
      analyze();
      
    } catch (err) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found.");
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsListening(false);
    setVolume(0);
    setCurrentPitch(null);
    setIsSounding(false);
    soundStartedRef.current = false;
    // Clear pitch buffer on stop
    pitchBufferRef.current = [];
    stablePitchRef.current = null;
  }, []);
  
  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const analyser = analyserRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    
    const processAudio = () => {
      if (!analyserRef.current) return;
      
      analyser.getFloatTimeDomainData(dataArray);
      
      // Get pitch and RMS
      const result = autoCorrelate(dataArray, sampleRate);
      const rms = result.rms || 0;
      
      // Normalize volume (0-1 scale)
      const normalizedVolume = Math.min(1, rms * 10);
      setVolume(normalizedVolume);
      if (onVolumeChange) {
        onVolumeChange(normalizedVolume);
      }
      
      // Check if sound is above threshold
      const isAboveThreshold = normalizedVolume > volumeThreshold;
      
      if (isAboveThreshold) {
        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // Fire sound start if not already sounding
        if (!soundStartedRef.current) {
          soundStartedRef.current = true;
          setIsSounding(true);
          if (onSoundStart) {
            onSoundStart();
          }
        }
        
        // Detect pitch - very low threshold for voice
        if (result.frequency > 0 && result.confidence > 0.3) {
          const noteInfo = frequencyToNote(result.frequency);
          if (noteInfo) {
            // Add timestamped reading to buffer
            const now = Date.now();
            pitchBufferRef.current.push({ midi: noteInfo.midiNote, timestamp: now });
            
            // Update visual display with current detected pitch
            setCurrentPitch(noteInfo);
            stablePitchRef.current = noteInfo;
            
            // Fire real-time pitch callback
            if (onRealtimePitch) {
              onRealtimePitch(noteInfo);
            }
            stablePitchRef.current = noteInfo;
            
            // Check if matches target (for visual feedback during playing)
            if (targetMidi !== null && onPitchMatch) {
              const diff = Math.abs(noteInfo.midiNote - targetMidi);
              const isMatch = diff === 0 && Math.abs(noteInfo.cents) < pitchMargin;
              onPitchMatch(isMatch, noteInfo);
            }
          }
        }
      } else {
        // Below threshold - start silence timer
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            setIsSounding(false);
            
            // Compute average pitch from last AVERAGING_WINDOW_MS of readings
            const now = Date.now();
            const cutoff = now - AVERAGING_WINDOW_MS;
            const recentReadings = pitchBufferRef.current.filter(r => r.timestamp >= cutoff);
            
            if (recentReadings.length > 0) {
              // Find most common MIDI note in the window
              const counts = {};
              recentReadings.forEach(r => {
                counts[r.midi] = (counts[r.midi] || 0) + 1;
              });
              
              let mostCommon = null;
              let maxCount = 0;
              Object.entries(counts).forEach(([midi, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  mostCommon = parseInt(midi);
                }
              });
              
              if (mostCommon !== null) {
                // Create noteInfo for the final averaged pitch
                const finalNoteInfo = frequencyToNote(440 * Math.pow(2, (mostCommon - 69) / 12));
                if (finalNoteInfo && onPitchDetected) {
                  onPitchDetected(finalNoteInfo);
                }
              }
            }
            
            setCurrentPitch(null);
            // Clear pitch buffer on silence
            pitchBufferRef.current = [];
            stablePitchRef.current = null;
            if (onSoundEnd) {
              onSoundEnd();
            }
          }, silenceDuration);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(processAudio);
    };
    
    processAudio();
  }, [onVolumeChange, onPitchDetected, onRealtimePitch, onSoundStart, onSoundEnd, onPitchMatch, 
      targetMidi, volumeThreshold, silenceDuration, pitchMargin]);
  
  // Request permission handler
  const requestPermission = async () => {
    if (Platform.OS !== "web") {
      setError("Microphone input is only supported on web currently");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Just testing permission
      setPermissionGranted(true);
      setError(null);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Please allow microphone access to continue.");
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  };
  
  if (Platform.OS !== "web") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Microphone input is only available on web at this time.
        </Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        {error.includes("permission") && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          We need microphone access to hear you play.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Enable Microphone</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (showDebug) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Listening: {isListening ? "Yes" : "No"}
        </Text>
        <Text style={styles.debugText}>
          Volume: {(volume * 100).toFixed(0)}%
        </Text>
        <Text style={styles.debugText}>
          Sounding: {isSounding ? "Yes" : "No"}
        </Text>
        {currentPitch && (
          <>
            <Text style={styles.debugText}>
              Note: {currentPitch.noteName}
            </Text>
            <Text style={styles.debugText}>
              Freq: {currentPitch.frequency.toFixed(1)} Hz
            </Text>
            <Text style={styles.debugText}>
              Cents: {currentPitch.cents > 0 ? '+' : ''}{currentPitch.cents}
            </Text>
          </>
        )}
        {targetNote && (
          <Text style={styles.debugText}>
            Target: {targetNote} (MIDI {targetMidi})
          </Text>
        )}
      </View>
    );
  }
  
  // Default: invisible component (just provides callbacks)
  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    margin: 10,
  },
  debugText: {
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier",
    fontSize: 12,
    color: "#333",
    marginVertical: 2,
  },
});
