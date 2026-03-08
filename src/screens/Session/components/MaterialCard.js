/**
 * MaterialCard - Displays material information with notation in session
 */
import React from "react";
import { View, Text } from "react-native";
import NotationDisplay, {
  NotationPlaceholder,
} from "../../../components/NotationDisplay";
import AudioPlayer from "../../../components/AudioPlayer";
import { createShadow } from "../../../styles/theme";

export default function MaterialCard({ mini }) {
  return (
    <>
      <View
        style={{
          backgroundColor: "#2a2a4a",
          borderRadius: 16,
          padding: 16,
          marginBottom: 18,
          width: 320,
          borderWidth: 1,
          borderColor: "#4a4a6a",
          ...createShadow("#000", 0, 2, 0.15, 4),
        }}
      >
        <Text
          style={{
            color: "#FFD700",
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 8,
          }}
        >
          {mini.material_title || "Material"}
        </Text>

        {mini.key && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#888", fontSize: 13 }}>Key: </Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              {mini.key}
            </Text>
          </View>
        )}

        {/* Notation display or placeholder */}
        {mini.notation_url || mini.material_id ? (
          <NotationDisplay
            notationUrl={mini.notation_url}
            materialId={mini.material_id}
            keySignature={mini.key}
            style={{ marginTop: 8, borderRadius: 8, overflow: "hidden" }}
          />
        ) : (
          <NotationPlaceholder />
        )}
      </View>

      {/* Audio Player */}
      {mini.audio_url && (
        <View
          style={{
            width: 320,
            marginBottom: 18,
            backgroundColor: "#2a2a4a",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#4a4a6a",
          }}
        >
          <AudioPlayer
            audioUrl={mini.audio_url}
            materialId={mini.material_id}
            keySignature={mini.key}
          />
        </View>
      )}
    </>
  );
}
