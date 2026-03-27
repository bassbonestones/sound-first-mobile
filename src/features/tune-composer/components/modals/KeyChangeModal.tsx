/**
 * KeyChangeModal - Handles key change transposition options
 *
 * Shows options for transposing notes when changing key signature.
 */
import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import { modalStyles } from "./modalStyles";

export interface KeyChangeModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Semitones to transpose up (positive) */
  upInterval: number;
  /** Semitones to transpose down (negative) */
  downInterval: number;
  /** Called when user selects a transposition option (semitones) */
  onSelectTranspose: (semitones: number) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for selecting transposition when changing key signature with existing notes
 */
export function KeyChangeModal({
  visible,
  upInterval,
  downInterval,
  onSelectTranspose,
  onCancel,
}: KeyChangeModalProps): React.ReactElement {
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
          <Text style={modalStyles.title}>Transpose Notes?</Text>
          <Text style={modalStyles.message}>
            You have notes on the staff. How would you like to handle them when
            changing key?
          </Text>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() => onSelectTranspose(0)}
          >
            <Text style={modalStyles.optionText}>Keep Pitch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() => onSelectTranspose(upInterval)}
          >
            <Text style={modalStyles.optionText}>Transpose Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() => onSelectTranspose(downInterval)}
          >
            <Text style={modalStyles.optionText}>Transpose Down</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancel} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
