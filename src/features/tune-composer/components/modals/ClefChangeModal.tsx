/**
 * ClefChangeModal - Handles clef change transposition options
 *
 * Shows options for transposing notes when changing clef (treble ↔ bass).
 */
import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import type { Clef } from "../../types";
import { modalStyles } from "./modalStyles";

export interface ClefChangeModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Target clef being changed to */
  targetClef: Clef;
  /** Called when user selects a transposition option (octaves: -2, -1, 0, 1, 2) */
  onSelectTranspose: (octaves: number) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for selecting transposition when changing clef with existing notes
 */
export function ClefChangeModal({
  visible,
  targetClef,
  onSelectTranspose,
  onCancel,
}: ClefChangeModalProps): React.ReactElement {
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
            You have notes on the staff. How would you like to transpose them
            when switching to {targetClef === "bass" ? "bass" : "treble"} clef?
          </Text>
          {targetClef === "bass" ? (
            <>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(0)}
              >
                <Text style={modalStyles.optionText}>No Transpose</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(-1)}
              >
                <Text style={modalStyles.optionText}>Octave Down</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(-2)}
              >
                <Text style={modalStyles.optionText}>2 Octaves Down</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(0)}
              >
                <Text style={modalStyles.optionText}>No Transpose</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(1)}
              >
                <Text style={modalStyles.optionText}>Octave Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.option}
                onPress={() => onSelectTranspose(2)}
              >
                <Text style={modalStyles.optionText}>2 Octaves Up</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={modalStyles.cancel} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
