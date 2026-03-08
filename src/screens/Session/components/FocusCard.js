/**
 * FocusCard - Displays focus card information in session
 */
import React from "react";
import { View, Text, Platform } from "react-native";
import { createShadow } from "../../../styles/theme";

export default function FocusCard({ mini }) {
  return (
    <View
      style={{
        backgroundColor: "#3b2c1a",
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        width: 320,
        borderWidth: 2,
        borderColor: "#FFD700",
        ...createShadow("#000", 0, 4, 0.2, 8),
      }}
    >
      {mini.focus_card_category && (
        <View
          style={{
            backgroundColor: "#FFD700",
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            alignSelf: "flex-start",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: "#3b2c1a",
              fontSize: 12,
              fontWeight: "bold",
              fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            }}
          >
            {mini.focus_card_category}
          </Text>
        </View>
      )}

      <Text
        style={{
          color: "#FFD700",
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 4,
          fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
        }}
      >
        {mini.focus_card_name}
      </Text>

      {mini.focus_card_attention_cue && (
        <View
          style={{
            backgroundColor: "#4a3a2a",
            borderRadius: 10,
            padding: 12,
            marginVertical: 8,
            borderLeftWidth: 3,
            borderLeftColor: "#FFD700",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 14,
              fontStyle: "italic",
              lineHeight: 20,
            }}
          >
            {mini.focus_card_attention_cue}
          </Text>
        </View>
      )}

      {mini.focus_card_instruction && (
        <Text
          style={{
            color: "#ddd",
            fontSize: 13,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {mini.focus_card_instruction}
        </Text>
      )}
    </View>
  );
}
