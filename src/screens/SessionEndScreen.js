/**
 * SessionEndScreen - Shown when a practice session is complete
 *
 * Options:
 * - Go Home
 * - Extend Session (generates more content)
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { devError } from "../utils/devLogger";
import { baseUrl } from "../api/client";

export default function SessionEndScreen({ navigation, route }) {
  const [extending, setExtending] = useState(false);

  // Get session stats from route params
  const {
    completedCount = 0,
    totalDuration = 0,
    sessionParams = {},
  } = route.params || {};

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  const handleExtend = async () => {
    setExtending(true);
    try {
      // Navigate back to Session with extend flag
      // This will generate new content
      navigation.replace("Session", {
        ...sessionParams,
        sessionKey: Date.now(),
        extendSession: true,
      });
    } catch (error) {
      devError("Failed to extend session:", error);
      setExtending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Completion Icon */}
        <Text style={styles.icon}>🎉</Text>

        {/* Title */}
        <Text style={styles.title}>Session Complete!</Text>
        <Text style={styles.subtitle}>Great work on your practice today</Text>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>
                {completedCount === 1 ? "Activity" : "Activities"}
              </Text>
            </View>
            {totalDuration > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalDuration}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          {/* Extend Button */}
          <TouchableOpacity
            style={styles.extendButton}
            onPress={handleExtend}
            disabled={extending}
            accessibilityLabel="Keep practicing"
            accessibilityHint="Extend your session with more activities"
            accessibilityRole="button"
            accessibilityState={{ disabled: extending }}
          >
            {extending ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <>
                <Text style={styles.extendIcon}>➕</Text>
                <Text style={styles.extendText}>Keep Practicing</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Home Button */}
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            accessibilityLabel="Go home"
            accessibilityHint="Return to the main menu"
            accessibilityRole="button"
          >
            <Text style={styles.homeIcon}>🏠</Text>
            <Text style={styles.homeText}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {/* Encouragement */}
        <Text style={styles.encouragement}>
          Every practice session makes you a better musician! 🎵
        </Text>
      </View>
    </SafeAreaView>
  );
}

SessionEndScreen.propTypes = {
  navigation: PropTypes.shape({
    reset: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      completedCount: PropTypes.number,
      totalDuration: PropTypes.number,
      sessionParams: PropTypes.object,
    }),
  }),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Icon & Title
  icon: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 32,
  },

  // Stats Card
  statsCard: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    marginBottom: 32,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#444",
    marginHorizontal: 16,
  },

  // Buttons
  buttons: {
    width: "100%",
    gap: 12,
    marginBottom: 32,
  },
  extendButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
  },
  extendIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  extendText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  homeButton: {
    backgroundColor: "#2a2a3e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
  },
  homeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  homeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },

  // Encouragement
  encouragement: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
