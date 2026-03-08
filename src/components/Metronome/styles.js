/**
 * Metronome Styles
 *
 * Extracted StyleSheet for Metronome component to reduce inline styles.
 */

import { StyleSheet, Platform } from "react-native";

// Colors
export const colors = {
  gold: "#FFD700",
  goldDark: "#bfa76a",
  goldMuted: "#5a4a3a",
  background: "#1a1410",
  surface: "#3b2c1a",
  surfaceDark: "#2d232e",
  purple: "#9C27B0",
  accent: "#FF9800",
  textMuted: "#666",
  textLight: "#fff",
  textDark: "#3b2c1a",
};

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    padding: 20,
  },

  // BPM Display
  bpmContainer: {
    marginBottom: 16,
  },
  bpmText: {
    color: colors.gold,
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  bpmLabel: {
    color: colors.goldDark,
    fontSize: 14,
    textAlign: "center",
  },

  // Selector buttons row
  selectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },

  // Time signature button
  timeSigButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  timeSigButtonActive: {
    backgroundColor: colors.gold,
  },
  timeSigButtonInactive: {
    backgroundColor: colors.surface,
  },
  timeSigButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  timeSigButtonTextActive: {
    color: colors.textDark,
  },
  timeSigButtonTextInactive: {
    color: colors.gold,
  },

  // Subdivision button
  subdivisionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  subdivisionButtonActive: {
    backgroundColor: colors.purple,
  },
  subdivisionButtonInactive: {
    backgroundColor: colors.surfaceDark,
  },
  subdivisionButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  subdivisionButtonTextActive: {
    color: colors.textLight,
  },
  subdivisionButtonTextInactive: {
    color: colors.purple,
  },

  // Picker panels
  pickerPanel: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    maxWidth: 340,
  },
  pickerTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  pickerTitleGold: {
    color: colors.gold,
  },
  pickerTitlePurple: {
    color: colors.purple,
  },
  pickerLabel: {
    color: colors.goldDark,
    fontSize: 12,
    marginBottom: 8,
  },
  pickerNote: {
    color: "#888",
    fontSize: 11,
    marginBottom: 8,
    fontStyle: "italic",
  },

  // Stepper controls
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButton: {
    backgroundColor: colors.surface,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  stepperButtonText: {
    color: colors.gold,
    fontSize: 20,
  },
  stepperValue: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: "bold",
    marginHorizontal: 24,
    minWidth: 50,
    textAlign: "center",
  },

  // Note value grid
  noteValueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  noteValueButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
    minWidth: 50,
    alignItems: "center",
  },
  noteValueButtonActive: {
    backgroundColor: colors.gold,
  },
  noteValueButtonInactive: {
    backgroundColor: colors.surface,
  },
  noteValueText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  noteValueTextActive: {
    color: colors.textDark,
  },
  noteValueTextInactive: {
    color: colors.gold,
  },
  noteValueLabel: {
    fontSize: 9,
  },
  noteValueLabelActive: {
    color: colors.goldMuted,
  },
  noteValueLabelInactive: {
    color: colors.textMuted,
  },

  // Done button
  doneButton: {
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  doneButtonGold: {
    backgroundColor: colors.gold,
  },
  doneButtonPurple: {
    backgroundColor: colors.purple,
  },
  doneButtonText: {
    fontWeight: "bold",
  },
  doneButtonTextDark: {
    color: colors.textDark,
  },
  doneButtonTextLight: {
    color: colors.textLight,
  },

  // Subdivision list item
  subdivisionItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  subdivisionItemActive: {
    backgroundColor: colors.purple,
  },
  subdivisionItemInactive: {
    backgroundColor: colors.surface,
  },
  subdivisionItemContent: {
    flex: 1,
  },
  subdivisionItemTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  subdivisionItemTitleActive: {
    color: colors.textLight,
  },
  subdivisionItemTitleInactive: {
    color: colors.goldDark,
  },
  subdivisionItemDesc: {
    fontSize: 11,
  },
  subdivisionItemDescActive: {
    color: "#ddd",
  },
  subdivisionItemDescInactive: {
    color: colors.textMuted,
  },
  subdivisionCheckmark: {
    color: colors.textLight,
    fontSize: 16,
  },

  // Beat indicators
  beatIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    maxWidth: 320,
  },
  beatDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    margin: 4,
    borderWidth: 2,
  },
  beatDotActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    transform: [{ scale: 1.2 }],
  },
  beatDotActiveAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  beatDotInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.gold,
    transform: [{ scale: 1 }],
  },
  beatDotInactiveAccent: {
    borderColor: colors.accent,
  },

  // Subdivision indicators
  subdivisionIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: -10,
  },
  subdivisionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  subdivisionDotActive: {
    backgroundColor: colors.purple,
  },
  subdivisionDotInactive: {
    backgroundColor: colors.surface,
  },

  // BPM controls row
  bpmControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bpmButtonLarge: {
    backgroundColor: colors.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  bpmButtonSmall: {
    backgroundColor: colors.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  bpmButtonLargeText: {
    color: colors.gold,
    fontSize: 24,
  },
  bpmButtonSmallText: {
    color: colors.goldDark,
    fontSize: 18,
  },

  // Slider
  sliderContainer: {
    width: "100%",
    maxWidth: 300,
    marginBottom: 16,
  },

  // Play button
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.gold,
    marginBottom: 20,
  },
  playButtonActive: {
    backgroundColor: colors.gold,
  },
  playButtonInactive: {
    backgroundColor: colors.surface,
  },
  playButtonText: {
    fontSize: 32,
  },

  // Mute button
  muteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  muteButtonMuted: {
    backgroundColor: "#555",
  },
  muteButtonUnmuted: {
    backgroundColor: "#333",
  },
  muteButtonText: {
    fontSize: 18,
  },

  // Volume modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeRow: {
    marginBottom: 24,
  },
  volumeLabel: {
    color: colors.goldDark,
    fontSize: 14,
    marginBottom: 12,
  },
  volumeValue: {
    color: colors.gold,
    fontWeight: "bold",
  },
});

