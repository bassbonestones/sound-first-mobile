/**
 * Stage5.js - Your Clef teaching
 * Part of FirstNoteScreen modularization
 */
import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useFirstNote } from "../context/FirstNoteContext";
import { BASS_CLEF_INSTRUMENTS } from "../data";
import styles from "../styles";

/**
 * Stage 5 Content - Clef teaching
 */
export const Stage5Content = () => {
  const { subStep, clefType, instrument } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>Your Clef</Text>

      {subStep === 0 && (
        <>
          <Text style={styles.clefSymbol}>
            {clefType === "bass" ? "𝄢" : clefType === "treble" ? "𝄞" : "𝄡"}
          </Text>
          <Text style={styles.instruction}>
            This is the{" "}
            <Text style={styles.bold}>
              {clefType === "bass"
                ? "Bass"
                : clefType === "treble"
                  ? "Treble"
                  : "Alto"}{" "}
              Clef
            </Text>
            .{"\n\n"}A clef tells us which notes go on which lines.
            {"\n\n"}
            Your instrument ({instrument}) uses the {clefType} clef.
          </Text>
        </>
      )}

      {subStep === 1 && clefType === "bass" && (
        <>
          <View style={styles.imageWhiteBubble}>
            <Image
              source={require("../../../../assets/bass_cleff_f.png")}
              style={styles.bassClefImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.instruction}>
            The bass clef is also called the{" "}
            <Text style={styles.bold}>F clef</Text>.{"\n\n"}
            See those two dots? The note F sits right between them!
            {"\n\n"}
            Instruments that use bass clef: {BASS_CLEF_INSTRUMENTS.join(", ")}.
          </Text>
        </>
      )}

      {subStep === 1 && clefType === "treble" && (
        <>
          <Text style={styles.clefSymbol}>𝄞</Text>
          <Text style={styles.instruction}>
            The treble clef is also called the{" "}
            <Text style={styles.bold}>G clef</Text>.{"\n\n"}
            See how it curls around the second line? That line is G!
            {"\n\n"}
            Most melody instruments use treble clef.
          </Text>
        </>
      )}
    </View>
  );
};

/**
 * Stage 5 Buttons - Navigation for clef teaching
 */
export const Stage5Buttons = () => {
  const { subStep, setSubStep, goBackTeaching, nextStage } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          style={styles.backTextButton}
          onPress={() => goBackTeaching(4, 3)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setSubStep(1)}
        >
          <Text style={styles.primaryButtonText}>Tell me more →</Text>
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
        <TouchableOpacity style={styles.primaryButton} onPress={nextStage}>
          <Text style={styles.primaryButtonText}>Got it →</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
};

export default { Stage5Content, Stage5Buttons };
