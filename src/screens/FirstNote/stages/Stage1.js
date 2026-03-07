import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AudioInput from "../../../components/AudioInput";
import EDMVisualizer from "../../../components/EDMVisualizer";
import { useFirstNote } from "../context/FirstNoteContext";
import { RATING_FACES } from "../data";
import { styles } from "../styles";

/**
 * Stage 1: Imagine and Play
 * User imagines the note, then plays it with pitch detection
 */
export function Stage1Content() {
  const {
    noteInfo,
    instrument,
    resonantNote,
    subStep,
    volume,
    setVolume,
    pitchAccuracy,
    handlePitchMatch,
    rating,
    setRating,
  } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Play Your Note</Text>
      <Text style={styles.noteDisplay}>
        {noteInfo.letter}
        {noteInfo.accidental}
      </Text>

      {subStep === 0 && (
        <>
          <Text style={styles.instruction}>
            Imagine the note clearly in your head first.{"\n"}
            When you're ready, play it on your {instrument}.
          </Text>
        </>
      )}

      {subStep === 1 && (
        <>
          <Text style={styles.instruction}>
            Now play {noteInfo.letter}
            {noteInfo.accidental} on your {instrument}.
          </Text>
        </>
      )}

      {subStep === 2 && (
        <>
          <Text style={styles.instruction}>
            Play {noteInfo.letter}
            {noteInfo.accidental} on your {instrument}!
          </Text>
          <EDMVisualizer volume={volume} pitchAccuracy={pitchAccuracy} />
          <AudioInput
            enabled={true}
            targetNote={resonantNote}
            onVolumeChange={setVolume}
            onPitchMatch={handlePitchMatch}
            volumeThreshold={0.03}
            pitchMargin={50}
          />
          <View style={styles.feedbackContainer}>
            {pitchAccuracy === "correct" && (
              <Text style={styles.successText}>✓ Correct Note!</Text>
            )}
            {pitchAccuracy === "off" && volume > 0.05 && (
              <Text style={styles.warningText}>Adjust your pitch a bit</Text>
            )}
          </View>
        </>
      )}

      {subStep === 3 && !rating && (
        <>
          <Text style={styles.instruction}>How did that feel?</Text>
          <View style={styles.ratingContainer}>
            {RATING_FACES.map((face) => (
              <TouchableOpacity
                key={face.value}
                style={styles.ratingButton}
                onPress={() => setRating(face.value)}
              >
                <Text style={styles.ratingEmoji}>{face.emoji}</Text>
                <Text style={styles.ratingLabel}>{face.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {subStep === 3 && rating && (
        <>
          <Text style={styles.instruction}>
            {rating >= 4
              ? "Nice! What would you like to do next?"
              : "Let's work on that! Choose an option:"}
          </Text>
        </>
      )}
    </View>
  );
}

/**
 * Stage 1 bottom buttons
 */
export function Stage1Buttons() {
  const {
    navigation,
    subStep,
    setSubStep,
    setStage,
    rating,
    setRating,
    pitchAccuracy,
    setPitchAccuracy,
    gotCorrectPitchRef,
    handleSoundEnd,
    nextStage,
  } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(1)}
        >
          <Text style={styles.primaryButtonText}>I'm imagining it...</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 1) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(2)}
        >
          <Text style={styles.primaryButtonText}>▶️ I'm ready to play</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 2) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSoundEnd}>
          <Text style={styles.primaryButtonText}>Done Playing →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 3 && rating) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            setRating(null);
            navigation.goBack();
          }}
        >
          <Text style={styles.secondaryButtonText}>Pick a Different Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => {
            setRating(null);
            gotCorrectPitchRef.current = false;
            setPitchAccuracy(null);
            setStage(0);
            setSubStep(2);
          }}
        >
          <Text style={styles.secondaryButtonText}>Practice Again</Text>
        </TouchableOpacity>
        {rating >= 4 && (
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 12 }]}
            onPress={() => {
              setRating(null);
              nextStage();
            }}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
}
