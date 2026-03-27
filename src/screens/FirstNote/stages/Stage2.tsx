import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AudioInput from "../../../components/AudioInput";
import { EDMVisualizerMedium } from "../../../components/EDMVisualizer";
import { CircularVolumeIndicator } from "../../../components/VolumeBar";
import { useFirstNote } from "../context/FirstNoteContext";
import { DAY0_FOCUS_CARDS, RATING_FACES } from "../data";
import { styles } from "../styles";

/**
 * Focus practice steps
 */
const FOCUS_STEPS = [
  { key: "listen", emoji: "👂", label: "Listen" },
  { key: "sing", emoji: "🎤", label: "Sing" },
  { key: "imagine", emoji: "🧠", label: "Imagine" },
  { key: "play", emoji: "🎺", label: "Play" },
];

/**
 * Stage 2: Focus Card Practice
 * Compact single-panel design with tab navigation
 */
export function Stage2Content() {
  const {
    noteInfo,
    instrument,
    resonantNote,
    volume,
    setVolume,
    pitchAccuracy,
    setPitchAccuracy,
    handlePitchMatch,
    isPlaying,
    playNote,
    stopAudio,
    focusCardIndex,
    setFocusCardIndex,
    focusCardRatings,
    setFocusCardRatings,
    focusStepsDone,
    setFocusStepsDone,
    focusActiveStep,
    setFocusActiveStep,
    focusListenStartedRef,
  } = useFirstNote();

  const currentCard = DAY0_FOCUS_CARDS[focusCardIndex];
  const allCardsComplete = focusCardRatings.length === DAY0_FOCUS_CARDS.length;
  const allRatingsGood =
    allCardsComplete && focusCardRatings.every((r) => r >= 4);
  const showRating = focusStepsDone.play;

  // Reset steps when moving to a new card
  const resetSteps = () => {
    setFocusStepsDone({
      listen: false,
      sing: false,
      imagine: false,
      play: false,
    });
    setFocusActiveStep(0);
    setPitchAccuracy(null);
  };

  // Render content based on active step
  const renderStepContent = () => {
    switch (focusActiveStep) {
      case 0: // Listen
        return (
          <View style={styles.stepContentArea}>
            <Text style={styles.stepInstruction}>
              Listen to your note with the focus in mind
            </Text>
            <TouchableOpacity
              accessibilityLabel={isPlaying ? "Playing note" : "Play note"}
              accessibilityRole="button"
              style={[
                styles.focusActionButton,
                isPlaying && styles.buttonDisabled,
              ]}
              onPress={() => {
                focusListenStartedRef.current = true;
                playNote();
              }}
              disabled={isPlaying}
            >
              <Text style={styles.focusActionButtonText}>
                {isPlaying ? "🔊 Playing..." : "▶️ Play Note"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 1: // Sing
        return (
          <View style={styles.stepContentAreaCompact}>
            <Text style={styles.stepInstruction}>
              Sing the note with an "Oh" sound
            </Text>
            <EDMVisualizerMedium
              volume={volume}
              pitchAccuracy={pitchAccuracy}
            />
            <AudioInput
              enabled={true}
              targetNote={resonantNote}
              onVolumeChange={setVolume}
              onPitchMatch={handlePitchMatch}
              volumeThreshold={0.05}
              pitchMargin={100}
              allowOctaveEquivalent={true}
              compact={true}
            />
            <Text
              style={[
                styles.successTextSmall,
                { opacity: pitchAccuracy === "correct" ? 1 : 0 },
              ]}
            >
              ✓ Correct!
            </Text>
          </View>
        );
      case 2: // Imagine
        return (
          <View style={styles.stepContentAreaCompact}>
            <Text style={styles.stepInstruction}>
              Hear the note clearly in your mind
            </Text>
            <Text style={styles.focusReminderBold}>
              Remember the focus above!
            </Text>
            <CircularVolumeIndicator
              volume={0.3}
              pitchAccuracy="listening"
              size={70}
            />
          </View>
        );
      case 3: // Play
        return (
          <View style={styles.stepContentAreaCompact}>
            <Text style={styles.stepInstruction}>
              Play your note on your {instrument}
            </Text>
            <EDMVisualizerMedium
              volume={volume}
              pitchAccuracy={pitchAccuracy}
            />
            <AudioInput
              enabled={true}
              targetNote={resonantNote}
              onVolumeChange={setVolume}
              onPitchMatch={handlePitchMatch}
              volumeThreshold={0.03}
              pitchMargin={50}
              compact={true}
            />
            <Text
              style={[
                styles.successTextSmall,
                { opacity: pitchAccuracy === "correct" ? 1 : 0 },
              ]}
            >
              ✓ Correct!
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Refine Your Sound</Text>

      {!allCardsComplete && (
        <Text style={styles.subtitle}>
          Focus Card {focusCardIndex + 1} of {DAY0_FOCUS_CARDS.length}
        </Text>
      )}

      {/* Main practice screen - compact panel */}
      {!allCardsComplete && !showRating && (
        <View style={styles.focusPracticePanel}>
          {/* Prominent Focus Banner */}
          <View style={styles.focusBanner}>
            <Text style={styles.focusBannerLabel}>🎯 FOCUS</Text>
            <Text style={styles.focusBannerTitle}>{currentCard.name}</Text>
            <Text style={styles.focusBannerCue}>"{currentCard.cue}"</Text>
          </View>

          {/* Note Display */}
          <View style={styles.focusNoteRow}>
            <Text style={styles.focusNoteLabel}>Playing:</Text>
            <Text style={styles.focusMiniNote}>
              {noteInfo.letter}
              {noteInfo.accidental}
            </Text>
          </View>

          {/* Tab Bar */}
          <View style={styles.focusTabBar}>
            {FOCUS_STEPS.map((step, idx) => (
              <TouchableOpacity
                key={step.key}
                accessibilityLabel={`${step.label} step${focusStepsDone[step.key] ? ", completed" : ""}`}
                accessibilityRole="button"
                style={[
                  styles.focusTab,
                  focusActiveStep === idx && styles.focusTabActive,
                  focusStepsDone[step.key] && styles.focusTabDone,
                ]}
                onPress={() => {
                  stopAudio();
                  setPitchAccuracy(null);
                  setFocusActiveStep(idx);
                }}
              >
                <Text style={styles.focusTabEmoji}>{step.emoji}</Text>
                <Text
                  style={[
                    styles.focusTabLabel,
                    focusActiveStep === idx && styles.focusTabLabelActive,
                  ]}
                >
                  {focusStepsDone[step.key] ? "✓" : step.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Shared Content Area */}
          {renderStepContent()}
        </View>
      )}

      {/* Rating screen after completing all 4 steps */}
      {!allCardsComplete && showRating && (
        <>
          <View style={styles.focusCard}>
            <Text style={styles.focusCardTitle}>Focus: {currentCard.name}</Text>
            <Text style={styles.focusCardDescription}>
              {currentCard.description}
            </Text>
            <Text style={styles.focusCardCue}>"{currentCard.cue}"</Text>
          </View>

          <Text style={styles.instruction}>
            How did that feel with the "{currentCard.name}" focus?
          </Text>
          <View style={styles.ratingContainer}>
            {RATING_FACES.map((face) => (
              <TouchableOpacity
                key={face.value}
                accessibilityLabel={`Rate ${face.label}`}
                accessibilityRole="button"
                style={styles.ratingButton}
                onPress={() => {
                  // Save rating for this card
                  const newRatings = [...focusCardRatings, face.value];
                  setFocusCardRatings(newRatings);

                  // Move to next card or final summary
                  if (focusCardIndex < DAY0_FOCUS_CARDS.length - 1) {
                    setFocusCardIndex(focusCardIndex + 1);
                    resetSteps();
                  }
                  // If last card, allCardsComplete will be true on next render
                }}
              >
                <Text style={styles.ratingEmoji}>{face.emoji}</Text>
                <Text style={styles.ratingLabel}>{face.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Final Summary after all cards */}
      {allCardsComplete && (
        <>
          <Text style={styles.successText}>🎉 Focus Practice Complete!</Text>
          <Text style={styles.instruction}>Your ratings:</Text>
          <View style={styles.ratingSummary}>
            {DAY0_FOCUS_CARDS.map((card, idx) => (
              <View key={idx} style={styles.ratingSummaryRow}>
                <Text style={styles.ratingSummaryCard}>{card.name}:</Text>
                <Text style={styles.ratingSummaryEmoji}>
                  {RATING_FACES.find((f) => f.value === focusCardRatings[idx])
                    ?.emoji || "😐"}
                </Text>
              </View>
            ))}
          </View>

          {allRatingsGood ? (
            <Text style={styles.successMessage}>
              Excellent! You felt good about all three focus concepts!
            </Text>
          ) : (
            <Text style={styles.instruction}>
              Let's keep working on it! Choose an option:
            </Text>
          )}
        </>
      )}
    </View>
  );
}

/**
 * Stage 2 bottom buttons
 */
export function Stage2Buttons() {
  const {
    navigation,
    focusCardIndex,
    setFocusCardIndex,
    focusCardRatings,
    setFocusCardRatings,
    focusStepsDone,
    setFocusStepsDone,
    focusActiveStep,
    setFocusActiveStep,
    stopAudio,
    nextStage,
  } = useFirstNote();

  const allCardsComplete = focusCardRatings.length === DAY0_FOCUS_CARDS.length;
  const allRatingsGood =
    allCardsComplete && focusCardRatings.every((r) => r >= 4);
  const showRating = focusStepsDone.play;

  // Navigation buttons for practice steps
  if (!allCardsComplete && !showRating) {
    return (
      <View style={styles.fixedBottomButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={[
              styles.secondaryButton,
              { flex: 1, marginRight: 8 },
              focusActiveStep === 0 && styles.buttonDisabled,
            ]}
            onPress={() => {
              if (focusActiveStep > 0) {
                stopAudio();
                setFocusActiveStep(focusActiveStep - 1);
              }
            }}
            disabled={focusActiveStep === 0}
          >
            <Text style={styles.secondaryButtonText}>← Back</Text>
          </TouchableOpacity>

          {focusActiveStep < 3 ? (
            <TouchableOpacity
              accessibilityLabel="Next step"
              accessibilityRole="button"
              style={[styles.primaryButton, { flex: 1, marginLeft: 8 }]}
              onPress={() => {
                stopAudio();
                const stepKey = FOCUS_STEPS[focusActiveStep].key;
                setFocusStepsDone((prev) => ({ ...prev, [stepKey]: true }));
                setFocusActiveStep(focusActiveStep + 1);
              }}
            >
              <Text style={styles.primaryButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              accessibilityLabel="Rate this focus card"
              accessibilityRole="button"
              style={[styles.primaryButton, { flex: 1, marginLeft: 8 }]}
              onPress={() => {
                stopAudio();
                setFocusStepsDone((prev) => ({ ...prev, play: true }));
              }}
            >
              <Text style={styles.primaryButtonText}>Rate →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // No buttons during rating selection (ratings are buttons themselves)
  if (!allCardsComplete && showRating) {
    return null;
  }

  // Final summary buttons
  if (allCardsComplete) {
    if (allRatingsGood) {
      return (
        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Practice focus cards again"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => {
              setFocusCardRatings([]);
              setFocusCardIndex(0);
              setFocusStepsDone({
                listen: false,
                sing: false,
                imagine: false,
                play: false,
              });
            }}
          >
            <Text style={styles.secondaryButtonText}>Practice Cards Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Continue to next stage"
            accessibilityRole="button"
            style={[styles.primaryButton, { marginTop: 12 }]}
            onPress={nextStage}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.fixedBottomButtons}>
          <TouchableOpacity
            accessibilityLabel="Pick a different note"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={() => {
              setFocusCardRatings([]);
              navigation.goBack();
            }}
          >
            <Text style={styles.secondaryButtonText}>
              Pick a Different Note
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Practice focus cards again"
            accessibilityRole="button"
            style={[styles.primaryButton, { marginTop: 12 }]}
            onPress={() => {
              setFocusCardRatings([]);
              setFocusCardIndex(0);
              setFocusStepsDone({
                listen: false,
                sing: false,
                imagine: false,
                play: false,
              });
            }}
          >
            <Text style={styles.primaryButtonText}>Practice Cards Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  return null;
}
