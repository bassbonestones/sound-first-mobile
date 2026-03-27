/**
 * lessonExerciseStyles - Shared styles for lesson exercises
 *
 * Used by: QuarterRestLessonExercise, HalfRestLessonExercise, WholeRestLessonExercise,
 *          Fragment2LessonExercise, and other lesson-style exercises
 *
 * These exercises share the same visual language with "earthy" colors for a warm,
 * focused learning experience.
 */
import { StyleSheet } from "react-native";

/**
 * Color palette for lesson exercises
 */
export const LESSON_COLORS = {
  // Backgrounds
  background: "#1a1410",
  cardBackground: "#2d241a",
  inputBackground: "#1a1410",

  // Borders
  border: "#3b2c1a",
  divider: "#3b2c1a",

  // Text
  textPrimary: "#f5e6d3",
  textSecondary: "#c4b5a0",
  textMuted: "#a69580",
  textHint: "#8a7a6a",

  // Accent
  accent: "#d4a574",
  accentDark: "#5a4a3a",

  // Feedback
  success: "#4CAF50",
  error: "#ff6b6b",
  warning: "#ff9800",

  // Beat indicators
  beatActive: "#d4a574",
  beatInactive: "#3b2c1a",
};

/**
 * Shared styles for lesson exercises
 */
