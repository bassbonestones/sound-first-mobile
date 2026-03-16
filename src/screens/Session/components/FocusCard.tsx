/**
 * FocusCard - Displays focus card information in session
 *
 * Memoized to prevent unnecessary re-renders when parent state changes.
 */
import React, { memo } from "react";
import { View, Text } from "react-native";
import { createShadow } from "../../../styles/theme";
import { styles } from "./styles";

interface FocusCardMini {
  focus_card_category?: string;
  focus_card_name?: string;
  focus_card_attention_cue?: string;
  focus_card_instruction?: string;
}

interface FocusCardProps {
  mini: FocusCardMini;
}

function FocusCard({ mini }: FocusCardProps) {
  return (
    <View
      style={[styles.focusCardContainer, createShadow("#000", 0, 4, 0.2, 8)]}
    >
      {mini.focus_card_category && (
        <View style={styles.focusCardCategory}>
          <Text style={styles.focusCardCategoryText}>
            {mini.focus_card_category}
          </Text>
        </View>
      )}

      <Text style={styles.focusCardTitle}>{mini.focus_card_name}</Text>

      {mini.focus_card_attention_cue && (
        <View style={styles.focusCardCue}>
          <Text style={styles.focusCardCueText}>
            {mini.focus_card_attention_cue}
          </Text>
        </View>
      )}

      {mini.focus_card_instruction && (
        <Text style={styles.focusCardInstruction}>
          {mini.focus_card_instruction}
        </Text>
      )}
    </View>
  );
}

export default memo(FocusCard);
