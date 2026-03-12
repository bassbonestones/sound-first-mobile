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
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
} from "react-native";
import Slider from "@react-native-community/slider";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";
import Tuner from "./Tuner";

// Focus cards data - picked randomly for each practice session
const FOCUS_CARDS = [
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

export default function PracticePanel({
  tuneName,
  tuneKey,
  currentScore,
  onSubmitRating,
  onCancel,
  settings,
  tuneSettings,
}) {
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
  const metronomeSubdivisionNum = tuneSettings?.subdivision || 1;

  // Map numeric subdivision to Metronome string keys
  const SUBDIVISION_MAP = {
    1: "none",
    2: "halves",
    3: "triplet",
    4: "quarters",
  };
  const metronomeSubdivision =
    SUBDIVISION_MAP[metronomeSubdivisionNum] || "none";

  // Parse time signature into beats and note value
  const [beatsPerMeasure, noteValue] = metronomeTimeSignature
    .split("/")
    .map(Number);

  // Pick a random focus card when tune/key changes
  const focusCard = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * FOCUS_CARDS.length);
    return FOCUS_CARDS[randomIndex];
  }, [tuneName, tuneKey]);

  const handleFineTune = (delta) => {
    setRating((prev) => Math.min(100, Math.max(0, prev + delta)));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityLabel="Cancel practice"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.practiceTitle}>{tuneName}</Text>
          <Text style={styles.practiceKey}>in {tuneKey}</Text>
        </View>
        {/* Mute and Volume buttons in header - always visible when tools are on */}
        {metronomeExpanded || droneExpanded ? (
          <View style={styles.headerButtonsContainer}>
            {/* Volume button */}
            <TouchableOpacity
              onPress={() => setShowVolumeModal(true)}
              activeOpacity={0.5}
              style={styles.headerVolumeButton}
              accessibilityLabel="Adjust volume"
              accessibilityRole="button"
            >
              <Text style={styles.headerMuteButtonText}>🎚️</Text>
            </TouchableOpacity>
            {/* Mute button */}
            <TouchableOpacity
              style={[
                styles.headerMuteButton,
                audioMuted && styles.headerMuteButtonActive,
              ]}
              onPress={() => {
                setAudioMuted((prev) => !prev);
              }}
              activeOpacity={0.5}
              accessibilityLabel={audioMuted ? "Unmute" : "Mute"}
              accessibilityRole="button"
            >
              <Text style={styles.headerMuteButtonText}>
                {audioMuted ? "🔇" : "🔊"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

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

        {/* Tool Circles Row */}
        <View style={styles.toolsRow}>
          {/* Tuner Circle */}
          <TouchableOpacity
            style={[
              styles.toolCircle,
              tunerExpanded && styles.toolCircleActive,
            ]}
            onPress={() => setTunerExpanded(!tunerExpanded)}
            accessibilityLabel={
              tunerExpanded ? "Collapse tuner" : "Expand tuner"
            }
            accessibilityRole="button"
          >
            <Text style={styles.toolCircleEmoji}>🎯</Text>
            <Text
              style={[
                styles.toolCircleLabel,
                tunerExpanded && styles.toolCircleLabelActive,
              ]}
            >
              Tuner
            </Text>
          </TouchableOpacity>

          {/* Metronome Circle */}
          <TouchableOpacity
            style={[
              styles.toolCircle,
              (metronomeExpanded || metronomeActive) &&
                styles.toolCircleMetronomeActive,
            ]}
            onPress={() => {
              if (!metronomeActive) {
                setMetronomeActive(true);
                setMetronomeExpanded(true);
              } else {
                setMetronomeExpanded(!metronomeExpanded);
              }
            }}
            onLongPress={() => {
              // Long press to stop metronome
              setMetronomeActive(false);
              setMetronomeExpanded(false);
            }}
            accessibilityLabel={
              metronomeExpanded ? "Collapse metronome" : "Expand metronome"
            }
            accessibilityRole="button"
          >
            <Text style={styles.toolCircleEmoji}>🥁</Text>
            <Text
              style={[
                styles.toolCircleLabel,
                (metronomeExpanded || metronomeActive) &&
                  styles.toolCircleLabelActive,
              ]}
            >
              Metro
            </Text>
          </TouchableOpacity>

          {/* Drone Circle */}
          <TouchableOpacity
            style={[
              styles.toolCircle,
              (droneExpanded || droneActive) && styles.toolCircleDroneActive,
            ]}
            onPress={() => {
              if (!droneActive) {
                setDroneActive(true);
                setDroneExpanded(true);
              } else {
                setDroneExpanded(!droneExpanded);
              }
            }}
            onLongPress={() => {
              // Long press to stop drone
              setDroneActive(false);
              setDroneExpanded(false);
            }}
            accessibilityLabel={
              droneExpanded ? "Collapse drone" : "Expand drone"
            }
            accessibilityRole="button"
          >
            <Text style={styles.toolCircleEmoji}>🎵</Text>
            <Text
              style={[
                styles.toolCircleLabel,
                (droneExpanded || droneActive) && styles.toolCircleLabelActive,
              ]}
            >
              Drone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Tool Panels */}
        {tunerExpanded && (
          <View style={styles.toolPanel}>
            <Tuner
              mode={settings?.tunerMode || "needle"}
              temperament={settings?.temperament || "equal"}
            />
          </View>
        )}

        {metronomeActive && (
          <View
            style={[
              styles.toolPanel,
              styles.toolPanelMetronome,
              !metronomeExpanded && styles.toolPanelCollapsed,
            ]}
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
          >
            <PitchDrone
              initialNote={tuneKey}
              autoStart={settings?.autoDrone}
              muted={audioMuted}
              volume={droneVolume}
              hideInternalMute={true}
            />
          </View>
        )}

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
            onValueChange={(value) => setRating(Math.round(value))}
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

PracticePanel.propTypes = {
  tuneName: PropTypes.string.isRequired,
  tuneKey: PropTypes.string.isRequired,
  currentScore: PropTypes.number.isRequired,
  onSubmitRating: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    tunerMode: PropTypes.oneOf(["needle", "text"]),
    temperament: PropTypes.oneOf(["equal", "just"]),
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a4e",
    backgroundColor: "#2a2a3e",
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  practiceTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  practiceKey: {
    color: "#FFD700",
    fontSize: 16,
    marginTop: 2,
  },
  headerSpacer: {
    width: 88, // matches two buttons + gap
  },
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerVolumeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  headerMuteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  headerMuteButtonActive: {
    backgroundColor: "#ff6b6b",
  },
  headerMuteButtonText: {
    fontSize: 20,
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

  // Tool Circles Row
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  toolCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#3a3a4e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a4a5e",
  },
  toolCircleActive: {
    backgroundColor: "#4a4a6e",
    borderColor: "#FFD700",
  },
  toolCircleMetronomeActive: {
    backgroundColor: "#9C27B0",
    borderColor: "#9C27B0",
  },
  toolCircleDroneActive: {
    backgroundColor: "#00BCD4",
    borderColor: "#00BCD4",
  },
  toolCircleEmoji: {
    fontSize: 24,
  },
  toolCircleLabel: {
    color: "#888",
    fontSize: 10,
    marginTop: 2,
  },
  toolCircleLabelActive: {
    color: "#FFFFFF",
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
    padding: 0,
    margin: 0,
    overflow: "hidden",
    opacity: 0,
    position: "absolute",
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
  volumeButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  volumeAdjustButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  volumeBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
  },
  volumeBarFill: {
    height: "100%",
    borderRadius: 6,
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
