import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";

// Import constants and utilities from extracted module
import {
  NOTES,
  OCTAVE_COLORS,
  JUST_RATIOS,
  calculateEqualTemperamentFrequency,
  calculateJustIntonationFrequency,
  getNoteNameBySemitone,
  getOctaveColor,
} from "./PitchDrone/constants";

// Import styles
import { styles, colors } from "./PitchDrone/styles";

// Cross-platform AudioContext
// Web: use browser's native AudioContext
// Native: use react-native-audio-api
let NativeAudioContext = null;
if (Platform.OS !== "web") {
  try {
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    console.warn("react-native-audio-api not available");
  }
}

export default function PitchDrone({
  onPlayingChange,
  onMuteChange,
  muted = false,
  volume = 1.0, // Master volume multiplier (0-1)
  metronomeVolume = 0.5, // For cross-component volume control
  onVolumeChange, // Callback to change drone volume
  onMetronomeVolumeChange, // Callback to change metronome volume
}) {
  const [temperament, setTemperament] = useState("equal"); // "equal" or "just"
  const [pitchCenter, setPitchCenter] = useState(0); // Semitone offset for just intonation root (0 = C)
  const [concertA, setConcertA] = useState("440");
  const [octave, setOctave] = useState(4);
  const [sustain, setSustain] = useState(false);
  const [vibrato, setVibrato] = useState(false);

  // Track which notes are currently sounding: { "C-4": true, "C-5": true, ... }
  const [activeDrones, setActiveDrones] = useState({});

  // Track octave selection order per note (stack) for 3-octave limit
  // { "C": [4, 5, 6], "D": [3, 4], ... } - most recent last
  const [octaveStacks, setOctaveStacks] = useState({});

  // Volume control modal state
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Maximum simultaneous octaves per note
  const MAX_OCTAVES_PER_NOTE = 3;

  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef({});
  const gainNodesRef = useRef({});
  const lfoRef = useRef({}); // LFO oscillators for vibrato
  const lfoGainRef = useRef({}); // LFO depth control
  const mutedRef = useRef(muted);
  const vibratoRef = useRef(vibrato);
  const volumeRef = useRef(volume);

  // Base drone volume (will be multiplied by master volume)
  const BASE_DRONE_VOLUME = 0.3;

  // Vibrato settings: 6 Hz rate, ~10 cents depth (subtle but audible)
  const VIBRATO_RATE = 6; // Hz - standard vocal/string vibrato
  const VIBRATO_DEPTH = 1.5; // cents worth of frequency variation

  // Keep mutedRef in sync
  useEffect(() => {
    mutedRef.current = muted;
    // Apply mute to all active oscillators
    Object.keys(gainNodesRef.current).forEach((key) => {
      const gainNode = gainNodesRef.current[key];
      if (gainNode) {
        gainNode.gain.setValueAtTime(
          muted ? 0 : BASE_DRONE_VOLUME * volumeRef.current,
          audioContextRef.current?.currentTime || 0,
        );
      }
    });
  }, [muted]);

  // Keep volumeRef in sync and apply to active oscillators
  useEffect(() => {
    volumeRef.current = volume;
    // Apply volume change to all active oscillators
    if (!mutedRef.current) {
      Object.keys(gainNodesRef.current).forEach((key) => {
        const gainNode = gainNodesRef.current[key];
        if (gainNode && audioContextRef.current) {
          gainNode.gain.setValueAtTime(
            BASE_DRONE_VOLUME * volume,
            audioContextRef.current.currentTime,
          );
        }
      });
    }
  }, [volume]);

  // Keep vibratoRef in sync and apply/remove vibrato to existing drones
  useEffect(() => {
    vibratoRef.current = vibrato;

    // Apply or remove vibrato to all existing drones
    Object.keys(oscillatorsRef.current).forEach((key) => {
      const oscillator = oscillatorsRef.current[key];
      const lfoGain = lfoGainRef.current[key];

      if (oscillator && lfoGain && audioContextRef.current) {
        // Toggle LFO depth
        lfoGain.gain.setValueAtTime(
          vibrato ? VIBRATO_DEPTH : 0,
          audioContextRef.current.currentTime,
        );
      }
    });
  }, [vibrato]);

  // Initialize AudioContext (cross-platform)
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // Web: use browser's native AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    } else if (NativeAudioContext) {
      // Native: use react-native-audio-api
      audioContextRef.current = new NativeAudioContext();
    }

    return () => {
      // Clean up all oscillators and LFOs on unmount
      Object.entries(oscillatorsRef.current).forEach(([key, osc]) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      Object.values(gainNodesRef.current).forEach((gain) => {
        try {
          gain.disconnect();
        } catch (e) {}
      });
      Object.values(lfoRef.current).forEach((lfo) => {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch (e) {}
      });
      Object.values(lfoGainRef.current).forEach((lfoGain) => {
        try {
          lfoGain.disconnect();
        } catch (e) {}
      });
      oscillatorsRef.current = {};
      gainNodesRef.current = {};
      lfoRef.current = {};
      lfoGainRef.current = {};

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Notify parent when any drone is playing
  useEffect(() => {
    const isPlaying = Object.keys(activeDrones).length > 0;
    if (onPlayingChange) {
      onPlayingChange(isPlaying);
    }
  }, [activeDrones, onPlayingChange]);

  // Calculate frequency for a note
  const calculateFrequency = useCallback(
    (semitone, noteOctave) => {
      const a4 = parseFloat(concertA) || 440;

      if (temperament === "equal") {
        // Equal temperament: f = A4 * 2^((n - 69) / 12) where n is MIDI note number
        // MIDI note: C4 = 60, A4 = 69
        const midiNote = noteOctave * 12 + semitone + 12; // +12 because C0 = MIDI 12
        return a4 * Math.pow(2, (midiNote - 69) / 12);
      } else {
        // Just intonation relative to pitch center
        const rootMidiNote = noteOctave * 12 + pitchCenter + 12;
        const rootFreq = a4 * Math.pow(2, (rootMidiNote - 69) / 12);

        // Calculate interval from pitch center
        let interval = (semitone - pitchCenter + 12) % 12;
        const ratio = JUST_RATIOS[interval];

        // Adjust octave if needed
        let freq = rootFreq * ratio;
        if (semitone < pitchCenter) {
          // Note is below root in same octave context
        }

        // Correct for actual octave
        const octaveDiff = noteOctave - 4; // relative to octave 4
        freq = freq * Math.pow(2, octaveDiff);

        // Recalculate properly
        const baseMidi = 60 + pitchCenter; // C4 + pitch center
        const baseFreq = a4 * Math.pow(2, (baseMidi - 69) / 12);
        const targetRatio = JUST_RATIOS[interval];
        const targetOctaveOffset = noteOctave - 4;

        return baseFreq * targetRatio * Math.pow(2, targetOctaveOffset);
      }
    },
    [concertA, temperament, pitchCenter],
  );

  // Start a drone
  const startDrone = useCallback(
    (semitone, noteOctave) => {
      if (!audioContextRef.current) return;

      const key = `${NOTES[semitone].name}-${noteOctave}`;

      // Don't start if already playing
      if (oscillatorsRef.current[key]) return;

      // Don't create oscillators if context is closed
      if (audioContextRef.current.state === "closed") return;

      // Resume audio context if suspended
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const frequency = calculateFrequency(semitone, noteOctave);

      // Add very slight random detuning to prevent phase interference
      // when multiple octaves play together (±2 cents max)
      const detuningCents = (Math.random() - 0.5) * 4;
      const detunedFrequency = frequency * Math.pow(2, detuningCents / 1200);

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      // Create LFO for vibrato
      const lfo = audioContextRef.current.createOscillator();
      const lfoGain = audioContextRef.current.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        detunedFrequency,
        audioContextRef.current.currentTime,
      );

      // Set up LFO (vibrato)
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(
        VIBRATO_RATE,
        audioContextRef.current.currentTime,
      );
      lfoGain.gain.setValueAtTime(
        vibratoRef.current ? VIBRATO_DEPTH : 0,
        audioContextRef.current.currentTime,
      );

      // Connect LFO to oscillator frequency
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      lfo.start();

      gainNode.gain.setValueAtTime(
        mutedRef.current ? 0 : BASE_DRONE_VOLUME * volumeRef.current,
        audioContextRef.current.currentTime,
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();

      oscillatorsRef.current[key] = oscillator;
      gainNodesRef.current[key] = gainNode;
      lfoRef.current[key] = lfo;
      lfoGainRef.current[key] = lfoGain;

      setActiveDrones((prev) => ({ ...prev, [key]: true }));

      console.log(
        `[Drone] Started ${key} at ${frequency.toFixed(2)} Hz (${temperament})`,
      );
    },
    [calculateFrequency, temperament],
  );

  // Stop a drone
  const stopDrone = useCallback((semitone, noteOctave) => {
    const key = `${NOTES[semitone].name}-${noteOctave}`;

    const oscillator = oscillatorsRef.current[key];
    const gainNode = gainNodesRef.current[key];
    const lfo = lfoRef.current[key];
    const lfoGain = lfoGainRef.current[key];

    if (oscillator) {
      // Remove from refs immediately to prevent race conditions
      delete oscillatorsRef.current[key];
      delete gainNodesRef.current[key];
      delete lfoRef.current[key];
      delete lfoGainRef.current[key];

      try {
        // Fade out to avoid click
        if (gainNode && audioContextRef.current) {
          gainNode.gain.setValueAtTime(
            gainNode.gain.value,
            audioContextRef.current.currentTime,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioContextRef.current.currentTime + 0.05,
          );
        }
        // Stop after fade completes
        setTimeout(() => {
          try {
            oscillator.stop();
            oscillator.disconnect();
            if (gainNode) gainNode.disconnect();
            if (lfo) {
              lfo.stop();
              lfo.disconnect();
            }
            if (lfoGain) lfoGain.disconnect();
          } catch (e) {
            // Already stopped
          }
        }, 60);
      } catch (e) {
        // If fade fails, stop immediately
        try {
          oscillator.stop();
          oscillator.disconnect();
          if (gainNode) gainNode.disconnect();
          if (lfo) {
            lfo.stop();
            lfo.disconnect();
          }
          if (lfoGain) lfoGain.disconnect();
        } catch (e2) {}
      }

      setActiveDrones((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      console.log(`[Drone] Stopped ${key}`);
    }
  }, []);

  // Stop all drones
  const stopAllDrones = useCallback(() => {
    // Capture current refs before clearing
    const currentOscillators = { ...oscillatorsRef.current };
    const currentGainNodes = { ...gainNodesRef.current };
    const currentLfos = { ...lfoRef.current };
    const currentLfoGains = { ...lfoGainRef.current };

    // Clear refs immediately
    oscillatorsRef.current = {};
    gainNodesRef.current = {};
    lfoRef.current = {};
    lfoGainRef.current = {};
    setActiveDrones({});

    // Now stop all captured oscillators
    Object.keys(currentOscillators).forEach((key) => {
      const oscillator = currentOscillators[key];
      const gainNode = currentGainNodes[key];
      const lfo = currentLfos[key];
      const lfoGain = currentLfoGains[key];

      try {
        // Fade out
        if (gainNode && audioContextRef.current) {
          gainNode.gain.setValueAtTime(
            gainNode.gain.value,
            audioContextRef.current.currentTime,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            audioContextRef.current.currentTime + 0.05,
          );
        }
        // Stop after fade
        setTimeout(() => {
          try {
            oscillator.stop();
            oscillator.disconnect();
            if (gainNode) gainNode.disconnect();
            if (lfo) {
              lfo.stop();
              lfo.disconnect();
            }
            if (lfoGain) lfoGain.disconnect();
          } catch (e) {}
        }, 60);
      } catch (e) {
        // If fade fails, stop immediately
        try {
          oscillator.stop();
          oscillator.disconnect();
          if (gainNode) gainNode.disconnect();
          if (lfo) {
            lfo.stop();
            lfo.disconnect();
          }
          if (lfoGain) lfoGain.disconnect();
        } catch (e2) {}
      }
    });
    console.log("[Drone] Stopped all drones");
  }, []);

  // Handle sustain toggle
  const handleSustainToggle = () => {
    if (sustain) {
      // Turning off sustain - stop all drones and clear stacks
      stopAllDrones();
      setOctaveStacks({});
    }
    setSustain(!sustain);
  };

  // Helper: get the octaves that should be playing (last 3 from stack)
  const getPlayingOctaves = (stack) => {
    if (!stack || stack.length === 0) return [];
    return stack.slice(-MAX_OCTAVES_PER_NOTE); // Last 3
  };

  // Handle note press - implements stack logic for 3-octave limit
  const handleNotePress = (semitone) => {
    const noteName = NOTES[semitone].name;

    if (sustain) {
      // In sustain mode, toggle the octave selection
      const currentStack = octaveStacks[noteName] || [];
      const octaveIndex = currentStack.indexOf(octave);

      if (octaveIndex !== -1) {
        // Octave is selected - remove it
        const newStack = [...currentStack];
        newStack.splice(octaveIndex, 1);

        // Was this octave playing?
        const wasPlaying = getPlayingOctaves(currentStack).includes(octave);

        // Update stack state
        setOctaveStacks((prev) => {
          const updated = { ...prev };
          if (newStack.length === 0) {
            delete updated[noteName];
          } else {
            updated[noteName] = newStack;
          }
          return updated;
        });

        // Stop the drone
        if (wasPlaying) {
          stopDrone(semitone, octave);

          // If there's a queued octave that wasn't playing, start it
          const newPlayingOctaves = getPlayingOctaves(newStack);
          const oldPlayingOctaves = getPlayingOctaves(currentStack);

          // Find octave that should now play but wasn't before
          newPlayingOctaves.forEach((oct) => {
            if (!oldPlayingOctaves.includes(oct)) {
              startDrone(semitone, oct);
            }
          });
        }
      } else {
        // Octave not selected - add it to stack
        const newStack = [...currentStack, octave];

        // Update stack state
        setOctaveStacks((prev) => ({
          ...prev,
          [noteName]: newStack,
        }));

        // Determine what should play now
        const oldPlayingOctaves = getPlayingOctaves(currentStack);
        const newPlayingOctaves = getPlayingOctaves(newStack);

        // Stop any octave that was playing but shouldn't be anymore
        oldPlayingOctaves.forEach((oct) => {
          if (!newPlayingOctaves.includes(oct)) {
            stopDrone(semitone, oct);
          }
        });

        // Start new octave if it's in the playing set
        if (newPlayingOctaves.includes(octave)) {
          startDrone(semitone, octave);
        }
      }
    } else {
      // Non-sustain: start on press
      startDrone(semitone, octave);
    }
  };

  // Handle note release (only in non-sustain mode)
  const handleNoteRelease = (semitone) => {
    if (!sustain) {
      stopDrone(semitone, octave);
    }
  };

  // Get active octaves for a note (for highlighting) - returns all selected octaves
  const getActiveOctavesForNote = (semitone) => {
    const noteName = NOTES[semitone].name;
    return octaveStacks[noteName] || [];
  };

  // Check if an octave is actually playing (vs just selected/queued)
  const isOctavePlaying = (noteName, oct) => {
    const stack = octaveStacks[noteName] || [];
    const playingOctaves = getPlayingOctaves(stack);
    return playingOctaves.includes(oct);
  };

  // Render multi-octave highlight - shows all selected, dims queued ones
  const renderOctaveHighlight = (semitone, activeOctaves) => {
    if (activeOctaves.length === 0) return null;

    const noteName = NOTES[semitone].name;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "row",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {activeOctaves.map((oct, index) => {
          const isPlaying = isOctavePlaying(noteName, oct);
          return (
            <View
              key={oct}
              style={{
                flex: 1,
                backgroundColor: OCTAVE_COLORS[oct],
                opacity: isPlaying ? 0.7 : 0.3, // Dimmer if queued (not playing)
              }}
            />
          );
        })}
      </View>
    );
  };

  const toggleMute = () => {
    if (onMuteChange) {
      onMuteChange(!muted);
    }
  };

  const isAnyDronePlaying = Object.keys(activeDrones).length > 0;

  return (
    <View style={styles.container}>
      {/* Mute Button - top right corner, only when playing */}
      {/* Tap to mute, long-press for volume controls */}
      {isAnyDronePlaying && (
        <Pressable
          onPress={toggleMute}
          onLongPress={() => setShowVolumeModal(true)}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.muteButton,
            { backgroundColor: muted ? "#555" : pressed ? "#444" : "#333" },
          ]}
        >
          <Text style={styles.muteButtonText}>{muted ? "🔇" : "🔊"}</Text>
        </Pressable>
      )}

      {/* Header */}
      <Text style={styles.headerTitle}>Pitch Drone</Text>

      {/* Temperament & Concert A Row */}
      <View style={styles.headerRow}>
        {/* Temperament Toggle */}
        <View style={styles.temperamentToggle}>
          <TouchableOpacity
            onPress={() => setTemperament("equal")}
            style={[
              styles.temperamentButtonLeft,
              temperament === "equal"
                ? styles.temperamentButtonActive
                : styles.temperamentButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.temperamentButtonText,
                temperament === "equal"
                  ? styles.temperamentButtonTextActive
                  : styles.temperamentButtonTextInactive,
              ]}
            >
              Equal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTemperament("just")}
            style={[
              styles.temperamentButtonRight,
              temperament === "just"
                ? styles.temperamentButtonActive
                : styles.temperamentButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.temperamentButtonText,
                temperament === "just"
                  ? styles.temperamentButtonTextActive
                  : styles.temperamentButtonTextInactive,
              ]}
            >
              Just
            </Text>
          </TouchableOpacity>
        </View>

        {/* Concert A Input */}
        <View style={styles.concertARow}>
          <Text style={styles.concertALabel}>A=</Text>
          <TextInput
            value={concertA}
            onChangeText={setConcertA}
            keyboardType="numeric"
            style={{
              backgroundColor: "#2d232e",
              color: "#FFD700",
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 8,
              width: 60,
              textAlign: "center",
              fontSize: 14,
              borderWidth: 1,
              borderColor: "#444",
            }}
            placeholder="440"
            placeholderTextColor="#666"
          />
          <Text style={{ color: "#bfa76a", fontSize: 12, marginLeft: 4 }}>
            Hz
          </Text>
        </View>
      </View>

      {/* Pitch Center (only for Just temperament) */}
      {temperament === "just" && (
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              color: "#bfa76a",
              fontSize: 12,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Root for Just Intonation:
          </Text>
          <View style={styles.pitchCenterGrid}>
            {NOTES.map((note, idx) => (
              <TouchableOpacity
                key={note.name}
                onPress={() => setPitchCenter(idx)}
                style={[
                  styles.pitchCenterButton,
                  pitchCenter === idx
                    ? styles.pitchCenterButtonActive
                    : styles.pitchCenterButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.pitchCenterText,
                    pitchCenter === idx
                      ? styles.pitchCenterTextActive
                      : styles.pitchCenterTextInactive,
                  ]}
                >
                  {note.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Octave Selector */}
      <View style={styles.octaveRow}>
        <TouchableOpacity
          onPress={() => setOctave(Math.max(1, octave - 1))}
          style={[
            styles.octaveButton,
            octave > 1
              ? styles.octaveButtonEnabled
              : styles.octaveButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.octaveButtonText,
              octave > 1
                ? styles.octaveButtonTextEnabled
                : styles.octaveButtonTextDisabled,
            ]}
          >
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.octaveDisplay}>
          <Text style={styles.octaveDisplayText}>Octave ({octave})</Text>
        </View>

        <TouchableOpacity
          onPress={() => setOctave(Math.min(9, octave + 1))}
          style={[
            styles.octaveButton,
            octave < 9
              ? styles.octaveButtonEnabled
              : styles.octaveButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.octaveButtonText,
              octave < 9
                ? styles.octaveButtonTextEnabled
                : styles.octaveButtonTextDisabled,
            ]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sustain & Vibrato Row */}
      <View style={styles.toggleRow}>
        {/* Sustain Button */}
        <TouchableOpacity
          onPress={handleSustainToggle}
          style={[
            styles.toggleButton,
            sustain ? styles.sustainButtonActive : styles.sustainButtonInactive,
          ]}
        >
          <Text
            style={[
              styles.toggleButtonText,
              sustain
                ? styles.toggleButtonTextActive
                : styles.toggleButtonTextInactive,
            ]}
          >
            {sustain ? "🔒 Sustain" : "🔓 Sustain"}
          </Text>
        </TouchableOpacity>

        {/* Vibrato Button */}
        <TouchableOpacity
          onPress={() => setVibrato(!vibrato)}
          style={{
            backgroundColor: vibrato ? "#9C27B0" : "#2d232e",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: vibrato ? "#9C27B0" : "#444",
          }}
        >
          <Text
            style={{
              color: vibrato ? "#fff" : "#bfa76a",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            {vibrato ? "〰️ Vib ON" : "〰️ Vib"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note Grid */}
      <View style={styles.noteGrid}>
        {NOTES.map((note, idx) => {
          const activeOctaves = getActiveOctavesForNote(idx);
          const isActive = activeOctaves.length > 0;

          return (
            <TouchableOpacity
              key={note.name}
              onPressIn={() => handleNotePress(idx)}
              onPressOut={() => handleNoteRelease(idx)}
              style={[
                styles.noteButton,
                { borderColor: isActive ? colors.gold : "#444" },
              ]}
            >
              {/* Multi-octave highlight */}
              {renderOctaveHighlight(idx, activeOctaves)}

              {/* Note label */}
              <View style={styles.noteLabelWrapper}>
                <Text
                  style={[
                    styles.noteLabel,
                    isActive
                      ? styles.noteLabelActive
                      : styles.noteLabelInactive,
                  ]}
                >
                  {note.enharmonic}
                </Text>
                {activeOctaves.length > 0 && (
                  <Text style={styles.noteOctaveLabel}>
                    Oct: {activeOctaves.join(", ")}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Drones Summary */}
      {isAnyDronePlaying && (
        <View style={styles.activeDronesSummary}>
          <Text style={styles.activeDronesText}>
            Active: {Object.keys(activeDrones).join(", ")}
          </Text>
        </View>
      )}

      {/* Octave Color Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendLabel}>Octave colors:</Text>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((oct) => (
          <View
            key={oct}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 6,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                backgroundColor: OCTAVE_COLORS[oct],
                borderRadius: 2,
                marginRight: 2,
              }}
            />
            <Text style={{ color: "#666", fontSize: 10 }}>{oct}</Text>
          </View>
        ))}
      </View>

      {/* Volume Control Modal - appears on long-press of mute button */}
      <Modal
        visible={showVolumeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowVolumeModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#2d232e",
              borderRadius: 16,
              padding: 24,
              width: 300,
              ...(Platform.OS === "web"
                ? { boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)" }
                : {
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 10,
                  }),
            }}
          >
            <Text style={styles.volumeModalTitle}>🔊 Volume Controls</Text>

            {/* Metronome Volume */}
            <View style={styles.volumeRow}>
              <Text style={styles.volumeLabelPurple}>
                🎵 Metronome: {Math.round(metronomeVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={metronomeVolume}
                onValueChange={(val) =>
                  onMetronomeVolumeChange && onMetronomeVolumeChange(val)
                }
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#444"
                thumbTintColor="#9C27B0"
              />
            </View>

            {/* Drone Volume */}
            <View style={styles.volumeRowLast}>
              <Text style={styles.volumeLabelCyan}>
                🎶 Drone: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={(val) => onVolumeChange && onVolumeChange(val)}
                minimumTrackTintColor="#00BCD4"
                maximumTrackTintColor="#444"
                thumbTintColor="#00BCD4"
              />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowVolumeModal(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
