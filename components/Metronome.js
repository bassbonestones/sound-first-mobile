import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";

/**
 * Metronome Component
 * 
 * Uses Web Audio API (web) or generates ticks via AudioContext.
 * For mobile, falls back to visual-only beat indicator.
 */

// Generate a click sound using Web Audio API
function createClickSound(audioContext, frequency = 1000, duration = 0.05) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

export default function Metronome({ 
  initialBpm = 80,
  minBpm = 40,
  maxBpm = 208,
  onBpmChange,
  beatsPerMeasure = 4,
  accentFirst = true,
  showControls = true,
  autoStart = false,
}) {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentBeat, setCurrentBeat] = useState(0);
  
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const nextBeatTimeRef = useRef(0);
  const schedulerRef = useRef(null);

  // Initialize AudioContext (web only)
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
    };
  }, []);

  // Scheduler for precise timing
  const scheduleNote = useCallback((beatNumber, time) => {
    if (audioContextRef.current && Platform.OS === "web") {
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
      intervalRef.current = setInterval(() => {
        setCurrentBeat(prev => (prev + 1) % beatsPerMeasure);
        
        // For web, also schedule audio
        if (Platform.OS === "web" && audioContextRef.current) {
          const isAccent = accentFirst && currentBeat === 0;
          createClickSound(audioContextRef.current, isAccent ? 1200 : 800, 0.05);
        }
      }, msPerBeat);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, beatsPerMeasure, accentFirst]);

  const handleBpmChange = (newBpm) => {
    const clampedBpm = Math.max(minBpm, Math.min(maxBpm, newBpm));
    setBpm(clampedBpm);
    if (onBpmChange) {
      onBpmChange(clampedBpm);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
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

  return (
    <View style={{ alignItems: "center", padding: 16 }}>
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

      {/* Beat Indicator */}
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "center", 
        marginBottom: 20 
      }}>
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              marginHorizontal: 6,
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
      
      {Platform.OS !== "web" && (
        <Text style={{ 
          color: "#666", 
          fontSize: 11, 
          marginTop: 12,
          textAlign: "center",
        }}>
          Audio requires expo-av on mobile
        </Text>
      )}
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
