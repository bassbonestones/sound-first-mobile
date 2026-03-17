/**
 * SubdivisionPickerModal - Full-screen modal for selecting subdivision pattern
 * Reusable across TuneCard and Metronome
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SUBDIVISIONS, getSubdivisionLabel } from "./constants";

export interface SubdivisionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  subdivision: string;
  noteValue: number;
  onSubdivisionChange: (subdivision: string) => void;
}

const SubdivisionPickerModal: React.FC<SubdivisionPickerModalProps> = ({
  visible,
  onClose,
  subdivision,
  noteValue,
  onSubdivisionChange,
}) => {
  const handleSelect = (key: string) => {
    onSubdivisionChange(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Subdivision</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {noteValue !== 4 && (
          <Text style={styles.modalNote}>Swing only available in /4 time</Text>
        )}

        <ScrollView style={styles.modalScrollView}>
          {Object.entries(SUBDIVISIONS)
            .filter(([_, sub]) => !sub.swingOnly || noteValue === 4)
            .map(([key]) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleSelect(key)}
                style={[
                  styles.modalOption,
                  subdivision === key && styles.modalOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    subdivision === key && styles.modalOptionTextActive,
                  ]}
                >
                  {getSubdivisionLabel(key, noteValue)}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a4e",
    position: "relative",
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3a3a4e",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 16,
  },
  modalCloseButtonText: {
    color: "#FFD700",
    fontSize: 20,
  },
  modalNote: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
  },
  modalOption: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalOptionActive: {
    backgroundColor: "#FFD700",
  },
  modalOptionText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  modalOptionTextActive: {
    color: "#1a1a2e",
    fontWeight: "600",
  },
});

export default SubdivisionPickerModal;
