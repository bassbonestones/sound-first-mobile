/**
 * PitchDrone Styles
 *
 * Extracted StyleSheet for PitchDrone component to reduce inline styles.
 */

import { StyleSheet, Platform } from "react-native";

// Colors
export const colors = {
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

export const styles = StyleSheet.create({
  // Container
  container: {
    alignItems: "center",
    padding: 16,
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
    marginBottom: 16,
  },
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
    width: 52,
    height: 52,
    margin: 4,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
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
  },
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

  // Note grid styles
  noteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 340,
  },
  noteButton: {
    width: 72,
    height: 56,
    margin: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceDark,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
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
    ...Platform.select({
      web: { textShadow: "1px 1px 2px #000" },
      default: {
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  noteLabelInactive: {
    color: colors.gold,
  },
  noteOctaveLabel: {
    color: colors.textLight,
    fontSize: 10,
    textAlign: "center",
    ...Platform.select({
      web: { textShadow: "1px 1px 2px #000" },
      default: {
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },

  // Active drones summary
  activeDronesSummary: {
    marginTop: 12,
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
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginRight: 8,
  },

  // Volume modal
  volumeModalTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeRow: {
    marginBottom: 20,
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
});

export default styles;
