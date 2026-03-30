/**
 * MeasureTempoModal Component
 *
 * Modal for setting or clearing tempo override on a specific measure.
 * Allows mid-piece tempo changes including beat unit selection and metric modulation.
 */

import React, { useState, useCallback, memo, useMemo } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../../constants";
import { TempoSlider } from "../../../../components/TempoSlider";
import type { TempoBeatUnit, TempoModulation } from "../../types";
import {
  COMMON_TEMPO_BEAT_UNITS,
  TEMPO_BEAT_UNIT_LABELS,
  calculateModulatedTempo,
} from "../../types";

// =============================================================================
// Types
// =============================================================================

type TempoMode = "bpm" | "modulation";

export interface MeasureTempoModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when modal is closed */
  onClose: () => void;
  /** Current measure number (1-based, for display) */
  measureNumber: number;
  /** Current tempo override for the measure (undefined if inheriting) */
  currentTempo: number | undefined;
  /** Effective tempo for the measure (including inheritance) */
  effectiveTempo: number;
  /** Score-level default tempo */
  scoreTempo: number;
  /** Called when tempo is set (BPM mode) */
  onSetTempo: (tempo: number) => void;
  /** Called when tempo is cleared (inherit from previous) */
  onClearTempo: () => void;
  /** Current beat unit override for the measure (undefined if inheriting) */
  currentBeatUnit?: TempoBeatUnit | undefined;
  /** Effective beat unit for the measure (including inheritance) */
  effectiveBeatUnit?: TempoBeatUnit;
  /** Called when beat unit is set */
  onSetBeatUnit?: (beatUnit: TempoBeatUnit) => void;
  /** Called when beat unit is cleared (inherit from previous) */
  onClearBeatUnit?: () => void;
  /** Current modulation for the measure (undefined if none) */
  currentModulation?: TempoModulation | undefined;
  /** Called when modulation is set */
  onSetModulation?: (modulation: TempoModulation) => void;
  /** Called when modulation is cleared */
  onClearModulation?: () => void;
  /** Previous measure's effective beat unit (for modulation "from" default) */
  previousBeatUnit?: TempoBeatUnit;
}

// =============================================================================
// Component
// =============================================================================

