/**
 * Styles for RangeExpansionExercise
 * Extracted for maintainability - Day 0 warm theme styling
 */
import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  // Container - Day 0 warm theme
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#1a1410",
  },

  // Progress bar - Day 0 style dots
  progressBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b2c1a",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  progressDotActive: {
    backgroundColor: "#FFD700",
    transform: [{ scale: 1.3 }],
  },
  progressDotComplete: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },

  // Stage title - Day 0 style
  stageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },

  // Note display - large prominent note
  noteDisplay: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#FFD700",
    marginVertical: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 16,
    textAlign: "center",
  },

  // Focus cards - Day 0 style
  focusCard: {
    backgroundColor: "#2a1f15",
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: "100%",
    maxWidth: 400,
  },
  focusCardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
    textAlign: "center",
  },
  focusCardDescription: {
    fontSize: 16,
    color: "#fffbe6",
    marginBottom: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  focusCardCue: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Staff container
  staffContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
  },
  staffContainerCompact: {
    marginVertical: 8,
  },
  staffPlaceholder: {
    alignItems: "center",
    padding: 20,
  },
  staffNoteText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFD700",
  },
  staffLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 20,
  },

  // Notation toggle styles
  notationToggle: {
    width: "100%",
    alignItems: "center",
    marginVertical: 16,
  },
  notationToggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    backgroundColor: "transparent",
  },
  notationToggleText: {
    color: "#FFD700",
    fontSize: 16,
  },
  notationToggleContainer: {
    width: "100%",
    alignItems: "center",
  },
  notationModeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  notationModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3b2c1a",
    backgroundColor: "#2a1f15",
  },
  notationModeButtonActive: {
    borderColor: "#FFD700",
    backgroundColor: "#3b2c1a",
  },
  notationModeText: {
    color: "#888",
    fontSize: 14,
  },
  notationModeTextActive: {
    color: "#FFD700",
    fontWeight: "600",
  },
  notationHideButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  notationHideText: {
    color: "#888",
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // Pattern display
  patternBox: {
    backgroundColor: "#2a1f15",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  patternSolfege: {
    fontSize: 20,
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
  patternSolfegeLarge: {
    fontSize: 28,
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
    marginVertical: 12,
  },
  patternDesc: {
    fontSize: 14,
    color: "#a09080",
    textAlign: "center",
  },

  // Instruction text
  instruction: {
    fontSize: 18,
    color: "#fffbe6",
    textAlign: "center",
    lineHeight: 28,
    marginVertical: 16,
    paddingHorizontal: 10,
  },

  hint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },

  // Progress text
  progressText: {
    fontSize: 16,
    color: "#a09080",
    textAlign: "center",
    marginVertical: 8,
  },

  // Buttons - Day 0 style
  fixedBottomButtons: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#3b2c1a",
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 8,
    minWidth: 200,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginVertical: 8,
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },

  // Feedback text
  successText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
    marginVertical: 8,
  },
  feedbackError: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginVertical: 8,
  },
  hearingText: {
    fontSize: 20,
    color: "#FFD700",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
  },

  // Results summary - Day 0 style
  resultSummary: {
    backgroundColor: "#2a1f15",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: 300,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  resultLabel: {
    fontSize: 16,
    color: "#fffbe6",
  },
  resultSuccess: {
    fontSize: 20,
    color: "#4CAF50",
  },
  resultFail: {
    fontSize: 20,
    color: "#ff6b6b",
  },

  // Success screen
  successTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 16,
    textAlign: "center",
  },
  successNote: {
    fontSize: 20,
    color: "#fffbe6",
    marginBottom: 20,
    textAlign: "center",
  },

  // Error
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
  },
});

export default styles;
