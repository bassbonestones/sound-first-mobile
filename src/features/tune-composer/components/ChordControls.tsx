/**
 * ChordControls Component
 *
 * Controls for entering and editing chord symbols.
 * Provides a text input with symbol palette buttons, autocomplete suggestions,
 * and chord preview functionality.
 */

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  AccessibilityRole,
  TextInput as TextInputType,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";
import {
  recognizeChord,
  getAutocompleteSuggestions,
  spellChord,
} from "../services";
import { ProgressionSelector } from "./ProgressionSelector";
import type { ChordProgression } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface ChordControlsProps {
  /** Whether chord entry mode is currently active */
  chordModeActive: boolean;
  /** Toggle chord entry mode on/off */
  onToggleChordMode: () => void;
  /** Current chord symbol at selected position */
  currentChordSymbol: string;
  /** Set chord at current position */
  onSetChord: (symbol: string) => void;
  /** Remove chord at current position */
  onRemoveChord: () => void;
  /** Move to next beat position */
  onNextBeat: () => void;
  /** Move to previous beat position */
  onPrevBeat: () => void;
  /** Whether we can move to previous position */
  canGoPrev: boolean;
  /** Whether we can move to next position */
  canGoNext: boolean;
  /** Current position info for display */
  currentPosition: {
    measureIndex: number;
    beatPosition: number;
  };
  /** Whether there's a valid position selected */
  hasSelection: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Optional callback for live chord input changes (called on every keystroke) */
  onChordInputChange?: (text: string) => void;
  /** Optional callback when chord preview is requested */
  onPreviewChord?: (midiNotes: number[]) => void;
  /** Whether chord symbols are visible in the score */
  showChordSymbols?: boolean;
  /** Callback to toggle chord symbol visibility */
  onToggleVisibility?: () => void;
  /** Callback to infer chords from melody */
  onInferChords?: () => void;
  /** Whether chord inference is in progress */
  isInferring?: boolean;
  /** Callback to clear all chords from current progression */
  onClearChords?: () => void;
  // Progression management props
  /** All available progressions */
  progressions?: ChordProgression[];
  /** ID of the currently active progression */
  activeProgressionId?: string;
  /** Callback when a progression is selected */
  onSelectProgression?: (id: string) => void;
  /** Callback to create a new progression */
  onCreateProgression?: (name: string) => void;
  /** Callback to duplicate a progression */
  onDuplicateProgression?: (sourceId: string, newName?: string) => void;
  /** Callback to delete a progression */
  onDeleteProgression?: (id: string) => void;
  /** Callback to rename a progression */
  onRenameProgression?: (id: string, newName: string) => void;
  /** Whether progression edit mode is active */
  isProgressionEditMode?: boolean;
  /** Callback to toggle progression edit mode */
  onToggleProgressionEditMode?: () => void;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Symbol Palette Configuration
// =============================================================================

interface SymbolButton {
  /** Display label on button */
  label: string;
  /** Text to insert into input */
  insert: string;
  /** Accessibility label */
  accessibilityLabel: string;
}

/** Row 1: Accidentals & special symbols */
const ACCIDENTAL_SYMBOLS: SymbolButton[] = [
  { label: "♯", insert: "#", accessibilityLabel: "Sharp" },
  { label: "♭", insert: "b", accessibilityLabel: "Flat" },
  { label: "Δ", insert: "maj7", accessibilityLabel: "Major 7" },
  { label: "°", insert: "dim", accessibilityLabel: "Diminished" },
  { label: "ø", insert: "m7b5", accessibilityLabel: "Half diminished" },
  { label: "+", insert: "aug", accessibilityLabel: "Augmented" },
  { label: "/", insert: "/", accessibilityLabel: "Slash" },
];

/** Row 2: Chord qualities */
const QUALITY_SYMBOLS: SymbolButton[] = [
  { label: "m", insert: "m", accessibilityLabel: "Minor" },
  { label: "7", insert: "7", accessibilityLabel: "Dominant 7" },
  { label: "maj7", insert: "maj7", accessibilityLabel: "Major 7" },
  { label: "m7", insert: "m7", accessibilityLabel: "Minor 7" },
  { label: "sus", insert: "sus4", accessibilityLabel: "Suspended 4" },
];

/** Row 3: Extensions */
const EXTENSION_SYMBOLS: SymbolButton[] = [
  { label: "9", insert: "9", accessibilityLabel: "9th" },
  { label: "11", insert: "11", accessibilityLabel: "11th" },
  { label: "13", insert: "13", accessibilityLabel: "13th" },
  { label: "♭9", insert: "b9", accessibilityLabel: "Flat 9" },
  { label: "♯9", insert: "#9", accessibilityLabel: "Sharp 9" },
  { label: "♭5", insert: "b5", accessibilityLabel: "Flat 5" },
  { label: "♯5", insert: "#5", accessibilityLabel: "Sharp 5" },
];

// =============================================================================
// Component
// =============================================================================

function ChordControlsComponent({
  chordModeActive,
  onToggleChordMode,
  currentChordSymbol,
  onSetChord,
  onRemoveChord,
  onNextBeat,
  onPrevBeat,
  canGoPrev,
  canGoNext,
  currentPosition,
  hasSelection,
  disabled = false,
  onChordInputChange,
  onPreviewChord,
  showChordSymbols = true,
  onToggleVisibility,
  onInferChords,
  isInferring = false,
  onClearChords,
  progressions,
  activeProgressionId,
  onSelectProgression,
  onCreateProgression,
  onDuplicateProgression,
  onDeleteProgression,
  onRenameProgression,
  isProgressionEditMode = false,
  onToggleProgressionEditMode,
  testID,
}: ChordControlsProps): React.ReactElement {
  const [inputText, setInputText] = useState(currentChordSymbol);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInputType>(null);
  // Track if we're selecting a suggestion to avoid blur handler race condition
  const isSelectingSuggestionRef = useRef(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDisabled = disabled || !hasSelection;

  // Validate current input
  const recognitionResult = inputText.trim()
    ? recognizeChord(inputText.trim())
    : null;
  const isRecognized = recognitionResult?.recognized ?? false;
  const hasInput = inputText.trim().length > 0;

  // Sync input text with current chord when position changes
  useEffect(() => {
    setInputText(currentChordSymbol);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [
    currentChordSymbol,
    currentPosition.measureIndex,
    currentPosition.beatPosition,
  ]);

  // Update suggestions as user types
  useEffect(() => {
    if (inputText.trim()) {
      const newSuggestions = getAutocompleteSuggestions(inputText.trim(), 8);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputText]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Handle text change - notify parent for live score updates
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
      // Notify parent for live preview on the score
      onChordInputChange?.(text);
    },
    [onChordInputChange],
  );

  // Actual submit logic (shared between blur and explicit submit)
  const doSubmit = useCallback(() => {
    setShowSuggestions(false);
    const trimmed = inputText.trim();
    if (trimmed) {
      onSetChord(trimmed);
    } else {
      onRemoveChord();
    }
  }, [inputText, onSetChord, onRemoveChord]);

  // Handle blur - delayed to allow suggestion tap to process first
  const handleBlur = useCallback(() => {
    // Skip if we're selecting a suggestion (to avoid race condition)
    if (isSelectingSuggestionRef.current) {
      isSelectingSuggestionRef.current = false;
      return;
    }
    // Delay submission to allow suggestion tap to process first
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      if (isSelectingSuggestionRef.current) {
        isSelectingSuggestionRef.current = false;
        return;
      }
      doSubmit();
    }, 150);
  }, [doSubmit]);

  // Handle explicit submit (Enter key) - immediate, no delay needed
  const handleExplicitSubmit = useCallback(() => {
    // Cancel any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    doSubmit();
  }, [doSubmit]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      // Cancel any pending blur submission
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      isSelectingSuggestionRef.current = true;
      setInputText(suggestion);
      setShowSuggestions(false);
      onSetChord(suggestion);
      // Reset flag after a moment
      setTimeout(() => {
        isSelectingSuggestionRef.current = false;
      }, 50);
    },
    [onSetChord],
  );

  // Insert symbol at cursor position with smart formatting for alterations
  const handleInsertSymbol = useCallback(
    (symbol: string) => {
      // Cancel any pending blur submission
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      let newText = inputText;

      // Check if we're adding an extension/alteration (b9, #9, 11, b5, #5, 13, b13, etc.)
      // These are NOT alterations: 7, maj7, m7, dim7 (these are chord qualities)
      const isExtension = /^[b#]?(9|11|13|5)$/.test(symbol);

      if (isExtension && inputText.length > 0) {
        // Check if there's already a parenthesis group
        if (inputText.includes("(") && !inputText.endsWith(")")) {
          // Inside open parens, add comma separator
          newText = inputText + "," + symbol;
        } else if (inputText.endsWith(")")) {
          // Closed parens - reopen and add
          newText = inputText.slice(0, -1) + "," + symbol + ")";
        } else if (/\([^)]+$/.test(inputText)) {
          // Has unclosed paren, just add with comma
          newText = inputText + "," + symbol;
        } else if (/[b#](9|11|13|5)$/.test(inputText)) {
          // Already has an extension without parens (like b9, #11) - wrap both
          const match = inputText.match(/^(.+?)([b#](?:9|11|13|5))$/);
          if (match) {
            newText = match[1] + "(" + match[2] + "," + symbol + ")";
          } else {
            newText = inputText + "(" + symbol + ")";
          }
        } else {
          // First extension - add with parens
          newText = inputText + "(" + symbol + ")";
        }
      } else {
        // Not an extension, just append
        newText = inputText + symbol;
      }

      setInputText(newText);
      // Notify parent for live preview on the score
      onChordInputChange?.(newText);
      // Focus the input after inserting
      inputRef.current?.focus();
    },
    [inputText, onChordInputChange],
  );

  // Handle chord preview
  const handlePreview = useCallback(() => {
    if (!inputText.trim() || !onPreviewChord) return;
    const midiNotes = spellChord(inputText.trim());
    if (midiNotes.length > 0) {
      onPreviewChord(midiNotes);
    }
  }, [inputText, onPreviewChord]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputText("");
    onRemoveChord();
  }, [onRemoveChord]);

  // When not in chord mode, just show the toggle button
  if (!chordModeActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, disabled && styles.buttonDisabled]}
          onPress={onToggleChordMode}
          disabled={disabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Enter chord mode"
          testID="chord-mode-toggle"
        >
          <Feather name="music" size={18} color={colors.primary} />
          <Text style={[styles.toggleLabel, disabled && styles.labelDisabled]}>
            Enter Chords
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In chord mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.chordModeContainer}>
        {/* Header with position info */}
        <View style={styles.header}>
          <Feather name="music" size={16} color={colors.primary} />
          <Text style={styles.headerLabel}>Chord Mode</Text>
          <Text style={styles.positionInfo}>
            M{currentPosition.measureIndex + 1} Beat{" "}
            {currentPosition.beatPosition + 1}
          </Text>
        </View>

        {/* Progression selector */}
        {progressions && onSelectProgression && onCreateProgression && onDuplicateProgression && onToggleProgressionEditMode && (
          <ProgressionSelector
            progressions={progressions}
            activeProgressionId={activeProgressionId}
            onSelectProgression={onSelectProgression}
            onCreateProgression={onCreateProgression}
            onDuplicateProgression={onDuplicateProgression}
            onDeleteProgression={onDeleteProgression}
            onRenameProgression={onRenameProgression}
            isEditMode={isProgressionEditMode}
            onToggleEditMode={onToggleProgressionEditMode}
            disabled={disabled}
            testID="progression-selector"
          />
        )}

        {/* Chord input row */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              hasInput && !isRecognized && styles.textInputWarning,
            ]}
            value={inputText}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            onSubmitEditing={handleExplicitSubmit}
            placeholder="Enter chord..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            testID="chord-input"
          />
          {hasInput && !isRecognized && (
            <View style={styles.warningBadge}>
              <Feather name="alert-circle" size={14} color={colors.warning} />
            </View>
          )}
          {onPreviewChord && (
            <TouchableOpacity
              style={[styles.previewButton, !hasInput && styles.buttonDisabled]}
              onPress={handlePreview}
              disabled={!hasInput}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Preview chord"
              testID="chord-preview-button"
            >
              <Text style={styles.previewButtonText}>?</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.clearButton, !hasInput && styles.buttonDisabled]}
            onPress={handleClear}
            disabled={!hasInput}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Clear chord"
            testID="chord-clear-button"
          >
            <Feather
              name="x"
              size={16}
              color={hasInput ? colors.error : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsContainer}
            contentContainerStyle={styles.suggestionsContent}
            testID="chord-suggestions"
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion}-${index}`}
                style={styles.suggestionChip}
                onPress={() => handleSelectSuggestion(suggestion)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Select ${suggestion}`}
                testID={`chord-suggestion-${suggestion}`}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Symbol palette - Row 1: Accidentals */}
        <View style={styles.symbolRow}>
          <Text style={styles.symbolRowLabel}>Symbols:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.symbolButtons}
          >
            {ACCIDENTAL_SYMBOLS.map((symbol) => (
              <TouchableOpacity
                key={symbol.insert}
                style={styles.symbolButton}
                onPress={() => handleInsertSymbol(symbol.insert)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={symbol.accessibilityLabel}
                testID={`chord-symbol-${symbol.insert}`}
              >
                <Text style={styles.symbolButtonText}>{symbol.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Symbol palette - Row 2: Qualities */}
        <View style={styles.symbolRow}>
          <Text style={styles.symbolRowLabel}>Quality:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.symbolButtons}
          >
            {QUALITY_SYMBOLS.map((symbol) => (
              <TouchableOpacity
                key={`quality-${symbol.insert}`}
                style={styles.symbolButton}
                onPress={() => handleInsertSymbol(symbol.insert)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={symbol.accessibilityLabel}
                testID={`chord-quality-${symbol.insert}`}
              >
                <Text style={styles.symbolButtonText}>{symbol.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Symbol palette - Row 3: Extensions */}
        <View style={styles.symbolRow}>
          <Text style={styles.symbolRowLabel}>Extend:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.symbolButtons}
          >
            {EXTENSION_SYMBOLS.map((symbol) => (
              <TouchableOpacity
                key={`ext-${symbol.insert}`}
                style={styles.symbolButton}
                onPress={() => handleInsertSymbol(symbol.insert)}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={symbol.accessibilityLabel}
                testID={`chord-ext-${symbol.insert}`}
              >
                <Text style={styles.symbolButtonText}>{symbol.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Position navigation row */}
        <View style={styles.controlRow}>
          <Text style={styles.rowLabel}>Position:</Text>
          <View style={styles.arrowGroup}>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                !canGoPrev && styles.arrowButtonDisabled,
              ]}
              onPress={onPrevBeat}
              disabled={!canGoPrev}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Previous beat"
              testID="chord-prev-beat"
            >
              <Feather
                name="chevron-left"
                size={20}
                color={canGoPrev ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                !canGoNext && styles.arrowButtonDisabled,
              ]}
              onPress={onNextBeat}
              disabled={!canGoNext}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Next beat"
              testID="chord-next-beat"
            >
              <Feather
                name="chevron-right"
                size={20}
                color={canGoNext ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Visibility toggle */}
        {onToggleVisibility && (
          <TouchableOpacity
            style={styles.visibilityRow}
            onPress={onToggleVisibility}
            accessibilityRole={"switch" as AccessibilityRole}
            accessibilityLabel="Show chord symbols"
            accessibilityState={{ checked: showChordSymbols }}
            testID="chord-visibility-toggle"
          >
            <Text style={styles.visibilityCheckbox}>
              {showChordSymbols ? "☑" : "☐"}
            </Text>
            <Text style={styles.visibilityLabel}>Show chord symbols</Text>
          </TouchableOpacity>
        )}

        {/* Infer Chords button */}
        {onInferChords && (
          <TouchableOpacity
            style={[styles.inferButton, isInferring && styles.buttonDisabled]}
            onPress={onInferChords}
            disabled={isInferring}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Infer chords from melody"
            testID="chord-infer-button"
          >
            <Feather
              name="zap"
              size={16}
              color={isInferring ? colors.textSecondary : colors.primary}
            />
            <Text
              style={[
                styles.inferButtonText,
                isInferring && styles.inferButtonTextDisabled,
              ]}
            >
              {isInferring ? "Inferring..." : "Infer Chords from Melody"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Clear All Chords button */}
        {onClearChords && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearChords}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Clear all chords from progression"
            testID="chord-clear-button"
          >
            <Feather name="trash-2" size={16} color={colors.error} />
            <Text style={styles.clearAllButtonText}>Clear All Chords</Text>
          </TouchableOpacity>
        )}

        {/* Exit button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onToggleChordMode}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Exit chord mode"
          testID="chord-exit"
        >
          <Text style={styles.exitButtonText}>Exit Chord Mode</Text>
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
  chordModeContainer: {
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
  positionInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInputWarning: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  warningBadge: {
    position: "absolute",
    right: 80,
    top: 12,
  },
  previewButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.surface,
  },
  clearButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionsContainer: {
    maxHeight: 40,
    marginBottom: spacing.sm,
  },
  suggestionsContent: {
    gap: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  symbolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  symbolRowLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    width: 50,
  },
  symbolButtons: {
    gap: spacing.xs,
  },
  symbolButton: {
    minWidth: 36,
    height: 32,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 60,
  },
  arrowGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  arrowButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowButtonDisabled: {
    opacity: 0.5,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  visibilityCheckbox: {
    fontSize: 18,
    color: colors.primary,
  },
  visibilityLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  inferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.xs,
  },
  inferButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  inferButtonTextDisabled: {
    color: colors.textSecondary,
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
    gap: spacing.xs,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.error,
  },
  exitButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  exitButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ChordControls = memo(ChordControlsComponent);