function MeasureTempoModalComponent({
  visible,
  onClose,
  measureNumber,
  currentTempo,
  effectiveTempo,
  scoreTempo,
  onSetTempo,
  onClearTempo,
  currentBeatUnit,
  effectiveBeatUnit = "quarter",
  onSetBeatUnit,
  onClearBeatUnit,
  currentModulation,
  onSetModulation,
  onClearModulation,
  previousBeatUnit = "quarter",
}: MeasureTempoModalProps): React.ReactElement {
  // Determine initial mode based on current state
  const initialMode: TempoMode = currentModulation ? "modulation" : "bpm";

  const [mode, setMode] = useState<TempoMode>(initialMode);
  const [pendingTempo, setPendingTempo] = useState(effectiveTempo);
  const [pendingBeatUnit, setPendingBeatUnit] =
    useState<TempoBeatUnit>(effectiveBeatUnit);
  const [pendingModulationFrom, setPendingModulationFrom] =
    useState<TempoBeatUnit>(currentModulation?.fromUnit ?? previousBeatUnit);
  const [pendingModulationTo, setPendingModulationTo] = useState<TempoBeatUnit>(
    currentModulation?.toUnit ?? "quarter",
  );

  const hasTempoOverride = currentTempo !== undefined;
  const hasBeatUnitOverride = currentBeatUnit !== undefined;
  const hasModulation = currentModulation !== undefined;
  const hasAnyOverride =
    hasTempoOverride || hasBeatUnitOverride || hasModulation;

  // Calculate preview of modulated tempo
  const modulatedTempoPreview = useMemo(() => {
    // Use the previous measure's effective tempo for preview
    const previousTempo = effectiveTempo;
    return Math.round(
      calculateModulatedTempo(
        previousTempo,
        {
          fromUnit: pendingModulationFrom,
          toUnit: pendingModulationTo,
        },
        previousBeatUnit,
      ),
    );
  }, [
    effectiveTempo,
    pendingModulationFrom,
    pendingModulationTo,
    previousBeatUnit,
  ]);

  // Reset pending values when modal opens
  React.useEffect(() => {
    if (visible) {
      setMode(currentModulation ? "modulation" : "bpm");
      setPendingTempo(effectiveTempo);
      setPendingBeatUnit(effectiveBeatUnit);
      setPendingModulationFrom(currentModulation?.fromUnit ?? previousBeatUnit);
      setPendingModulationTo(currentModulation?.toUnit ?? "quarter");
    }
  }, [
    visible,
    effectiveTempo,
    effectiveBeatUnit,
    currentModulation,
    previousBeatUnit,
  ]);

  const handleApply = useCallback(() => {
    if (mode === "modulation" && onSetModulation) {
      // Apply modulation
      onSetModulation({
        fromUnit: pendingModulationFrom,
        toUnit: pendingModulationTo,
      });
    } else {
      // BPM mode: apply tempo and beat unit
      if (pendingTempo !== effectiveTempo || hasTempoOverride) {
        onSetTempo(pendingTempo);
      }
      if (
        onSetBeatUnit &&
        (pendingBeatUnit !== effectiveBeatUnit || hasBeatUnitOverride)
      ) {
        onSetBeatUnit(pendingBeatUnit);
      }
      // Clear any existing modulation when switching to BPM mode
      if (onClearModulation && hasModulation) {
        onClearModulation();
      }
    }
    onClose();
  }, [
    mode,
    pendingTempo,
    pendingBeatUnit,
    pendingModulationFrom,
    pendingModulationTo,
    effectiveTempo,
    effectiveBeatUnit,
    hasTempoOverride,
    hasBeatUnitOverride,
    hasModulation,
    onSetTempo,
    onSetBeatUnit,
    onSetModulation,
    onClearModulation,
    onClose,
  ]);

  const handleClear = useCallback(() => {
    onClearTempo();
    if (onClearBeatUnit) {
      onClearBeatUnit();
    }
    if (onClearModulation) {
      onClearModulation();
    }
    onClose();
  }, [onClearTempo, onClearBeatUnit, onClearModulation, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const beatUnitLabel = TEMPO_BEAT_UNIT_LABELS[effectiveBeatUnit];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Measure {measureNumber} Tempo</Text>
              <TouchableOpacity
                onPress={handleCancel}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Close"
                testID="measure-tempo-close"
              >
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.statusRow}>
              {hasModulation && currentModulation ? (
                <Text style={styles.statusText}>
                  <Text style={styles.statusBeatUnit}>
                    {TEMPO_BEAT_UNIT_LABELS[currentModulation.fromUnit]}
                  </Text>{" "}
                  ={" "}
                  <Text style={styles.statusBeatUnit}>
                    {TEMPO_BEAT_UNIT_LABELS[currentModulation.toUnit]}
                  </Text>{" "}
                  (modulation)
                </Text>
              ) : hasAnyOverride ? (
                <Text style={styles.statusText}>
                  <Text style={styles.statusBeatUnit}>{beatUnitLabel}</Text> ={" "}
                  {effectiveTempo} (custom)
                </Text>
              ) : (
                <Text style={styles.statusTextInherited}>
                  <Text style={styles.statusBeatUnit}>{beatUnitLabel}</Text> ={" "}
                  {effectiveTempo} (inherited)
                </Text>
              )}
            </View>

            {/* Mode Toggle */}
            {onSetModulation && (
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === "bpm" && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode("bpm")}
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="BPM mode"
                  testID="measure-tempo-mode-bpm"
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === "bpm" && styles.modeButtonTextActive,
                    ]}
                  >
                    BPM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    mode === "modulation" && styles.modeButtonActive,
                  ]}
                  onPress={() => setMode("modulation")}
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="Modulation mode"
                  testID="measure-tempo-mode-modulation"
                >
                  <Text
                    style={[
                      styles.modeButtonText,
                      mode === "modulation" && styles.modeButtonTextActive,
                    ]}
                  >
                    Modulation
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === "bpm" ? (
              <>
                {/* Beat Unit Picker (BPM mode) */}
                {onSetBeatUnit && (
                  <View style={styles.beatUnitSection}>
                    <Text style={styles.sectionLabel}>Beat Unit</Text>
                    <View style={styles.beatUnitRow}>
                      {COMMON_TEMPO_BEAT_UNITS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.beatUnitButton,
                            pendingBeatUnit === unit &&
                              styles.beatUnitButtonActive,
                          ]}
                          onPress={() => setPendingBeatUnit(unit)}
                          accessibilityRole={"button" as AccessibilityRole}
                          accessibilityLabel={`Beat unit ${unit}`}
                          testID={`measure-tempo-beat-unit-${unit}`}
                        >
                          <Text
                            style={[
                              styles.beatUnitText,
                              pendingBeatUnit === unit &&
                                styles.beatUnitTextActive,
                            ]}
                          >
                            {TEMPO_BEAT_UNIT_LABELS[unit]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tempo Slider */}
                <View style={styles.sliderContainer}>
                  <TempoSlider
                    tempo={pendingTempo}
                    tempoRange={[20, 300]}
                    onTempoChange={setPendingTempo}
                    label="Tempo"
                    accessibilityLabel={`Set tempo for measure ${measureNumber}`}
                  />
                </View>
              </>
            ) : (
              <>
                {/* Modulation Mode */}
                <View style={styles.modulationSection}>
                  <Text style={styles.sectionLabel}>
                    Previous note value (from)
                  </Text>
                  <View style={styles.beatUnitRow}>
                    {COMMON_TEMPO_BEAT_UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.beatUnitButton,
                          pendingModulationFrom === unit &&
                            styles.beatUnitButtonActive,
                        ]}
                        onPress={() => setPendingModulationFrom(unit)}
                        accessibilityRole={"button" as AccessibilityRole}
                        accessibilityLabel={`From unit ${unit}`}
                        testID={`measure-tempo-mod-from-${unit}`}
                      >
                        <Text
                          style={[
                            styles.beatUnitText,
                            pendingModulationFrom === unit &&
                              styles.beatUnitTextActive,
                          ]}
                        >
                          {TEMPO_BEAT_UNIT_LABELS[unit]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text
                    style={[styles.sectionLabel, { marginTop: spacing.md }]}
                  >
                    = New note value (to)
                  </Text>
                  <View style={styles.beatUnitRow}>
                    {COMMON_TEMPO_BEAT_UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.beatUnitButton,
                          pendingModulationTo === unit &&
                            styles.beatUnitButtonActive,
                        ]}
                        onPress={() => setPendingModulationTo(unit)}
                        accessibilityRole={"button" as AccessibilityRole}
                        accessibilityLabel={`To unit ${unit}`}
                        testID={`measure-tempo-mod-to-${unit}`}
                      >
                        <Text
                          style={[
                            styles.beatUnitText,
                            pendingModulationTo === unit &&
                              styles.beatUnitTextActive,
                          ]}
                        >
                          {TEMPO_BEAT_UNIT_LABELS[unit]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Preview */}
                  <View style={styles.modulationPreview}>
                    <Text style={styles.previewLabel}>Result:</Text>
                    <Text style={styles.previewText}>
                      <Text style={styles.statusBeatUnit}>
                        {TEMPO_BEAT_UNIT_LABELS[pendingModulationTo]}
                      </Text>{" "}
                      = {modulatedTempoPreview} BPM
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              {hasAnyOverride && (
                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={handleClear}
                  accessibilityRole={"button" as AccessibilityRole}
                  accessibilityLabel="Clear tempo override and inherit from previous measure"
                  testID="measure-tempo-clear"
                >
                  <Feather name="rotate-ccw" size={16} color={colors.warning} />
                  <Text style={styles.clearButtonText}>Inherit</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel="Cancel"
                testID="measure-tempo-cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.applyButton]}
                onPress={handleApply}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={
                  mode === "modulation"
                    ? `Apply modulation`
                    : `Set tempo to ${pendingTempo}`
                }
                testID="measure-tempo-apply"
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  statusRow: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
    textAlign: "center",
  },
  statusTextInherited: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  statusBeatUnit: {
    fontFamily: "Bravura",
    fontSize: 20,
  },
  beatUnitSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  beatUnitRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  beatUnitButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  beatUnitButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  beatUnitText: {
    fontSize: 22,
    fontFamily: "Bravura",
    color: colors.textPrimary,
  },
  beatUnitTextActive: {
    color: colors.white,
  },
  sliderContainer: {
    marginBottom: spacing.lg,
  },
  modeToggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  modulationSection: {
    marginBottom: spacing.md,
  },
  modulationPreview: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  clearButton: {
    backgroundColor: colors.warningLight,
    marginRight: "auto",
  },
  clearButtonText: {
    color: colors.warning,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textSecondary,
  },
  applyButton: {
    backgroundColor: colors.primary,
  },
  applyButtonText: {
    color: colors.white,
    fontWeight: "500",
  },
});

export const MeasureTempoModal = memo(MeasureTempoModalComponent);
