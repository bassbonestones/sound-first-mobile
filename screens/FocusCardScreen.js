import React from "react";
import { View, Text, Platform, ScrollView } from "react-native";

export default function FocusCardScreen({ route }) {
  const { focusCard } = route.params;
  return (
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
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
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
  );
}
