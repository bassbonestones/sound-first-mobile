/**
 * LessonComponents - Shared UI components for lesson-style exercises
 *
 * Extracts common UI patterns from WholeNoteLessonExercise, HalfNoteLessonExercise,
 * QuarterNoteLessonExercise, and other lesson exercises.
 *
 * Components:
 * - LessonBeatIndicator: Count-in and play beat visualization
 * - LessonAttestationModal: Self-attestation dialog
 * - LessonFocusCard: Full focus card display
 * - LessonFocusCardMini: Compact focus card for phase screens
 * - LessonPhaseProgress: Pattern/round progress dots
 * - LessonNotationToggle: Show/hide notation button
 */
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
// Colors are defined inline for component isolation

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FocusCardData {
  category: string;
  name: string;
  description: string;
  cue: string;
}

export interface PatternProgressItem {
  id: string;
  name: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

// -----------------------------------------------------------------------------
// LessonBeatIndicator
// -----------------------------------------------------------------------------

export interface LessonBeatIndicatorProps {
  /** Current beat number (negative for count-in, positive for play) */
  currentBeat: number;
  /** Total beats to play (not counting count-in) */
  totalBeats: number;
  /** Number of count-in beats (default: 4) */
  countInBeats?: number;
  /** Number of beats per note (for accent highlighting) */
  beatsPerNote?: number;
  /** Label for count-in row */
  countInLabel?: string;
  /** Label for play row */
  playLabel?: string;
  /** Whether to show subdivision indicator */
  isSubdivision?: boolean;
}

export function LessonBeatIndicator({
  currentBeat,
  totalBeats,
  countInBeats = 4,
  beatsPerNote = 1,
  countInLabel = "Count in:",
  playLabel = "Play:",
  isSubdivision: _isSubdivision = false,
}: LessonBeatIndicatorProps): React.JSX.Element {
  const countInArray = useMemo(
    () => Array.from({ length: countInBeats }, (_, i) => -countInBeats + i),
    [countInBeats],
  );

  const playArray = useMemo(
    () => Array.from({ length: totalBeats }, (_, i) => i + 1),
    [totalBeats],
  );

  return (
    <View style={beatStyles.container}>
      {/* Count-in row */}
      <View style={beatStyles.row}>
        <Text style={beatStyles.label}>{countInLabel}</Text>
        <View style={beatStyles.beats}>
          {countInArray.map((beat, index) => (
            <View
              key={beat}
              style={[
                beatStyles.dot,
                beat <= currentBeat && currentBeat < 0 && beatStyles.dotActive,
                beat === -countInBeats && beatStyles.dotAccent,
              ]}
            >
              <Text
                style={[
                  beatStyles.number,
                  beat <= currentBeat &&
                    currentBeat < 0 &&
                    beatStyles.numberActive,
                ]}
              >
                {index + 1}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Play row */}
      <View style={beatStyles.row}>
        <Text style={[beatStyles.label, beatStyles.playLabel]}>
          {playLabel}
        </Text>
        <View style={beatStyles.beats}>
          {playArray.map((beat) => {
            const isActive = currentBeat >= beat && currentBeat > 0;
            const isNoteStart = (beat - 1) % beatsPerNote === 0;

            return (
              <View
                key={beat}
                style={[
                  beatStyles.dot,
                  beatStyles.playDot,
                  isNoteStart && beatStyles.dotAccent,
                  isActive && beatStyles.dotActive,
                ]}
              >
                <Text
                  style={[
                    beatStyles.number,
                    isActive && beatStyles.numberActive,
                  ]}
                >
                  {beat}
                </Text>
              </View>
            );
          })}

          {/* Stop indicator */}
          <View
            style={[
              beatStyles.dot,
              beatStyles.stopDot,
              currentBeat === totalBeats + 1 && beatStyles.stopDotActive,
            ]}
          >
            <Text
              style={[
                beatStyles.number,
                currentBeat === totalBeats + 1 && beatStyles.stopNumberActive,
              ]}
            >
              ●
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const beatStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#8a7a6a",
    marginRight: 12,
    width: 70,
  },
  playLabel: {
    color: "#d4a574",
    fontWeight: "600",
  },
  beats: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  playDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  dotActive: {
    backgroundColor: "#d4a574",
    borderColor: "#d4a574",
  },
  dotAccent: {
    borderColor: "#f5e6d3",
  },
  stopDot: {
    borderColor: "#e57373",
  },
  stopDotActive: {
    backgroundColor: "#e57373",
    borderColor: "#e57373",
  },
  number: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  numberActive: {
    color: "#1a1410",
  },
  stopNumberActive: {
    color: "#fff",
  },
});

// -----------------------------------------------------------------------------
// LessonAttestationModal
// -----------------------------------------------------------------------------

export interface LessonAttestationModalProps {
  visible: boolean;
  phase: "sing" | "play" | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LessonAttestationModal({
  visible,
  phase,
  onCancel,
  onConfirm,
}: LessonAttestationModalProps): React.JSX.Element {
  const actionVerb = phase === "sing" ? "sang" : "played";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.content}>
          <Text style={modalStyles.title}>Confirm</Text>
          <Text style={modalStyles.text}>
            I attest that I {actionVerb} this correctly, but due to background
            noise or technical issues it was not able to register.
          </Text>
          <View style={modalStyles.buttons}>
            <TouchableOpacity
              accessibilityLabel="Cancel attestation"
              accessibilityRole="button"
              style={modalStyles.cancelButton}
              onPress={onCancel}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Confirm attestation"
              accessibilityRole="button"
              style={modalStyles.confirmButton}
              onPress={onConfirm}
            >
              <Text style={modalStyles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    width: "85%",
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#1a1410",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#8a7a6a",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#d4a574",
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1410",
  },
});

// -----------------------------------------------------------------------------
// LessonFocusCard
// -----------------------------------------------------------------------------

export interface LessonFocusCardProps {
  focusCard: FocusCardData;
}

export function LessonFocusCard({
  focusCard,
}: LessonFocusCardProps): React.JSX.Element {
  return (
    <View style={focusStyles.card}>
      <Text style={focusStyles.category}>
        {focusCard.category.toUpperCase()}
      </Text>
      <Text style={focusStyles.title}>{focusCard.name}</Text>
      <Text style={focusStyles.description}>{focusCard.description}</Text>
      <View style={focusStyles.cueBox}>
        <Text style={focusStyles.cue}>{focusCard.cue}</Text>
      </View>
    </View>
  );
}

const focusStyles = StyleSheet.create({
  card: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  category: {
    fontSize: 12,
    color: "#8a7a6a",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 16,
  },
  cueBox: {
    backgroundColor: "#1a1410",
    borderRadius: 8,
    padding: 12,
  },
  cue: {
    fontSize: 14,
    color: "#d4a574",
    fontStyle: "italic",
    textAlign: "center",
  },
});

// -----------------------------------------------------------------------------
// LessonFocusCardMini
// -----------------------------------------------------------------------------

export interface LessonFocusCardMiniProps {
  focusCard: FocusCardData;
}

export function LessonFocusCardMini({
  focusCard,
}: LessonFocusCardMiniProps): React.JSX.Element {
  return (
    <View style={miniStyles.card}>
      <View style={miniStyles.icon}>
        <Text style={miniStyles.iconText}>🎯</Text>
      </View>
      <View style={miniStyles.content}>
        <Text style={miniStyles.title}>{focusCard.name}</Text>
        <Text style={miniStyles.cue}>{focusCard.cue}</Text>
      </View>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5e6d3",
  },
  cue: {
    fontSize: 12,
    color: "#8a7a6a",
    marginTop: 2,
  },
});

