/**
 * PracticePanel - Full screen active practice view with tools and rating
 *
 * Includes:
 * - Current tune/key display
 * - Random focus card
 * - Collapsible tool circles (Tuner, Metronome, Drone)
 * - Mute button with volume controls (long press)
 * - Rating slider with fine-tune buttons
 */
import React, { useReducer, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";
import Tuner from "./Tuner";
import { practicePanelStyles as styles } from "./practicePanelStyles";
import { practicePanelReducer } from "./practicePanelReducer";
import {
  createInitialPracticePanelState,
  type PracticePanelSettings,
  type TuneSettingsForPractice,
} from "./practicePanelTypes";

// Re-export types for backward compatibility
export type {
  PracticePanelSettings,
  TuneSettingsForPractice,
} from "./practicePanelTypes";

// Focus card type
interface FocusCard {
  name: string;
  category: string;
  attention_cue: string;
}

// Focus cards data - picked randomly for each practice session
const FOCUS_CARDS: FocusCard[] = [
  {
    name: "Pitch Center",
    category: "Ear & Pitch",
    attention_cue:
      "Lock your ear onto the center of the pitch before you play.",
  },
  {
    name: "Pitch + Tone Together",
    category: "Ear & Pitch",
    attention_cue:
      "Hear both the pitch center and the tone quality you want before playing.",
  },
  {
    name: "Pitch Snap",
    category: "Ear & Pitch",
    attention_cue: "Snap to the pitch immediately. No searching.",
  },
  {
    name: "Projection Intent",
    category: "Resonance & Tone",
    attention_cue: "Aim your sound at a point beyond the room.",
  },
  {
    name: "Resonant Ring",
    category: "Resonance & Tone",
    attention_cue:
      "Listen for the ring in your sound—the overtones that bloom after the attack.",
  },
  {
    name: "Core Sound",
    category: "Resonance & Tone",
    attention_cue: "Find the core—the centered, fundamental tone.",
  },
  {
    name: "Soft with Carry",
    category: "Resonance & Tone",
    attention_cue: "Play soft but let the sound still travel.",
  },
  {
    name: "Projected without Push",
    category: "Resonance & Tone",
    attention_cue: "Project through resonance, not through pushing.",
  },
  {
    name: "Stable Center Through Change",
    category: "Resonance & Tone",
    attention_cue: "Keep your core tone stable even as other things change.",
  },
  {
    name: "Subdivision",
    category: "Rhythm & Time",
    attention_cue: "Feel the subdivision—the smallest pulse within the beat.",
  },
  {
    name: "Internal Pulse",
    category: "Rhythm & Time",
    attention_cue: "Feel the pulse inside you—steady and independent.",
  },
  {
    name: "Rhythm Locks Pitch",
    category: "Rhythm & Time",
    attention_cue: "Let perfect rhythm create perfect pitch placement.",
  },
  {
    name: "Speech-Like Time",
    category: "Rhythm & Time",
    attention_cue: "Let the rhythm breathe like natural speech.",
  },
  {
    name: "Time First",
    category: "Rhythm & Time",
    attention_cue: "Set the time before you play a note.",
  },
  {
    name: "Clean Front",
    category: "Articulation & Communication",
    attention_cue: "Every note starts with a clean, clear attack.",
  },
  {
    name: "Rhythmic Communication",
    category: "Articulation & Communication",
    attention_cue: "Your articulation tells the rhythm story.",
  },
  {
    name: "Instant Switch Connection",
    category: "Articulation & Communication",
    attention_cue:
      "Switch articulation styles instantly without breaking flow.",
  },
  {
    name: "Attack Matches Style",
    category: "Articulation & Communication",
    attention_cue: "Match your attack to the musical character.",
  },
  {
    name: "Clean Ends",
    category: "Articulation & Communication",
    attention_cue: "End every note with intention and clarity.",
  },
  {
    name: "Rhythmic Edges",
    category: "Articulation & Communication",
    attention_cue: "Define the rhythm with clear edges on every note.",
  },
  {
    name: "No Extra Movement",
    category: "Ease & Efficiency",
    attention_cue: "Use only the movement you need. Nothing extra.",
  },
  {
    name: "Free Air",
    category: "Ease & Efficiency",
    attention_cue: "Let the air flow freely—no holding, no forcing.",
  },
  {
    name: "Even Changes",
    category: "Ease & Efficiency",
    attention_cue: "Every change is smooth and even—no bumps or jolts.",
  },
  {
    name: "Minimum Pressure",
    category: "Ease & Efficiency",
    attention_cue: "Only as much pressure as you need—not a gram more.",
  },
  {
    name: "Phrase Direction",
    category: "Musical Shape",
    attention_cue:
      "Know where the phrase is going. Every phrase has direction.",
  },
  {
    name: "Forward Rest",
    category: "Musical Shape",
    attention_cue: "Rests keep moving forward. They're active, not passive.",
  },
  {
    name: "Continuous Tension",
    category: "Musical Shape",
    attention_cue: "Keep the musical tension alive from start to finish.",
  },
  {
    name: "Line Over Notes",
    category: "Musical Shape",
    attention_cue: "Hear the line, not just the notes. Connect everything.",
  },
  {
    name: "Confident Silence",
    category: "Musical Shape",
    attention_cue: "Own the silence. It's part of the music.",
  },
  {
    name: "Phrase Targets",
    category: "Musical Shape",
    attention_cue: "Find the target of each phrase and shape toward it.",
  },
];

export interface PracticePanelProps {
  tuneName: string;
  tuneKey: string;
  currentScore: number;
  onSubmitRating: (rating: number) => void;
  onCancel: () => void;
  settings?: PracticePanelSettings;
  tuneSettings?: TuneSettingsForPractice;
}

type SubdivisionKey = 1 | 2 | 3 | 4;
type SubdivisionValue = "none" | "halves" | "triplet" | "quarters";

const SUBDIVISION_MAP: Record<SubdivisionKey, SubdivisionValue> = {
  1: "none",
  2: "halves",
  3: "triplet",
  4: "quarters",
};

// Map key names to chromatic index (0=C, 1=C#/Db, ..., 11=B)
const KEY_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  "B#": 0,
};

