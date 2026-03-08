import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";

// Import constants and utilities from extracted module
import {
  NOTE_VALUES,
  NOTE_VALUE_NAMES,
  SUBDIVISIONS,
  getSubdivisionLabel,
  createClickSound,
} from "./Metronome/constants";

// Import styles
import { styles, colors } from "./Metronome/styles";

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
        subIntervalRef.current.forEach((t) => clearTimeout(t));
      }
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
    };
  }, []);

  // Scheduler for precise timing
  const scheduleNote = useCallback(
    (beatNumber, time) => {
      if (audioContextRef.current) {
        // Accent on beat 1 if enabled
        const isAccent = accentFirst && beatNumber === 0;
        const frequency = isAccent ? 1200 : 800;
        createClickSound(audioContextRef.current, frequency, 0.05);
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
    (beatCounter, msPerBeat, isFirstBeat) => {
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
            const frequency = isBeatAccent ? 1200 : index === 0 ? 900 : 700;
            const baseVolume = isBeatAccent ? 0.6 : subAccent * 0.5;
            const finalVolume = baseVolume * volumeRef.current; // Apply master volume

            console.log(
              `[Metronome] Beat ${beatCounter + 1}/${beatsPerMeasure}, sub=${index + 1}/${pattern.length}, freq=${frequency}Hz, vol=${finalVolume.toFixed(2)}`,
            );
            createClickSound(
              audioContextRef.current,
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
      console.log(
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
    <View style={styles.mainContainer}>
      {/* Mute Button - top right corner, only when playing */}
      {/* Tap to mute, long-press for volume controls */}
      {isPlaying && (
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

      {/* BPM Display */}
      <View style={styles.bpmContainer}>
        <Text style={styles.bpmText}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>

      {/* Time Signature & Subdivision Display */}
      {showControls && (showTimeSignature || showSubdivision) && (
        <View style={styles.selectorRow}>
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
              {...(Platform.OS === "web"
                ? { title: "Select time signature" }
                : {})}
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
              {...(Platform.OS === "web"
                ? { title: "Select subdivision pattern" }
                : {})}
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

      {/* Time Signature Picker */}
      {showTimeSigPicker && (
        <View
          style={{
            backgroundColor: "#2d232e",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <Text style={[styles.pickerTitle, styles.pickerTitleGold]}>
            Time Signature
          </Text>

          {/* Beats per measure (top number) */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.pickerLabel}>Beats per measure (1-12):</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() =>
                  setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))
                }
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{beatsPerMeasure}</Text>
              <TouchableOpacity
                onPress={() =>
                  setBeatsPerMeasure(Math.min(12, beatsPerMeasure + 1))
                }
                style={styles.stepperButton}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note value (bottom number) */}
          <View>
            <Text style={styles.pickerLabel}>Beat note value:</Text>
            <View style={styles.noteValueGrid}>
              {NOTE_VALUES.map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setNoteValue(val)}
                  style={[
                    styles.noteValueButton,
                    noteValue === val
                      ? styles.noteValueButtonActive
                      : styles.noteValueButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.noteValueText,
                      noteValue === val
                        ? styles.noteValueTextActive
                        : styles.noteValueTextInactive,
                    ]}
                  >
                    {val}
                  </Text>
                  <Text
                    style={[
                      styles.noteValueLabel,
                      noteValue === val
                        ? styles.noteValueLabelActive
                        : styles.noteValueLabelInactive,
                    ]}
                  >
                      color: noteValue === val ? "#5a4a3a" : "#666",
                      fontSize: 9,
                    }}
                  >
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
        <View
          style={{
            backgroundColor: "#2d232e",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            width: "100%",
            maxWidth: 340,
          }}
        >
          <Text
            style={{ color: "#9C27B0", fontWeight: "bold", marginBottom: 8 }}
          >
            Subdivision Pattern
          </Text>
          {noteValue !== 4 && (
            <Text style={styles.pickerNote}>
              Note: Swing patterns only available in /4 time
            </Text>
          )}
          <ScrollView
            style={styles.subdivisionScrollView}
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
                  style={[
                    styles.subdivisionOption,
                    subdivision === key
                      ? styles.subdivisionOptionActive
                      : styles.subdivisionOptionInactive,
                  ]}
                >
                  <View style={styles.subdivisionOptionContent}>
                    <Text
                      style={[
                        styles.subdivisionOptionTitle,
                        subdivision === key
                          ? styles.subdivisionOptionTitleActive
                          : styles.subdivisionOptionTitleInactive,
                      ]}
                    >
                      {getSubdivisionLabel(key, noteValue)}
                    </Text>
                    <Text
                      style={[
                        styles.subdivisionOptionDesc,
                        subdivision === key
                          ? styles.subdivisionOptionDescActive
                          : styles.subdivisionOptionDescInactive,
                      ]}
                    >
                      {sub.description}
                    </Text>
                  </View>
                  {subdivision === key && (
                    <Text style={styles.subdivisionCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowSubdivisionPicker(false)}
            style={styles.doneButtonPurple}
          >
            <Text style={styles.doneButtonTextLight}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Beat Indicator */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          maxWidth: 320,
        }}
      >
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              margin: 4,
              backgroundColor:
                isPlaying && currentBeat === i
                  ? i === 0 && accentFirst
                    ? colors.accent
                    : colors.gold
                  : colors.surface,
              borderWidth: 2,
              borderColor: i === 0 && accentFirst ? colors.accent : colors.gold,
              transform:
                isPlaying && currentBeat === i
                  ? [{ scale: 1.2 }]
                  : [{ scale: 1 }],
            }}
          />
        ))}
      </View>

      {/* Subdivision indicator (small dots under current beat) */}
      {subdivision !== "none" && isPlaying && (
        <View style={styles.subIndicatorRow}>
          {currentSubdivision.pattern.map((_, i) => (
            <View
              key={i}
              style={[
                styles.subIndicatorDot,
                currentSubClick === i
                  ? styles.subIndicatorDotActive
                  : styles.subIndicatorDotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {showControls && (
        <>
          {/* BPM Controls */}
          <View style={styles.bpmControlsRow}>
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
          <View style={styles.playButtonsRow}>
            <TouchableOpacity
              onPress={togglePlay}
              style={[
                styles.playButton,
                isPlaying ? styles.playButtonStop : styles.playButtonStart,
              ]}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? "⏹ Stop" : "▶ Start"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTapTempo}
              style={styles.tapButton}
            >
              <Text style={styles.tapButtonText}>👆 Tap</Text>
            </TouchableOpacity>
          </View>

          {/* Preset BPM buttons */}
          <View style={styles.presetsRow}>
            {[60, 80, 100, 120, 140, 160].map((preset) => (
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
        </>
      )}

      {Platform.OS !== "web" && !NativeAudioContext && (
        <Text style={styles.audioWarning}>
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
            <View style={styles.volumeSliderRow}>
              <Text style={styles.volumeLabelPurple}>
                🎵 Metronome: {Math.round(volume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
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
            <View style={styles.volumeSliderRowLast}>
              <Text style={styles.volumeLabelCyan}>
                🎶 Drone: {Math.round(droneVolume * 100)}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={droneVolume}
                onValueChange={(val) =>
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
}

// Compact metronome for inline use (e.g., in session screen)
export function CompactMetronome({
  bpm,
  isPlaying,
  currentBeat,
  beatsPerMeasure = 4,
}) {
  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactBpmText}>{bpm} BPM</Text>
      {Array.from({ length: beatsPerMeasure }, (_, i) => (
        <View
          key={i}
          style={[
            styles.compactBeatDot,
            isPlaying && currentBeat === i
              ? styles.beatDotActive
              : styles.beatDotInactive,
          ]}
        />
      ))}
    </View>
  );
}
