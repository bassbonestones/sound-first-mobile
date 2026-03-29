/**
 * ChordControls Component
 *
 * Controls for entering and editing chord symbols.
 * Provides a text input with symbol palette buttons, autocomplete suggestions,
 * and chord preview functionality.
 *
 * Uses ChordModeContext to eliminate prop drilling. The connected version
 * (ChordControlsConnected) reads from context, while ChordControlsBase
 * accepts props directly for flexibility.
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
import { ChordPreview } from "./ChordPreview";
import { ProgressionSelectorConnected } from "./ProgressionSelector";
import { useChordModeOptional } from "../contexts";

// =============================================================================
// Types
// =============================================================================

/** Props for the connected version (uses context) */
export interface ChordControlsConnectedProps {
  /** Optional callback for live chord input changes (called on every keystroke) */
  onChordInputChange?: (text: string) => void;
  /** Optional callback when chord preview is requested */
  onPreviewChord?: (midiNotes: number[]) => void;
  /** Test ID for testing */
  testID?: string;
}

/** Props for the base version (no context, all props required) */
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
  /** Current subdivision: 1=beat, 2=half, 3=triplet */
  subdivision: 1 | 2 | 3;
  /** Callback to cycle through subdivisions */
  onCycleSubdivision: () => void;
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

