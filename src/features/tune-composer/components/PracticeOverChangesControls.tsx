/**
 * PracticeOverChangesControls Component
 *
 * Controls for generating and playing scales, arpeggios, or guide tones
 * over a chord progression. Provides content type selection, pattern/rhythm
 * pickers, tempo slider, and range controls.
 */

import React, { memo, useState, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  AccessibilityRole,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import type { PracticeOverChangesState, PracticeContentType } from "../types";
import { PRACTICE_CONTENT_TYPE_LABELS } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface PracticeOverChangesControlsProps {
  /** Whether practice mode is currently active */
  practiceActive: boolean;
  /** Toggle practice mode on/off */
  onTogglePracticeMode: () => void;
  /** Current practice state */
  practiceState: PracticeOverChangesState;
  /** Whether the score has chords for generation */
  hasChords: boolean;
  /** Tune tempo (BPM) for default */
  tuneTempo: number;
  /** Effective tempo (considering override) */
  effectiveTempo: number;
  /** Set content type */
  onSetContentType: (type: PracticeContentType) => void;
  /** Set pattern */
  onSetPattern: (pattern: string | null) => void;
  /** Set rhythm */
  onSetRhythm: (rhythm: string) => void;
  /** Set tempo override */
  onSetTempoOverride: (tempo: number | null) => void;
  /** Set range */
  onSetRange: (low: number, high: number) => void;
  /** Generate content */
  onGenerate: () => void;
  /** Clear generated content */
  onClear: () => void;
  /** Whether content has been generated */
  hasGeneratedContent: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Available rhythm types */
const RHYTHM_OPTIONS: { value: string; label: string }[] = [
  { value: "whole_notes", label: "Whole" },
  { value: "half_notes", label: "Half" },
  { value: "quarter_notes", label: "Quarter" },
  { value: "eighth_notes", label: "Eighth" },
  { value: "sixteenth_notes", label: "16th" },
  { value: "eighth_triplets", label: "Triplets" },
  { value: "swing_eighths", label: "Swing" },
];

/** Scale pattern options (when content type is scales) */
const SCALE_PATTERN_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "Default" },
  { value: "straight_up", label: "Up" },
  { value: "straight_down", label: "Down" },
  { value: "straight_up_down", label: "Up/Down" },
  { value: "in_3rds", label: "3rds" },
  { value: "in_4ths", label: "4ths" },
  { value: "groups_of_3", label: "Groups 3" },
  { value: "groups_of_4", label: "Groups 4" },
];

/** Arpeggio pattern options (when content type is arpeggios) */
const ARPEGGIO_PATTERN_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "Default" },
  { value: "straight_up", label: "Up" },
  { value: "straight_down", label: "Down" },
  { value: "straight_up_down", label: "Up/Down" },
  { value: "weaving_ascend", label: "Weave Up" },
  { value: "weaving_descend", label: "Weave Down" },
  { value: "inversion_root", label: "Root Pos" },
  { value: "inversion_1st", label: "1st Inv" },
  { value: "inversion_2nd", label: "2nd Inv" },
];

/** MIDI note names for range picker */
const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

/** Convert MIDI to note name with octave */
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// =============================================================================
// Component
// =============================================================================

