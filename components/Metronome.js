import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable, Platform, ScrollView, Modal } from "react-native";
import Slider from "@react-native-community/slider";

// Import AudioContext from react-native-audio-api for native platforms
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available:", e);
  }
}

/**
 * Metronome Component
 * 
 * Uses Web Audio API (web) or react-native-audio-api (mobile).
 * Provides audio clicks on all platforms.
 * 
 * Features:
 * - Custom time signature (top: 1-12, bottom: 1, 2, 4, 8, 16, 32)
 * - Subdivision patterns relative to beat note value
 * - Swing patterns only available for /4 time
 */

// Available note values for the bottom of time signature
const NOTE_VALUES = [1, 2, 4, 8, 16, 32];

// Note value names for display
const NOTE_VALUE_NAMES = {
  1: "whole",
  2: "half",
  4: "quarter",
  8: "eighth",
  16: "sixteenth",
  32: "thirty-second",
};

// Get subdivision names based on the beat note value
// The actual note name depends on what the beat note IS
function getSubdivisionLabel(subdivisionKey, noteValue) {
  // Map beat note value to actual rhythm names for subdivisions
  const noteNames = {
    1:  { half: "half notes",          quarter: "quarter notes",       triplet: "half note triplets" },
    2:  { half: "quarter notes",       quarter: "eighth notes",        triplet: "quarter note triplets" },
    4:  { half: "eighth notes",        quarter: "sixteenth notes",     triplet: "eighth note triplets" },
    8:  { half: "sixteenth notes",     quarter: "thirty-second notes", triplet: "sixteenth note triplets" },
    16: { half: "thirty-second notes", quarter: "sixty-fourth notes",  triplet: "thirty-second note triplets" },
    32: { half: "sixty-fourth notes",  quarter: "128th notes",         triplet: "sixty-fourth note triplets" },
  };
  
  const n = noteNames[noteValue] || noteNames[4];
  
  const labels = {
    none: "None",
    halves: n.half,
    triplet: n.triplet,
    quarters: n.quarter,
    // Compound patterns
    halfTwoQuarters: `${n.half.replace(' notes', '')} + 2 ${n.quarter}`,
    twoQuartersHalf: `2 ${n.quarter} + ${n.half.replace(' notes', '')}`,
    dottedHalfQuarter: `dotted ${n.half.replace(' notes', '')} + ${n.quarter.replace(' notes', '')}`,
    quarterHalfQuarter: `${n.quarter.replace(' notes', '')} + ${n.half.replace(' notes', '')} + ${n.quarter.replace(' notes', '')}`,
    quarterDottedHalf: `${n.quarter.replace(' notes', '')} + dotted ${n.half.replace(' notes', '')}`,
    // Swing - only for /4
    swing: "Swing",
  };
  
  return labels[subdivisionKey] || subdivisionKey;
}

// Subdivision patterns - timing relative to beat (note-value agnostic)
const SUBDIVISIONS = {
  none: {
    key: "none",
    description: "1 click per beat",
    pattern: [0],
    accent: [1],
    swingOnly: false,
  },
  halves: {
    key: "halves",
    description: "2 clicks per beat",
    pattern: [0, 0.5],
    accent: [1, 0.5],
    swingOnly: false,
  },
  triplet: {
    key: "triplet",
    description: "3 clicks per beat",
    pattern: [0, 0.333, 0.667],
    accent: [1, 0.4, 0.4],
    swingOnly: false,
  },
  quarters: {
    key: "quarters",
    description: "4 clicks per beat",
    pattern: [0, 0.25, 0.5, 0.75],
    accent: [1, 0.3, 0.6, 0.3],
    swingOnly: false,
  },
  halfTwoQuarters: {
    key: "halfTwoQuarters",
    description: "Long-short-short",
    pattern: [0, 0.5, 0.75],
    accent: [1, 0.5, 0.4],
    swingOnly: false,
  },
  twoQuartersHalf: {
    key: "twoQuartersHalf",
    description: "Short-short-long",
    pattern: [0, 0.25, 0.5],
    accent: [1, 0.4, 0.6],
    swingOnly: false,
  },
  dottedHalfQuarter: {
    key: "dottedHalfQuarter",
    description: "Long (dotted)-short",
    pattern: [0, 0.75],
    accent: [1, 0.5],
    swingOnly: false,
  },
  quarterHalfQuarter: {
    key: "quarterHalfQuarter",
    description: "Short-long-short",
    pattern: [0, 0.25, 0.75],
    accent: [0.7, 1, 0.7],
    swingOnly: false,
  },
  quarterDottedHalf: {
    key: "quarterDottedHalf",
    description: "Short-long (dotted)",
    pattern: [0, 0.25],
    accent: [0.6, 1],
    swingOnly: false,
  },
  swing: {
    key: "swing",
    description: "Triplet swing feel",
    pattern: [0, 0.667],
    accent: [1, 0.5],
    swingOnly: true, // Only available for /4 time
  },
};

