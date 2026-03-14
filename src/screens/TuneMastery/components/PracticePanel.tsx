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
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";
import Tuner, { TunerMode, Temperament } from "./Tuner";

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

export interface PracticePanelSettings {
  tunerMode?: TunerMode;
  temperament?: Temperament;
  autoMetronome?: boolean;
  autoDrone?: boolean;
}

export interface TuneSettingsForPractice {
  bpm?: number;
  timeSignature?: string;
  subdivision?: number;
  pitchSystem?: "equal" | "just";
  aHertz?: number;
}

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
  const [rating, setRating] = useState(currentScore || 50);

  // Tool visibility states - auto-expand based on settings
  const [tunerExpanded, setTunerExpanded] = useState(false);
  const [metronomeExpanded, setMetronomeExpanded] = useState(false);
  const [droneExpanded, setDroneExpanded] = useState(false);

  // Track if tools are active (playing) - separate from expanded state
  const [metronomeActive, setMetronomeActive] = useState(
    settings?.autoMetronome || false,
  );
  const [droneActive, setDroneActive] = useState(settings?.autoDrone || false);

  // Audio controls
  const [audioMuted, setAudioMuted] = useState(false);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [droneVolume, setDroneVolume] = useState(0.5);

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

  const handleFineTune = (delta: number): void => {
    setRating((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

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
                tunerExpanded && styles.headerToolButtonActive,
              ]}
              onPress={() => {
                const willExpand = !tunerExpanded;
                setTunerExpanded(willExpand);
                if (willExpand) {
                  setMetronomeExpanded(false);
                  setDroneExpanded(false);
                  setAudioMuted(true);
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
                (metronomeExpanded || metronomeActive) &&
                  styles.headerToolButtonMetronome,
              ]}
              onPress={() => {
                if (!metronomeActive) {
                  setMetronomeActive(true);
                  setMetronomeExpanded(true);
                  setTunerExpanded(false);
                  setDroneExpanded(false);
                } else {
                  const willExpand = !metronomeExpanded;
                  setMetronomeExpanded(willExpand);
                  if (willExpand) {
                    setTunerExpanded(false);
                    setDroneExpanded(false);
                  }
                }
              }}
              onLongPress={() => {
                setMetronomeActive(false);
                setMetronomeExpanded(false);
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
                (droneExpanded || droneActive) && styles.headerToolButtonDrone,
              ]}
              onPress={() => {
                if (!droneActive) {
                  setDroneActive(true);
                  setDroneExpanded(true);
                  setTunerExpanded(false);
                  setMetronomeExpanded(false);
                } else {
                  const willExpand = !droneExpanded;
                  setDroneExpanded(willExpand);
                  if (willExpand) {
                    setTunerExpanded(false);
                    setMetronomeExpanded(false);
                  }
                }
              }}
              onLongPress={() => {
                setDroneActive(false);
                setDroneExpanded(false);
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
                  onPress={() => setShowVolumeModal(true)}
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
                  onPress={() => setAudioMuted((prev) => !prev)}
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

      {/* ScrollView for other content */}
      {!tunerExpanded && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Focus Card - hidden when any tool is expanded */}
          {!(metronomeExpanded || droneExpanded) && (
            <View style={styles.focusCard}>
              <Text style={styles.focusCardCategory}>{focusCard.category}</Text>
              <Text style={styles.focusCardName}>{focusCard.name}</Text>
              <Text style={styles.focusCardCue}>{focusCard.attention_cue}</Text>
            </View>
          )}

          {metronomeActive && (
            <View
              style={[
                styles.toolPanel,
                styles.toolPanelMetronome,
                !metronomeExpanded && styles.toolPanelCollapsed,
              ]}
              pointerEvents={metronomeExpanded ? "auto" : "none"}
              accessibilityElementsHidden={!metronomeExpanded}
              importantForAccessibility={
                metronomeExpanded ? "auto" : "no-hide-descendants"
              }
            >
              <Metronome
                initialBpm={metronomeBpm}
                beatsPerMeasure={beatsPerMeasure}
                initialNoteValue={noteValue}
                initialSubdivision={metronomeSubdivision}
                autoStart={settings?.autoMetronome}
                showControls={true}
                showTimeSignature={true}
                showSubdivision={true}
                muted={audioMuted}
                volume={metronomeVolume}
                hideInternalMute={true}
              />
            </View>
          )}

          {droneActive && (
            <View
              style={[
                styles.toolPanel,
                styles.toolPanelDrone,
                !droneExpanded && styles.toolPanelCollapsed,
              ]}
              pointerEvents={droneExpanded ? "auto" : "none"}
              accessibilityElementsHidden={!droneExpanded}
              importantForAccessibility={
                droneExpanded ? "auto" : "no-hide-descendants"
              }
            >
              <PitchDrone
                initialNote={tuneKey}
                autoStart={settings?.autoDrone}
                muted={audioMuted}
                volume={droneVolume}
                hideInternalMute={true}
                temperament={tunePitchSystem}
                pitchCenter={tuneKeyIndex}
                concertA={tuneSettings?.aHertz || 440}
              />
            </View>
          )}

          {/* Rating Section - Hidden when tools are expanded */}
          {!tunerExpanded && !metronomeExpanded && !droneExpanded && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How did it go?</Text>

              {/* Score Display */}
              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreValue}>{rating}%</Text>
                <Text style={styles.scorePrevious}>
                  (prev: {currentScore}%)
                </Text>
              </View>

              {/* Slider */}
              <Slider
                style={styles.slider}
                value={rating}
                onValueChange={(value: number) => setRating(Math.round(value))}
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
          )}
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
        onRequestClose={() => setShowVolumeModal(false)}
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
                onValueChange={setMetronomeVolume}
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
                onValueChange={setDroneVolume}
                minimumTrackTintColor="#00BCD4"
                maximumTrackTintColor="#444"
                thumbTintColor="#00BCD4"
              />
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={() => setShowVolumeModal(false)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a4e",
    backgroundColor: "#2a2a3e",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 8,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 80,
  },
  cancelButton: {
    padding: 6,
    marginRight: 4,
  },
  cancelButtonText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
  },
  titleContainer: {
    flexShrink: 1,
    minWidth: 60,
    alignItems: "flex-start",
    marginLeft: 4,
  },
  practiceTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  practiceKey: {
    color: "#FFD700",
    fontSize: 12,
    marginTop: 1,
  },
  headerToolsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  headerToolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3a3a4e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a4a5e",
  },
  headerToolButtonActive: {
    backgroundColor: "#4a4a6e",
    borderColor: "#FFD700",
  },
  headerToolButtonMetronome: {
    backgroundColor: "#9C27B0",
    borderColor: "#9C27B0",
  },
  headerToolButtonDrone: {
    backgroundColor: "#00BCD4",
    borderColor: "#00BCD4",
  },
  headerToolButtonMuted: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  headerToolEmoji: {
    fontSize: 20,
  },
  headerToolDivider: {
    width: 2,
    height: 28,
    backgroundColor: "#FFD700",
    marginHorizontal: 4,
    borderRadius: 1,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#3b2c1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  focusCardCategory: {
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  focusCardName: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    marginBottom: 8,
  },
  focusCardCue: {
    color: "#fffbe6",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    lineHeight: 22,
  },

  // Tool Panels
  toolPanel: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  tunerPanelFixed: {
    flex: 1,
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    overflow: "hidden",
  },
  toolPanelMetronome: {
    backgroundColor: "#1a1410",
    padding: 0,
    borderColor: "#9C27B0",
    overflow: "hidden",
  },
  toolPanelDrone: {
    backgroundColor: "#1a1a2a",
    padding: 0,
    borderColor: "#00BCD4",
    overflow: "hidden",
  },
  toolPanelCollapsed: {
    height: 0,
    maxHeight: 0,
    padding: 0,
    margin: 0,
    overflow: "hidden",
    opacity: 0,
  },

  // Rating
  ratingSection: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  ratingLabel: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  scoreDisplay: {
    alignItems: "center",
    marginBottom: 8,
  },
  scoreValue: {
    color: "#FFD700",
    fontSize: 48,
    fontWeight: "bold",
  },
  scorePrevious: {
    color: "#666",
    fontSize: 14,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  fineTuneRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  fineTuneButton: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fineTuneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Submit
  submitContainer: {
    padding: 16,
    backgroundColor: "#2a2a3e",
    borderTopWidth: 1,
    borderTopColor: "#3a3a4e",
  },
  submitButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Volume Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  volumeModalContainer: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  volumeModalTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeSection: {
    marginBottom: 24,
  },
  volumeLabelMetronome: {
    color: "#9C27B0",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeLabelDrone: {
    color: "#00BCD4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeSlider: {
    width: "100%",
    height: 40,
  },
  volumeDoneButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  volumeDoneButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
});