// -----------------------------------------------------------------------------
// LessonPhaseProgress
// -----------------------------------------------------------------------------

export interface LessonPhaseProgressProps {
  items: PatternProgressItem[];
  onItemPress?: (index: number, id: string) => void;
  allowReplay?: boolean;
}

export function LessonPhaseProgress({
  items,
  onItemPress,
  allowReplay = false,
}: LessonPhaseProgressProps): React.JSX.Element {
  return (
    <View style={progressStyles.container}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          accessibilityLabel={`${item.name}${item.isCompleted ? ", completed" : item.isCurrent ? ", current" : ""}`}
          accessibilityRole="button"
          style={[
            progressStyles.dot,
            item.isCompleted && progressStyles.dotCompleted,
            item.isCurrent && progressStyles.dotCurrent,
          ]}
          onPress={() => {
            if (allowReplay && onItemPress) {
              onItemPress(index, item.id);
            }
          }}
          disabled={!allowReplay}
        >
          <Text
            style={[
              progressStyles.dotText,
              (item.isCompleted || item.isCurrent) &&
                progressStyles.dotTextActive,
            ]}
          >
            {item.isCompleted ? "✓" : index + 1}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#2d241a",
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1a1410",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    marginHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dotCompleted: {
    backgroundColor: "#4a7c59",
    borderColor: "#4a7c59",
  },
  dotCurrent: {
    borderColor: "#d4a574",
    borderWidth: 3,
  },
  dotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  dotTextActive: {
    color: "#fff",
  },
});