export default function PracticePanel({
  tuneName,
  tuneKey,
  currentScore,
  onSubmitRating,
  onCancel,
  settings,
  tuneSettings,
}: PracticePanelProps): React.JSX.Element {
  // Single reducer manages all component state
  const [state, dispatch] = useReducer(
    practicePanelReducer,
    { currentScore, settings },
    ({ currentScore: score, settings: s }) =>
      createInitialPracticePanelState(score, s),
  );

  // Destructure state for readability
  const { tunerExpanded, metronomeExpanded, droneExpanded } =
    state.toolExpansion;
  const { metronomeActive, droneActive } = state.toolActivation;
  const {
    metronomeIsPlaying,
    droneIsPlaying,
    metronomeAutoStarted,
    droneAutoStarted,
  } = state.playback;
  const { audioMuted, metronomeVolume, droneVolume } = state.audio;
  const { showVolumeModal, rating } = state.ui;

  // Set autoStarted flag when component first becomes active
  useEffect(() => {
    if (metronomeActive && !metronomeAutoStarted) {
      dispatch({ type: "SET_METRONOME_AUTO_STARTED" });
    }
  }, [metronomeActive, metronomeAutoStarted]);

  useEffect(() => {
    if (droneActive && !droneAutoStarted) {
      dispatch({ type: "SET_DRONE_AUTO_STARTED" });
    }
  }, [droneActive, droneAutoStarted]);

  // Callbacks for child components
  const handleMetronomePlayingChange = useCallback((isPlaying: boolean) => {
    dispatch({ type: "SET_METRONOME_PLAYING", payload: isPlaying });
  }, []);

  const handleDronePlayingChange = useCallback((isPlaying: boolean) => {
    dispatch({ type: "SET_DRONE_PLAYING", payload: isPlaying });
  }, []);

  // Get metronome settings from tune or use defaults
  const metronomeBpm = tuneSettings?.bpm || 120;
  const metronomeTimeSignature = tuneSettings?.timeSignature || "4/4";
  const metronomeSubdivisionNum = (tuneSettings?.subdivision ||
    1) as SubdivisionKey;

  // Map numeric subdivision to Metronome string keys
  const metronomeSubdivision: SubdivisionValue =
    SUBDIVISION_MAP[metronomeSubdivisionNum] || "none";

  // Parse time signature into beats and note value
  const [beatsPerMeasure, noteValue] = metronomeTimeSignature
    .split("/")
    .map(Number);

  // Get pitch system settings from tune
  const tunePitchSystem = tuneSettings?.pitchSystem || "just";
  const tuneKeyIndex = KEY_TO_INDEX[tuneKey] ?? 0;

  // Pick a random focus card when tune/key changes
  const focusCard = useMemo<FocusCard>(() => {
    const randomIndex = Math.floor(Math.random() * FOCUS_CARDS.length);
    return FOCUS_CARDS[randomIndex];
  }, [tuneName, tuneKey]);

  const handleFineTune = useCallback((delta: number): void => {
    dispatch({ type: "ADJUST_RATING", payload: delta });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - wraps to two lines on small screens */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {/* Title group stays left-aligned */}
          <View style={styles.headerTitleGroup}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              accessibilityLabel="Cancel practice"
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.practiceTitle} numberOfLines={1}>
                {tuneName}
              </Text>
              <Text style={styles.practiceKey}>in {tuneKey}</Text>
            </View>
          </View>
          {/* Tool Buttons - stay right-aligned */}
          <View style={styles.headerToolsRow}>
            {/* Tuner */}
            <TouchableOpacity
              style={[
                styles.headerToolButton,
                !tunerExpanded && styles.headerToolButtonActive,
                tunerExpanded && styles.headerToolButtonActiveExpanded,
              ]}
              onPress={() => {
                if (tunerExpanded) {
                  dispatch({ type: "COLLAPSE_TUNER" });
                } else {
                  dispatch({ type: "EXPAND_TUNER" });
                }
              }}
              accessibilityLabel={
                tunerExpanded ? "Collapse tuner" : "Expand tuner"
              }
              accessibilityRole="button"
            >
              <Text style={styles.headerToolEmoji}>🎯</Text>
            </TouchableOpacity>
            {/* Metronome */}
            <TouchableOpacity
              style={[
                styles.headerToolButton,
                metronomeActive &&
                  !metronomeExpanded &&
                  styles.headerToolButtonMetronome,
                metronomeExpanded && styles.headerToolButtonMetronomeExpanded,
              ]}
              onPress={() => {
                if (!metronomeActive) {
                  dispatch({ type: "EXPAND_METRONOME" });
                } else if (metronomeExpanded) {
                  dispatch({ type: "COLLAPSE_METRONOME" });
                } else {
                  dispatch({ type: "EXPAND_METRONOME" });
                }
              }}
              onLongPress={() => {
                dispatch({ type: "DEACTIVATE_METRONOME" });
              }}
              accessibilityLabel={
                metronomeExpanded ? "Collapse metronome" : "Expand metronome"
              }
              accessibilityRole="button"
            >
              <Text style={styles.headerToolEmoji}>🥁</Text>
            </TouchableOpacity>
            {/* Drone */}
            <TouchableOpacity
              style={[
                styles.headerToolButton,
                droneActive && !droneExpanded && styles.headerToolButtonDrone,
                droneExpanded && styles.headerToolButtonDroneExpanded,
              ]}
              onPress={() => {
                if (!droneActive) {
                  dispatch({ type: "EXPAND_DRONE" });
                } else if (droneExpanded) {
                  dispatch({ type: "COLLAPSE_DRONE" });
                } else {
                  dispatch({ type: "EXPAND_DRONE" });
                }
              }}
              onLongPress={() => {
                dispatch({ type: "DEACTIVATE_DRONE" });
              }}
              accessibilityLabel={
                droneExpanded ? "Collapse drone" : "Expand drone"
              }
              accessibilityRole="button"
            >
              <Text style={styles.headerToolEmoji}>🎵</Text>
            </TouchableOpacity>
            {/* Gold divider + Volume/Mute - only when metronome or drone active */}
            {(metronomeActive || droneActive) && (
              <>
                <View style={styles.headerToolDivider} />
                <TouchableOpacity
                  onPress={() => dispatch({ type: "SHOW_VOLUME_MODAL" })}
                  style={styles.headerToolButton}
                  accessibilityLabel="Adjust volume"
                  accessibilityRole="button"
                >
                  <Text style={styles.headerToolEmoji}>🎚️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.headerToolButton,
                    audioMuted && styles.headerToolButtonMuted,
                  ]}
                  onPress={() => dispatch({ type: "TOGGLE_MUTE" })}
                  accessibilityLabel={audioMuted ? "Unmute" : "Mute"}
                  accessibilityRole="button"
                >
                  <Text style={styles.headerToolEmoji}>
                    {audioMuted ? "🔇" : "🔊"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Tuner Panel - rendered outside ScrollView to fill remaining space */}
      {tunerExpanded && (
        <View style={styles.tunerPanelFixed}>
          <Tuner
            mode={settings?.tunerMode || "needle"}
            temperament={tunePitchSystem}
            selectedKeyIndex={tuneKeyIndex}
            concertA={tuneSettings?.aHertz || 440}
          />
        </View>
      )}

      {/* Metronome Panel - always rendered when active, styled as collapsed or expanded */}
      {metronomeActive && (
        <View
          style={[
            styles.toolPanelFixed,
            styles.toolPanelMetronome,
            !metronomeExpanded && styles.toolPanelCollapsed,
          ]}
          pointerEvents={metronomeExpanded ? "auto" : "none"}
        >
          <Metronome
            initialBpm={metronomeBpm}
            beatsPerMeasure={beatsPerMeasure}
            initialNoteValue={noteValue}
            initialSubdivision={metronomeSubdivision}
            autoStart={settings?.autoMetronome && !metronomeAutoStarted}
            showControls={true}
            showTimeSignature={true}
            showSubdivision={true}
            muted={audioMuted}
            volume={metronomeVolume}
            hideInternalMute={true}
            onPlayingChange={handleMetronomePlayingChange}
          />
        </View>
      )}

      {/* Drone Panel - always rendered when active, styled as collapsed or expanded */}
      {droneActive && (
        <View
          style={[
            styles.toolPanelFixed,
            styles.toolPanelDrone,
            !droneExpanded && styles.toolPanelCollapsed,
          ]}
          pointerEvents={droneExpanded ? "auto" : "none"}
        >
          <PitchDrone
            initialNote={tuneKey}
            autoStart={settings?.autoDrone && !droneAutoStarted}
            muted={audioMuted}
            volume={droneVolume}
            hideInternalMute={true}
            temperament={tunePitchSystem}
            pitchCenter={tuneKeyIndex}
            concertA={tuneSettings?.aHertz || 440}
            onPlayingChange={handleDronePlayingChange}
          />
        </View>
      )}

      {/* ScrollView for other content - shown when no tool is expanded */}
      {!tunerExpanded && !metronomeExpanded && !droneExpanded && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Focus Card */}
          <View style={styles.focusCard}>
            <Text style={styles.focusCardCategory}>{focusCard.category}</Text>
            <Text style={styles.focusCardName}>{focusCard.name}</Text>
            <Text style={styles.focusCardCue}>{focusCard.attention_cue}</Text>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>How did it go?</Text>

            {/* Score Display */}
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreValue}>{rating}%</Text>
              <Text style={styles.scorePrevious}>(prev: {currentScore}%)</Text>
            </View>

            {/* Slider */}
            <Slider
              style={styles.slider}
              value={rating}
              onValueChange={(value: number) =>
                dispatch({ type: "SET_RATING", payload: Math.round(value) })
              }
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor="#FFD700"
              maximumTrackTintColor="#444"
              thumbTintColor="#FFD700"
            />

            {/* Fine Tune Buttons */}
            <View style={styles.fineTuneRow}>
              <TouchableOpacity
                style={styles.fineTuneButton}
                onPress={() => handleFineTune(-5)}
                accessibilityLabel="Decrease rating by 5"
                accessibilityRole="button"
              >
                <Text style={styles.fineTuneButtonText}>-5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fineTuneButton}
                onPress={() => handleFineTune(-1)}
                accessibilityLabel="Decrease rating by 1"
                accessibilityRole="button"
              >
                <Text style={styles.fineTuneButtonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fineTuneButton}
                onPress={() => handleFineTune(1)}
                accessibilityLabel="Increase rating by 1"
                accessibilityRole="button"
              >
                <Text style={styles.fineTuneButtonText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fineTuneButton}
                onPress={() => handleFineTune(5)}
                accessibilityLabel="Increase rating by 5"
                accessibilityRole="button"
              >
                <Text style={styles.fineTuneButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Submit Button - Hidden when tools are expanded */}
      {!tunerExpanded && !metronomeExpanded && !droneExpanded && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => onSubmitRating(rating)}
            accessibilityLabel={`Submit rating of ${rating} percent`}
            accessibilityRole="button"
          >
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Volume Control Modal */}
      <Modal
        visible={showVolumeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => dispatch({ type: "HIDE_VOLUME_MODAL" })}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.volumeModalContainer}>
            <Text style={styles.volumeModalTitle}>Volume Control</Text>

            {/* Metronome Volume */}
            <View style={styles.volumeSection}>
              <Text style={styles.volumeLabelMetronome}>
                🥁 Metronome: {Math.round(metronomeVolume * 100)}%
              </Text>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={metronomeVolume}
                onValueChange={(value) =>
                  dispatch({ type: "SET_METRONOME_VOLUME", payload: value })
                }
                minimumTrackTintColor="#9C27B0"
                maximumTrackTintColor="#444"
                thumbTintColor="#9C27B0"
              />
            </View>

            {/* Drone Volume */}
            <View style={styles.volumeSection}>
              <Text style={styles.volumeLabelDrone}>
                🎵 Drone: {Math.round(droneVolume * 100)}%
              </Text>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={1}
                value={droneVolume}
                onValueChange={(value) =>
                  dispatch({ type: "SET_DRONE_VOLUME", payload: value })
                }
                minimumTrackTintColor="#00BCD4"
                maximumTrackTintColor="#444"
                thumbTintColor="#00BCD4"
              />
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={() => dispatch({ type: "HIDE_VOLUME_MODAL" })}
              style={styles.volumeDoneButton}
              accessibilityLabel="Close volume control"
              accessibilityRole="button"
            >
              <Text style={styles.volumeDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Note: Styles have been extracted to practicePanelStyles.ts