// Generate a click sound using Web Audio API
function createClickSound(audioContext, frequency = 1000, duration = 0.05, volume = 0.5) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export default function Metronome({ 
  initialBpm = 80,
  minBpm = 40,
  maxBpm = 350,
  onBpmChange,
  onPlayingChange,
  onMuteChange,
  beatsPerMeasure: initialBeats = 4,
  initialNoteValue = 4,
  accentFirst = true,
  showControls = true,
  autoStart = false,
  showTimeSignature = true,
  showSubdivision = true,
  muted = false,
  volume = 1.0, // Master volume multiplier (0-1)
  // Volume controls for cross-component modal
  droneVolume = 0.5,
  onVolumeChange,
  onDroneVolumeChange,
}) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubClick, setCurrentSubClick] = useState(0);
  
  // Time signature state - fully custom
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(initialBeats);
  const [noteValue, setNoteValue] = useState(initialNoteValue);
  const [showTimeSigPicker, setShowTimeSigPicker] = useState(false);
  
  // Subdivision state
  const [subdivision, setSubdivision] = useState("none");
  const [showSubdivisionPicker, setShowSubdivisionPicker] = useState(false);
  
  // Volume modal state
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  
  // Reset subdivision to "none" if swing is selected but noteValue changes from 4
  useEffect(() => {
    if (subdivision === "swing" && noteValue !== 4) {
      setSubdivision("none");
    }
  }, [noteValue, subdivision]);
  
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const subIntervalRef = useRef(null);
  const nextBeatTimeRef = useRef(0);
  const schedulerRef = useRef(null);
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);

  // Keep mutedRef in sync with prop (avoids restart on mute toggle)
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Keep volumeRef in sync
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Initialize AudioContext (all platforms)
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    } else if (NativeAudioContext) {
      // Use react-native-audio-api on native platforms
      audioContextRef.current = new NativeAudioContext();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subIntervalRef.current) {
        subIntervalRef.current.forEach(t => clearTimeout(t));
      }
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
    };
  }, []);

  // Scheduler for precise timing
  const scheduleNote = useCallback((beatNumber, time) => {
    if (audioContextRef.current) {
      // Accent on beat 1 if enabled
      const isAccent = accentFirst && beatNumber === 0;
      const frequency = isAccent ? 1200 : 800;
      createClickSound(audioContextRef.current, frequency, 0.05);
    }
  }, [accentFirst]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const secondsPerBeat = 60.0 / bpm;
    const scheduleAheadTime = 0.1; // Schedule 100ms ahead
    
    while (nextBeatTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeat, nextBeatTimeRef.current);
      nextBeatTimeRef.current += secondsPerBeat;
      setCurrentBeat(prev => (prev + 1) % beatsPerMeasure);
    }
  }, [bpm, currentBeat, beatsPerMeasure, scheduleNote]);

  // Play subdivision clicks within a beat
  const playSubdivisionClicks = useCallback((beatCounter, msPerBeat, isFirstBeat) => {
    const subdivisionPattern = SUBDIVISIONS[subdivision];
    if (!subdivisionPattern || !audioContextRef.current) return [];
    
    const timeouts = [];
    const pattern = subdivisionPattern.pattern;
    const accents = subdivisionPattern.accent;
    
    pattern.forEach((timing, index) => {
      const delayMs = timing * msPerBeat;
      const timeout = setTimeout(() => {
        if (audioContextRef.current && !mutedRef.current) {
          // Beat 1 gets strongest accent, subdivisions get their pattern accents
          const isBeatAccent = isFirstBeat && index === 0 && accentFirst;
          const subAccent = accents[index] || 0.5;
          const frequency = isBeatAccent ? 1200 : (index === 0 ? 900 : 700);
          const baseVolume = isBeatAccent ? 0.6 : subAccent * 0.5;
          const finalVolume = baseVolume * volumeRef.current; // Apply master volume
          
          console.log(`[Metronome] Beat ${beatCounter + 1}/${beatsPerMeasure}, sub=${index + 1}/${pattern.length}, freq=${frequency}Hz, vol=${finalVolume.toFixed(2)}`);
          createClickSound(audioContextRef.current, frequency, 0.04, finalVolume);
        }
        setCurrentSubClick(index);
      }, delayMs);
      timeouts.push(timeout);
    });
    
    return timeouts;
  }, [subdivision, beatsPerMeasure, accentFirst]);

  // Start/stop metronome
  useEffect(() => {
    if (isPlaying) {
      if (audioContextRef.current) {
        // Resume AudioContext if suspended
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
        nextBeatTimeRef.current = audioContextRef.current.currentTime;
      }
      
      // Visual beat ticker (works on all platforms)
      const msPerBeat = (60 / bpm) * 1000;
      let beatCounter = 0; // Local counter to avoid stale closure
      subIntervalRef.current = [];
      
      const subdivisionPattern = SUBDIVISIONS[subdivision];
      console.log(`[Metronome] Starting at ${bpm} BPM, interval=${msPerBeat}ms, beatsPerMeasure=${beatsPerMeasure}, subdivision=${subdivision}, pattern=${subdivisionPattern.pattern.join(',')}`);
      
      intervalRef.current = setInterval(() => {
        const isFirstBeat = beatCounter === 0;
        
        // Schedule subdivision clicks for this beat
        const newTimeouts = playSubdivisionClicks(beatCounter, msPerBeat, isFirstBeat);
        subIntervalRef.current = [...subIntervalRef.current, ...newTimeouts];
        
        // Clean up old timeouts
        subIntervalRef.current = subIntervalRef.current.filter(t => t !== null);
        
        // Update visual and increment counter
        setCurrentBeat(beatCounter);
        beatCounter = (beatCounter + 1) % beatsPerMeasure;
      }, msPerBeat);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (subIntervalRef.current) {
        subIntervalRef.current.forEach(t => clearTimeout(t));
        subIntervalRef.current = [];
      }
      setCurrentBeat(0);
      setCurrentSubClick(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (subIntervalRef.current) {
        subIntervalRef.current.forEach(t => clearTimeout(t));
      }
    };
  }, [isPlaying, bpm, beatsPerMeasure, subdivision, playSubdivisionClicks]);

  const handleBpmChange = (newBpm) => {
    const clampedBpm = Math.max(minBpm, Math.min(maxBpm, newBpm));
    setBpm(clampedBpm);
    if (onBpmChange) {
      onBpmChange(clampedBpm);
    }
  };

  const togglePlay = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    if (onPlayingChange) {
      onPlayingChange(newPlaying);
    }
  };

  const toggleMute = () => {
    if (onMuteChange) {
      onMuteChange(!muted);
    }
  };

  // Tap tempo feature
  const tapTimesRef = useRef([]);
  const handleTapTempo = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    
    // Keep only last 4 taps
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }
    
    // Calculate average BPM from taps
    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }
    
    // Reset if too much time passed
    setTimeout(() => {
      if (tapTimesRef.current.length > 0 && 
          Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1] > 2000) {
        tapTimesRef.current = [];
      }
    }, 2000);
  };

  const currentSubdivision = SUBDIVISIONS[subdivision];

  return (
    <View style={{ alignItems: "center", padding: 16, position: "relative" }}>
      {/* Mute Button - top right corner, only when playing */}
      {/* Tap to mute, long-press for volume controls */}
      {isPlaying && (
        <Pressable
          onPress={toggleMute}
          onLongPress={() => setShowVolumeModal(true)}
          delayLongPress={400}
          style={({ pressed }) => ({
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: muted ? "#555" : (pressed ? "#444" : "#333"),
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 20,
            zIndex: 10,
          })}
        >
          <Text style={{ fontSize: 18 }}>{muted ? "🔇" : "🔊"}</Text>
        </Pressable>
      )}

      {/* BPM Display */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ 
          color: "#FFD700", 
          fontSize: 48, 
          fontWeight: "bold",
          textAlign: "center",
          fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
        }}>
          {bpm}
        </Text>
        <Text style={{ 
          color: "#bfa76a", 
          fontSize: 14, 
          textAlign: "center" 
        }}>
          BPM
        </Text>
      </View>

      {/* Time Signature & Subdivision Display */}
      {showControls && (showTimeSignature || showSubdivision) && (
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "center", 
          marginBottom: 12,
          flexWrap: "wrap",
        }}>
          {/* Time Signature Selector */}
          {showTimeSignature && (
            <TouchableOpacity
              onPress={() => {
                if (!showSubdivisionPicker) {
                  setShowTimeSigPicker(!showTimeSigPicker);
                }
              }}
              disabled={showSubdivisionPicker}
              style={{
                backgroundColor: showTimeSigPicker ? "#FFD700" : "#3b2c1a",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 12,
                marginHorizontal: 4,
                borderWidth: 1,
                borderColor: "#FFD700",
                opacity: showSubdivisionPicker ? 0.5 : 1,
              }}
              {...(Platform.OS === "web" ? { title: "Select time signature" } : {})}
            >
              <Text style={{ 
                color: showTimeSigPicker ? "#3b2c1a" : "#FFD700", 
                fontWeight: "bold",
                fontSize: 16,
              }}>
                {beatsPerMeasure}/{noteValue}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Subdivision Selector */}
          {showSubdivision && (
            <TouchableOpacity
              onPress={() => {
                if (!showTimeSigPicker) {
                  setShowSubdivisionPicker(!showSubdivisionPicker);
                }
              }}
              disabled={showTimeSigPicker}
              style={{
                backgroundColor: showSubdivisionPicker ? "#9C27B0" : "#2d232e",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 12,
                marginHorizontal: 4,
                borderWidth: 1,
                borderColor: "#9C27B0",
                opacity: showTimeSigPicker ? 0.5 : 1,
              }}
              {...(Platform.OS === "web" ? { title: "Select subdivision pattern" } : {})}
            >
              <Text style={{ 
                color: showSubdivisionPicker ? "#fff" : "#9C27B0", 
                fontWeight: "bold",
                fontSize: 14,
              }}>
                {getSubdivisionLabel(subdivision, noteValue)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time Signature Picker */}
      {showTimeSigPicker && (
        <View style={{
          backgroundColor: "#2d232e",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          width: "100%",
          maxWidth: 340,
        }}>
          <Text style={{ color: "#FFD700", fontWeight: "bold", marginBottom: 12 }}>
            Time Signature
          </Text>
          
          {/* Beats per measure (top number) */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: "#bfa76a", fontSize: 12, marginBottom: 8 }}>
              Beats per measure (1-12):
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <TouchableOpacity
                onPress={() => setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))}
                style={{
                  backgroundColor: "#3b2c1a",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#FFD700",
                }}
              >
                <Text style={{ color: "#FFD700", fontSize: 20 }}>-</Text>
              </TouchableOpacity>
              <Text style={{ 
                color: "#FFD700", 
                fontSize: 32, 
                fontWeight: "bold",
                marginHorizontal: 24,
                minWidth: 50,
                textAlign: "center",
              }}>
                {beatsPerMeasure}
              </Text>
              <TouchableOpacity
                onPress={() => setBeatsPerMeasure(Math.min(12, beatsPerMeasure + 1))}
                style={{
                  backgroundColor: "#3b2c1a",
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#FFD700",
                }}
              >
                <Text style={{ color: "#FFD700", fontSize: 20 }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Note value (bottom number) */}
          <View>
            <Text style={{ color: "#bfa76a", fontSize: 12, marginBottom: 8 }}>
              Beat note value:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
              {NOTE_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setNoteValue(val)}
                  style={{
                    backgroundColor: noteValue === val ? "#FFD700" : "#3b2c1a",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    margin: 4,
                    minWidth: 50,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ 
                    color: noteValue === val ? "#3b2c1a" : "#FFD700",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}>
                    {val}
                  </Text>
                  <Text style={{ 
                    color: noteValue === val ? "#5a4a3a" : "#666",
                    fontSize: 9,
                  }}>
                    {NOTE_VALUE_NAMES[val]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => setShowTimeSigPicker(false)}
            style={{
              backgroundColor: "#FFD700",
              paddingVertical: 10,
              borderRadius: 8,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#3b2c1a", fontWeight: "bold" }}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Subdivision Picker */}
      {showSubdivisionPicker && (
        <View style={{
          backgroundColor: "#2d232e",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          width: "100%",
          maxWidth: 340,
        }}>
          <Text style={{ color: "#9C27B0", fontWeight: "bold", marginBottom: 8 }}>
            Subdivision Pattern
          </Text>
          {noteValue !== 4 && (
            <Text style={{ color: "#888", fontSize: 11, marginBottom: 8, fontStyle: "italic" }}>
              Note: Swing patterns only available in /4 time
            </Text>
          )}
          <ScrollView 
            style={{ maxHeight: 250 }}
            showsVerticalScrollIndicator={true}
          >
            {Object.entries(SUBDIVISIONS)
              .filter(([key, sub]) => !sub.swingOnly || noteValue === 4)
              .map(([key, sub]) => (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  setSubdivision(key);
                  setShowSubdivisionPicker(false);
                }}
                style={{
                  backgroundColor: subdivision === key ? "#9C27B0" : "#3b2c1a",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  marginBottom: 6,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    color: subdivision === key ? "#fff" : "#bfa76a",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}>
                    {getSubdivisionLabel(key, noteValue)}
                  </Text>
                  <Text style={{ 
                    color: subdivision === key ? "#ddd" : "#666",
                    fontSize: 11,
                  }}>
                    {sub.description}
                  </Text>
                </View>
                {subdivision === key && (
                  <Text style={{ color: "#fff", fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            onPress={() => setShowSubdivisionPicker(false)}
            style={{
              backgroundColor: "#9C27B0",
              paddingVertical: 10,
              borderRadius: 8,
              marginTop: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Beat Indicator */}
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "center", 
        marginBottom: 20,
        flexWrap: "wrap",
        maxWidth: 320,
      }}>
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              margin: 4,
              backgroundColor: isPlaying && currentBeat === i 
                ? (i === 0 && accentFirst ? "#FF9800" : "#FFD700") 
                : "#3b2c1a",
              borderWidth: 2,
              borderColor: i === 0 && accentFirst ? "#FF9800" : "#FFD700",
              transform: isPlaying && currentBeat === i 
                ? [{ scale: 1.2 }] 
                : [{ scale: 1 }],
            }}
          />
        ))}
      </View>

      {/* Subdivision indicator (small dots under current beat) */}
      {subdivision !== "none" && isPlaying && (
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "center", 
          marginBottom: 12,
          marginTop: -10,
        }}>
          {currentSubdivision.pattern.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 3,
                backgroundColor: currentSubClick === i ? "#9C27B0" : "#3b2c1a",
                borderWidth: 1,
                borderColor: "#9C27B0",
              }}
            />
          ))}
        </View>
      )}

      {showControls && (
        <>
          {/* BPM Controls */}
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            marginBottom: 16 
          }}>
            <TouchableOpacity
              onPress={() => handleBpmChange(bpm - 5)}
              style={{
                backgroundColor: "#3b2c1a",
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#FFD700",
              }}
            >
              <Text style={{ color: "#FFD700", fontSize: 24 }}>-</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleBpmChange(bpm - 1)}
              style={{
                backgroundColor: "#3b2c1a",
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: "#5a4a3a",
              }}
            >
              <Text style={{ color: "#bfa76a", fontSize: 18 }}>-1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleBpmChange(bpm + 1)}
              style={{
                backgroundColor: "#3b2c1a",
                width: 36,
                height: 36,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                marginHorizontal: 8,
                borderWidth: 1,
                borderColor: "#5a4a3a",
              }}
            >
              <Text style={{ color: "#bfa76a", fontSize: 18 }}>+1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleBpmChange(bpm + 5)}
              style={{
                backgroundColor: "#3b2c1a",
                width: 44,
                height: 44,
                borderRadius: 22,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#FFD700",
              }}
            >
              <Text style={{ color: "#FFD700", fontSize: 24 }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Play/Stop & Tap Tempo */}
          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <TouchableOpacity
              onPress={togglePlay}
              style={{
                backgroundColor: isPlaying ? "#c0392b" : "#27ae60",
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 24,
                marginRight: 12,
              }}
            >
              <Text style={{ 
                color: "#fff", 
                fontWeight: "bold", 
                fontSize: 16 
              }}>
                {isPlaying ? "⏹ Stop" : "▶ Start"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleTapTempo}
              style={{
                backgroundColor: "#3b2c1a",
                paddingVertical: 14,
                paddingHorizontal: 24,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: "#FFD700",
              }}
            >
              <Text style={{ 
                color: "#FFD700", 
                fontWeight: "bold", 
                fontSize: 16 
              }}>
                👆 Tap
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset BPM buttons */}
          <View style={{ 
            flexDirection: "row", 
            flexWrap: "wrap", 
            justifyContent: "center", 
            marginTop: 16 
          }}>
            {[60, 80, 100, 120, 140, 160].map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => handleBpmChange(preset)}
                style={{
                  backgroundColor: bpm === preset ? "#FFD700" : "#2d232e",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  margin: 4,
                }}
              >
                <Text style={{ 
                  color: bpm === preset ? "#3b2c1a" : "#bfa76a", 
                  fontWeight: "bold",
                  fontSize: 13,
                }}>
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      
      {Platform.OS !== "web" && !NativeAudioContext && (
        <Text style={{ 
          color: "#666", 
          fontSize: 11, 
          marginTop: 12,
          textAlign: "center",
        }}>
          Audio playback unavailable - react-native-audio-api not loaded
        </Text>
      )}

      {/* Volume Control Modal - appears on long-press of mute button */}
      <Modal
        visible={showVolumeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowVolumeModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <View style={{
            backgroundColor: "#2d232e",
            borderRadius: 16,
            padding: 24,
            width: 300,
            shadowColor: "#000",
            shadowOpacity: 0.5,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 10,
          }}>
            <Text style={{
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
            }}>
              🔊 Volume Controls
            </Text>

            {/* Metronome Volume */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#9C27B0", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                🎵 Metronome: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={(val) => onVolumeChange && onVolumeChange(val)}
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#444"
                thumbTintColor="#9C27B0"
              />
            </View>

            {/* Drone Volume */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#00BCD4", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                🎶 Drone: {Math.round(droneVolume * 100)}%
              </Text>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={droneVolume}
                onValueChange={(val) => onDroneVolumeChange && onDroneVolumeChange(val)}
                minimumTrackTintColor="#00BCD4"
                maximumTrackTintColor="#444"
                thumbTintColor="#00BCD4"
              />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowVolumeModal(false)}
              style={{
                backgroundColor: "#FFD700",
                borderRadius: 8,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#1a1a2e", fontWeight: "bold", fontSize: 16 }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Compact metronome for inline use (e.g., in session screen)
export function CompactMetronome({ bpm, isPlaying, currentBeat, beatsPerMeasure = 4 }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: "#FFD700", fontWeight: "bold", marginRight: 8 }}>
        {bpm} BPM
      </Text>
      {Array.from({ length: beatsPerMeasure }, (_, i) => (
        <View
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            marginHorizontal: 2,
            backgroundColor: isPlaying && currentBeat === i ? "#FFD700" : "#3b2c1a",
            borderWidth: 1,
            borderColor: "#FFD700",
          }}
        />
      ))}
    </View>
  );
}
