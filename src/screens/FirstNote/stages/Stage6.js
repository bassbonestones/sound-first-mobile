/**
 * Stage6.js - Sharps, Flats & Naturals teaching
 * Part of FirstNoteScreen modularization
 */
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useFirstNote } from "../context/FirstNoteContext";
import { PITCH_EXPLORER_NOTES } from "../data";
import styles from "../styles";

/**
 * Stage 6 Content - Sharps, Flats & Naturals teaching
 */
export const Stage6Content = () => {
  const {
    subStep,
    setSubStep,
    accidentalExplorer,
    setAccidentalExplorer,
    pitchExplorerIndex,
    setPitchExplorerIndex,
    noteInfo,
    playAccidentalExplorer,
    playCombinedExplorer,
  } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Sharps, Flats & Naturals</Text>

      {subStep === 0 && (
        <>
          <View style={styles.accidentalRow}>
            <View style={styles.accidentalBox}>
              <Text style={styles.accidentalSymbol}>♭</Text>
              <Text style={styles.accidentalName}>Flat</Text>
            </View>
            <View style={styles.accidentalBox}>
              <Text style={styles.accidentalSymbol}>♮</Text>
              <Text style={styles.accidentalName}>Natural</Text>
            </View>
            <View style={styles.accidentalBox}>
              <Text style={styles.accidentalSymbol}>♯</Text>
              <Text style={styles.accidentalName}>Sharp</Text>
            </View>
          </View>
          <Text style={styles.instruction}>
            These symbols change a note's pitch:
            {"\n\n"}
            <Text style={styles.bold}>Flat (♭)</Text> = one step lower{"\n"}
            <Text style={styles.bold}>Natural (♮)</Text> = normal pitch{"\n"}
            <Text style={styles.bold}>Sharp (♯)</Text> = one step higher
          </Text>
        </>
      )}

      {subStep === 1 && (
        <>
          <Text style={styles.instruction}>
            By default, every note is <Text style={styles.bold}>natural</Text>.
            {"\n\n"}
            We only write the natural symbol (♮) when we need to{" "}
            <Text style={styles.italic}>cancel</Text> a previous sharp or flat.
            {"\n\n"}
            Otherwise, no symbol means natural!
          </Text>
        </>
      )}

      {subStep === 2 && (
        <>
          <Text style={styles.instruction}>
            Try it! Tap each symbol to hear the difference:
          </Text>
          <View style={styles.accidentalExplorerStaff}>
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            {accidentalExplorer === "flat" && (
              <Text style={styles.flatOnStaff}>♭</Text>
            )}
            {accidentalExplorer === "sharp" && (
              <Text style={styles.sharpOnStaff}>♯</Text>
            )}
            <View style={styles.accidentalExplorerNote} />
          </View>
          <View style={styles.accidentalExplorerControls}>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "flat" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("flat");
                playAccidentalExplorer("flat");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♭</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "natural" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("natural");
                playAccidentalExplorer("natural");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "sharp" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("sharp");
                playAccidentalExplorer("sharp");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♯</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {subStep === 3 && (
        <>
          <Text style={styles.instruction}>
            Now try both together! Move the note up/down and add accidentals:
          </Text>
          <View style={styles.combinedExplorerStaff}>
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
            {accidentalExplorer === "flat" && (
              <Text
                style={[
                  styles.flatOnStaff,
                  {
                    top: `${PITCH_EXPLORER_NOTES[pitchExplorerIndex].position - 16}%`,
                  },
                ]}
              >
                ♭
              </Text>
            )}
            {accidentalExplorer === "sharp" && (
              <Text
                style={[
                  styles.sharpOnStaff,
                  {
                    top: `${PITCH_EXPLORER_NOTES[pitchExplorerIndex].position - 14}%`,
                  },
                ]}
              >
                ♯
              </Text>
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
          <View style={styles.combinedExplorerControls}>
            <TouchableOpacity
              style={[
                styles.pitchExplorerButton,
                pitchExplorerIndex === 0 && styles.pitchExplorerButtonDisabled,
              ]}
              onPress={() => {
                if (pitchExplorerIndex > 0) {
                  const newIndex = pitchExplorerIndex - 1;
                  setPitchExplorerIndex(newIndex);
                  playCombinedExplorer(newIndex, accidentalExplorer);
                }
              }}
              disabled={pitchExplorerIndex === 0}
            >
              <Text style={styles.pitchExplorerButtonText}>↓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pitchExplorerPlayButton}
              onPress={() =>
                playCombinedExplorer(pitchExplorerIndex, accidentalExplorer)
              }
            >
              <Text style={styles.pitchExplorerPlayButtonText}>▶</Text>
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
                  playCombinedExplorer(newIndex, accidentalExplorer);
                }
              }}
              disabled={pitchExplorerIndex === PITCH_EXPLORER_NOTES.length - 1}
            >
              <Text style={styles.pitchExplorerButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.combinedAccidentalButtons}>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "flat" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("flat");
                playCombinedExplorer(pitchExplorerIndex, "flat");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♭</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "natural" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("natural");
                playCombinedExplorer(pitchExplorerIndex, "natural");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♮</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.accidentalExplorerButton,
                accidentalExplorer === "sharp" &&
                  styles.accidentalExplorerButtonActive,
              ]}
              onPress={() => {
                setAccidentalExplorer("sharp");
                playCombinedExplorer(pitchExplorerIndex, "sharp");
              }}
            >
              <Text style={styles.accidentalExplorerButtonText}>♯</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {subStep === 4 && (
        <>
          <Text style={styles.instruction}>
            Your note is{" "}
            <Text style={styles.bold}>
              {noteInfo.letter}
              {noteInfo.accidental}
            </Text>
            {noteInfo.hasAccidental && (
              <>
                {"\n\n"}
                That {noteInfo.accidental === "♯" ? "sharp" : "flat"} symbol
                means it's one step
                {noteInfo.accidental === "♯" ? " higher than " : " lower than "}
                {noteInfo.letter} natural.
              </>
            )}
            {!noteInfo.hasAccidental && (
              <>
                {"\n\n"}
                This is a "natural" note—no sharp or flat needed.
              </>
            )}
          </Text>
        </>
      )}
    </View>
  );
};

/**
 * Stage 6 Buttons - Navigation for sharps/flats teaching
 */
export const Stage6Buttons = () => {
  const { subStep, setSubStep, goBackTeaching, nextStage } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => goBackTeaching(5, 1)}
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
          <Text style={styles.primaryButtonText}>Try it! →</Text>
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
          <Text style={styles.primaryButtonText}>Next →</Text>
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
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(4)}
        >
          <Text style={styles.primaryButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (subStep === 4) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => setSubStep(3)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
          <Text style={styles.primaryButtonText}>Show me my note! →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
};

export default { Stage6Content, Stage6Buttons };
