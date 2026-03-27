/**
 * Fragment2LessonExercise Styles
 *
 * Extracted styles for the Fragment2 lesson exercise component.
 * Warm, earth-toned theme for focused learning.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 200,
  },

  // Pattern Progress
  patternProgress: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#2d241a",
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  patternDot: {
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
  patternDotCompleted: {
    backgroundColor: "#4a7c59",
    borderColor: "#4a7c59",
  },
  patternDotCurrent: {
    borderColor: "#d4a574",
    borderWidth: 3,
  },
  patternDotText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  patternDotTextActive: {
    color: "#fff",
  },

  // Tempo Control
  tempoControl: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#2d241a",
    borderRadius: 12,
  },
  tempoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 12,
  },
  tempoSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempoSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  tempoMin: {
    fontSize: 12,
    color: "#8a7a6a",
  },
  tempoMax: {
    fontSize: 12,
    color: "#8a7a6a",
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  focusCardCategory: {
    fontSize: 12,
    color: "#8a7a6a",
    letterSpacing: 1,
    marginBottom: 8,
  },
  focusCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
  },
  focusCardDescription: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 16,
  },
  focusCardCueBox: {
    backgroundColor: "#1a1410",
    borderRadius: 8,
    padding: 12,
  },
  focusCardCue: {
    fontSize: 14,
    color: "#d4a574",
    fontStyle: "italic",
    textAlign: "center",
  },

  // Focus Card Mini
  focusCardMini: {
    flexDirection: "row",
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  focusCardMiniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  focusCardMiniIconText: {
    fontSize: 20,
  },
  focusCardMiniRight: {
    flex: 1,
  },
  focusCardMiniTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f5e6d3",
  },
  focusCardMiniText: {
    fontSize: 12,
    color: "#8a7a6a",
    marginTop: 2,
  },

  // Pattern Info
  patternInfo: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 24,
    color: "#d4a574",
    fontWeight: "bold",
  },

  // Phase content
  phaseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f5e6d3",
    textAlign: "center",
    marginBottom: 8,
  },
  patternDisplay: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#d4a574",
    textAlign: "center",
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },

  // Beat Indicator
  beatIndicatorContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  countInRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  countInLabel: {
    fontSize: 14,
    color: "#8a7a6a",
    marginRight: 12,
    width: 70,
  },
  countInBeats: {
    flexDirection: "row",
    alignItems: "center",
  },
  countInDot: {
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
  countInDotActive: {
    backgroundColor: "#6b5a4a",
    borderColor: "#6b5a4a",
  },
  countInDotAccent: {
    borderColor: "#8a7a6a",
  },
  countInNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  countInNumberActive: {
    color: "#f5e6d3",
  },
  singRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  singLabel: {
    fontSize: 14,
    color: "#d4a574",
    marginRight: 12,
    width: 70,
    fontWeight: "600",
  },
  beatIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  beatDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2d241a",
    borderWidth: 2,
    borderColor: "#3b2c1a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  beatDotActive: {
    backgroundColor: "#d4a574",
    borderColor: "#d4a574",
  },
  beatDotAccent: {
    borderColor: "#f5e6d3",
  },
  beatDotStop: {
    borderColor: "#e57373",
  },
  beatDotStopActive: {
    backgroundColor: "#e57373",
    borderColor: "#e57373",
  },
  beatNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  beatNumberActive: {
    color: "#1a1410",
  },
  beatNumberStopActive: {
    color: "#fff",
  },
  subdivisionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2d241a",
    borderWidth: 1,
    borderColor: "#3b2c1a",
    marginHorizontal: 4,
    alignSelf: "center",
  },
  subdivisionDotActive: {
    backgroundColor: "#8b7355",
    borderColor: "#8b7355",
  },

  // Volume/visualizer
  volumeContainer: {
    alignItems: "center",
    marginVertical: 24,
  },
  hearingText: {
    fontSize: 16,
    color: "#d4a574",
    marginTop: 12,
  },

  // Drone indicator
  droneIndicator: {
    backgroundColor: "#2d4a3a",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: "center",
  },
  droneText: {
    fontSize: 16,
    color: "#8fd4a4",
    fontWeight: "600",
  },

  // Results
  resultContainer: {
    backgroundColor: "#2d241a",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  resultText: {
    fontSize: 16,
    textAlign: "center",
  },
  resultSuccess: {
    color: "#8fd4a4",
  },
  resultFail: {
    color: "#e5a574",
  },

  // Imagine
  imagineVisual: {
    alignItems: "center",
    marginVertical: 24,
  },
  imagineEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagineHint: {
    fontSize: 16,
    color: "#8a7a6a",
    fontStyle: "italic",
  },

  // Notation
  notationContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  showNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  showNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },
  notationWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 200,
    overflow: "visible",
  },
  hideNotationButton: {
    padding: 12,
    backgroundColor: "#2d241a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  hideNotationText: {
    fontSize: 14,
    color: "#d4a574",
  },

  // Feedback
  feedbackContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  feedbackEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 8,
  },
  feedbackPattern: {
    fontSize: 20,
    color: "#d4a574",
    marginBottom: 4,
  },
  feedbackDescription: {
    fontSize: 18,
    color: "#8a7a6a",
  },
  progressSummary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#2d241a",
    borderRadius: 12,
  },
  progressText: {
    fontSize: 16,
    color: "#c4b5a0",
    textAlign: "center",
  },

  // Success
  successContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8fd4a4",
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    color: "#c4b5a0",
    textAlign: "center",
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: "#8a7a6a",
    textAlign: "center",
  },

  // Buttons
  fixedBottomButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#1a1410",
    borderTopWidth: 1,
    borderTopColor: "#2d241a",
  },
  primaryButton: {
    backgroundColor: "#d4a574",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1410",
  },
  secondaryButton: {
    backgroundColor: "#2d241a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3b2c1a",
  },
  secondaryButtonText: {
    fontSize: 16,
    color: "#d4a574",
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
    color: "#8a7a6a",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d241a",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 32,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f5e6d3",
    marginBottom: 12,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#c4b5a0",
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#1a1410",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#8a7a6a",
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#d4a574",
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1410",
  },

  // Extra styles for inline conversions
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  notationWrapperRelative: {
    position: "relative",
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
});
