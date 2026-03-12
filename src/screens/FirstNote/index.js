/**
 * FirstNoteScreen/index.js - Main entry point
 * Day 0 first-note experience with 8 stages
 */
import React from "react";
import PropTypes from "prop-types";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import ErrorBoundary from "../../components/ErrorBoundary";
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
  const { stage, skippableStages, error, setError, scrollToEndRef } = useFirstNote();
  const scrollViewRef = React.useRef(null);

  // Set the scrollToEnd callback in context so child components can trigger scroll
  React.useEffect(() => {
    scrollToEndRef.current = () => {
      // Small delay to let the content render first
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    };
  }, [scrollToEndRef]);

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
    <View style={styles.flexContainer}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          styles.contentContainerWithBottomButtons,
        ]}
      >
        {/* Progress indicator */}
        <View style={styles.progressBar}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => {
            const isSkipped = skippableStages.includes(s);
            return (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  isSkipped && styles.progressDotSkipped,
                  s === stage && styles.progressDotActive,
                  s < stage && !isSkipped && styles.progressDotComplete,
                ]}
              />
            );
          })}
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              accessibilityLabel="Dismiss error"
              accessibilityRole="button"
              onPress={() => setError(null)}
            >
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
    <ErrorBoundary>
      <FirstNoteProvider route={route} navigation={navigation}>
        <FirstNoteContent />
      </FirstNoteProvider>
    </ErrorBoundary>
  );
}

FirstNoteScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.object,
  }),
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    dispatch: PropTypes.func,
  }).isRequired,
};
