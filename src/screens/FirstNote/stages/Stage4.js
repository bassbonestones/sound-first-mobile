import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useFirstNote } from "../context/FirstNoteContext";
import { PITCH_EXPLORER_NOTES } from "../data";
import { styles } from "../styles";

/**
 * Stage 4: Learn About Notes
 * Teaching layout for note heads and pitch exploration
 */
export function Stage4Content() {
  const {
    subStep,
    pitchExplorerIndex,
    setPitchExplorerIndex,
    playPitchExplorer,
  } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>What is a Note?</Text>

      {subStep === 0 && (
        <>
          <View style={styles.noteVisualContainer}>
            <View style={styles.noteCircleFilled} />
            <View style={styles.noteCircleHollow} />
          </View>
          <Text style={styles.instruction}>
            Notes are <Text style={styles.bold}>round circles</Text> that tell
            us what pitch to play.
            {"\n\n"}
            The circle is called the <Text style={styles.bold}>note head</Text>.
            {"\n\n"}
            Note heads can be filled (solid) or hollow (open).
          </Text>
        </>
      )}

      {subStep === 1 && (
        <>
          <View style={styles.staffWithNoteVisual}>
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={[styles.noteOnLine, { top: "43%" }]} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
          </View>
          <Text style={styles.instruction}>
            Notes can sit <Text style={styles.bold}>directly on a line</Text>...
            {"\n\n"}
            The line goes right through the middle of the note.
          </Text>
        </>
      )}

      {subStep === 2 && (
        <>
          <View style={styles.staffWithNoteVisual}>
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={[styles.noteInSpace, { top: "34%" }]} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
          </View>
          <Text style={styles.instruction}>
            ...or <Text style={styles.bold}>in a space</Text> between lines.
            {"\n\n"}
            Higher on the staff = higher pitch.
            {"\n"}
            Lower on the staff = lower pitch.
          </Text>
        </>
      )}

      {subStep === 3 && (
        <>
          <Text style={styles.instruction}>
            Try it! Move the note <Text style={styles.bold}>up</Text> or{" "}
            <Text style={styles.bold}>down</Text> to hear different pitches.
          </Text>
          <View style={styles.pitchExplorerStaff}>
            {PITCH_EXPLORER_NOTES[pitchExplorerIndex].ledgerLines <= -2 && (
              <View style={[styles.ledgerLineExplorer, { top: "-22.5%" }]} />
            )}
            {PITCH_EXPLORER_NOTES[pitchExplorerIndex].ledgerLines < 0 && (
              <View style={[styles.ledgerLineExplorer, { top: "-4.5%" }]} />
            )}
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            {PITCH_EXPLORER_NOTES[pitchExplorerIndex].ledgerLines > 0 && (
              <View style={[styles.ledgerLineExplorer, { top: "103.5%" }]} />
            )}
            {PITCH_EXPLORER_NOTES[pitchExplorerIndex].ledgerLines >= 2 && (
              <View style={[styles.ledgerLineExplorer, { top: "121.5%" }]} />
            )}
            <View
              style={[
                styles.pitchExplorerNote,
                {
                  top: `${PITCH_EXPLORER_NOTES[pitchExplorerIndex].position}%`,
                },
              ]}
            />
          </View>
          <View style={styles.pitchExplorerControls}>
            <TouchableOpacity
              style={[
                styles.pitchExplorerButton,
                pitchExplorerIndex === 0 && styles.pitchExplorerButtonDisabled,
              ]}
              onPress={() => {
                if (pitchExplorerIndex > 0) {
                  const newIndex = pitchExplorerIndex - 1;
                  setPitchExplorerIndex(newIndex);
                  playPitchExplorer(newIndex);
                }
              }}
              disabled={pitchExplorerIndex === 0}
            >
              <Text style={styles.pitchExplorerButtonText}>↓ Down</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pitchExplorerPlayButton}
              onPress={() => playPitchExplorer(pitchExplorerIndex)}
            >
              <Text style={styles.pitchExplorerPlayButtonText}>▶ Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pitchExplorerButton,
                pitchExplorerIndex === PITCH_EXPLORER_NOTES.length - 1 &&
                  styles.pitchExplorerButtonDisabled,
              ]}
              onPress={() => {
                if (pitchExplorerIndex < PITCH_EXPLORER_NOTES.length - 1) {
                  const newIndex = pitchExplorerIndex + 1;
                  setPitchExplorerIndex(newIndex);
                  playPitchExplorer(newIndex);
                }
              }}
              disabled={pitchExplorerIndex === PITCH_EXPLORER_NOTES.length - 1}
            >
              <Text style={styles.pitchExplorerButtonText}>↑ Up</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * Stage 4 bottom buttons
 */
export function Stage4Buttons() {
  const { subStep, setSubStep, goBackTeaching, nextStage } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => goBackTeaching(3, 2)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(1)}
        >
          <Text style={styles.primaryButtonText}>Got it →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 1) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => setSubStep(0)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(2)}
        >
          <Text style={styles.primaryButtonText}>What else? →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 2) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => setSubStep(1)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(3)}
        >
          <Text style={styles.primaryButtonText}>Try it! →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 3) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => setSubStep(2)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
          <Text style={styles.primaryButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
