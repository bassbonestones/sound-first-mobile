/**
 * HomeScreen - Main landing screen for the app
 *
 * Features:
 * - Practice button to start a session
 * - Dev navigation via ResetButton component
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import ResetButton from "../components/ResetButton";

export default function HomeScreen({ navigation }) {
  const handleStartPractice = () => {
    navigation.navigate("StartPractice");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎺</Text>
          <Text style={styles.title}>Sound First</Text>
          <Text style={styles.subtitle}>Ear-First Music Practice</Text>
        </View>

        {/* Main Practice Button */}
        <TouchableOpacity
          style={styles.practiceButton}
          onPress={handleStartPractice}
          activeOpacity={0.8}
        >
          <Text style={styles.practiceButtonIcon}>▶️</Text>
          <Text style={styles.practiceButtonText}>Start Practice</Text>
        </TouchableOpacity>

        {/* Quick Stats - placeholder for now */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
          </View>
        </View>
      </View>

      <ResetButton />
    </SafeAreaView>
  );
}

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

  // Header
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 8,
  },

  // Practice Button
  practiceButton: {
    backgroundColor: "#FFD700",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  practiceButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  practiceButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  // Stats Card
  statsCard: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#444",
  },
});