function PracticeOverChangesControlsComponent({
  practiceActive,
  onTogglePracticeMode,
  practiceState,
  hasChords,
  tuneTempo,
  effectiveTempo,
  onSetContentType,
  onSetPattern,
  onSetRhythm,
  onSetTempoOverride,
  onSetRange,
  onGenerate,
  onClear,
  hasGeneratedContent,
  disabled = false,
  testID,
}: PracticeOverChangesControlsProps): React.ReactElement {
  const [showRhythmPicker, setShowRhythmPicker] = useState(false);
  const [showPatternPicker, setShowPatternPicker] = useState(false);

  const isDisabled = disabled || !hasChords;
  const {
    contentType,
    pattern,
    rhythm,
    tempoOverride,
    rangeLowMidi,
    rangeHighMidi,
    isGenerating,
    error,
  } = practiceState;

  // Get pattern options based on content type
  const patternOptions =
    contentType === "arpeggios"
      ? ARPEGGIO_PATTERN_OPTIONS
      : SCALE_PATTERN_OPTIONS;

  // Get current pattern label
  const currentPatternLabel =
    patternOptions.find((p) => p.value === pattern)?.label || "Default";

  // Get current rhythm label
  const currentRhythmLabel =
    RHYTHM_OPTIONS.find((r) => r.value === rhythm)?.label || "Quarter";

  // Handle tempo slider change
  const handleTempoChange = useCallback(
    (value: number) => {
      // If close to tune tempo, snap to null (use tune tempo)
      if (Math.abs(value - tuneTempo) < 5) {
        onSetTempoOverride(null);
      } else {
        onSetTempoOverride(Math.round(value));
      }
    },
    [tuneTempo, onSetTempoOverride],
  );

  // Handle range slider change
  const handleRangeLowChange = useCallback(
    (value: number) => {
      const newLow = Math.round(value);
      if (newLow < rangeHighMidi) {
        onSetRange(newLow, rangeHighMidi);
      }
    },
    [rangeHighMidi, onSetRange],
  );

  const handleRangeHighChange = useCallback(
    (value: number) => {
      const newHigh = Math.round(value);
      if (newHigh > rangeLowMidi) {
        onSetRange(rangeLowMidi, newHigh);
      }
    },
    [rangeLowMidi, onSetRange],
  );

  // When not in practice mode, just show the toggle button
  if (!practiceActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, isDisabled && styles.buttonDisabled]}
          onPress={onTogglePracticeMode}
          disabled={isDisabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel={
            hasChords ? "Practice over changes" : "Add chords first"
          }
          testID="practice-mode-toggle"
        >
          <Feather
            name="play-circle"
            size={18}
            color={hasChords ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.toggleLabel, isDisabled && styles.labelDisabled]}
          >
            {hasChords ? "Practice Over Changes" : "Add Chords First"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In practice mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.practiceContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Feather name="play-circle" size={16} color={colors.primary} />
          <Text style={styles.headerLabel}>Practice Over Changes</Text>
        </View>

        {/* Content Type Selector */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Content:</Text>
          <View style={styles.segmentedControl}>
            {(
              ["scales", "arpeggios", "guide_tones"] as PracticeContentType[]
            ).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentButton,
                  contentType === type && styles.segmentButtonActive,
                ]}
                onPress={() => onSetContentType(type)}
                disabled={isGenerating}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={PRACTICE_CONTENT_TYPE_LABELS[type]}
                accessibilityState={{ selected: contentType === type }}
                testID={`practice-content-${type}`}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    contentType === type && styles.segmentButtonTextActive,
                  ]}
                >
                  {PRACTICE_CONTENT_TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pattern Picker (not for guide_tones) */}
        {contentType !== "guide_tones" && (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Pattern:</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPatternPicker(!showPatternPicker)}
              disabled={isGenerating}
              testID="practice-pattern-picker"
            >
              <Text style={styles.pickerButtonText}>{currentPatternLabel}</Text>
              <Feather
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Pattern Options Dropdown */}
        {showPatternPicker && contentType !== "guide_tones" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
          >
            {patternOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value ?? "default"}
                style={[
                  styles.optionChip,
                  pattern === opt.value && styles.optionChipActive,
                ]}
                onPress={() => {
                  onSetPattern(opt.value);
                  setShowPatternPicker(false);
                }}
                testID={`practice-pattern-${opt.value ?? "default"}`}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    pattern === opt.value && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Rhythm Picker */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Rhythm:</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRhythmPicker(!showRhythmPicker)}
            disabled={isGenerating}
            testID="practice-rhythm-picker"
          >
            <Text style={styles.pickerButtonText}>{currentRhythmLabel}</Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Rhythm Options Dropdown */}
        {showRhythmPicker && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsContainer}
            contentContainerStyle={styles.optionsContent}
          >
            {RHYTHM_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionChip,
                  rhythm === opt.value && styles.optionChipActive,
                ]}
                onPress={() => {
                  onSetRhythm(opt.value);
                  setShowRhythmPicker(false);
                }}
                testID={`practice-rhythm-${opt.value}`}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    rhythm === opt.value && styles.optionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Tempo Slider */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionLabel}>Tempo:</Text>
            <Text style={styles.sliderValue}>
              {tempoOverride === null
                ? `${tuneTempo} (tune)`
                : `${effectiveTempo} BPM`}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={40}
            maximumValue={240}
            value={effectiveTempo}
            onValueChange={handleTempoChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            disabled={isGenerating}
            testID="practice-tempo-slider"
          />
        </View>

        {/* Range Sliders */}
        <View style={styles.sliderSection}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionLabel}>Range:</Text>
            <Text style={styles.sliderValue}>
              {midiToNoteName(rangeLowMidi)} - {midiToNoteName(rangeHighMidi)}
            </Text>
          </View>
          <View style={styles.rangeSliders}>
            <View style={styles.rangeSliderRow}>
              <Text style={styles.rangeLabel}>Low:</Text>
              <Slider
                style={styles.rangeSlider}
                minimumValue={24}
                maximumValue={96}
                step={1}
                value={rangeLowMidi}
                onValueChange={handleRangeLowChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={isGenerating}
                testID="practice-range-low-slider"
              />
            </View>
            <View style={styles.rangeSliderRow}>
              <Text style={styles.rangeLabel}>High:</Text>
              <Slider
                style={styles.rangeSlider}
                minimumValue={24}
                maximumValue={96}
                step={1}
                value={rangeHighMidi}
                onValueChange={handleRangeHighChange}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                disabled={isGenerating}
                testID="practice-range-high-slider"
              />
            </View>
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={onGenerate}
            disabled={isGenerating}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Generate practice content"
            testID="practice-generate-button"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Feather name="zap" size={16} color={colors.white} />
                <Text style={styles.generateButtonText}>Generate</Text>
              </>
            )}
          </TouchableOpacity>

          {hasGeneratedContent && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClear}
              disabled={isGenerating}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Clear generated content"
              testID="practice-clear-button"
            >
              <Feather name="trash-2" size={16} color={colors.error} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Exit button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onTogglePracticeMode}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Exit practice mode"
          testID="practice-exit"
        >
          <Text style={styles.exitButtonText}>Exit Practice Mode</Text>
        </TouchableOpacity>
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
    paddingVertical: spacing.xs,
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
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.textSecondary,
  },
  practiceContainer: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    flex: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    width: 60,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: "center",
    borderRadius: 4,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: colors.white,
  },
  pickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pickerButtonText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  optionsContainer: {
    marginBottom: spacing.sm,
    marginLeft: 68, // Align with picker
  },
  optionsContent: {
    gap: spacing.xs,
  },
  optionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionChipTextActive: {
    color: colors.white,
  },
  sliderSection: {
    marginBottom: spacing.sm,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  sliderValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  slider: {
    width: "100%",
    height: 32,
  },
  rangeSliders: {
    gap: spacing.xs,
  },
  rangeSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 35,
  },
  rangeSlider: {
    flex: 1,
    height: 32,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderRadius: 6,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  generateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.error,
  },
  exitButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exitButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const PracticeOverChangesControls = memo(
  PracticeOverChangesControlsComponent,
);
