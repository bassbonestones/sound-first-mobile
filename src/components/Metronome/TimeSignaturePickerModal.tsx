/**
 * TimeSignaturePickerModal - Full-screen modal for selecting time signature
 * Reusable across TuneCard and Metronome
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StyleSheet,
} from "react-native";

/**
 * SMuFL codepoints for Bravura font note symbols (stem up variants)
 */
const NOTE_SYMBOLS: Record<number, string> = {
  1: "\uE1D2", // noteWhole
  2: "\uE1D3", // noteHalfUp
  4: "\uE1D5", // noteQuarterUp
  8: "\uE1D7", // note8thUp
  16: "\uE1D9", // note16thUp
  32: "\uE1DB", // note32ndUp
};

/**
 * NoteSymbol component for time signature picker
 */
interface NoteSymbolProps {
  value: number;
  active: boolean;
}

const NoteSymbol: React.FC<NoteSymbolProps> = ({ value, active }) => {
  const symbol = NOTE_SYMBOLS[value] || NOTE_SYMBOLS[4];
  const topOffset = value === 1 ? -10 : 0;

  return (
    <Text
      style={{
        fontFamily: "Bravura",
        fontSize: 22,
        color: active ? "#1a1a2e" : "#FFD700",
        textAlign: "center",
        marginTop: topOffset,
      }}
    >
      {symbol}
    </Text>
  );
};

export interface TimeSignaturePickerModalProps {
  visible: boolean;
  onClose: () => void;
  beatsPerMeasure: number;
  noteValue: number;
  onBeatsChange: (beats: number) => void;
  onNoteValueChange: (noteValue: number) => void;
}

const TimeSignaturePickerModal: React.FC<TimeSignaturePickerModalProps> = ({
  visible,
  onClose,
  beatsPerMeasure,
  noteValue,
  onBeatsChange,
  onNoteValueChange,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Time Signature</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Beats per measure */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>
              Beats per measure (1-12)
            </Text>
            <View style={styles.stepperRowLarge}>
              <TouchableOpacity
                onPress={() => onBeatsChange(Math.max(1, beatsPerMeasure - 1))}
                style={styles.stepperButtonLarge}
              >
                <Text style={styles.stepperButtonTextLarge}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValueLarge}>{beatsPerMeasure}</Text>
              <TouchableOpacity
                onPress={() => onBeatsChange(Math.min(12, beatsPerMeasure + 1))}
                style={styles.stepperButtonLarge}
              >
                <Text style={styles.stepperButtonTextLarge}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note value */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionLabel}>Beat note value</Text>
            <View style={styles.noteValueGridLarge}>
              {/* Row 1: whole, half, quarter */}
              <View style={styles.noteValueRowLarge}>
                {[1, 2, 4].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => onNoteValueChange(val)}
                    style={[
                      styles.noteValueButtonLarge,
                      noteValue === val && styles.noteValueButtonActive,
                    ]}
                  >
                    <NoteSymbol value={val} active={noteValue === val} />
                  </TouchableOpacity>
                ))}
              </View>
              {/* Row 2: eighth, sixteenth, thirty-second */}
              <View style={styles.noteValueRowLarge}>
                {[8, 16, 32].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => onNoteValueChange(val)}
                    style={[
                      styles.noteValueButtonLarge,
                      noteValue === val && styles.noteValueButtonActive,
                    ]}
                  >
                    <NoteSymbol value={val} active={noteValue === val} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
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
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 30,
  },
  modalSectionLabel: {
    color: "#888",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  stepperRowLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  stepperButtonLarge: {
    backgroundColor: "#3a3a4e",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  stepperButtonTextLarge: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "600",
  },
  stepperValueLarge: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "600",
    minWidth: 80,
    textAlign: "center",
  },
  noteValueGridLarge: {
    alignItems: "center",
    gap: 12,
  },
  noteValueRowLarge: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  noteValueButtonLarge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#3a3a4e",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 18,
    borderWidth: 2,
    borderColor: "#5a4a3a",
  },
  noteValueButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
});

export default TimeSignaturePickerModal;
