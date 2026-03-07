import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AudioInput from "../../../components/AudioInput";
import EDMVisualizer from "../../../components/EDMVisualizer";
import { CircularVolumeIndicator } from "../../../components/VolumeBar";
import { useFirstNote } from "../context/FirstNoteContext";
import { styles } from "../styles";

/**
 * Stage 0: Listen and Sing
 * User listens to their note, sings it, then imagines it
 */
export function Stage0Content() {
  const { noteInfo, subStep, volume, setVolume } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Let's Start With Your Note</Text>
      <Text style={styles.noteDisplay}>
        {noteInfo.letter}
        {noteInfo.accidental}
      </Text>

      {subStep === 0 && (
        <>
          <Text style={styles.instruction}>
            Tap Play to hear your note, then confirm when you've heard it.
          </Text>
        </>
      )}

      {subStep === 1 && (
        <>
          <Text style={styles.instruction}>
            Now sing that note using an "Oh" sound.{"\n"}Match the pitch you
            just heard.
          </Text>
          <EDMVisualizer volume={volume} pitchAccuracy="listening" />
          <AudioInput
            enabled={true}
            onVolumeChange={setVolume}
            volumeThreshold={0.1}
          />
          <Text style={styles.hint}>Sing "Ohhhhh" and hold (like a sigh).</Text>
        </>
      )}

      {subStep === 2 && (
        <>
          <Text style={styles.instruction}>
            Great! Now imagine that note clearly in your head.{"\n\n"}
            Hear it in your instrument's sound—with resonance and projection.
          </Text>
          <CircularVolumeIndicator
            volume={0.3}
            pitchAccuracy="listening"
            size={120}
          />
          <Text style={styles.hint}>
            Take a few seconds to really hear it internally...
          </Text>
        </>
      )}
    </View>
  );
}

/**
 * Stage 0 bottom buttons
 */
export function Stage0Buttons() {
  const {
    subStep,
    setSubStep,
    isPlaying,
    playNote,
    stopAudio,
    showHeardItButton,
    nextStage,
  } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, isPlaying && styles.buttonDisabled]}
          onPress={playNote}
          disabled={isPlaying}
        >
          <Text style={styles.primaryButtonText}>
            {isPlaying ? "🔊 Playing..." : "▶️ Play"}
          </Text>
        </TouchableOpacity>
        {showHeardItButton && (
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 12 }]}
            onPress={() => {
              stopAudio();
              setSubStep(1);
            }}
          >
            <Text style={styles.primaryButtonText}>I Heard It →</Text>
          </TouchableOpacity>
        )}
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
          <Text style={styles.primaryButtonText}>Done Singing →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 2) {
    return (
      <View style={styles.fixedBottomButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
            onPress={playNote}
            disabled={isPlaying}
          >
            <Text style={styles.secondaryButtonText}>
              {isPlaying ? "Playing..." : "Listen Again"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setSubStep(1)}
          >
            <Text style={styles.secondaryButtonText}>Sing Again</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
          <Text style={styles.primaryButtonText}>Play →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
