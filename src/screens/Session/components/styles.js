/**
 * Session Components Styles
 *
 * Shared StyleSheet for all Session component files
 */

import { StyleSheet, Platform } from "react-native";

export const colors = {
  // Background colors
  backdrop: "rgba(0,0,0,0.85)",
  modalBg: "#2a2a4a",
  cardBg: "#2a2a4a",
  focusCardBg: "#3b2c1a",
  inputBg: "#1a1a2e",
  itemBg: "#222",
  itemActiveBg: "#3a3a5a",
  itemCompletedBg: "#2d3d2d",

  // Brand colors
  gold: "#FFD700",
  metronome: "#9C27B0",
  drone: "#00BCD4",
  success: "#4CAF50",
  muted: "#ff6b6b",

  // Border colors
  border: "#4a4a6a",
  borderLight: "#555",
  borderDark: "#444",

  // Text colors
  textPrimary: "#fff",
  textSecondary: "#ddd",
  textMuted: "#888",
  textDisabled: "#aaa",
  textDark: "#1a1a2e",
};

export const styles = StyleSheet.create({
  // Modal backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Modal container
  modalContainer: {
    backgroundColor: colors.modalBg,
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  modalContainerSmall: {
    backgroundColor: colors.modalBg,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  volumeModalContainer: {
    backgroundColor: colors.modalBg,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },

  // Modal titles
  modalTitle: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalTitleSmall: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeModalTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },

  // Rating row
  ratingRow: {
    flexDirection: "row",
    marginVertical: 12,
    justifyContent: "space-around",
    width: "100%",
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  ratingButtonSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  ratingButtonText: {
    color: colors.textDisabled,
    fontSize: 20,
    fontWeight: "bold",
  },
  ratingButtonTextSelected: {
    color: colors.textDark,
  },

  // Fatigue emoji row
  fatigueRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  fatigueButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    borderWidth: 0,
    borderColor: colors.gold,
  },
  fatigueButtonSelected: {
    backgroundColor: "#333",
    borderWidth: 1,
  },
  fatigueEmoji: {
    fontSize: 24,
  },

  // Text input
  textInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    color: colors.textPrimary,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  // Button row
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Action buttons
  skipButton: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  extendButton: {
    flex: 1,
    backgroundColor: "#4a4a6a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 8,
  },
  extendButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  submitButton: {
    flex: 1.5,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "bold",
  },

  // End practice link
  endPracticeLink: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  endPracticeLinkText: {
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: "underline",
  },

  // Close/Done button
  doneButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneButtonText: {
    color: colors.textDark,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Volume slider section
  volumeSection: {
    marginBottom: 24,
  },
  volumeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeLabelMetronome: {
    color: colors.metronome,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeLabelDrone: {
    color: colors.drone,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },

  // Card container
  cardContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    width: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContainerLarge: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    width: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Card titles
  cardTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  cardTitleLarge: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },

  // Focus card specific
  focusCardContainer: {
    backgroundColor: colors.focusCardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    width: 320,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  focusCardCategory: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  focusCardCategoryText: {
    color: colors.focusCardBg,
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  focusCardTitle: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  focusCardCue: {
    backgroundColor: "#4a3a2a",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  focusCardCueText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
  focusCardInstruction: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  // Material card
  materialKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  materialKeyLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  materialKeyValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Audio player card
  audioPlayerCard: {
    width: 320,
    marginBottom: 18,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Notation display
  notationDisplay: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },

  // Tools row
  toolsRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: 320,
    marginBottom: 18,
  },

  // Toggle button
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#333",
    borderColor: colors.borderLight,
    marginRight: 10,
  },
  toggleButtonRight: {
    marginRight: 0,
    marginLeft: 10,
  },
  toggleButtonMetronomeActive: {
    backgroundColor: colors.metronome,
    borderColor: colors.metronome,
  },
  toggleButtonDroneActive: {
    backgroundColor: colors.drone,
    borderColor: colors.drone,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleButtonTextActive: {
    color: colors.textPrimary,
  },

  // Mute button
  muteButton: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  muteButtonActive: {
    backgroundColor: colors.muted,
  },
  muteButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
  },

  // Tool component wrapper
  toolWrapper: {
    width: 320,
    marginBottom: 18,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.metronome,
  },
  toolWrapperDrone: {
    borderColor: colors.drone,
  },

  // Curriculum step item
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: colors.itemBg,
  },
  stepItemDefault: {
    // Using base styles from stepItem
  },
  stepItemActive: {
    backgroundColor: colors.itemActiveBg,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  stepItemCompleted: {
    backgroundColor: colors.itemCompletedBg,
    borderColor: colors.success,
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stepLabelDefault: {
    // Using base styles from stepLabel
  },
  stepLabelActive: {
    color: colors.gold,
    fontWeight: "bold",
  },
  stepLabelCompleted: {
    color: colors.success,
  },
  stepInstruction: {
    color: colors.textDisabled,
    fontSize: 12,
    marginTop: 2,
  },
  stepCheckmark: {
    fontSize: 16,
    color: colors.success,
  },

  // Complete step button
  completeStepButton: {
    backgroundColor: colors.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  completeStepButtonText: {
    color: colors.textDark,
    fontSize: 16,
    fontWeight: "bold",
  },

  // Helper text
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 8,
  },
});

export default styles;