/** Row 3: Extensions - grouped by scale degree */
const EXTENSION_SYMBOLS: SymbolButton[] = [
  // 9ths
  { label: "9", insert: "9", accessibilityLabel: "9th" },
  { label: "♭9", insert: "b9", accessibilityLabel: "Flat 9" },
  { label: "♯9", insert: "#9", accessibilityLabel: "Sharp 9" },
  // 11ths
  { label: "11", insert: "11", accessibilityLabel: "11th" },
  { label: "♯11", insert: "#11", accessibilityLabel: "Sharp 11" },
  // 13ths
  { label: "13", insert: "13", accessibilityLabel: "13th" },
  { label: "♭13", insert: "b13", accessibilityLabel: "Flat 13" },
  // 5ths (less common as alterations in parens)
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
  subdivision = 1,
  onCycleSubdivision,
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
  testID,
}: ChordControlsProps): React.ReactElement {
  const [inputText, setInputText] = useState(currentChordSymbol);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
  const hasWarnings = (recognitionResult?.warnings?.length ?? 0) > 0;
  const warningMessages = recognitionResult?.warnings ?? [];

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

  // Handle chord preview - toggle visual preview and optionally play audio
  const handlePreview = useCallback(() => {
    if (!inputText.trim()) return;
    // Toggle the visual preview
    setShowPreview((prev) => !prev);
    // Also play audio preview if callback provided
    if (onPreviewChord) {
      const midiNotes = spellChord(inputText.trim());
      if (midiNotes.length > 0) {
        onPreviewChord(midiNotes);
      }
    }
  }, [inputText, onPreviewChord]);

  // Close preview when input changes
  useEffect(() => {
    setShowPreview(false);
  }, [inputText]);

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
  // Format beat position for display (e.g., "1", "1½", "1⅓", "1⅔")
  const formatBeatPosition = (beat: number): string => {
    const wholeBeat = Math.floor(beat) + 1; // 1-indexed display
    const fraction = beat - Math.floor(beat);
    if (Math.abs(fraction) < 0.01) return `${wholeBeat}`;
    if (Math.abs(fraction - 0.5) < 0.01) return `${wholeBeat}½`;
    if (Math.abs(fraction - 1 / 3) < 0.01) return `${wholeBeat}⅓`;
    if (Math.abs(fraction - 2 / 3) < 0.01) return `${wholeBeat}⅔`;
    // For other fractions, show decimal
    return `${(beat + 1).toFixed(1)}`;
  };

  // Subdivision label for display
  const subdivisionLabel =
    subdivision === 1 ? "♩" : subdivision === 2 ? "♪" : "𝅘𝅥𝅮³";

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.chordModeContainer}>
        {/* Header with position info */}
        <View style={styles.header}>
          <Feather name="music" size={16} color={colors.primary} />
          <Text style={styles.headerLabel}>Chord Mode</Text>
          <Text style={styles.positionInfo}>
            M{currentPosition.measureIndex + 1} Beat{" "}
            {formatBeatPosition(currentPosition.beatPosition)}
          </Text>
          <TouchableOpacity
            onPress={onCycleSubdivision}
            style={styles.subdivisionButton}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel={`Subdivision: ${subdivision === 1 ? "beat" : subdivision === 2 ? "half beat" : "triplet"}. Tap to change.`}
            accessibilityHint="Cycles through beat, half beat, and triplet subdivisions"
            testID="subdivision-toggle"
          >
            <Text style={styles.subdivisionBadge}>{subdivisionLabel}</Text>
          </TouchableOpacity>
        </View>

        {/* Progression selector - uses ChordProgressionContext */}
        <ProgressionSelectorConnected testID="progression-selector" />

        {/* Chord input row */}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              hasInput && !isRecognized && styles.textInputWarning,
              hasInput &&
                isRecognized &&
                hasWarnings &&
                styles.textInputCaution,
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
          {hasInput && isRecognized && hasWarnings && (
            <View style={styles.cautionBadge} testID="chord-caution-badge">
              <Feather name="alert-triangle" size={14} color={colors.warning} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.previewButton, !hasInput && styles.buttonDisabled]}
            onPress={handlePreview}
            disabled={!hasInput}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Preview chord tones"
            testID="chord-preview-button"
          >
            <Text style={styles.previewButtonText}>?</Text>
          </TouchableOpacity>
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

        {/* Chord preview mini-staff */}
        {showPreview && hasInput && (
          <ChordPreview
            symbol={inputText.trim()}
            onClose={() => setShowPreview(false)}
            testID="chord-preview"
          />
        )}

        {/* Autocomplete suggestions - always allocate space to prevent layout jumping */}
        <View style={styles.suggestionsContainer} testID="chord-suggestions-container">
          {showSuggestions && suggestions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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
          ) : null}
        </View>

        {/* Validation warnings */}
        {hasWarnings && (
          <View style={styles.warningMessagesContainer} testID="chord-warnings">
            {warningMessages.map((warning, index) => (
              <View key={index} style={styles.warningMessage}>
                <Feather
                  name="alert-triangle"
                  size={12}
                  color={colors.warning}
                />
                <Text style={styles.warningMessageText}>{warning}</Text>
              </View>
            ))}
          </View>
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
    marginRight: spacing.xs,
  },
  subdivisionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: colors.primary + "20",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  subdivisionBadge: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
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
  textInputCaution: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  warningBadge: {
    position: "absolute",
    right: 80,
    top: 12,
  },
  cautionBadge: {
    position: "absolute",
    right: 80,
    top: 12,
  },
  warningMessagesContainer: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  warningMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: 2,
  },
  warningMessageText: {
    fontSize: 12,
    color: colors.warning,
    fontStyle: "italic",
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
    height: 40,
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

/** Base component that accepts all props directly */
export const ChordControlsBase = memo(ChordControlsComponent);

/**
 * Connected component that uses ChordModeContext.
 * Must be used within a ChordModeProvider.
 */
function ChordControlsConnectedComponent({
  onChordInputChange,
  onPreviewChord,
  testID,
}: ChordControlsConnectedProps): React.ReactElement {
  const context = useChordModeOptional();

  if (!context) {
    throw new Error(
      "ChordControlsConnected must be used within a ChordModeProvider",
    );
  }

  return (
    <ChordControlsBase
      chordModeActive={context.chordModeActive}
      onToggleChordMode={context.toggleChordMode}
      currentChordSymbol={context.currentChordSymbol}
      onSetChord={context.setChord}
      onRemoveChord={context.removeChord}
      onNextBeat={context.moveNext}
      onPrevBeat={context.movePrev}
      canGoPrev={context.canGoPrev}
      canGoNext={context.canGoNext}
      subdivision={context.subdivision}
      onCycleSubdivision={context.cycleSubdivision}
      currentPosition={context.currentPosition}
      hasSelection={context.hasSelection}
      disabled={context.disabled}
      onChordInputChange={onChordInputChange}
      onPreviewChord={onPreviewChord}
      showChordSymbols={context.showChordSymbols}
      onToggleVisibility={context.toggleVisibility}
      onInferChords={context.inferChords}
      isInferring={context.isInferring}
      onClearChords={context.clearChords}
      testID={testID}
    />
  );
}

export const ChordControlsConnected = memo(ChordControlsConnectedComponent);

/**
 * Default export - the connected version for easy migration.
 * For the base version without context, use ChordControlsBase.
 * @deprecated Use ChordControlsConnected with ChordModeProvider for reduced prop drilling
 */
export const ChordControls = memo(ChordControlsComponent);
