import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useFirstNote } from "../context/FirstNoteContext";
import { styles } from "../styles";

/**
 * Stage 3: Learn About Staff
 * Teaching layout for the musical staff
 */
export function Stage3Content() {
  const { subStep } = useFirstNote();

  return (
    <View style={styles.stageContainer}>
      <Text style={styles.stageTitle}>The Musical Staff</Text>

      {subStep === 0 && (
        <>
          <View style={styles.staffVisual}>
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
          </View>
          <Text style={styles.instruction}>
            This is a <Text style={styles.bold}>staff</Text> (sometimes called a
            stave).
            {"\n\n"}
            It has <Text style={styles.bold}>5 lines</Text> and{" "}
            <Text style={styles.bold}>4 spaces</Text>.{"\n\n"}
            Notes sit on the lines or in the spaces to tell us which pitch to
            play.
          </Text>
        </>
      )}

      {subStep === 1 && (
        <>
          <Text style={styles.funFact}>🏥 Fun Memory Trick</Text>
          <Image
            source={require("../../../../assets/staff_infection.jpg")}
            style={styles.staffInfectionImage}
            resizeMode="contain"
          />
          <Text style={styles.instruction}>
            🤣 5 lines = staff = "staff infection"
          </Text>
        </>
      )}

      {subStep === 2 && (
        <>
          <View style={styles.ledgerLineDemo}>
            {/* High note with 2 ledger lines - right side */}
            <View
              style={[
                styles.ledgerLineSmall,
                { alignSelf: "flex-end", marginRight: 40 },
              ]}
            />
            <View
              style={[
                styles.noteDemoCircle,
                { top: 10, right: 53, left: "auto" },
              ]}
            />
            <View
              style={[
                styles.ledgerLineSmall,
                { alignSelf: "flex-end", marginRight: 40 },
              ]}
            />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            <View style={styles.staffLine} />
            {/* Low note ledger line - left side */}
            <View
              style={[
                styles.ledgerLineSmall,
                { alignSelf: "flex-start", marginLeft: 40 },
              ]}
            />
            <View style={[styles.noteDemoCircle, { bottom: 3, left: 50 }]} />
          </View>
          <Text style={styles.instruction}>
            Sometimes notes go <Text style={styles.bold}>beyond</Text> the 5
            lines.
            {"\n\n"}
            When they do, we add short extra lines called{" "}
            <Text style={styles.bold}>ledger lines</Text>.{"\n\n"}
            They're just temporary extensions of the staff!
          </Text>
        </>
      )}
    </View>
  );
}

/**
 * Stage 3 bottom buttons
 */
export function Stage3Buttons() {
  const { subStep, setSubStep, nextStage } = useFirstNote();

  if (subStep === 0) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          accessibilityLabel="Got it, continue"
          accessibilityRole="button"
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
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backTextButton}
          onPress={() => setSubStep(0)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Ha, next"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={() => setSubStep(2)}
        >
          <Text style={styles.primaryButtonText}>Ha! Next →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (subStep === 2) {
    return (
      <View style={styles.fixedBottomButtons}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backTextButton}
          onPress={() => setSubStep(1)}
        >
          <Text style={styles.backTextButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="Got it, continue"
          accessibilityRole="button"
          style={styles.primaryButton}
          onPress={nextStage}
        >
          <Text style={styles.primaryButtonText}>Got it →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
