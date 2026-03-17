import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  Modal,
  useWindowDimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { devLog, devWarn } from "../utils/devLogger";

// Import constants and utilities from extracted module
import {
  NOTE_VALUES,
  NOTE_VALUE_NAMES,
  SUBDIVISIONS,
  getSubdivisionLabel,
  createClickSound,
} from "./Metronome/constants";

// Import picker modals
import TimeSignaturePickerModal from "./Metronome/TimeSignaturePickerModal";
import SubdivisionPickerModal from "./Metronome/SubdivisionPickerModal";

// Import styles
import { styles, colors } from "./Metronome/styles";

// AudioContext types
interface AudioContextType {
  currentTime: number;
  state: string;
  resume: () => Promise<void>;
  close: () => Promise<void>;
}

type NativeAudioContextConstructor = new () => AudioContextType;

// Import AudioContext from react-native-audio-api for native platforms
let NativeAudioContext: NativeAudioContextConstructor | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NativeAudioContext = require("react-native-audio-api").AudioContext;
  } catch (e) {
    devWarn("react-native-audio-api not available:", e);
  }
}

/**
 * SMuFL codepoints for Bravura font note symbols (stem up variants)
 */
const NOTE_SYMBOLS: Record<number, string> = {
  1: "\uE1D2",  // noteWhole
  2: "\uE1D3",  // noteHalfUp
  4: "\uE1D5",  // noteQuarterUp
  8: "\uE1D7",  // note8thUp
  16: "\uE1D9", // note16thUp
  32: "\uE1DB", // note32ndUp
};

/**
 * NoteSymbol component - renders musical note symbols using Bravura font
 * Vertical offset aligns noteheads (stems go up, so stemmed notes shift down)
 */
interface NoteSymbolProps {
  value: number;
  active: boolean;
}

const NoteSymbol: React.FC<NoteSymbolProps> = ({ value, active }) => {
  const color = active ? colors.textDark : colors.gold;
  const symbol = NOTE_SYMBOLS[value] || NOTE_SYMBOLS[4];

  // Whole note doesn't have stem, needs to move back up to center
  const topOffset = value === 1 ? -16 : 0;

  return (
    <Text
      style={{
        fontFamily: "Bravura",
        fontSize: 28,
        color,
        textAlign: "center",
        marginTop: topOffset,
      }}
    >
      {symbol}
    </Text>
  );
};

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

