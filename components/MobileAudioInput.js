import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Platform, PermissionsAndroid } from "react-native";

// Import live audio stream for native audio access
let LiveAudioStream = null;
try {
  LiveAudioStream = require("react-native-live-audio-stream").default;
} catch (e) {
  console.warn("react-native-live-audio-stream not available:", e);
}

/**
 * Mobile Audio Input using react-native-live-audio-stream
 * 
 * Provides real-time pitch detection on iOS and Android by:
 * - Streaming raw PCM audio data from the microphone
 * - Running autocorrelation pitch detection on the audio samples
 * - Reporting pitch, volume, and sound start/end events
 * 
 * Note: Requires Expo Dev Client or bare workflow (not Expo Go)
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SAMPLE_RATE = 44100;
const BUFFER_SIZE = 4096;

// Convert frequency to note info
function frequencyToNote(frequency) {
  if (!frequency || frequency < 50 || frequency > 2000) return null;
  const semitones = 12 * Math.log2(frequency / 440);
  const midiNote = Math.round(semitones) + 69;
  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  const exactMidi = semitones + 69;
  const cents = Math.round((exactMidi - midiNote) * 100);
  return {
    frequency: Math.round(frequency * 10) / 10,
    noteName: noteName + octave,
    noteNameShort: noteName,
    octave,
    midiNote,
    cents,
    isInTune: Math.abs(cents) < 15,
  };
}

// Convert note name to MIDI number
function noteNameToMidi(noteName) {
  if (!noteName) return null;
  const match = noteName.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;
  const [, letter, accidental, octaveStr] = match;
  const letterIndex = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter.toUpperCase()];
  if (letterIndex === undefined) return null;
  let noteIndex = letterIndex;
  if (accidental === '#') noteIndex += 1;
  if (accidental === 'b') noteIndex -= 1;
  noteIndex = ((noteIndex % 12) + 12) % 12;
  return (parseInt(octaveStr, 10) + 1) * 12 + noteIndex;
}

// Autocorrelation pitch detection
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  
  // Too quiet - no pitch
  if (rms < 0.01) {
    return { frequency: -1, rms, confidence: 0 };
  }
  
  // Only look at frequencies from 70Hz to 1400Hz
  const minPeriod = Math.floor(sampleRate / 1400);
  const maxPeriod = Math.floor(sampleRate / 70);
  const correlations = [];
  
  for (let lag = minPeriod; lag <= maxPeriod && lag < SIZE / 2; lag++) {
    let sum = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < SIZE - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + lag] * buffer[i + lag];
    }
    const norm = Math.sqrt(norm1 * norm2);
    const correlation = norm > 0 ? sum / norm : 0;
    correlations.push({ lag, correlation });
  }
  
  if (correlations.length === 0) {
    return { frequency: -1, rms, confidence: 0 };
  }
  
  // Find the best correlation peak
  let bestLag = -1;
  let bestCorrelation = 0;
  
  for (let i = 1; i < correlations.length - 1; i++) {
    const prev = correlations[i - 1].correlation;
    const curr = correlations[i].correlation;
    const next = correlations[i + 1].correlation;
    
    // Local maximum with correlation > 0.5
    if (curr > prev && curr > next && curr > 0.5 && curr > bestCorrelation) {
      bestCorrelation = curr;
      bestLag = correlations[i].lag;
      
      // Parabolic interpolation for better accuracy
      const denom = 2 * curr - prev - next;
      if (denom !== 0) {
        bestLag += (next - prev) / (2 * denom);
      }
      
      // Stop at first good peak (fundamental frequency)
      if (bestCorrelation > 0.7) break;
    }
  }
  
  if (bestCorrelation > 0.5 && bestLag > 0) {
    return { frequency: sampleRate / bestLag, rms, confidence: bestCorrelation };
  }
  
  return { frequency: -1, rms, confidence: 0 };
}

// Convert base64 to Float32Array (16-bit PCM)
function base64ToFloat32Array(base64) {
  // Use Buffer for React Native (available via polyfill)
  let bytes;
  if (typeof Buffer !== 'undefined') {
    bytes = Buffer.from(base64, 'base64');
  } else if (typeof atob !== 'undefined') {
    const binaryString = atob(base64);
    bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  } else {
    console.error('No base64 decoder available');
    return new Float32Array(0);
  }
  
  // Convert 16-bit PCM to float32 (-1 to 1)
  const samples = new Float32Array(bytes.length / 2);
  
  for (let i = 0; i < samples.length; i++) {
    // Read as signed 16-bit integer, little-endian
    const low = bytes[i * 2];
    const high = bytes[i * 2 + 1];
    const int16 = (high << 8) | low;
    // Convert to signed
    const signed = int16 > 32767 ? int16 - 65536 : int16;
    samples[i] = signed / 32768.0;
  }
  
  return samples;
}

export default function MobileAudioInput({
  onVolumeChange,
  onPitchDetected,
  onRealtimePitch,
  onSoundStart,
  onSoundEnd,
  targetNote,
  onPitchMatch,
  volumeThreshold = 0.02,
  silenceDuration = 1500,
  pitchMargin = 100,
  enabled = true,
  showDebug = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [volume, setVolume] = useState(0);
  const [isSounding, setIsSounding] = useState(false);
  
  const silenceTimerRef = useRef(null);
  const soundStartedRef = useRef(false);
  const pitchBufferRef = useRef([]);
  const audioBufferRef = useRef(new Float32Array(BUFFER_SIZE));
  const bufferIndexRef = useRef(0);
  const targetMidiRef = useRef(noteNameToMidi(targetNote));
  const isListeningRef = useRef(false);
  
  // Update target MIDI when prop changes
  useEffect(() => {
    targetMidiRef.current = noteNameToMidi(targetNote);
  }, [targetNote]);
  
  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Sound First needs access to your microphone to hear you play.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setPermissionGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS handles permissions automatically when starting the stream
        setPermissionGranted(true);
        return true;
      }
    } catch (err) {
      console.error('Permission error:', err);
      setError('Failed to request microphone permission');
      return false;
    }
  }, []);
  
  // Process incoming audio data
  const processAudioData = useCallback((data) => {
    if (!isListeningRef.current) return;
    
    try {
      // Convert base64 audio data to samples
      const samples = base64ToFloat32Array(data);
      
      // Add samples to our circular buffer
      for (let i = 0; i < samples.length; i++) {
        audioBufferRef.current[bufferIndexRef.current] = samples[i];
        bufferIndexRef.current = (bufferIndexRef.current + 1) % BUFFER_SIZE;
      }
      
      // Run pitch detection
      const result = autoCorrelate(audioBufferRef.current, SAMPLE_RATE);
      const normalizedVolume = Math.min(1, result.rms * 15);
      
      setVolume(normalizedVolume);
      onVolumeChange?.(normalizedVolume);
      
      const isAboveThreshold = normalizedVolume > volumeThreshold;
      
      if (isAboveThreshold) {
        // Clear silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        
        // Fire sound start
        if (!soundStartedRef.current) {
          soundStartedRef.current = true;
          setIsSounding(true);
          onSoundStart?.();
        }
        
        // Pitch detection
        if (result.frequency > 0 && result.confidence > 0.5) {
          const noteInfo = frequencyToNote(result.frequency);
          if (noteInfo) {
            setCurrentPitch(noteInfo);
            pitchBufferRef.current.push({
              midi: noteInfo.midiNote,
              timestamp: Date.now(),
              noteInfo,
            });
            
            // Keep buffer from growing too large
            if (pitchBufferRef.current.length > 100) {
              pitchBufferRef.current = pitchBufferRef.current.slice(-50);
            }
            
            onRealtimePitch?.(noteInfo);
            
            // Check target match
            if (targetMidiRef.current !== null) {
              const diff = Math.abs(noteInfo.midiNote - targetMidiRef.current);
              const isMatch = diff === 0 && Math.abs(noteInfo.cents) < pitchMargin;
              onPitchMatch?.(isMatch, noteInfo);
            }
          }
        }
      } else {
        // Below threshold - start silence timer
        if (soundStartedRef.current && !silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            soundStartedRef.current = false;
            setIsSounding(false);
            
            // Calculate final pitch from recent buffer
            const cutoff = Date.now() - 1000;
            const recent = pitchBufferRef.current.filter(r => r.timestamp >= cutoff);
            
            if (recent.length > 0) {
              // Find most common note
              const counts = {};
              recent.forEach(r => {
                counts[r.midi] = (counts[r.midi] || 0) + 1;
              });
              
              let mostCommon = null;
              let maxCount = 0;
              Object.entries(counts).forEach(([midi, count]) => {
                if (count > maxCount) {
                  maxCount = count;
                  mostCommon = parseInt(midi, 10);
                }
              });
              
              if (mostCommon !== null) {
                const finalNote = frequencyToNote(440 * Math.pow(2, (mostCommon - 69) / 12));
                if (finalNote) {
                  onPitchDetected?.(finalNote);
                }
              }
            }
            
            pitchBufferRef.current = [];
            setCurrentPitch(null);
            onSoundEnd?.();
          }, silenceDuration);
        }
      }
    } catch (err) {
      console.error('Audio processing error:', err);
    }
  }, [onVolumeChange, onSoundStart, onSoundEnd, onRealtimePitch, onPitchDetected, onPitchMatch, volumeThreshold, silenceDuration, pitchMargin]);
  
  // Start listening
  const startListening = useCallback(async () => {
    if (!LiveAudioStream) {
      setError('Native audio streaming not available. Please use Expo Dev Client.');
      return;
    }
    
    if (isListeningRef.current) return;
    
    try {
      console.log('[MobileAudioInput] Initializing audio stream...');
      
      // Initialize audio stream
      LiveAudioStream.init({
        sampleRate: SAMPLE_RATE,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // VOICE_RECOGNITION for Android
        bufferSize: BUFFER_SIZE,
      });
      
      // Set up data handler
      LiveAudioStream.on('data', processAudioData);
      
      // Start streaming
      LiveAudioStream.start();
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
      console.log('[MobileAudioInput] Started listening');
    } catch (err) {
      console.error('Start listening error:', err);
      setError(`Failed to start audio: ${err.message}`);
    }
  }, [processAudioData]);
  
  // Stop listening
  const stopListening = useCallback(() => {
    if (!LiveAudioStream || !isListeningRef.current) return;
    
    try {
      isListeningRef.current = false;
      LiveAudioStream.stop();
      setIsListening(false);
      setVolume(0);
      setCurrentPitch(null);
      setIsSounding(false);
      soundStartedRef.current = false;
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      console.log('[MobileAudioInput] Stopped listening');
    } catch (err) {
      console.warn('Stop listening error:', err);
    }
  }, []);
  
  // Handle enabled state
  useEffect(() => {
    const setup = async () => {
      if (enabled) {
        const hasPermission = permissionGranted || await requestPermission();
        if (hasPermission) {
          startListening();
        }
      } else {
        stopListening();
      }
    };
    
    setup();
    
    return () => {
      stopListening();
    };
  }, [enabled, permissionGranted, requestPermission, startListening, stopListening]);
  
  // Check if native module is available
  if (!LiveAudioStream) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>🎤</Text>
        <Text style={styles.errorText}>
          Native audio not available.
        </Text>
        <Text style={styles.errorHint}>
          To use pitch detection on mobile, you need to run with Expo Dev Client instead of Expo Go.
        </Text>
        <Text style={styles.errorHint}>
          Run: npx expo run:ios or npx expo run:android
        </Text>
      </View>
    );
  }
  
  // Show error
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  // Show debug view
  if (showDebug) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Listening: {isListening ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Volume: {(volume * 100).toFixed(0)}%</Text>
        <Text style={styles.debugText}>Sounding: {isSounding ? 'Yes' : 'No'}</Text>
        <Text style={styles.debugText}>Pitch: {currentPitch?.noteName || '--'}</Text>
        <Text style={styles.debugText}>Frequency: {currentPitch?.frequency?.toFixed(1) || '--'} Hz</Text>
        <View style={styles.volumeBarContainer}>
          <View style={[styles.volumeBar, { width: `${volume * 100}%` }]} />
        </View>
      </View>
    );
  }
  
  // Main display
  return (
    <View style={styles.container}>
      <Text style={styles.listeningText}>
        {isListening ? '🎤 Listening...' : '🎤 Starting...'}
      </Text>
      
      <View style={styles.volumeBarContainer}>
        <View 
          style={[
            styles.volumeBar, 
            { 
              width: `${Math.max(2, volume * 100)}%`,
              backgroundColor: isSounding ? '#4ADE80' : '#4A90D9'
            }
          ]} 
        />
      </View>
      
      {currentPitch && (
        <View style={styles.pitchDisplay}>
          <Text style={styles.pitchNote}>{currentPitch.noteName}</Text>
          <Text style={styles.pitchInfo}>
            {currentPitch.isInTune 
              ? 'In tune ✓' 
              : `${currentPitch.cents > 0 ? '+' : ''}${currentPitch.cents} cents`
            }
          </Text>
        </View>
      )}
      
      {!currentPitch && isSounding && (
        <Text style={styles.detectingText}>Detecting pitch...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  listeningText: {
    color: '#4ADE80',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  volumeBarContainer: {
    width: '100%',
    maxWidth: 250,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  volumeBar: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 6,
  },
  pitchDisplay: {
    alignItems: 'center',
    marginTop: 8,
  },
  pitchNote: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pitchInfo: {
    fontSize: 14,
    color: '#e6cfa7',
    marginTop: 4,
  },
  detectingText: {
    color: '#bfa76a',
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  errorText: {
    color: '#e6cfa7',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  errorHint: {
    color: '#bfa76a',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: '#2d232e',
    borderRadius: 12,
    margin: 8,
  },
  debugText: {
    color: '#e6cfa7',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
});
