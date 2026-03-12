import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
  Modal,
  ViewStyle,
  TextStyle,
} from "react-native";
import Slider from "@react-native-community/slider";
import { devLog, devWarn } from "../utils/devLogger";

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

// AudioContext types
interface NativeAudioContextType {
  currentTime: number;
  state: string;
  destination: AudioDestinationNode;
  resume: () => Promise<void>;
  close: () => Promise<void>;
  createOscillator: () => OscillatorNode;
  createGain: () => GainNode;
}

type NativeAudioContextConstructor = new () => NativeAudioContextType;

// Cross-platform AudioContext
let NativeAudioContext: NativeAudioContextConstructor | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    devWarn("react-native-audio-api not available");
  }
}

interface PitchDroneProps {
  onPlayingChange?: (isPlaying: boolean) => void;
  onMuteChange?: (isMuted: boolean) => void;
  muted?: boolean;
  volume?: number;
  hideInternalMute?: boolean;
  metronomeVolume?: number;
  onVolumeChange?: (volume: number) => void;
  onMetronomeVolumeChange?: (volume: number) => void;
  initialNote?: string | null;
  autoStart?: boolean;
}

interface ActiveDrones {
  [key: string]: boolean;
}

interface OctaveStacks {
  [noteName: string]: number[];
}

