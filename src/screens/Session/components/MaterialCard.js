/**
 * MaterialCard - Displays material information with notation in session
 *
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
import React, { memo } from "react";
import PropTypes from "prop-types";
import { View, Text } from "react-native";
import NotationDisplay, {
  NotationPlaceholder,
} from "../../../components/NotationDisplay";
import AudioPlayer from "../../../components/AudioPlayer";
import { createShadow } from "../../../styles/theme";
import { styles } from "./styles";

function MaterialCard({ mini }) {
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

MaterialCard.propTypes = {
  mini: PropTypes.shape({
    material_title: PropTypes.string,
    key: PropTypes.string,
    notation_url: PropTypes.string,
    material_id: PropTypes.number,
    audio_url: PropTypes.string,
  }).isRequired,
};

export default memo(MaterialCard);
