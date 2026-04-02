/**
 * LyricsControls Component
 *
 * Controls for editing lyrics on notes.
 * Provides a text input for syllables, note navigation, and melisma controls.
 */

import React, { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, spacing } from "../../../constants";

// =============================================================================
// Types
// =============================================================================

export type SyllabicType = "single" | "begin" | "middle" | "end";

export interface LyricsControlsProps {
  /** Whether lyrics mode is currently active */
  lyricsModeActive: boolean;
  /** Toggle lyrics mode on/off */
  onToggleLyricsMode: () => void;
  /** Current lyric text on selected note (raw, no hyphens) */
  currentLyricText: string;
  /** Current syllabic type */
  currentSyllabic: SyllabicType | undefined;
  /** Previous note's syllabic type (to know if we're in middle of a word) */
  prevSyllabic: SyllabicType | undefined;
  /** Set lyric on current note */
  onSetLyric: (text: string, syllabic?: SyllabicType) => void;
  /** Remove lyric from current note */
  onRemoveLyric: () => void;
  /** Move to next pitched note */
  onNextNote: () => void;
  /** Move to previous pitched note */
  onPrevNote: () => void;
  /** Extend melisma (moves to next note and extends span) */
  onExtendMelisma: () => void;
  /** Shrink melisma (moves to previous note and shrinks span) */
  onShrinkMelisma: () => void;
  /** Whether we can move to previous note */
  canGoPrev: boolean;
  /** Whether we can move to next note */
  canGoNext: boolean;
  /** Current note index (1-based for display) */
  currentNoteIndex: number;
  /** Total pitched notes */
  totalNotes: number;
  /** Whether there's a note selected */
  hasSelection: boolean;
  /** Whether controls are disabled */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function LyricsControlsComponent({
  lyricsModeActive,
  onToggleLyricsMode,
  currentLyricText,
  currentSyllabic,
  prevSyllabic,
  onSetLyric,
  onRemoveLyric,
  onNextNote,
  onPrevNote,
  onExtendMelisma,
  onShrinkMelisma,
  canGoPrev,
  canGoNext,
  currentNoteIndex,
  totalNotes,
  hasSelection,
  disabled = false,
  testID,
}: LyricsControlsProps): React.ReactElement {
  const [inputText, setInputText] = useState(currentLyricText);
  const inputRef = useRef<TextInput>(null);

  // Focus the input after actions that might blur it
  const refocusInput = useCallback(() => {
    // Small delay to ensure state updates complete before focusing
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Infer syllabic: if no current syllabic but prev was begin/middle, default to middle
  const inferredSyllabic = (): SyllabicType => {
    if (currentSyllabic) return currentSyllabic;
    if (prevSyllabic === "begin" || prevSyllabic === "middle") return "middle";
    return "single";
  };

  const [syllabic, setSyllabic] = useState<SyllabicType>(inferredSyllabic());
  const isDisabled = disabled || !hasSelection;

  // Sync input text and syllabic with current lyric when note changes
  useEffect(() => {
    setInputText(currentLyricText);
    // If note has no lyric but we're continuing a word, default to middle
    if (currentSyllabic) {
      setSyllabic(currentSyllabic);
    } else if (prevSyllabic === "begin" || prevSyllabic === "middle") {
      setSyllabic("middle");
    } else {
      setSyllabic("single");
    }
  }, [currentLyricText, currentSyllabic, prevSyllabic]);

  // Handle text change - save with current syllabic type
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (text.trim()) {
        onSetLyric(text, syllabic);
      } else {
        onRemoveLyric();
      }
    },
    [onSetLyric, onRemoveLyric, syllabic],
  );

  // Handle syllabic type change
  const handleSyllabicChange = useCallback(
    (newSyllabic: SyllabicType) => {
      setSyllabic(newSyllabic);
      if (inputText.trim()) {
        onSetLyric(inputText, newSyllabic);
      }
    },
    [inputText, onSetLyric],
  );

  // Handle "Word continues" - mark as begin/middle and move to next note
  const handleWordContinues = useCallback(() => {
    if (!inputText.trim()) return;
    // If the PREVIOUS note was "begin" or "middle", we're continuing a word (use "middle")
    // Otherwise this is the first syllable (use "begin")
    const newSyllabic =
      prevSyllabic === "begin" || prevSyllabic === "middle"
        ? "middle"
        : "begin";
    onSetLyric(inputText, newSyllabic);
    onNextNote();
    refocusInput();
  }, [inputText, prevSyllabic, onSetLyric, onNextNote, refocusInput]);

  // Handle "End word" - mark as end and optionally move
  const handleEndWord = useCallback(() => {
    if (!inputText.trim()) return;
    onSetLyric(inputText, "end");
  }, [inputText, onSetLyric]);

  // When not in lyrics mode, just show the toggle button
  if (!lyricsModeActive) {
    return (
      <View style={styles.container} testID={testID}>
        <TouchableOpacity
          style={[styles.toggleButton, isDisabled && styles.buttonDisabled]}
          onPress={onToggleLyricsMode}
          disabled={isDisabled}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Enter lyrics mode"
          testID="lyrics-mode-toggle"
        >
          <Feather name="type" size={18} color={colors.primary} />
          <Text
            style={[styles.toggleLabel, isDisabled && styles.labelDisabled]}
          >
            Enter Lyrics
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // In lyrics mode, show full controls
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.lyricsModeContainer}>
        {/* Header with note count */}
        <View style={styles.header}>
          <Feather name="type" size={16} color={colors.primary} />
          <Text style={styles.headerLabel}>Lyrics Mode</Text>
          <Text style={styles.noteCount}>
            Note {currentNoteIndex} of {totalNotes}
          </Text>
        </View>

        {/* Syllable input */}
        <View style={styles.inputRow}>
          <Text style={styles.rowLabel}>Syllable:</Text>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Enter syllable..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            testID="lyrics-syllable-input"
          />
        </View>

        {/* Syllabic type row - how does this syllable connect? */}
        <View style={styles.syllabicRow}>
          <TouchableOpacity
            style={[
              styles.syllabicButton,
              syllabic === "single" && styles.syllabicButtonActive,
            ]}
            onPress={() => handleSyllabicChange("single")}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Single word"
            testID="lyrics-syllabic-single"
          >
            <Text
              style={[
                styles.syllabicButtonText,
                syllabic === "single" && styles.syllabicButtonTextActive,
              ]}
            >
              Word
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.syllabicButton,
              styles.syllabicButtonWide,
              (!inputText.trim() || !canGoNext) && styles.buttonDisabled,
            ]}
            onPress={handleWordContinues}
            disabled={!inputText.trim() || !canGoNext}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Word continues to next syllable"
            testID="lyrics-word-continues"
          >
            <Text style={styles.syllabicButtonText}>Continues →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.syllabicButton,
              syllabic === "end" && styles.syllabicButtonActive,
              !inputText.trim() && styles.buttonDisabled,
            ]}
            onPress={handleEndWord}
            disabled={!inputText.trim()}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="End of word"
            testID="lyrics-syllabic-end"
          >
            <Text
              style={[
                styles.syllabicButtonText,
                syllabic === "end" && styles.syllabicButtonTextActive,
              ]}
            >
              End
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note navigation row */}
        <View style={styles.controlRow}>
          <Text style={styles.rowLabel}>Note:</Text>
          <View style={styles.arrowGroup}>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                !canGoPrev && styles.arrowButtonDisabled,
              ]}
              onPress={() => {
                onPrevNote();
                refocusInput();
              }}
              disabled={!canGoPrev}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Previous note"
              testID="lyrics-prev-note"
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
              onPress={() => {
                onNextNote();
                refocusInput();
              }}
              disabled={!canGoNext}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Next note"
              testID="lyrics-next-note"
            >
              <Feather
                name="chevron-right"
                size={20}
                color={canGoNext ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={styles.hintText}>(skips rests)</Text>
          </View>
        </View>

        {/* Melisma row */}
        <View style={styles.controlRow}>
          <Text style={styles.rowLabel}>Melisma:</Text>
          <View style={styles.arrowGroup}>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                !canGoPrev && styles.arrowButtonDisabled,
              ]}
              onPress={onShrinkMelisma}
              disabled={!canGoPrev}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Shrink melisma"
              testID="lyrics-shrink-melisma"
            >
              <Feather
                name="chevron-left"
                size={20}
                color={canGoPrev ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.arrowButton,
                !canGoNext && styles.arrowButtonDisabled,
              ]}
              onPress={onExtendMelisma}
              disabled={!canGoNext}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel="Extend melisma"
              testID="lyrics-extend-melisma"
            >
              <Feather
                name="chevron-right"
                size={20}
                color={canGoNext ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={styles.hintText}>(extends span)</Text>
          </View>
        </View>

        {/* Exit button */}
        <TouchableOpacity
          style={styles.exitButton}
          onPress={onToggleLyricsMode}
          accessibilityRole={"button" as AccessibilityRole}
          accessibilityLabel="Exit lyrics mode"
          testID="lyrics-exit"
        >
          <Text style={styles.exitButtonText}>Exit Lyrics Mode</Text>
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
  lyricsModeContainer: {
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
  noteCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    width: 65,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  arrowGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButtonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  hintText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  syllabicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  syllabicButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  syllabicButtonWide: {
    flex: 1.5,
  },
  syllabicButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  syllabicButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  syllabicButtonTextActive: {
    color: colors.white,
  },
  exitButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.textSecondary,
    borderRadius: 6,
    alignItems: "center",
  },
  exitButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

// =============================================================================
// Export
// =============================================================================

export const LyricsControls = memo(LyricsControlsComponent);