export const lessonExerciseStyles = StyleSheet.create({
  // ============================================================
  // LAYOUT
  // ============================================================
  container: {
    flex: 1,
    backgroundColor: LESSON_COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ============================================================
  // FOCUS CARD (intro phase)
  // ============================================================
  focusCard: {
    backgroundColor: LESSON_COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LESSON_COLORS.border,
  },
  focusCardTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: LESSON_COLORS.textPrimary,
    marginBottom: 16,
  },
  focusCardSymbol: {
    fontSize: 72,
    color: LESSON_COLORS.accent,
    marginBottom: 16,
  },
  focusCardDescription: {
    fontSize: 20,
    color: LESSON_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 28,
  },
  focusCardDivider: {
    width: "80%",
    height: 1,
    backgroundColor: LESSON_COLORS.divider,
    marginVertical: 20,
  },
  focusCardCue: {
    fontSize: 18,
    color: LESSON_COLORS.accent,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 8,
  },
  focusCardDetail: {
    fontSize: 16,
    color: LESSON_COLORS.textMuted,
    textAlign: "center",
  },

  // ============================================================
  // COMPARISON BOX (shows different rest values)
  // ============================================================
  comparisonBox: {
    backgroundColor: LESSON_COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: "100%",
  },
  comparisonTitle: {
    fontSize: 14,
    color: LESSON_COLORS.textHint,
    textAlign: "center",
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  comparisonItem: {
    alignItems: "center",
  },
  comparisonLabel: {
    fontSize: 12,
    color: LESSON_COLORS.textHint,
    marginTop: 4,
  },
  comparisonDetail: {
    fontSize: 10,
    color: LESSON_COLORS.textHint,
    fontStyle: "italic",
  },

  // ============================================================
  // REST SYMBOL COMPARISON (for focus card showing all rests)
  // ============================================================
  // Whole rest - hangs below the line
  wholeRestSymbolSmall: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  wholeRestLineSmall: {
    width: 40,
    height: 2,
    backgroundColor: LESSON_COLORS.textHint,
    position: "absolute",
    top: 15,
  },
  wholeRestBlockSmall: {
    width: 16,
    height: 8,
    backgroundColor: LESSON_COLORS.textHint,
    position: "absolute",
    top: 17,
  },
  // Half rest - sits on top of the line
  halfRestSymbolSmall: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  halfRestLineSmall: {
    width: 40,
    height: 2,
    backgroundColor: LESSON_COLORS.textHint,
    position: "absolute",
    top: 20,
  },
  halfRestBlockSmall: {
    width: 16,
    height: 8,
    backgroundColor: LESSON_COLORS.textHint,
    position: "absolute",
    top: 12,
  },
  // Quarter rest - squiggly symbol
  quarterRestSymbolSmall: {
    fontSize: 36,
    color: LESSON_COLORS.accent,
    height: 40,
    lineHeight: 40,
  },

  // ============================================================
  // INSTRUCTION SECTION
  // ============================================================
  instructionSection: {
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: LESSON_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 18,
    color: LESSON_COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 8,
  },
  instructionEmoji: {
    fontSize: 32,
    textAlign: "center",
    marginVertical: 8,
  },
  instructionHint: {
    fontSize: 14,
    color: LESSON_COLORS.textHint,
    textAlign: "center",
    marginTop: 8,
  },

  // ============================================================
  // BEAT INDICATORS
  // ============================================================
  beatIndicator: {
    alignItems: "center",
    marginVertical: 32,
  },
  beatVisualContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  beatCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderWidth: 2,
    borderColor: LESSON_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  beatCircleActive: {
    backgroundColor: LESSON_COLORS.beatActive,
    borderColor: LESSON_COLORS.beatActive,
  },
  beatCircleRest: {
    backgroundColor: LESSON_COLORS.beatInactive,
    borderStyle: "dashed",
  },
  beatCircleRestActive: {
    borderColor: LESSON_COLORS.accent,
  },
  beatNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: LESSON_COLORS.textPrimary,
  },
  beatRestText: {
    fontSize: 24,
    color: LESSON_COLORS.textHint,
  },
  // Beat labels below the row
  beatLabels: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  beatLabelItem: {
    width: 48,
    alignItems: "center",
  },
  beatLabel: {
    fontSize: 14,
    color: LESSON_COLORS.textHint,
  },

  // ============================================================
  // COUNTDOWN / STATUS
  // ============================================================
  countdownContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  countdownText: {
    fontSize: 64,
    fontWeight: "700",
    color: LESSON_COLORS.accent,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "600",
    color: LESSON_COLORS.textSecondary,
    textAlign: "center",
  },
  playingText: {
    fontSize: 18,
    color: LESSON_COLORS.textSecondary,
  },
  listeningText: {
    fontSize: 18,
    color: LESSON_COLORS.success,
  },

  // ============================================================
  // PATTERN HINT (shows note/rest pattern)
  // ============================================================
  patternHint: {
    marginTop: 12,
    alignItems: "center",
  },
  patternHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  patternHintSpacer: {
    width: 60,
    marginRight: 12,
  },
  patternHintNote: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LESSON_COLORS.accent,
  },
  patternHintRest: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderWidth: 2,
    borderColor: LESSON_COLORS.textHint,
    borderStyle: "dashed",
    position: "relative",
  },
  patternHintRestText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 28,
  },
  patternHintSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: LESSON_COLORS.accentDark,
    marginHorizontal: 4,
  },
  patternHintText: {
    fontSize: 18,
    color: LESSON_COLORS.accent,
  },
  patternHintSubtext: {
    fontSize: 12,
    color: LESSON_COLORS.textHint,
    marginTop: 4,
  },

  // ============================================================
  // SUBDIVISION DOTS (for eighth note feeling)
  // ============================================================
  subdivisionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderWidth: 1,
    borderColor: LESSON_COLORS.border,
    marginHorizontal: 4,
    alignSelf: "center",
  },
  subdivisionDotActive: {
    backgroundColor: LESSON_COLORS.textHint,
    borderColor: LESSON_COLORS.textHint,
  },

  // ============================================================
  // VOLUME / VISUALIZER
  // ============================================================
  volumeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  hearingText: {
    fontSize: 16,
    color: LESSON_COLORS.accent,
    marginTop: 12,
  },

  // ============================================================
  // NOTATION DISPLAY
  // ============================================================
  notationContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  showNotationButton: {
    padding: 12,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LESSON_COLORS.border,
  },
  showNotationText: {
    fontSize: 14,
    color: LESSON_COLORS.accent,
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 200,
    overflow: "visible",
  },
  notationWrapperRelative: {
    position: "relative",
  },
  hideNotationButton: {
    padding: 12,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LESSON_COLORS.border,
  },
  hideNotationText: {
    fontSize: 14,
    color: LESSON_COLORS.accent,
  },
  highlightOverlay: {
    position: "absolute",
    top: 40,
    backgroundColor: "rgba(76, 175, 80, 0.25)",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.6)",
    pointerEvents: "none",
  },

  // ============================================================
  // IMAGINE PHASE
  // ============================================================
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
  },
  imaginePatternRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  imaginePatternNote: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LESSON_COLORS.accent,
  },
  imaginePatternRest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LESSON_COLORS.beatInactive,
    borderWidth: 2,
    borderColor: LESSON_COLORS.textHint,
    borderStyle: "dashed",
    position: "relative",
  },
  imaginePatternRestText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 24,
    textAlign: "center",
    lineHeight: 36,
  },
  imagineEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  imagineHint: {
    fontSize: 20,
    color: LESSON_COLORS.accent,
    fontWeight: "600",
  },

  // ============================================================
  // FEEDBACK
  // ============================================================
  successText: {
    fontSize: 24,
    color: LESSON_COLORS.success,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 16,
  },
  feedbackError: {
    fontSize: 18,
    color: LESSON_COLORS.error,
    textAlign: "center",
    marginVertical: 16,
  },

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================
  resultsSummary: {
    backgroundColor: LESSON_COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 18,
    color: LESSON_COLORS.textSecondary,
  },
  resultSuccess: {
    fontSize: 24,
    color: LESSON_COLORS.success,
    fontWeight: "700",
  },
  resultFail: {
    fontSize: 24,
    color: LESSON_COLORS.error,
    fontWeight: "700",
  },
  progressText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginVertical: 12,
  },

  // ============================================================
  // REMINDER BOX
  // ============================================================
  reminderBox: {
    backgroundColor: LESSON_COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: LESSON_COLORS.accent,
  },
  reminderTitle: {
    fontSize: 14,
    color: LESSON_COLORS.accent,
    fontWeight: "600",
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 16,
    color: LESSON_COLORS.textSecondary,
    lineHeight: 24,
  },

  // ============================================================
  // SUCCESS SCREEN
  // ============================================================
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: LESSON_COLORS.success,
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 18,
    color: LESSON_COLORS.textSecondary,
    textAlign: "center",
  },

  // ============================================================
  // BUTTONS
  // ============================================================
  fixedBottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: LESSON_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: LESSON_COLORS.border,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    backgroundColor: LESSON_COLORS.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    alignSelf: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: LESSON_COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    alignSelf: "center",
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: LESSON_COLORS.background,
  },
  tertiaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: LESSON_COLORS.textHint,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // ============================================================
  // MODAL
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: LESSON_COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    maxWidth: 340,
    borderWidth: 1,
    borderColor: LESSON_COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: LESSON_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: LESSON_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: LESSON_COLORS.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: LESSON_COLORS.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: LESSON_COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default lessonExerciseStyles;
