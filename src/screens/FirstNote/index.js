/**
 * FirstNoteScreen/index.js - Main entry point
 * Day 0 first-note experience with 8 stages
 */
import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { FirstNoteProvider, useFirstNote } from "./context/FirstNoteContext";
import { DevNavMenu } from "./components/DevNavMenu";
import {
  Stage0Content,
  Stage0Buttons,
  Stage1Content,
  Stage1Buttons,
  Stage2Content,
  Stage2Buttons,
  Stage3Content,
  Stage3Buttons,
  Stage4Content,
  Stage4Buttons,
  Stage5Content,
  Stage5Buttons,
  Stage6Content,
  Stage6Buttons,
  Stage7Content,
  Stage7Buttons,
} from "./stages";
import styles from "./styles";

/**
 * Main content component that uses context
 */
const FirstNoteContent = () => {
  const { stage, error, setError } = useFirstNote();

  // Render current stage content
  const renderStage = () => {
    switch (stage) {
      case 0:
        return <Stage0Content />;
      case 1:
        return <Stage1Content />;
      case 2:
        return <Stage2Content />;
      case 3:
        return <Stage3Content />;
      case 4:
        return <Stage4Content />;
      case 5:
        return <Stage5Content />;
      case 6:
        return <Stage6Content />;
      case 7:
        return <Stage7Content />;
      default:
        return <Stage0Content />;
    }
  };

  // Render fixed bottom buttons based on current stage
  const renderBottomButtons = () => {
    switch (stage) {
      case 0:
        return <Stage0Buttons />;
      case 1:
        return <Stage1Buttons />;
      case 2:
        return <Stage2Buttons />;
      case 3:
        return <Stage3Buttons />;
      case 4:
        return <Stage4Buttons />;
      case 5:
        return <Stage5Buttons />;
      case 6:
        return <Stage6Buttons />;
      case 7:
        return <Stage7Buttons />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          styles.contentContainerWithBottomButtons,
        ]}
      >
        {/* Progress indicator */}
        <View style={styles.progressBar}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s === stage && styles.progressDotActive,
                s < stage && styles.progressDotComplete,
              ]}
            />
          ))}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderStage()}
      </ScrollView>
      {renderBottomButtons()}
      <DevNavMenu />
    </View>
  );
};

/**
 * FirstNoteScreen - Exported screen component
 * Wraps content in provider with route/navigation
 */
export default function FirstNoteScreen({ route, navigation }) {
  return (
    <FirstNoteProvider route={route} navigation={navigation}>
      <FirstNoteContent />
    </FirstNoteProvider>
  );
}
