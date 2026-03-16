import React from "react";
import { View, Text, Platform, ScrollView, StyleSheet } from "react-native";
import ResetButton from "../components/ResetButton";
import { createShadow } from "../styles/theme";

interface FocusCardScreenProps {
  route: {
    params: {
      focusCard: string;
    };
  };
}

export default function FocusCardScreen({ route }: FocusCardScreenProps) {
  const { focusCard } = route.params;
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Focus Card</Text>
          <Text style={styles.cardText}>{focusCard}</Text>
        </View>
      </ScrollView>
      <ResetButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1410",
    padding: 32,
  },
  card: {
    backgroundColor: "#3b2c1a",
    borderRadius: 18,
    padding: 24,
    marginBottom: 18,
    width: 320,
    borderWidth: 2,
    borderColor: "#FFD700",
    ...createShadow("#000", 0, 4, 0.2, 8),
  },
  cardTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  cardText: {
    color: "#fffbe6",
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
});
