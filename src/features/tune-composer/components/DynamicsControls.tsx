/**
 * DynamicsControls Component
 *
 * Controls for adding dynamics markings on notes:
 * - Static dynamics (ppp, pp, p, mp, mf, f, ff, fff)
 * - Text dynamics (cresc., decresc., dim.)
 * - Wedge markings (crescendo <, diminuendo >) with start/extend/done workflow
 */

import React, { memo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { DynamicType, DynamicTextType } from "../types/tuneComposerTypes";

/** Wedge type for crescendo/diminuendo */
type WedgeType = "crescendo" | "diminuendo";

// =============================================================================
// Types
// =============================================================================

export interface DynamicsControlsProps {
  /** Whether dynamics mode is currently active */
  dynamicsModeActive: boolean;
  /** Toggle dynamics mode on/off */
  onToggleDynamicsMode: () => void;
  /** Current static dynamic on selected note */
  currentDynamic: DynamicType | undefined;
  /** Current text dynamic on selected note */
  currentDynamicText: DynamicTextType | undefined;
  /** Set static dynamic on current note */
  onSetDynamic: (dynamic: DynamicType) => void;
  /** Remove static dynamic from current note */
  onRemoveDynamic: () => void;
  /** Set text dynamic on current note */
  onSetDynamicText: (text: DynamicTextType) => void;
  /** Remove text dynamic from current note */
  onRemoveDynamicText: () => void;
  /** Whether wedge mode is active */
  wedgeModeActive: boolean;
  /** Toggle wedge mode on/off */
  onToggleWedgeMode: () => void;
  /** Start crescendo wedge from current note */
  onStartCrescendo: () => void;
  /** Start diminuendo wedge from current note */
  onStartDiminuendo: () => void;
  /** Extend current wedge to next note */
  onExtendWedge: () => void;
  /** End wedge mode and finalize wedge */
  onEndWedgeMode: () => void;
  /** Remove wedge marking from current note */
  onRemoveWedgeMarking: () => void;
  /** Currently active wedge type being edited */
  activeWedgeType: WedgeType | null;
  /** ID of note where active wedge starts */
  activeWedgeStartId: string | null;
  /** Whether selected note has a wedge marking */
  selectedNoteHasWedge: boolean;
  /** Whether there's a note selected */
  hasSelection: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// Dynamic levels from softest to loudest
const STATIC_DYNAMICS: DynamicType[] = [
  "ppp",
  "pp",
  "p",
  "mp",
  "mf",
  "f",
  "ff",
  "fff",
];

// Text dynamics
const TEXT_DYNAMICS: DynamicTextType[] = ["cresc.", "decresc.", "dim."];

// =============================================================================
// Component
// =============================================================================

function DynamicsControlsComponent({
  dynamicsModeActive,
  onToggleDynamicsMode,
  currentDynamic,
  currentDynamicText,
  onSetDynamic,
  onRemoveDynamic,
  onSetDynamicText,
  onRemoveDynamicText,
  wedgeModeActive,
  onToggleWedgeMode,
  onStartCrescendo,
  onStartDiminuendo,
  onExtendWedge,
  onEndWedgeMode,
  onRemoveWedgeMarking,
  activeWedgeType,
  activeWedgeStartId,
  selectedNoteHasWedge,
  hasSelection,
  disabled = false,
  testID,
}: DynamicsControlsProps): React.ReactElement {
  const isDisabled = disabled || !hasSelection;
  const isEditingWedge = activeWedgeStartId !== null;

  // When not in dynamics mode, just show the toggle button
  if (!dynamicsModeActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, isDisabled && styles.buttonDisabled]}
          onPress={onToggleDynamicsMode}
          disabled={isDisabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Add dynamics"
          testID="dynamics-mode-toggle"
        >
          <Text style={styles.dynamicSymbol}>f</Text>
          <Text
            style={[styles.toggleLabel, isDisabled && styles.labelDisabled]}
          >
            Dynamics
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In dynamics mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.dynamicsModeContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dynamicSymbol}>f</Text>
          <Text style={styles.headerLabel}>Dynamics</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onToggleDynamicsMode}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Close dynamics mode"
            testID="dynamics-mode-close"
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Static dynamics row */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Volume Level</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dynamicsRow}
          >
            {STATIC_DYNAMICS.map((dynamic) => (
              <TouchableOpacity
                key={dynamic}
                style={[
                  styles.dynamicButton,
                  currentDynamic === dynamic && styles.dynamicButtonActive,
                ]}
                onPress={() => {
                  if (currentDynamic === dynamic) {
                    onRemoveDynamic();
                  } else {
                    onSetDynamic(dynamic);
                  }
                }}
                disabled={isDisabled}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Set dynamic to ${dynamic}`}
                testID={`dynamics-${dynamic}`}
              >
                <Text
                  style={[
                    styles.dynamicButtonText,
                    currentDynamic === dynamic &&
                      styles.dynamicButtonTextActive,
                  ]}
                >
                  {dynamic}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Text dynamics row */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Text Dynamics</Text>
          <View style={styles.textDynamicsRow}>
            {TEXT_DYNAMICS.map((text) => (
              <TouchableOpacity
                key={text}
                style={[
                  styles.textDynamicButton,
                  currentDynamicText === text && styles.dynamicButtonActive,
                ]}
                onPress={() => {
                  if (currentDynamicText === text) {
                    onRemoveDynamicText();
                  } else {
                    onSetDynamicText(text);
                  }
                }}
                disabled={isDisabled}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Set text dynamic to ${text}`}
                testID={`dynamics-text-${text}`}
              >
                <Text
                  style={[
                    styles.textDynamicButtonText,
                    currentDynamicText === text &&
                      styles.dynamicButtonTextActive,
                  ]}
                >
                  {text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Wedge (hairpin) controls */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Hairpins</Text>

          {!wedgeModeActive ? (
            <View style={styles.wedgeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.wedgeToggleButton,
                  isDisabled && styles.buttonDisabled,
                ]}
                onPress={onToggleWedgeMode}
                disabled={isDisabled}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Start wedge mode"
                testID="wedge-mode-toggle"
              >
                <Text style={styles.wedgeSymbol}>{"< >"}</Text>
                <Text style={styles.wedgeToggleLabel}>Add Hairpin</Text>
              </TouchableOpacity>

              {selectedNoteHasWedge && (
                <TouchableOpacity
                  style={styles.removeWedgeButton}
                  onPress={onRemoveWedgeMarking}
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="Remove wedge from note"
                  testID="wedge-remove"
                >
                  <Feather name="trash-2" size={16} color={colors.error} />
                  <Text style={styles.removeWedgeLabel}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.wedgeModeContainer}>
              {!isEditingWedge ? (
                // Not yet started a wedge - show start options
                <View style={styles.wedgeStartRow}>
                  <Text style={styles.wedgeInstruction}>
                    Select where to start:
                  </Text>
                  <View style={styles.wedgeStartButtons}>
                    <TouchableOpacity
                      style={styles.wedgeStartButton}
                      onPress={onStartCrescendo}
                      disabled={isDisabled}
                      accessibilityRole={"button" as AccessibilityRole}
                      accessibilityLabel="Start crescendo"
                      testID="wedge-start-crescendo"
                    >
                      <Text style={styles.wedgeSymbol}>{"<"}</Text>
                      <Text style={styles.wedgeButtonLabel}>Crescendo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.wedgeStartButton}
                      onPress={onStartDiminuendo}
                      disabled={isDisabled}
                      accessibilityRole={"button" as AccessibilityRole}
                      accessibilityLabel="Start diminuendo"
                      testID="wedge-start-diminuendo"
                    >
                      <Text style={styles.wedgeSymbol}>{">"}</Text>
                      <Text style={styles.wedgeButtonLabel}>Diminuendo</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onToggleWedgeMode}
                    accessibilityRole={"button" as AccessibilityRole}
                    accessibilityLabel="Cancel wedge mode"
                    testID="wedge-cancel"
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Currently editing a wedge - show extend/done
                <View style={styles.wedgeEditRow}>
                  <Text style={styles.wedgeEditLabel}>
                    {activeWedgeType === "crescendo"
                      ? "Crescendo"
                      : "Diminuendo"}{" "}
                    active
                  </Text>
                  <View style={styles.wedgeEditButtons}>
                    <TouchableOpacity
                      style={styles.extendButton}
                      onPress={onExtendWedge}
                      accessibilityRole={"button" as AccessibilityRole}
                      accessibilityLabel="Extend wedge"
                      testID="wedge-extend"
                    >
                      <Feather
                        name="arrow-right"
                        size={16}
                        color={colors.white}
                      />
                      <Text style={styles.extendButtonText}>Extend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={onEndWedgeMode}
                      accessibilityRole={"button" as AccessibilityRole}
                      accessibilityLabel="Done editing wedge"
                      testID="wedge-done"
                    >
                      <Feather name="check" size={16} color={colors.white} />
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dynamicSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    fontStyle: "italic",
    color: colors.primary,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  dynamicsModeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  sectionContainer: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    marginBottom: 2,
  },
  dynamicsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  dynamicButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 36,
    alignItems: "center",
  },
  dynamicButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dynamicButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    fontStyle: "italic",
    color: colors.textPrimary,
  },
  dynamicButtonTextActive: {
    color: colors.white,
  },
  textDynamicsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  textDynamicButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  textDynamicButtonText: {
    fontSize: 13,
    fontStyle: "italic",
    color: colors.textPrimary,
  },
  wedgeButtonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  wedgeToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  wedgeSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  wedgeToggleLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  removeWedgeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  removeWedgeLabel: {
    fontSize: 13,
    color: colors.error,
  },
  wedgeModeContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 6,
    padding: spacing.sm,
  },
  wedgeStartRow: {
    gap: spacing.sm,
  },
  wedgeInstruction: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  wedgeStartButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  wedgeStartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  wedgeButtonLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  cancelButton: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  wedgeEditRow: {
    gap: spacing.sm,
  },
  wedgeEditLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  wedgeEditButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  extendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    gap: spacing.xs,
  },
  extendButtonText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "500",
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    gap: spacing.xs,
  },
  doneButtonText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "500",
  },
});

// =============================================================================
// Export
// =============================================================================

export const DynamicsControls = memo(DynamicsControlsComponent);