interface MetronomeProps {
  initialBpm?: number;
  minBpm?: number;
  maxBpm?: number;
  onBpmChange?: (bpm: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onMuteChange?: (muted: boolean) => void;
  beatsPerMeasure?: number;
  initialNoteValue?: number;
  initialSubdivision?: string;
  accentFirst?: boolean;
  showControls?: boolean;
  autoStart?: boolean;
  showTimeSignature?: boolean;
  showSubdivision?: boolean;
  muted?: boolean;
  volume?: number;
  hideInternalMute?: boolean;
  droneVolume?: number;
  onVolumeChange?: (volume: number) => void;
  onDroneVolumeChange?: (volume: number) => void;
}

const Metronome: React.FC<MetronomeProps> = ({
  initialBpm = 80,
  minBpm = 40,
  maxBpm = 350,
  onBpmChange,
  onPlayingChange,
  onMuteChange,
  beatsPerMeasure: initialBeats = 4,
  initialNoteValue = 4,
  initialSubdivision = "none",
  accentFirst = true,
  showControls = true,
  autoStart = false,
  showTimeSignature = true,
  showSubdivision = true,
  muted = false,
  volume = 1.0,
  hideInternalMute = false,
  droneVolume = 0.5,
  onVolumeChange,
  onDroneVolumeChange,
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubClick, setCurrentSubClick] = useState(0);

  // Time signature state - fully custom
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(initialBeats);
  const [noteValue, setNoteValue] = useState(initialNoteValue);
  const [showTimeSigPicker, setShowTimeSigPicker] = useState(false);

  // Subdivision state
  const [subdivision, setSubdivision] = useState(initialSubdivision);
  const [showSubdivisionPicker, setShowSubdivisionPicker] = useState(false);

  // Volume modal state
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Responsive vertical spacing
  const { height: screenHeight } = useWindowDimensions();
  const MIN_HEIGHT = 568;
  const MAX_HEIGHT = 700;
  const MIN_GAP = 8; // minimum spacing (current tight values)
  const MAX_GAP = 20; // maximum spacing
  const heightRatio = Math.min(
    1,
    Math.max(0, (screenHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)),
  );
  const verticalGap = Math.round(MIN_GAP + heightRatio * (MAX_GAP - MIN_GAP));
  const smallGap = Math.round(verticalGap * 0.6); // for tighter spacing (e.g., 5-12px)

  // Reset subdivision to "none" if swing is selected but noteValue changes from 4
  useEffect(() => {
    if (subdivision === "swing" && noteValue !== 4) {
      setSubdivision("none");
    }
  }, [noteValue, subdivision]);

  const audioContextRef = useRef<AudioContextType | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subIntervalRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextBeatTimeRef = useRef(0);
  const schedulerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      const WebAudioContext =
        (
          window as typeof window & {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          }
        ).AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (WebAudioContext) {
        audioContextRef.current =
          new WebAudioContext() as unknown as AudioContextType;
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
        subIntervalRef.current.forEach((t) => clearTimeout(t));
      }
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
    };
  }, []);

  // Scheduler for precise timing
  const scheduleNote = useCallback(
    (beatNumber: number, time: number) => {
      if (audioContextRef.current) {
        // Accent on beat 1 if enabled
        const isAccent = accentFirst && beatNumber === 0;
        const frequency = isAccent ? 1200 : 800;
        createClickSound(
          audioContextRef.current as unknown as AudioContext,
          frequency,
          0.05,
        );
      }
    },
    [accentFirst],
  );

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    const secondsPerBeat = 60.0 / bpm;
    const scheduleAheadTime = 0.1; // Schedule 100ms ahead

    while (
      nextBeatTimeRef.current <
      audioContextRef.current.currentTime + scheduleAheadTime
    ) {
      scheduleNote(currentBeat, nextBeatTimeRef.current);
      nextBeatTimeRef.current += secondsPerBeat;
      setCurrentBeat((prev) => (prev + 1) % beatsPerMeasure);
    }
  }, [bpm, currentBeat, beatsPerMeasure, scheduleNote]);

  // Play subdivision clicks within a beat
  const playSubdivisionClicks = useCallback(
    (
      beatCounter: number,
      msPerBeat: number,
      isFirstBeat: boolean,
    ): ReturnType<typeof setTimeout>[] => {
      const subdivisionPattern = SUBDIVISIONS[subdivision];
      if (!subdivisionPattern || !audioContextRef.current) return [];

      const timeouts: ReturnType<typeof setTimeout>[] = [];
      const pattern = subdivisionPattern.pattern;
      const accents = subdivisionPattern.accent;

      pattern.forEach((timing: number, index: number) => {
        const delayMs = timing * msPerBeat;
        const timeout = setTimeout(() => {
          if (audioContextRef.current && !mutedRef.current) {
            // Beat 1 gets strongest accent, subdivisions get their pattern accents
            const isBeatAccent = isFirstBeat && index === 0 && accentFirst;
            const subAccent = accents[index] || 0.5;
            const frequency = isBeatAccent ? 1200 : index === 0 ? 900 : 700;
            const baseVolume = isBeatAccent ? 0.6 : subAccent * 0.5;
            const finalVolume = baseVolume * volumeRef.current; // Apply master volume

            devLog(
              `[Metronome] Beat ${beatCounter + 1}/${beatsPerMeasure}, sub=${index + 1}/${pattern.length}, freq=${frequency}Hz, vol=${finalVolume.toFixed(2)}`,
            );
            createClickSound(
              audioContextRef.current as unknown as AudioContext,
              frequency,
              0.04,
              finalVolume,
            );
          }
          setCurrentSubClick(index);
        }, delayMs);
        timeouts.push(timeout);
      });

      return timeouts;
    },
    [subdivision, beatsPerMeasure, accentFirst],
  );

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
      devLog(
        `[Metronome] Starting at ${bpm} BPM, interval=${msPerBeat}ms, beatsPerMeasure=${beatsPerMeasure}, subdivision=${subdivision}, pattern=${subdivisionPattern.pattern.join(",")}`,
      );

      intervalRef.current = setInterval(() => {
        const isFirstBeat = beatCounter === 0;

        // Schedule subdivision clicks for this beat
        const newTimeouts = playSubdivisionClicks(
          beatCounter,
          msPerBeat,
          isFirstBeat,
        );
        subIntervalRef.current = [...subIntervalRef.current, ...newTimeouts];

        // Clean up old timeouts
        subIntervalRef.current = subIntervalRef.current.filter(
          (t) => t !== null,
        );

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
        subIntervalRef.current.forEach((t) => clearTimeout(t));
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
        subIntervalRef.current.forEach((t) => clearTimeout(t));
      }
    };
  }, [isPlaying, bpm, beatsPerMeasure, subdivision, playSubdivisionClicks]);

  const handleBpmChange = (newBpm: number): void => {
    const clampedBpm = Math.max(minBpm, Math.min(maxBpm, newBpm));
    setBpm(clampedBpm);
    if (onBpmChange) {
      onBpmChange(clampedBpm);
    }
  };

  const togglePlay = (): void => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    if (onPlayingChange) {
      onPlayingChange(newPlaying);
    }
  };

  const toggleMute = (): void => {
    if (onMuteChange) {
      onMuteChange(!muted);
    }
  };

  // Tap tempo feature
  const tapTimesRef = useRef<number[]>([]);
  const handleTapTempo = (): void => {
    const now = Date.now();
    tapTimesRef.current.push(now);

    // Keep only last 4 taps
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }

    // Calculate average BPM from taps
    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }

    // Reset if too much time passed
    setTimeout(() => {
      if (
        tapTimesRef.current.length > 0 &&
        Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1] > 2000
      ) {
        tapTimesRef.current = [];
      }
    }, 2000);
  };

  const currentSubdivision = SUBDIVISIONS[subdivision];

  return (
    <View style={[styles.mainContainer, { padding: verticalGap }]}>
      {/* Mute Button - top right corner, only when playing */}
      {/* Tap to mute, long-press for volume controls */}
      {isPlaying && !hideInternalMute && (
        <Pressable
          onPress={toggleMute}
          onLongPress={() => setShowVolumeModal(true)}
          delayLongPress={400}
          style={({ pressed }) => [
            styles.muteButton,
            { backgroundColor: muted ? "#555" : pressed ? "#444" : "#333" },
          ]}
          accessibilityLabel={muted ? "Unmute metronome" : "Mute metronome"}
          accessibilityHint="Long press to open volume controls"
          accessibilityRole="button"
        >
          <Text style={styles.muteButtonText}>{muted ? "🔇" : "🔊"}</Text>
        </Pressable>
      )}

      {/* Time Signature & Subdivision Buttons - always at top */}
      {showControls && (showTimeSignature || showSubdivision) && (
        <View style={[styles.selectorRow, { marginBottom: smallGap }]}>
          {/* Time Signature Selector */}
          {showTimeSignature && (
            <TouchableOpacity
              onPress={() => {
                if (!showSubdivisionPicker) {
                  setShowTimeSigPicker(!showTimeSigPicker);
                }
              }}
              disabled={showSubdivisionPicker}
              style={[
                styles.timeSigButton,
                showTimeSigPicker
                  ? styles.timeSigButtonActive
                  : styles.timeSigButtonInactive,
                { opacity: showSubdivisionPicker ? 0.5 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.timeSigButtonText,
                  showTimeSigPicker
                    ? styles.timeSigButtonTextActive
                    : styles.timeSigButtonTextInactive,
                ]}
              >
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
              style={[
                styles.subdivisionButton,
                showSubdivisionPicker
                  ? styles.subdivisionButtonActive
                  : styles.subdivisionButtonInactive,
                { opacity: showTimeSigPicker ? 0.5 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.subdivisionButtonText,
                  showSubdivisionPicker
                    ? styles.subdivisionButtonTextActive
                    : styles.subdivisionButtonTextInactive,
                ]}
              >
                {getSubdivisionLabel(subdivision, noteValue)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Time Signature Picker Modal */}
      <TimeSignaturePickerModal
        visible={showTimeSigPicker}
        onClose={() => setShowTimeSigPicker(false)}
        beatsPerMeasure={beatsPerMeasure}
        noteValue={noteValue}
        onBeatsChange={setBeatsPerMeasure}
        onNoteValueChange={setNoteValue}
      />

      {/* Subdivision Picker Modal */}
      <SubdivisionPickerModal
        visible={showSubdivisionPicker}
        onClose={() => setShowSubdivisionPicker(false)}
        subdivision={subdivision}
        noteValue={noteValue}
        onSubdivisionChange={setSubdivision}
      />

      {/* Hide elements below when picker is open */}
      {!showTimeSigPicker && !showSubdivisionPicker && (
        <>
          {/* BPM Display */}
          <View style={[styles.bpmContainer, { marginBottom: verticalGap }]}>
            <Text style={styles.bpmText}>{bpm}</Text>
            <Text style={styles.bpmLabel}>BPM</Text>
          </View>

          {/* Beat Indicator */}
          <View style={[styles.beatIndicatorRow, { marginBottom: verticalGap }]}>
            {Array.from({ length: beatsPerMeasure }, (_, i) => {
              const isCurrentBeat = isPlaying && currentBeat === i;
              const isAccentBeat = i === 0 && accentFirst;
              return (
                <View
                  key={i}
                  style={[
                    styles.beatDot,
                    isCurrentBeat
                      ? isAccentBeat
                        ? styles.beatDotActiveAccent
                        : styles.beatDotActive
                      : isAccentBeat
                        ? styles.beatDotInactiveAccent
                        : styles.beatDotInactive,
                  ]}
                />
              );
            })}
          </View>

          {showControls && (
            <>
              {/* BPM Controls */}
              <View style={[styles.bpmControlsRow, { marginBottom: verticalGap }]}>
                <TouchableOpacity
                  onPress={() => handleBpmChange(bpm - 5)}
                  style={styles.bpmButtonLarge}
                >
                  <Text style={styles.bpmButtonLargeText}>-</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleBpmChange(bpm - 1)}
                  style={styles.bpmButtonSmall}
                >
                  <Text style={styles.bpmButtonSmallText}>-1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleBpmChange(bpm + 1)}
                  style={styles.bpmButtonSmall}
                >
                  <Text style={styles.bpmButtonSmallText}>+1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleBpmChange(bpm + 5)}
                  style={styles.bpmButtonLarge}
                >
                  <Text style={styles.bpmButtonLargeText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Play/Stop & Tap Tempo */}
              <View style={[styles.playButtonsRow, { marginTop: smallGap }]}>
                <TouchableOpacity
                  onPress={togglePlay}
                  style={[
                    styles.playButtonStart,
                    isPlaying && styles.playButtonStop,
                  ]}
                  accessibilityLabel={
                    isPlaying ? "Stop metronome" : "Start metronome"
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.playButtonText}>
                    {isPlaying ? "⏹ Stop" : "▶ Start"}
                  </Text>
                </TouchableOpacity>

                {!isPlaying && (
                  <TouchableOpacity
                    onPress={handleTapTempo}
                    style={styles.tapButton}
                    accessibilityLabel="Tap tempo"
                    accessibilityHint="Tap repeatedly to set tempo from your taps"
                    accessibilityRole="button"
                  >
                    <Text style={styles.tapButtonText}>Tap</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Preset BPM buttons - two rows of 3 */}
              <View style={[styles.presetsContainer, { marginTop: verticalGap }]}>
                <View style={styles.presetsRow}>
                  {[60, 80, 100].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => handleBpmChange(preset)}
                      style={[
                        styles.presetButton,
                        bpm === preset
                          ? styles.presetButtonActive
                          : styles.presetButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          bpm === preset
                            ? styles.presetButtonTextActive
                            : styles.presetButtonTextInactive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.presetsRow}>
                  {[120, 140, 160].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => handleBpmChange(preset)}
                      style={[
                        styles.presetButton,
                        bpm === preset
                          ? styles.presetButtonActive
                          : styles.presetButtonInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetButtonText,
                          bpm === preset
                            ? styles.presetButtonTextActive
                            : styles.presetButtonTextInactive,
                        ]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </>
      )}

      {Platform.OS !== "web" && !NativeAudioContext && (
        <Text style={styles.audioUnavailableText}>
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
        <View style={styles.volumeModalOverlay}>
          <View style={[styles.volumeModalContent]}>
            <Text style={styles.volumeModalTitle}>🔊 Volume Controls</Text>

            {/* Metronome Volume */}
            <View style={styles.volumeSliderRow}>
              <Text style={styles.volumeLabelPurple}>
                🎵 Metronome: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={(val: number) =>
                  onVolumeChange && onVolumeChange(val)
                }
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#444"
                thumbTintColor="#9C27B0"
              />
            </View>

            {/* Drone Volume */}
            <View style={styles.volumeSliderRowLast}>
              <Text style={styles.volumeLabelCyan}>
                🎶 Drone: {Math.round(droneVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={droneVolume}
                onValueChange={(val: number) =>
                  onDroneVolumeChange && onDroneVolumeChange(val)
                }
                minimumTrackTintColor="#00BCD4"
                maximumTrackTintColor="#444"
                thumbTintColor="#00BCD4"
              />
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowVolumeModal(false)}
              style={styles.volumeModalDoneButton}
            >
              <Text style={styles.volumeModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Compact metronome for inline use (e.g., in session screen)
interface CompactMetronomeProps {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  beatsPerMeasure?: number;
}

export const CompactMetronome: React.FC<CompactMetronomeProps> = ({
  bpm,
  isPlaying,
  currentBeat,
  beatsPerMeasure = 4,
}) => {
  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactBpmText}>{bpm} BPM</Text>
      {Array.from({ length: beatsPerMeasure }, (_, i) => (
        <View
          key={i}
          style={[
            styles.compactBeatDot,
            isPlaying && currentBeat === i
              ? styles.compactBeatDotActive
              : styles.compactBeatDotInactive,
          ]}
        />
      ))}
    </View>
  );
};

export default Metronome;
