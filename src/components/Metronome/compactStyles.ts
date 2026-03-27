/**
 * Metronome Compact Styles
 *
 * Extracted StyleSheet for compact Metronome component variant.
 * Used for smaller, streamlined metronome instances.
 */

import { StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";
import { colors } from "./metronomeColors";

// Compact metronome styles interface
interface CompactStyles {
  container: ViewStyle;
  bpmText: TextStyle;
  beatDot: ViewStyle;
  beatDotActive: ViewStyle;
  beatDotInactive: ViewStyle;
  mainContainer: ViewStyle;
  muteButton: ViewStyle;
  muteButtonText: TextStyle;
  subdivisionScrollView: ViewStyle;
  subdivisionOption: ViewStyle;
  subdivisionOptionActive: ViewStyle;
  subdivisionOptionInactive: ViewStyle;
  subdivisionOptionContent: ViewStyle;
  subdivisionOptionTitle: TextStyle;
  subdivisionOptionTitleActive: TextStyle;
  subdivisionOptionTitleInactive: TextStyle;
  subdivisionOptionDesc: TextStyle;
  subdivisionOptionDescActive: TextStyle;
  subdivisionOptionDescInactive: TextStyle;
  subdivisionCheckmark: TextStyle;
  doneButtonPurple: ViewStyle;
  doneButtonGold: ViewStyle;
  doneButtonTextLight: TextStyle;
  doneButtonTextDark: TextStyle;
  subIndicatorRow: ViewStyle;
  subIndicatorDot: ViewStyle;
  subIndicatorDotActive: ViewStyle;
  subIndicatorDotInactive: ViewStyle;
  bpmControlsRow: ViewStyle;
  bpmButtonLarge: ViewStyle;
  bpmButtonLargeText: TextStyle;
  bpmButtonSmall: ViewStyle;
  bpmButtonSmallText: TextStyle;
  playButtonsRow: ViewStyle;
  playButton: ViewStyle;
  playButtonStart: ViewStyle;
  playButtonStop: ViewStyle;
  playButtonText: TextStyle;
  tapButton: ViewStyle;
  tapButtonText: TextStyle;
  presetsContainer: ViewStyle;
  presetsRow: ViewStyle;
  presetButton: ViewStyle;
  presetButtonActive: ViewStyle;
  presetButtonInactive: ViewStyle;
  presetButtonText: TextStyle;
  presetButtonTextActive: TextStyle;
  presetButtonTextInactive: TextStyle;
  audioWarning: TextStyle;
  volumeModalTitle: TextStyle;
  volumeSliderRow: ViewStyle;
  volumeSliderRowLast: ViewStyle;
  volumeLabelPurple: TextStyle;
  volumeLabelCyan: TextStyle;
  slider: ViewStyle;
  volumeModalDoneButton: ViewStyle;
  volumeModalDoneText: TextStyle;
  timeSigPickerPanel: ViewStyle;
  beatsPerMeasureSection: ViewStyle;
  timeSigDoneButton: ViewStyle;
  timeSigDoneButtonText: TextStyle;
  subdivisionPickerPanel: ViewStyle;
  subdivisionPickerTitle: TextStyle;
  beatIndicatorRow: ViewStyle;
  beatDotActiveAccent: ViewStyle;
  beatDotInactiveAccent: ViewStyle;
  volumeModalOverlay: ViewStyle;
  volumeModalContent: ViewStyle;
  volumeModalContentShadow: ViewStyle;
  compactContainer: ViewStyle;
  compactBpmText: TextStyle;
  compactBeatDot: ViewStyle;
}

export const compactStyles = StyleSheet.create<CompactStyles>({
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
    padding: 12,
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
    alignItems: "center",
    marginTop: 8,
  },
  playButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 18,
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  tapButton: {
    backgroundColor: colors.surface,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -4,
  },
  tapButtonText: {
    color: colors.gold,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },

  // Presets
  presetsContainer: {
    alignItems: "center",
    width: "100%",
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  presetButton: {
    paddingVertical: 8,
    width: 50,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: "center",
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

  // Time signature picker panel
  timeSigPickerPanel: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    maxWidth: 340,
  },
  beatsPerMeasureSection: {
    marginBottom: 16,
  },
  timeSigDoneButton: {
    backgroundColor: colors.gold,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  timeSigDoneButtonText: {
    color: colors.textDark,
    fontWeight: "bold",
  },

  // Subdivision picker panel
  subdivisionPickerPanel: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    maxWidth: 340,
  },
  subdivisionPickerTitle: {
    color: colors.purple,
    fontWeight: "bold",
    marginBottom: 8,
  },

  // Beat indicator row
  beatIndicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    maxWidth: 320,
  },
  beatDotActiveAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    transform: [{ scale: 1.2 }],
  },
  beatDotInactiveAccent: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    transform: [{ scale: 1 }],
  },

  // Volume modal
  volumeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  volumeModalContent: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 16,
    padding: 24,
    width: 300,
  },
  volumeModalContentShadow: {
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.5)" } as ViewStyle,
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
      } as ViewStyle,
    }),
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
