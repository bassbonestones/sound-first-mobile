/**
 * Starting Note Selection Step (Step 2)
 *
 * User selects their starting note via staff picker or microphone detection.
 */

import React from "react";
import PropTypes from "prop-types";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import StaffNotePicker from "../../../components/StaffNotePicker";
import AudioInput from "../../../components/AudioInput";
import ResetButton from "../../../components/ResetButton";
import { createShadow } from "../../../styles/theme";
import ProgressDots from "../components/ProgressDots";
import { styles, colors } from "../styles";

/**
 * Play-to-Select Mode - Microphone pitch detection
 */
function PlayToSelectMode({
  instrumentIcon,
  detectedPitch,
  isSounding,
  onRealtimePitch,
  onFinalPitch,
  onSoundEnd,
  onConfirm,
  onBack,
}) {
  const canConfirm = !!detectedPitch;

  // Determine pitch display background color
  const getPitchBoxStyle = () => {
    if (!isSounding) return styles.pitchDisplayBoxStopped;
    if (detectedPitch?.isInTune) return styles.pitchDisplayBoxInTune;
    return styles.pitchDisplayBoxDefault;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentWithTopPadding}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to staff</Text>
        </TouchableOpacity>

        <Text style={styles.pitchIconText}>{instrumentIcon}</Text>
        <Text style={styles.sectionTitle}>Play a note that feels great</Text>
        <Text style={styles.description}>
          Play around on your instrument and find a note that feels natural,
          resonant, and easy to play. When you find it, hold it steady.
        </Text>

        <AudioInput
          enabled={true}
          onRealtimePitch={onRealtimePitch}
          onPitchDetected={onFinalPitch}
          onSoundEnd={onSoundEnd}
          showDebug={false}
          volumeThreshold={0.2}
        />

        {detectedPitch && (
          <View style={styles.pitchDisplayContainer}>
            <Text style={styles.pitchLabel}>
              {isSounding ? "I hear:" : "Detected:"}
            </Text>
            <View style={[styles.pitchDisplayBox, getPitchBoxStyle()]}>
              <Text style={styles.pitchNoteText}>{detectedPitch.noteName}</Text>
              <Text style={styles.pitchCentsText}>
                {detectedPitch.isRealtime
                  ? detectedPitch.isInTune
                    ? "In tune ✓"
                    : `${detectedPitch.cents > 0 ? "+" : ""}${detectedPitch.cents} cents`
                  : " "}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom area with button and progress dots */}
      <View style={styles.fixedBottomArea}>
        <TouchableOpacity
          accessibilityLabel="Confirm this is my note"
          accessibilityRole="button"
          disabled={!canConfirm}
          onPress={onConfirm}
          style={[
            styles.primaryButton,
            { paddingHorizontal: 32 },
            !canConfirm && styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              !canConfirm && styles.primaryButtonTextDisabled,
            ]}
          >
            Yes, that's my note! ✓
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={2} />
      </View>
      <ResetButton />
    </View>
  );
}

/**
 * Staff-based Note Selection Mode
 */
function StaffSelectMode({
  instrumentIcon,
  instrument,
  clef,
  startingNote,
  onChangeNote,
  onPlayToSelect,
  onBack,
  onSubmit,
}) {
  const canProceed = !!startingNote;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContentWithTopPadding}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.pitchIconText}>{instrumentIcon}</Text>
        <Text style={styles.sectionTitle}>Choose your starting note</Text>
        <Text style={styles.description}>
          Pick a note that feels great, resonant, and easy to play. This will be
          your home base.
        </Text>

        <StaffNotePicker
          clef={clef}
          value={startingNote}
          onChange={onChangeNote}
          onPlayToSelect={onPlayToSelect}
          instrument={instrument}
        />

        <Text style={styles.hint}>
          Don't worry about picking the "perfect" note — you can always change
          it later!
        </Text>
      </ScrollView>

      {/* Fixed bottom area with button and progress dots */}
      <View style={styles.fixedBottomArea}>
        <TouchableOpacity
          accessibilityLabel="Start practicing"
          accessibilityRole="button"
          disabled={!canProceed}
          onPress={onSubmit}
          style={[
            styles.primaryButton,
            !canProceed && styles.primaryButtonDisabled,
            canProceed && createShadow(colors.gold, 0, 4, 0.4, 12),
          ]}
        >
          <Text
            style={[
              styles.primaryButtonTextLarge,
              !canProceed && styles.primaryButtonTextDisabled,
            ]}
          >
            Start Practicing 🎵
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={2} />
      </View>
      <ResetButton />
    </View>
  );
}

/**
 * Starting Note Step - Main Component
 */
export default function StartingNoteStep({
  instrument,
  instrumentIcon,
  clef,
  startingNote,
  playToSelectMode,
  detectedPitch,
  isSounding,
  onChangeNote,
  onRealtimePitch,
  onFinalPitch,
  onSoundEnd,
  onConfirmPitch,
  onSetPlayToSelectMode,
  onBack,
  onSubmit,
}) {
  if (playToSelectMode) {
    return (
      <PlayToSelectMode
        instrumentIcon={instrumentIcon}
        detectedPitch={detectedPitch}
        isSounding={isSounding}
        onRealtimePitch={onRealtimePitch}
        onFinalPitch={onFinalPitch}
        onSoundEnd={onSoundEnd}
        onConfirm={onConfirmPitch}
        onBack={() => onSetPlayToSelectMode(false)}
      />
    );
  }

  return (
    <StaffSelectMode
      instrumentIcon={instrumentIcon}
      instrument={instrument}
      clef={clef}
      startingNote={startingNote}
      onChangeNote={onChangeNote}
      onPlayToSelect={() => onSetPlayToSelectMode(true)}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}

StartingNoteStep.propTypes = {
  instrument: PropTypes.string.isRequired,
  instrumentIcon: PropTypes.string,
  clef: PropTypes.string.isRequired,
  startingNote: PropTypes.string,
  playToSelectMode: PropTypes.bool.isRequired,
  detectedPitch: PropTypes.shape({
    note: PropTypes.string,
    isInTune: PropTypes.bool,
  }),
  isSounding: PropTypes.bool.isRequired,
  onChangeNote: PropTypes.func.isRequired,
  onRealtimePitch: PropTypes.func.isRequired,
  onFinalPitch: PropTypes.func.isRequired,
  onSoundEnd: PropTypes.func.isRequired,
  onConfirmPitch: PropTypes.func.isRequired,
  onSetPlayToSelectMode: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
