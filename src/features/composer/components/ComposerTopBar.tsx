/**
 * ComposerTopBar Component
 *
 * Top bar with score settings: title, clef, time signature, key, tempo.
 */

import React, { memo, useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  Pressable,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  ScrollView,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { Clef, TimeSignature, KeySignature } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface ComposerTopBarProps {
  /** Score title */
  title: string;
  /** Called when title changes */
  onTitleChange: (title: string) => void;
  /** Current clef */
  clef: Clef;
  /** Called when clef changes */
  onClefChange: (clef: Clef) => void;
  /** Current time signature */
  timeSignature: TimeSignature;
  /** Called when time signature changes */
  onTimeSignatureChange: (ts: TimeSignature) => void;
  /** Current key signature (-7 to +7) */
  keySignature: KeySignature;
  /** Called when key signature changes */
  onKeySignatureChange: (key: KeySignature) => void;
  /** Current tempo in BPM */
  tempo: number;
  /** Called when tempo changes */
  onTempoChange: (tempo: number) => void;
  /** Called when back is pressed */
  onBack?: () => void;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TIME_SIGNATURES: TimeSignature[] = [
  { beats: 4, beatUnit: 4 },
  { beats: 3, beatUnit: 4 },
  { beats: 2, beatUnit: 4 },
  { beats: 6, beatUnit: 8 },
  { beats: 2, beatUnit: 2 },
  { beats: 3, beatUnit: 8 },
  { beats: 9, beatUnit: 8 },
  { beats: 12, beatUnit: 8 },
];

const KEY_NAMES: Record<number, string> = {
  "-7": "C♭ Major",
  "-6": "G♭ Major",
  "-5": "D♭ Major",
  "-4": "A♭ Major",
  "-3": "E♭ Major",
  "-2": "B♭ Major",
  "-1": "F Major",
  "0": "C Major",
  "1": "G Major",
  "2": "D Major",
  "3": "A Major",
  "4": "E Major",
  "5": "B Major",
  "6": "F♯ Major",
  "7": "C♯ Major",
};

// =============================================================================
// Subcomponents
// =============================================================================

interface DropdownProps<T> {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  testID: string;
}

function Dropdown<T>({
  label,
  value,
  onPress,
  disabled = false,
  testID,
}: DropdownProps<T>): React.ReactElement {
  return (
    <TouchableOpacity
      style={[styles.dropdown, disabled && styles.dropdownDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={"button" as AccessibilityRole}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={`Tap to change ${label.toLowerCase()}`}
      testID={testID}
    >
      <Text style={styles.dropdownLabel}>{label}</Text>
      <View style={styles.dropdownValueRow}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Feather name="chevron-down" size={14} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// Component
// =============================================================================

function ComposerTopBarComponent({
  title,
  onTitleChange,
  clef,
  onClefChange,
  timeSignature,
  onTimeSignatureChange,
  keySignature,
  onKeySignatureChange,
  tempo,
  onTempoChange,
  onBack,
  disabled = false,
  testID,
}: ComposerTopBarProps): React.ReactElement {
  // Modal states
  const [showClefModal, setShowClefModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showTempoModal, setShowTempoModal] = useState(false);
  const [tempoInput, setTempoInput] = useState(tempo.toString());

  // Format time signature
  const tsDisplay = `${timeSignature.beats}/${timeSignature.beatUnit}`;

  // Format key signature
  const keyDisplay = KEY_NAMES[keySignature.toString()] || "C Major";

  // Format clef
  const clefDisplay = clef === "treble" ? "Treble" : "Bass";

  // Handlers
  const handleClefSelect = useCallback(
    (c: Clef) => {
      onClefChange(c);
      setShowClefModal(false);
    },
    [onClefChange],
  );

  const handleTimeSelect = useCallback(
    (ts: TimeSignature) => {
      onTimeSignatureChange(ts);
      setShowTimeModal(false);
    },
    [onTimeSignatureChange],
  );

  const handleKeySelect = useCallback(
    (k: KeySignature) => {
      onKeySignatureChange(k);
      setShowKeyModal(false);
    },
    [onKeySignatureChange],
  );

  const handleTempoConfirm = useCallback(() => {
    const parsed = parseInt(tempoInput, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 300) {
      onTempoChange(parsed);
    } else {
      setTempoInput(tempo.toString());
    }
    setShowTempoModal(false);
  }, [tempoInput, tempo, onTempoChange]);

  const openTempoModal = useCallback(() => {
    setTempoInput(tempo.toString());
    setShowTempoModal(true);
  }, [tempo]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Back button */}
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Go back"
          testID="topbar-back"
        >
          <Feather name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      {/* Title input */}
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={onTitleChange}
        placeholder="Untitled"
        placeholderTextColor={colors.textSecondary}
        editable={!disabled}
        accessibilityLabel="Score title"
        accessibilityHint="Enter a name for your score"
        testID="topbar-title"
      />

      {/* Settings row */}
      <View style={styles.settingsRow}>
        <Dropdown
          label="Clef"
          value={clefDisplay}
          onPress={() => setShowClefModal(true)}
          disabled={disabled}
          testID="topbar-clef"
        />

        <Dropdown
          label="Time"
          value={tsDisplay}
          onPress={() => setShowTimeModal(true)}
          disabled={disabled}
          testID="topbar-time"
        />

        <Dropdown
          label="Key"
          value={keyDisplay}
          onPress={() => setShowKeyModal(true)}
          disabled={disabled}
          testID="topbar-key"
        />

        <Dropdown
          label="Tempo"
          value={`${tempo}`}
          onPress={openTempoModal}
          disabled={disabled}
          testID="topbar-tempo"
        />
      </View>

      {/* Clef Modal */}
      <Modal
        visible={showClefModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClefModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowClefModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Select Clef</Text>
            <TouchableOpacity
              style={[
                styles.option,
                clef === "treble" && styles.optionSelected,
              ]}
              onPress={() => handleClefSelect("treble")}
              testID="clef-treble"
            >
              <Text style={styles.optionText}>Treble Clef</Text>
              {clef === "treble" && (
                <Feather name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, clef === "bass" && styles.optionSelected]}
              onPress={() => handleClefSelect("bass")}
              testID="clef-bass"
            >
              <Text style={styles.optionText}>Bass Clef</Text>
              {clef === "bass" && (
                <Feather name="check" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Time Signature Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimeModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Select Time Signature</Text>
            <ScrollView style={styles.optionScroll}>
              {TIME_SIGNATURES.map((ts) => {
                const isSelected =
                  ts.beats === timeSignature.beats &&
                  ts.beatUnit === timeSignature.beatUnit;
                const tsKey = `${ts.beats}/${ts.beatUnit}`;
                return (
                  <TouchableOpacity
                    key={tsKey}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleTimeSelect(ts)}
                    testID={`time-${tsKey}`}
                  >
                    <Text style={styles.optionText}>{tsKey}</Text>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Key Signature Modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowKeyModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Select Key</Text>
            <ScrollView style={styles.optionScroll}>
              {Array.from({ length: 15 }, (_, i) => i - 7).map((k) => {
                const isSelected = k === keySignature;
                const keyName = KEY_NAMES[k.toString()] || "C Major";
                return (
                  <TouchableOpacity
                    key={k}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleKeySelect(k as ComposerKeySignature)}
                    testID={`key-${k}`}
                  >
                    <Text style={styles.optionText}>{keyName}</Text>
                    {isSelected && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Tempo Modal */}
      <Modal
        visible={showTempoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTempoModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTempoModal(false)}
        >
          <View
            style={[styles.modalContent, styles.tempoModalContent]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>Set Tempo (BPM)</Text>
            <TextInput
              style={styles.tempoInput}
              value={tempoInput}
              onChangeText={setTempoInput}
              keyboardType="number-pad"
              maxLength={3}
              autoFocus
              accessibilityLabel="Tempo input"
              testID="tempo-input"
            />
            <Text style={styles.tempoHint}>20 – 300 BPM</Text>
            <View style={styles.tempoButtons}>
              <TouchableOpacity
                style={styles.tempoCancel}
                onPress={() => setShowTempoModal(false)}
                testID="tempo-cancel"
              >
                <Text style={styles.tempoCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tempoConfirm}
                onPress={handleTempoConfirm}
                testID="tempo-confirm"
              >
                <Text style={styles.tempoConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    position: "absolute",
    left: spacing.sm,
    top: spacing.sm,
    padding: spacing.xs,
    zIndex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dropdown: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    width: "80%",
    maxWidth: 320,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  optionScroll: {
    maxHeight: 300,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  tempoModalContent: {
    alignItems: "center",
  },
  tempoInput: {
    width: 100,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.sm,
  },
  tempoHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tempoButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  tempoCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoCancelText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  tempoConfirm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  tempoConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ComposerTopBar = memo(ComposerTopBarComponent);
