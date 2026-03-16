/**
 * MaterialCard - Displays material information with notation in session
 *
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
import React, { memo } from "react";
import { View, Text } from "react-native";
import NotationDisplay, {
  NotationPlaceholder,
} from "../../../components/NotationDisplay";
import AudioPlayer from "../../../components/AudioPlayer";
import { createShadow } from "../../../styles/theme";
import { styles } from "./styles";

interface MaterialCardMini {
  material_title?: string;
  key?: string;
  notation_url?: string;
  material_id?: number;
  audio_url?: string;
}

interface MaterialCardProps {
  mini: MaterialCardMini;
}

function MaterialCard({ mini }: MaterialCardProps) {
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

export default memo(MaterialCard);
