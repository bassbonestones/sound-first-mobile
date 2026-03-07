import React from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import ResetButton from "../components/ResetButton";
import { createShadow } from "../styles/theme";

export default function FocusCardScreen({ route }) {
  const { focusCard } = route.params;
  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a1410",
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: "#3b2c1a",
            borderRadius: 18,
            padding: 24,
            marginBottom: 18,
            width: 320,
            borderWidth: 2,
            borderColor: "#FFD700",
            ...createShadow("#000", 0, 4, 0.2, 8),
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 8,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            Focus Card
          </Text>
          <Text
            style={{
              color: "#fffbe6",
              fontSize: 20,
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            {focusCard}
          </Text>
        </View>
      </ScrollView>
      <ResetButton />
    </View>
  );
}