interface ExtendedWindow extends Window {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

export default function PitchDrone({
  onPlayingChange,
  onMuteChange,
  muted = false,
  volume = 1.0,
  hideInternalMute = false,
  metronomeVolume = 0.5,
  onVolumeChange,
  onMetronomeVolumeChange,
  initialNote = null,
  autoStart = false,
}: PitchDroneProps): React.ReactElement {
  const [temperament, setTemperament] = useState<"equal" | "just">("equal");
  const [pitchCenter, setPitchCenter] = useState(0);
  const [concertA, setConcertA] = useState("440");
  const [octave, setOctave] = useState(4);
  const [sustain, setSustain] = useState(false);
  const [vibrato, setVibrato] = useState(false);

  const [activeDrones, setActiveDrones] = useState<ActiveDrones>({});
  const [octaveStacks, setOctaveStacks] = useState<OctaveStacks>({});
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  const MAX_OCTAVES_PER_NOTE = 3;

  const audioContextRef = useRef<AudioContext | NativeAudioContextType | null>(null);
  const oscillatorsRef = useRef<Record<string, OscillatorNode>>({});
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const lfoRef = useRef<Record<string, OscillatorNode>>({});
  const lfoGainRef = useRef<Record<string, GainNode>>({});
  const mutedRef = useRef(muted);
  const vibratoRef = useRef(vibrato);
  const volumeRef = useRef(volume);

  const BASE_DRONE_VOLUME = 0.3;
  const VIBRATO_RATE = 6;
  const VIBRATO_DEPTH = 1.5;

  // Keep mutedRef in sync
  useEffect(() => {
    mutedRef.current = muted;
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

  // Keep volumeRef in sync
  useEffect(() => {
    volumeRef.current = volume;
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

  // Keep vibratoRef in sync
  useEffect(() => {
    vibratoRef.current = vibrato;

    Object.keys(oscillatorsRef.current).forEach((key) => {
      const lfoGain = lfoGainRef.current[key];

      if (lfoGain && audioContextRef.current) {
        lfoGain.gain.setValueAtTime(
          vibrato ? VIBRATO_DEPTH : 0,
          audioContextRef.current.currentTime,
        );
      }
    });
  }, [vibrato]);

  // Initialize AudioContext
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const extWindow = window as ExtendedWindow;
      const AudioContextClass = extWindow.AudioContext || extWindow.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    } else if (NativeAudioContext) {
      audioContextRef.current = new NativeAudioContext();
    }

    return () => {
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
    (semitone: number, noteOctave: number): number => {
      const a4 = parseFloat(concertA) || 440;

      if (temperament === "equal") {
        const midiNote = noteOctave * 12 + semitone + 12;
        return a4 * Math.pow(2, (midiNote - 69) / 12);
      } else {
        const interval = (semitone - pitchCenter + 12) % 12;
        const baseMidi = 60 + pitchCenter;
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
    (semitone: number, noteOctave: number): void => {
      if (!audioContextRef.current) return;

      const key = `${NOTES[semitone].name}-${noteOctave}`;

      if (oscillatorsRef.current[key]) return;
      if (audioContextRef.current.state === "closed") return;

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const frequency = calculateFrequency(semitone, noteOctave);
      const detuningCents = (Math.random() - 0.5) * 4;
      const detunedFrequency = frequency * Math.pow(2, detuningCents / 1200);

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      const lfo = audioContextRef.current.createOscillator();
      const lfoGain = audioContextRef.current.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        detunedFrequency,
        audioContextRef.current.currentTime,
      );

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(
        VIBRATO_RATE,
        audioContextRef.current.currentTime,
      );
      lfoGain.gain.setValueAtTime(
        vibratoRef.current ? VIBRATO_DEPTH : 0,
        audioContextRef.current.currentTime,
      );

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

      devLog(
        `[Drone] Started ${key} at ${frequency.toFixed(2)} Hz (${temperament})`,
      );
    },
    [calculateFrequency, temperament],
  );

  // Stop a drone
  const stopDrone = useCallback((semitone: number, noteOctave: number): void => {
    const key = `${NOTES[semitone].name}-${noteOctave}`;

    const oscillator = oscillatorsRef.current[key];
    const gainNode = gainNodesRef.current[key];
    const lfo = lfoRef.current[key];
    const lfoGain = lfoGainRef.current[key];

    if (oscillator) {
      delete oscillatorsRef.current[key];
      delete gainNodesRef.current[key];
      delete lfoRef.current[key];
      delete lfoGainRef.current[key];

      try {
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

      devLog(`[Drone] Stopped ${key}`);
    }
  }, []);

  // Stop all drones
  const stopAllDrones = useCallback((): void => {
    const currentOscillators = { ...oscillatorsRef.current };
    const currentGainNodes = { ...gainNodesRef.current };
    const currentLfos = { ...lfoRef.current };
    const currentLfoGains = { ...lfoGainRef.current };

    oscillatorsRef.current = {};
    gainNodesRef.current = {};
    lfoRef.current = {};
    lfoGainRef.current = {};
    setActiveDrones({});

    Object.keys(currentOscillators).forEach((key) => {
      const oscillator = currentOscillators[key];
      const gainNode = currentGainNodes[key];
      const lfo = currentLfos[key];
      const lfoGain = currentLfoGains[key];

      try {
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
    devLog("[Drone] Stopped all drones");
  }, []);

  // Auto-start drone on mount
  useEffect(() => {
    if (autoStart && initialNote && audioContextRef.current) {
      const noteNameToSemitone = (noteName: string | null): number | null => {
        if (!noteName) return null;
        const flatToSharp: Record<string, string> = {
          Bb: "A#",
          Db: "C#",
          Eb: "D#",
          Gb: "F#",
          Ab: "G#",
        };
        const normalized = flatToSharp[noteName] || noteName;
        const noteIndex = NOTES.findIndex((n) => n.name === normalized);
        return noteIndex >= 0 ? noteIndex : null;
      };

      const semitone = noteNameToSemitone(initialNote);
      if (semitone !== null) {
        startDrone(semitone, octave);
        devLog(`[Drone] Auto-started ${initialNote} in octave ${octave}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle sustain toggle
  const handleSustainToggle = (): void => {
    if (sustain) {
      stopAllDrones();
      setOctaveStacks({});
    }
    setSustain(!sustain);
  };

  // Helper: get the octaves that should be playing
  const getPlayingOctaves = (stack: number[]): number[] => {
    if (!stack || stack.length === 0) return [];
    return stack.slice(-MAX_OCTAVES_PER_NOTE);
  };

  // Handle note press
  const handleNotePress = (semitone: number): void => {
    const noteName = NOTES[semitone].name;

    if (sustain) {
      const currentStack = octaveStacks[noteName] || [];
      const octaveIndex = currentStack.indexOf(octave);

      if (octaveIndex !== -1) {
        const newStack = [...currentStack];
        newStack.splice(octaveIndex, 1);

        const wasPlaying = getPlayingOctaves(currentStack).includes(octave);

        setOctaveStacks((prev) => {
          const updated = { ...prev };
          if (newStack.length === 0) {
            delete updated[noteName];
          } else {
            updated[noteName] = newStack;
          }
          return updated;
        });

        if (wasPlaying) {
          stopDrone(semitone, octave);

          const newPlayingOctaves = getPlayingOctaves(newStack);
          const oldPlayingOctaves = getPlayingOctaves(currentStack);

          newPlayingOctaves.forEach((oct) => {
            if (!oldPlayingOctaves.includes(oct)) {
              startDrone(semitone, oct);
            }
          });
        }
      } else {
        const newStack = [...currentStack, octave];

        setOctaveStacks((prev) => ({
          ...prev,
          [noteName]: newStack,
        }));

        const oldPlayingOctaves = getPlayingOctaves(currentStack);
        const newPlayingOctaves = getPlayingOctaves(newStack);

        oldPlayingOctaves.forEach((oct) => {
          if (!newPlayingOctaves.includes(oct)) {
            stopDrone(semitone, oct);
          }
        });

        if (newPlayingOctaves.includes(octave)) {
          startDrone(semitone, octave);
        }
      }
    } else {
      startDrone(semitone, octave);
    }
  };

  // Handle note release
  const handleNoteRelease = (semitone: number): void => {
    if (!sustain) {
      stopDrone(semitone, octave);
    }
  };

  // Get active octaves for a note
  const getActiveOctavesForNote = (semitone: number): number[] => {
    const noteName = NOTES[semitone].name;
    return octaveStacks[noteName] || [];
  };

  // Check if an octave is actually playing
  const isOctavePlaying = (noteName: string, oct: number): boolean => {
    const stack = octaveStacks[noteName] || [];
    const playingOctaves = getPlayingOctaves(stack);
    return playingOctaves.includes(oct);
  };

  // Render multi-octave highlight
  const renderOctaveHighlight = (semitone: number, activeOctaves: number[]): React.ReactElement | null => {
    if (activeOctaves.length === 0) return null;

    const noteName = NOTES[semitone].name;

    return (
      <View style={styles.octaveHighlightContainer}>
        {activeOctaves.map((oct) => {
          const isPlaying = isOctavePlaying(noteName, oct);
          return (
            <View
              key={oct}
              style={[
                styles.octaveHighlightSlice,
                { backgroundColor: OCTAVE_COLORS[oct] },
                isPlaying
                  ? styles.octaveHighlightSliceActive
                  : styles.octaveHighlightSliceQueued,
              ]}
            />
          );
        })}
      </View>
    );
  };

  const toggleMute = (): void => {
    if (onMuteChange) {
      onMuteChange(!muted);
    }
  };

  const isAnyDronePlaying = Object.keys(activeDrones).length > 0;

  return (
    <View style={styles.container}>
      {/* Mute Button */}
      {isAnyDronePlaying && !hideInternalMute && (
        <Pressable
          onPress={toggleMute}
          onLongPress={() => setShowVolumeModal(true)}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.muteButton,
            { backgroundColor: muted ? "#555" : pressed ? "#444" : "#333" },
          ]}
          accessibilityLabel={muted ? "Unmute drone" : "Mute drone"}
          accessibilityHint="Long press to open volume controls"
          accessibilityRole="button"
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
            accessibilityLabel={`Equal temperament${temperament === "equal" ? ", selected" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: temperament === "equal" }}
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
            accessibilityLabel={`Just intonation${temperament === "just" ? ", selected" : ""}`}
            accessibilityRole="button"
            accessibilityState={{ selected: temperament === "just" }}
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
            style={styles.concertAInput}
            placeholder="440"
            placeholderTextColor="#666"
          />
          <Text style={styles.concertAUnit}>Hz</Text>
        </View>
      </View>

      {/* Pitch Center (only for Just temperament) */}
      {temperament === "just" && (
        <View style={styles.pitchCenterContainer}>
          <Text style={styles.justIntonationLabel}>
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
          style={
            vibrato ? styles.vibratoButtonActive : styles.vibratoButtonInactive
          }
        >
          <Text
            style={
              vibrato
                ? styles.vibratoButtonTextActive
                : styles.vibratoButtonTextInactive
            }
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
          <View key={oct} style={styles.legendItem}>
            <View
              style={[
                styles.legendColorBox,
                { backgroundColor: OCTAVE_COLORS[oct] },
              ]}
            />
            <Text style={styles.legendOctaveText}>{oct}</Text>
          </View>
        ))}
      </View>

      {/* Volume Control Modal */}
      <Modal
        visible={showVolumeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowVolumeModal(false)}
      >
        <View style={styles.volumeModalOverlay}>
          <View
            style={[styles.volumeModalContent, styles.volumeModalContentShadow]}
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
                onValueChange={(val: number) =>
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
                onValueChange={(val: number) => onVolumeChange && onVolumeChange(val)}
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
