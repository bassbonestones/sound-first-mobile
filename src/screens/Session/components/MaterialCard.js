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
import { styles } from "./styles";

export default function MaterialCard({ mini }) {
  return (
    <>
      <View
        style={[styles.cardContainerLarge, createShadow("#000", 0, 2, 0.15, 4)]}
      >
        <Text style={styles.cardTitleLarge}>
          {mini.material_title || "Material"}
        </Text>

        {mini.key && (
          <View style={styles.materialKeyRow}>
            <Text style={styles.materialKeyLabel}>Key: </Text>
            <Text style={styles.materialKeyValue}>{mini.key}</Text>
          </View>
        )}

        {/* Notation display or placeholder */}
        {mini.notation_url || mini.material_id ? (
          <NotationDisplay
            notationUrl={mini.notation_url}
            materialId={mini.material_id}
            keySignature={mini.key}
            style={styles.notationDisplay}
          />
        ) : (
          <NotationPlaceholder />
        )}
      </View>

      {/* Audio Player */}
      {mini.audio_url && (
        <View style={styles.audioPlayerCard}>
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
