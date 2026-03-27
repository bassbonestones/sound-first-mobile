/**
 * RhythmChangeModal - Confirms clearing chords/lyrics when changing rhythm
 *
 * Warns user that chords and/or lyrics will be cleared when rhythm changes.
 */
import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import { modalStyles } from "./modalStyles";

export interface RhythmChangeModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the measure has chords */
  hasChords: boolean;
  /** Whether the measure has lyrics */
  hasLyrics: boolean;
  /** Called when user confirms the rhythm change */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for confirming rhythm change that will clear chords/lyrics
 */
export function RhythmChangeModal({
  visible,
  hasChords,
  hasLyrics,
  onConfirm,
  onCancel,
}: RhythmChangeModalProps): React.ReactElement {
  // Determine what content will be cleared
  const contentDescription =
    hasChords && hasLyrics
      ? "chords and lyrics"
      : hasChords
        ? "chords"
        : "lyrics";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={modalStyles.overlay} onPress={onCancel}>
        <View
          style={modalStyles.content}
          onStartShouldSetResponder={() => true}
        >
          <Text style={modalStyles.title}>Clear Chords & Lyrics?</Text>
          <Text style={modalStyles.message}>
            This measure has {contentDescription}. Changing the rhythm will
            remove them from this measure.
          </Text>
          <TouchableOpacity style={modalStyles.option} onPress={onConfirm}>
            <Text style={modalStyles.optionText}>Clear & Change Rhythm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.option, modalStyles.cancelOption]}
            onPress={onCancel}
          >
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