// Compact metronome styles
export const compactStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  bpmText: {
    color: colors.gold,
    fontWeight: "bold",
    marginRight: 8,
  },
  beatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  beatDotActive: {
    backgroundColor: colors.gold,
  },
  beatDotInactive: {
    backgroundColor: colors.surface,
  },

  // Main component container
  mainContainer: {
    alignItems: "center",
    padding: 16,
    position: "relative",
  },

  // Mute button
  muteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  muteButtonText: {
    fontSize: 18,
  },

  // Subdivision picker
  subdivisionScrollView: {
    maxHeight: 250,
  },
  subdivisionOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  subdivisionOptionActive: {
    backgroundColor: colors.purple,
  },
  subdivisionOptionInactive: {
    backgroundColor: colors.surface,
  },
  subdivisionOptionContent: {
    flex: 1,
  },
  subdivisionOptionTitle: {
    fontWeight: "bold",
    fontSize: 14,
  },
  subdivisionOptionTitleActive: {
    color: colors.textLight,
  },
  subdivisionOptionTitleInactive: {
    color: colors.goldDark,
  },
  subdivisionOptionDesc: {
    fontSize: 11,
  },
  subdivisionOptionDescActive: {
    color: "#ddd",
  },
  subdivisionOptionDescInactive: {
    color: colors.textMuted,
  },
  subdivisionCheckmark: {
    color: colors.textLight,
    fontSize: 16,
  },

  // Done buttons
  doneButtonPurple: {
    backgroundColor: colors.purple,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  doneButtonGold: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  doneButtonTextLight: {
    color: colors.textLight,
    fontWeight: "bold",
  },
  doneButtonTextDark: {
    color: colors.textDark,
    fontWeight: "bold",
  },

  // Subdivision indicators
  subIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: -10,
  },
  subIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  subIndicatorDotActive: {
    backgroundColor: colors.purple,
  },
  subIndicatorDotInactive: {
    backgroundColor: colors.surface,
  },

  // BPM controls
  bpmControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bpmButtonLarge: {
    backgroundColor: colors.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gold,
  },
  bpmButtonLargeText: {
    color: colors.gold,
    fontSize: 24,
  },
  bpmButtonSmall: {
    backgroundColor: colors.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.goldMuted,
  },
  bpmButtonSmallText: {
    color: colors.goldDark,
    fontSize: 18,
  },

  // Play buttons row
  playButtonsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  playButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginRight: 12,
  },
  playButtonStart: {
    backgroundColor: "#27ae60",
  },
  playButtonStop: {
    backgroundColor: "#c0392b",
  },
  playButtonText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 16,
  },
  tapButton: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  tapButtonText: {
    color: colors.gold,
    fontWeight: "bold",
    fontSize: 16,
  },

  // Presets row
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    margin: 4,
  },
  presetButtonActive: {
    backgroundColor: colors.gold,
  },
  presetButtonInactive: {
    backgroundColor: colors.surfaceDark,
  },
  presetButtonText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  presetButtonTextActive: {
    color: colors.textDark,
  },
  presetButtonTextInactive: {
    color: colors.goldDark,
  },

  // Audio warning
  audioWarning: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 12,
    textAlign: "center",
  },

  // Volume modal styles
  volumeModalTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeSliderRow: {
    marginBottom: 20,
  },
  volumeSliderRowLast: {
    marginBottom: 24,
  },
  volumeLabelPurple: {
    color: colors.purple,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeLabelCyan: {
    color: "#00BCD4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  volumeModalDoneButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  volumeModalDoneText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Compact metronome styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactBpmText: {
    color: colors.gold,
    fontWeight: "bold",
    marginRight: 8,
  },
  compactBeatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.gold,
  },
});

export default styles;
