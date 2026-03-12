/**
 * Stage7.js - Your Note on the Staff (final stage)
 * Part of FirstNoteScreen modularization
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import NotationDisplay from "../../../components/NotationDisplay";
import { useFirstNote } from "../context/FirstNoteContext";
import styles from "../styles";

/**
 * Stage 7 Content - Show the note on the staff
 */
export const Stage7Content = () => {
  const {
    noteInfo,
    clefType,
    stage6MusicXML,
    showSummary,
    setShowSummary,
    scrollToEnd,
  } = useFirstNote();

  const handleShowSummary = () => {
    setShowSummary(true);
    scrollToEnd();
  };

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Your Note on the Staff</Text>

      <View style={styles.notationContainer}>
        <NotationDisplay
          musicxml={stage6MusicXML}
          width={280}
          height={160}
          showTitle={false}
        />
      </View>

      <Text style={styles.instruction}>
        This is{" "}
        <Text style={styles.bold}>
          {noteInfo.letter}
          {noteInfo.accidental}
        </Text>{" "}
        on the {clefType} clef staff.
        {"\n\n"}
        This is the note you practiced playing!
      </Text>

      {!showSummary && (
        <TouchableOpacity
          accessibilityLabel="View what I learned today"
          accessibilityRole="button"
          style={styles.summaryToggleButton}
          onPress={handleShowSummary}
        >
          <Text style={styles.summaryToggleText}>📋 What I Learned Today</Text>
        </TouchableOpacity>
      )}

      {showSummary && (
        <View style={styles.summaryContainer}>
          <TouchableOpacity
            accessibilityLabel="Close summary"
            accessibilityRole="button"
            style={styles.summaryCloseButton}
            onPress={() => setShowSummary(false)}
          >
            <Text style={styles.summaryCloseText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.summaryTitle}>What I Learned</Text>
          <Text style={styles.summaryItem}>
            ✓ The staff has 5 lines and 4 spaces
          </Text>
          <Text style={styles.summaryItem}>
            ✓ Ledger lines extend the staff
          </Text>
          <Text style={styles.summaryItem}>
            ✓ Notes sit on lines or in spaces
          </Text>
          <Text style={styles.summaryItem}>
            ✓ Higher on staff = higher pitch
          </Text>
          <Text style={styles.summaryItem}>
            ✓{" "}
            {clefType === "bass"
              ? "Bass clef shows us where F is"
              : "Treble clef shows us where G is"}
          </Text>
          <Text style={styles.summaryItem}>
            ✓ ♯ sharp (higher), ♮ natural, ♭ flat (lower)
          </Text>
          <Text style={styles.summaryItem}>
            ✓ My note: {noteInfo.letter}
            {noteInfo.accidental}
          </Text>
        </View>
      )}

      {!showSummary && (
        <Text style={styles.hint}>
          Remember: You first <Text style={styles.italic}>heard</Text> it,{" "}
          <Text style={styles.italic}>sang</Text> it,
          <Text style={styles.italic}> imagined</Text> it, then{" "}
          <Text style={styles.italic}>played</Text> it.
          {"\n"}
          Sound before symbol. Always. 🎵
        </Text>
      )}
    </View>
  );
};

/**
 * Stage 7 Buttons - Final stage with play and complete options
 */
export const Stage7Buttons = () => {
  const { isPlaying, playNote, goBackTeaching, completeDay0 } = useFirstNote();

  return (
    <View style={styles.fixedBottomButtons}>
      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        style={styles.backTextButton}
        onPress={() => goBackTeaching(6, 4)}
      >
        <Text style={styles.backTextButtonText}>← Back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityLabel={isPlaying ? "Playing note" : "Play your note"}
        accessibilityRole="button"
        style={[styles.secondaryButton, isPlaying && styles.buttonDisabled]}
        onPress={playNote}
        disabled={isPlaying}
      >
        <Text style={styles.secondaryButtonText}>
          {isPlaying ? "🔊 Playing..." : "▶️ Play Your Note"}
        </Text>
      </TouchableOpacity>

      {/* Two completion options */}
      <View style={styles.completionButtons}>
        <TouchableOpacity
          accessibilityLabel="Start practicing"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => completeDay0("StartPractice")}
        >
          <Text style={styles.primaryButtonText}>🎯 Start Practicing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Go to home"
          accessibilityRole="button"
          style={styles.homeButton}
          onPress={() => completeDay0("Home")}
        >
          <Text style={styles.homeButtonText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default { Stage7Content, Stage7Buttons };