// -----------------------------------------------------------------------------
// LessonNotationToggle
// -----------------------------------------------------------------------------

export interface LessonNotationToggleProps {
  showNotation: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export function LessonNotationToggle({
  showNotation,
  onToggle,
  children,
}: LessonNotationToggleProps): React.JSX.Element {
  return (
    <View style={notationStyles.container}>
      {!showNotation ? (
        <TouchableOpacity
          accessibilityLabel="Show notation"
          accessibilityRole="button"
          style={notationStyles.toggleButton}
          onPress={onToggle}
        >
          <Text style={notationStyles.toggleText}>Show Notation 📝</Text>
        </TouchableOpacity>
      ) : (
        <>
          {children}
          <TouchableOpacity
            accessibilityLabel="Hide notation"
            accessibilityRole="button"
            style={notationStyles.toggleButton}
            onPress={onToggle}
          >
            <Text style={notationStyles.toggleText}>Hide Notation</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const notationStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 16,
  },
  toggleButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  toggleText: {
    fontSize: 14,
    color: "#d4a574",
  },
});

// -----------------------------------------------------------------------------
// LessonResultDisplay
// -----------------------------------------------------------------------------

export interface LessonResultDisplayProps {
  success: boolean;
  message: string;
}

export function LessonResultDisplay({
  success,
  message,
}: LessonResultDisplayProps): React.JSX.Element {
  return (
    <View style={resultStyles.container}>
      <Text
        style={[
          resultStyles.text,
          success ? resultStyles.success : resultStyles.fail,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  container: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  success: {
    color: "#8fd4a4",
  },
  fail: {
    color: "#e5a574",
  },
});

// -----------------------------------------------------------------------------
// LessonSuccessDisplay
// -----------------------------------------------------------------------------

export interface LessonSuccessDisplayProps {
  title?: string;
  message?: string;
  subtext?: string;
  emoji?: string;
}

export function LessonSuccessDisplay({
  title = "All Patterns Complete!",
  message = "You've successfully completed all patterns.",
  subtext,
  emoji = "🎉",
}: LessonSuccessDisplayProps): React.JSX.Element {
  return (
    <View style={successStyles.container}>
      <Text style={successStyles.emoji}>{emoji}</Text>
      <Text style={successStyles.title}>{title}</Text>
      <Text style={successStyles.text}>{message}</Text>
      {subtext && <Text style={successStyles.subtext}>{subtext}</Text>}
    </View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8fd4a4",
    marginBottom: 12,
  },
  text: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
  },
});

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

export {
  beatStyles as lessonBeatStyles,
  modalStyles as lessonModalStyles,
  focusStyles as lessonFocusStyles,
  miniStyles as lessonMiniStyles,
  progressStyles as lessonProgressStyles,
  notationStyles as lessonNotationStyles,
  resultStyles as lessonResultStyles,
  successStyles as lessonSuccessStyles,
};
