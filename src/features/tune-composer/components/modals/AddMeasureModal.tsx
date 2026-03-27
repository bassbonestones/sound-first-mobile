/**
 * AddMeasureModal - Prompts user to add a new measure
 *
 * Shown when user reaches the end of the last measure.
 */
import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity } from "react-native";
import { modalStyles } from "./modalStyles";

export interface AddMeasureModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when user confirms adding a measure */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
}

/**
 * Modal for prompting to add a new measure at the end
 */
export function AddMeasureModal({
  visible,
  onConfirm,
  onCancel,
}: AddMeasureModalProps): React.ReactElement {
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
          <Text style={modalStyles.title}>Add New Measure?</Text>
          <Text style={modalStyles.message}>
            You&apos;ve reached the end of the last measure. Would you like to
            add another measure?
          </Text>
          <TouchableOpacity
            style={modalStyles.option}
            onPress={onConfirm}
            testID="add-measure-confirm"
          >
            <Text style={modalStyles.optionText}>Add Measure at End</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={modalStyles.cancel}
            onPress={onCancel}
            testID="add-measure-cancel"
          >
            <Text style={modalStyles.cancelText}>No Thanks</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
