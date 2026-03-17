/**
 * PitchDrone Styles
 *
 * Extracted StyleSheet for PitchDrone component to reduce inline styles.
 */

import { StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";

// Colors
interface ColorsType {
  gold: string;
  goldDark: string;
  background: string;
  surface: string;
  surfaceDark: string;
  surfaceDisabled: string;
  purple: string;
  green: string;
  border: string;
  textMuted: string;
  textLight: string;
  textDark: string;
}

export const colors: ColorsType = {
  gold: "#FFD700",
  goldDark: "#bfa76a",
  background: "#1a1410",
  surface: "#3b2c1a",
  surfaceDark: "#2d232e",
  surfaceDisabled: "#222",
  purple: "#9C27B0",
  green: "#27ae60",
  border: "#444",
  textMuted: "#666",
  textLight: "#fff",
  textDark: "#1a1a2e",
};

interface PitchDroneStyles {
  // Container
  container: ViewStyle;

  // Header
  title: TextStyle;

  // Mute button
  muteButton: ViewStyle;
  muteButtonMuted: ViewStyle;
  muteButtonUnmuted: ViewStyle;
  muteButtonText: TextStyle;

  // Settings row
  settingsRow: ViewStyle;

  // Temperament toggle
  temperamentContainer: ViewStyle;
  temperamentButtonLeft: ViewStyle;
  temperamentButtonRight: ViewStyle;
  temperamentButtonActive: ViewStyle;
  temperamentButtonInactive: ViewStyle;
  temperamentText: TextStyle;
  temperamentTextActive: TextStyle;
  temperamentTextInactive: TextStyle;

  // Concert A input
  concertAContainer: ViewStyle;
  concertALabel: TextStyle;
  concertAInput: TextStyle;
  concertAUnit: TextStyle;

  // Pitch center selector
  pitchCenterContainer: ViewStyle;
  pitchCenterLabel: TextStyle;
  pitchCenterGrid: ViewStyle;
  pitchCenterButton: ViewStyle;
  pitchCenterButtonActive: ViewStyle;
  pitchCenterButtonInactive: ViewStyle;
  pitchCenterText: TextStyle;
  pitchCenterTextActive: TextStyle;
  pitchCenterTextInactive: TextStyle;

  // Octave selector
  octaveRow: ViewStyle;
  octaveButton: ViewStyle;
  octaveButtonEnabled: ViewStyle;
  octaveButtonDisabled: ViewStyle;
  octaveButtonText: TextStyle;
  octaveButtonTextEnabled: TextStyle;
  octaveButtonTextDisabled: TextStyle;
  octaveDisplay: ViewStyle;
  octaveDisplayText: TextStyle;

  // Sustain & Vibrato buttons
  toggleRow: ViewStyle;
  toggleButton: ViewStyle;
  sustainButtonActive: ViewStyle;
  sustainButtonInactive: ViewStyle;
  vibratoButtonActive: ViewStyle;
  vibratoButtonInactive: ViewStyle;
  toggleButtonText: TextStyle;
  toggleButtonTextActive: TextStyle;
  toggleButtonTextInactive: TextStyle;

  // Note grid
  noteGrid: ViewStyle;
  noteButton: ViewStyle;
  noteButtonActive: ViewStyle;
  noteButtonInactive: ViewStyle;
  noteButtonText: TextStyle;
  noteOctaveIndicator: ViewStyle;
  octaveDot: ViewStyle;
  frequencyLabel: TextStyle;

  // Volume modal
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  volumeRow: ViewStyle;
  volumeLabel: TextStyle;
  volumeValue: TextStyle;
  doneButton: ViewStyle;
  doneButtonText: TextStyle;

  // Aliases
  headerTitle: TextStyle;
  headerRow: ViewStyle;
  temperamentToggle: ViewStyle;
  temperamentButtonText: TextStyle;
  temperamentButtonTextActive: TextStyle;
  temperamentButtonTextInactive: TextStyle;
  concertARow: ViewStyle;

  // Additional note grid styles
  noteLabelWrapper: ViewStyle;
  noteLabel: TextStyle;
  noteLabelActive: TextStyle;
  noteLabelInactive: TextStyle;
  noteOctaveLabel: TextStyle;

  // Active drones summary
  activeDronesSummary: ViewStyle;
  activeDronesText: TextStyle;

  // Legend
  legendContainer: ViewStyle;
  legendLabel: TextStyle;

  // Just intonation
  justIntonationLabel: TextStyle;

  // Vibrato button standalone
  vibratoButtonTextActive: TextStyle;
  vibratoButtonTextInactive: TextStyle;

  // Octave highlight
  octaveHighlightContainer: ViewStyle;
  octaveHighlightSlice: ViewStyle;
  octaveHighlightSliceActive: ViewStyle;
  octaveHighlightSliceQueued: ViewStyle;

  // Legend item
  legendItem: ViewStyle;
  legendColorBox: ViewStyle;
  legendOctaveText: TextStyle;

  // Volume modal overlay
  volumeModalOverlay: ViewStyle;
  volumeModalContent: ViewStyle;
  volumeModalContentShadow: ViewStyle;
  volumeModalTitle: TextStyle;
  volumeRowLast: ViewStyle;
  volumeLabelPurple: TextStyle;
  volumeLabelCyan: TextStyle;
  slider: ViewStyle;

  // Settings summary button (additional styling for PitchDrone)
  settingsSummaryButton: ViewStyle;
}

export const styles = StyleSheet.create<PitchDroneStyles>({
  // Container
  container: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },

  // Header
  title: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
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

  // Settings row
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  // Temperament toggle
  temperamentContainer: {
    flexDirection: "row",
    marginRight: 16,
    marginBottom: 8,
  },
  temperamentButtonLeft: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: colors.purple,
  },
  temperamentButtonRight: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.purple,
  },
  temperamentButtonActive: {
    backgroundColor: colors.purple,
  },
  temperamentButtonInactive: {
    backgroundColor: colors.surfaceDark,
  },
  temperamentText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  temperamentTextActive: {
    color: colors.textLight,
  },
  temperamentTextInactive: {
    color: colors.purple,
  },

  // Concert A input
  concertAContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  concertALabel: {
    color: colors.goldDark,
    fontSize: 12,
    marginRight: 4,
  },
  concertAInput: {
    backgroundColor: colors.surfaceDark,
    color: colors.gold,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  concertAUnit: {
    color: colors.goldDark,
    fontSize: 12,
    marginLeft: 4,
  },

  // Pitch center selector (Just intonation)
  pitchCenterContainer: {
    marginBottom: 12,
  },
  pitchCenterLabel: {
    color: colors.goldDark,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  pitchCenterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  pitchCenterButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    margin: 2,
  },
  pitchCenterButtonActive: {
    backgroundColor: colors.gold,
  },
  pitchCenterButtonInactive: {
    backgroundColor: colors.surfaceDark,
  },
  pitchCenterText: {
    fontSize: 11,
  },
  pitchCenterTextActive: {
    color: colors.textDark,
    fontWeight: "bold",
  },
  pitchCenterTextInactive: {
    color: colors.goldDark,
    fontWeight: "normal",
  },

  // Octave selector
  octaveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  octaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  octaveButtonEnabled: {
    backgroundColor: colors.surface,
    borderColor: colors.gold,
  },
  octaveButtonDisabled: {
    backgroundColor: colors.surfaceDisabled,
    borderColor: colors.border,
  },
  octaveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  octaveButtonTextEnabled: {
    color: colors.gold,
  },
  octaveButtonTextDisabled: {
    color: colors.textMuted,
  },
  octaveDisplay: {
    backgroundColor: colors.surfaceDark,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  octaveDisplayText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Sustain & Vibrato buttons
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  } as ViewStyle,
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
  },
  sustainButtonActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  sustainButtonInactive: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
  },
  vibratoButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  vibratoButtonInactive: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.border,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  toggleButtonTextActive: {
    color: colors.textLight,
  },
  toggleButtonTextInactive: {
    color: colors.goldDark,
  },

  // Note grid
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 340,
  },
  noteButton: {
    width: 72,
    height: 38,
    margin: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  noteButtonActive: {
    borderColor: "transparent",
  },
  noteButtonInactive: {
    borderColor: "#444",
  },
  noteButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  noteOctaveIndicator: {
    flexDirection: "row",
    marginTop: 2,
    gap: 2,
  } as ViewStyle,
  octaveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textLight,
  },
  frequencyLabel: {
    color: colors.textLight,
    fontSize: 8,
    marginTop: 2,
    opacity: 0.9,
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

  // Aliases for component use
  headerTitle: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  temperamentToggle: {
    flexDirection: "row",
    marginRight: 16,
    marginBottom: 8,
  },
  temperamentButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  temperamentButtonTextActive: {
    color: colors.textLight,
  },
  temperamentButtonTextInactive: {
    color: colors.purple,
  },
  concertARow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  // Note label wrapper
  noteLabelWrapper: {
    zIndex: 1,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  noteLabelActive: {
    color: colors.textLight,
    textShadow: "1px 1px 2px #000",
  },
  noteLabelInactive: {
    color: colors.gold,
  },
  noteOctaveLabel: {
    color: colors.textLight,
    fontSize: 10,
    textAlign: "center",
    textShadow: "1px 1px 2px #000",
  },

  // Active drones summary
  activeDronesSummary: {
    marginTop: 6,
  },
  activeDronesText: {
    color: colors.goldDark,
    fontSize: 12,
    textAlign: "center",
  },

  // Legend
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginRight: 8,
  },

  // Just intonation
  justIntonationLabel: {
    color: colors.goldDark,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },

  // Vibrato button text
  vibratoButtonTextActive: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: "bold",
  },
  vibratoButtonTextInactive: {
    color: colors.goldDark,
    fontSize: 14,
    fontWeight: "bold",
  },

  // Octave highlight
  octaveHighlightContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  octaveHighlightSlice: {
    flex: 1,
  },
  octaveHighlightSliceActive: {
    opacity: 0.7,
  },
  octaveHighlightSliceQueued: {
    opacity: 0.3,
  },

  // Legend item
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },
  legendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 2,
  },
  legendOctaveText: {
    color: colors.textMuted,
    fontSize: 10,
  },

  // Volume modal overlay and content
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

  // Volume modal
  volumeModalTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeRowLast: {
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

  // Settings Summary Button (matching Tuner layout)
  settingsSummaryButton: {
    marginBottom: 12,
  },
});

export default styles;
