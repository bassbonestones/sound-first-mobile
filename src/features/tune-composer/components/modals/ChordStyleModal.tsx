/**
 * ChordStyleModal - Selects harmony style for chord inference
 *
 * Allows user to choose between simple triads, jazz 7ths, or dense harmonization.
 */
import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import { modalStyles } from "./modalStyles";

export interface ChordStyleSelection {
  /** Whether to use jazz 7th chords (true) or simple triads (false) */
  useJazzChords: boolean;
  /** Number of chords per measure */
  chordsPerMeasure: number;
}

export interface ChordStyleModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when user selects a chord style */
  onSelect: (selection: ChordStyleSelection) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for selecting chord inference style
 */
export function ChordStyleModal({
  visible,
  onSelect,
  onCancel,
}: ChordStyleModalProps): React.ReactElement {
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
          <Text style={modalStyles.title}>Choose Chord Style</Text>
          <Text style={modalStyles.message}>
            Select the harmony style for your melody:
          </Text>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() =>
              onSelect({ useJazzChords: false, chordsPerMeasure: 1 })
            }
          >
            <Text style={modalStyles.optionText}>Simple (Triads)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() =>
              onSelect({ useJazzChords: true, chordsPerMeasure: 1 })
            }
          >
            <Text style={modalStyles.optionText}>Jazz (7th Chords)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={() =>
              onSelect({ useJazzChords: true, chordsPerMeasure: 2 })
            }
          >
            <Text style={modalStyles.optionText}>Dense (2 per measure)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.cancel} onPress={onCancel}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
