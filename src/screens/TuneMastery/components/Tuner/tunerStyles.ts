/**
 * Tuner component styles
 *
 * Extracted from Tuner.tsx for maintainability.
 * Contains all StyleSheet definitions for the tuner component.
 */
import { StyleSheet } from "react-native";

export const tunerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
  },
  tunerScrollView: {
    flex: 1,
  },
  tunerScrollContent: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginBottom: 8,
  },

  // Tuner Display
  tunerDisplay: {
    width: "100%",
    alignItems: "center",
  },

  // Needle Mode - Gauge design
  needleContainer: {
    alignItems: "center",
    width: "100%",
  },
  // GAUGE LAYOUT - all elements share pivot at (180, 20) from container bottom
  // Container: 360x180, Pivot: centerX=180, bottomOffset=20
  // SVG draws arcs and gradient, Needle: 115
  gaugeArc: {
    width: 360,
    height: 180,
    position: "relative",
  },
  // SVG container - positioned to align with gauge
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Needle pivot - rotation center at (180, 20)
  // needleRotator is 230px, rotates around center (115px up from its bottom)
  // So position needlePivotBase at bottom: 20-115 = -95 to align rotation center with pivot
  needlePivotBase: {
    position: "absolute",
    bottom: -95, // Shifted so rotator center is at pivot (20px from container bottom)
    left: 174, // 180 - 6 (half of 12px width)
    width: 12,
    alignItems: "center",
  },
  // needleRotator is 2x needle height so center = needle bottom = pivot point
  needleRotator: {
    width: 12,
    height: 230, // 2x needle height (115)
    alignItems: "center",
    justifyContent: "flex-start", // Needle at top, bottom half is empty
  },
  needle: {
    width: 4,
    height: 115, // Almost reaches arc (radius 120)
    borderRadius: 2,
  },
  pivotDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#333",
    borderWidth: 2,
    borderColor: "#666",
    position: "absolute",
    bottom: 107, // At rotation center: 115 - 8 (half of dot height)
  },
  smileyContainer: {
    width: 24,
    height: 24,
    position: "absolute",
    bottom: 103, // At rotation center: 115 - 12 (half of smiley height)
    left: -6, // Center the larger smiley: (24 - 12) / 2 = -6
  },
  noteContainer: {
    alignItems: "center",
    width: "100%",
  },
  noteNameRow: {
    flexDirection: "row",
    height: 44, // Fixed height for note name or mic icon
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  noteRowButtonSpacer: {
    width: 60,
  },
  noteRowSkipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    minHeight: 36,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  noteRowSkipText: {
    color: "#888",
    fontSize: 14,
  },
  noteRowStopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 100, 100, 0.2)",
    borderRadius: 6,
    minHeight: 36,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  noteRowStopText: {
    color: "#FF6B6B",
    fontSize: 14,
  },
  noteName: {
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 16,
  },
  micIcon: {
    fontSize: 36,
    // Note: textShadow is web-only. Using color + scale for glow effect on native.
  },
  // Tappable feedback area (tap to cycle modes)
  feedbackArea: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 0,
    alignItems: "center",
    minHeight: 50,
    alignSelf: "stretch",
  },
  feedbackContent: {
    minHeight: 28,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackPlaceholder: {
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
  },
  feedbackModeName: {
    color: "#9C27B0",
    fontWeight: "600",
    fontStyle: "normal",
  },
  feedbackDots: {
    flexDirection: "row",
    marginTop: 0,
    gap: 6,
  },
  feedbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  feedbackDotActive: {
    backgroundColor: "#9C27B0",
  },
  stabilityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stateTextRow: {
    height: 24, // Fixed height for state text
    justifyContent: "center",
    alignItems: "center",
  },
  centsDisplay: {
    color: "#888",
    fontSize: 14,
  },
  // Phase 1 UX Improvement Styles
  stateText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Fixed height container for guidance text row
  guidanceRow: {
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 16, // Fixed height
  },
  stabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  stabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  biasIndicator: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Fixed height container for bias text row
  biasRow: {
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  guidanceText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // Fixed height container for lock/hold area
  lockHoldRow: {
    height: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  holdProgressContainer: {
    width: 60,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  holdProgressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 2,
  },
  listeningText: {
    color: "#666",
    fontSize: 16,
    fontStyle: "italic",
  },

  // Text Mode
  textContainer: {
    alignItems: "center",
    height: 180, // Fixed height to prevent UI jumping when switching from mic icon to text
    width: "100%",
  },
  textNoteRow: {
    height: 56, // Fixed height for note name or mic icon
    justifyContent: "center",
    alignItems: "center",
  },
  textNote: {
    fontSize: 48,
    fontWeight: "bold",
  },
  textMicIcon: {
    fontSize: 48,
    // Note: textShadow is web-only. Using color + scale for glow effect on native.
  },
  textCentsRow: {
    height: 32, // Fixed height for cents/state text
    justifyContent: "center",
    alignItems: "center",
  },
  textCents: {
    fontSize: 24,
  },
  textFreqRow: {
    height: 20, // Fixed height for frequency
    justifyContent: "center",
    alignItems: "center",
  },
  textFreq: {
    color: "#666",
    fontSize: 14,
  },
  tuningIndicator: {
    color: "#888",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },

  // Settings Summary Button
  settingsSummaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(156, 39, 176, 0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(156, 39, 176, 0.3)",
  },
  settingsSummaryMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  settingsSummaryMetric: {
    color: "#E1BEE7",
    fontSize: 13,
    fontWeight: "500",
    backgroundColor: "rgba(156, 39, 176, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settingsSummaryIcon: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Panel Buttons (Stats/Challenge when collapsed)
  panelToggle: {
    flexDirection: "row",
    gap: 6,
  },
  panelToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    minWidth: 100,
  },
  panelToggleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  // Panel header buttons (reset + close)
  panelHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  panelCloseText: {
    color: "#888",
    fontSize: 20,
    fontWeight: "500",
  },

  // Settings Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#9C27B0",
    borderRadius: 6,
  },
  modalCloseText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBody: {
    padding: 16,
    alignItems: "center",
  },
  modalSection: {
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  modalSectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },

  // Settings Row (kept for backwards compatibility)
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },

  // Temperament Toggle
  temperamentToggle: {
    flexDirection: "row",
  },
  temperamentButtonLeft: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  temperamentButtonRight: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#9C27B0",
  },
  temperamentButtonActive: {
    backgroundColor: "#9C27B0",
  },
  temperamentButtonInactive: {
    backgroundColor: "#2d232e",
  },
  temperamentButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  temperamentButtonTextActive: {
    color: "#fff",
  },
  temperamentButtonTextInactive: {
    color: "#9C27B0",
  },

  // Minor 7th System Toggle (blue themed, 3-part)
  m7SystemContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  m7SystemLabel: {
    color: "#64B5F6",
    fontSize: 11,
    marginBottom: 4,
    fontWeight: "600",
  },
  m7SystemToggle: {
    flexDirection: "row",
  },
  m7ButtonLeft: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  m7ButtonMiddle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonRight: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "#2196F3",
  },
  m7ButtonActive: {
    backgroundColor: "#2196F3",
  },
  m7ButtonInactive: {
    backgroundColor: "#1a2a3e",
  },
  m7ButtonText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  m7ButtonTextActive: {
    color: "#fff",
  },
  m7ButtonTextInactive: {
    color: "#64B5F6",
  },

  // Concert A Input
  concertARow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  concertALabel: {
    color: "#bfa76a",
    fontSize: 12,
    marginRight: 4,
  },
  concertAInput: {
    backgroundColor: "#2d232e",
    color: "#FFD700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 60,
    textAlign: "center",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#444",
  },
  concertAUnit: {
    color: "#bfa76a",
    fontSize: 12,
    marginLeft: 4,
  },

  // Key Selector
  keySelector: {
    alignItems: "center",
    marginTop: 12,
  },
  keySelectorLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  keyGrid: {
    alignItems: "center",
    gap: 6,
  },
  keyRow: {
    flexDirection: "row",
    gap: 6,
  },
  keyOption: {
    width: 68,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  keyOptionActive: {
    backgroundColor: "#4CAF50",
  },
  keyOptionText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  keyOptionTextActive: {
    color: "#FFFFFF",
  },

  // Session Stats Styles (Phase 2A)
  sessionStatsPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    width: "100%",
    minHeight: 137,
  },
  sessionStatsPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionStatsPlaceholderText: {
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
  },
  sessionStatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionStatsTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sessionStatsReset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    minHeight: 36,
    justifyContent: "center",
  },
  sessionStatsResetText: {
    color: "#888",
    fontSize: 13,
  },
  sessionScoresRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  sessionScoreItem: {
    alignItems: "center",
    minWidth: 70,
  },
  sessionScoreValue: {
    color: "#4CAF50",
    fontSize: 24,
    fontWeight: "700",
  },
  sessionScoreLabel: {
    color: "#888",
    fontSize: 11,
    marginTop: 2,
  },
  attackSummaryRow: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  attackSummaryText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },

  // Challenge panel styles (Phase 2A)
  challengePanel: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },
  challengePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  challengeStartContent: {
    alignItems: "center",
    width: "100%",
  },
  challengePanelTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  challengeDifficultyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
    gap: 6,
  },
  challengeDifficultyButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
  },
  challengeDifficultyButtonActive: {
    backgroundColor: "#4CAF50",
  },
  challengeDifficultyText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "500",
  },
  challengeDifficultyTextActive: {
    color: "#FFFFFF",
  },
  challengeStartButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  challengeStartButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  challengeActiveContent: {
    alignItems: "center",
    width: "100%",
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 4,
  },
  challengeTargetLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },
  challengeButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  challengeSkipButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    minHeight: 44,
    justifyContent: "center",
  },
  challengeSkipText: {
    color: "#888",
    fontSize: 14,
  },
  challengeStopButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 100, 100, 0.2)",
    borderRadius: 6,
    minHeight: 44,
    justifyContent: "center",
  },
  challengeStopText: {
    color: "#FF6B6B",
    fontSize: 14,
  },
  challengeTargetDisplay: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  challengeTargetNote: {
    color: "#FFEB3B",
    fontSize: 32,
    fontWeight: "700",
  },
  challengeInstructionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  challengeInstructionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  challengeSuccessText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "600",
  },
  challengeFailedText: {
    color: "#F44336",
    fontSize: 18,
    fontWeight: "600",
  },
  challengeInlineNote: {
    backgroundColor: "rgba(255, 235, 59, 0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  challengeInlineNoteText: {
    color: "#FFEB3B",
    fontSize: 14,
    fontWeight: "700",
  },
  challengeStatusRow: {
    marginBottom: 8,
  },
  challengeStatusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  challengeProgressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  challengeProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  challengeNextButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: "center",
  },
  challengeNextButtonSuccess: {
    backgroundColor: "#4CAF50",
  },
  challengeNextButtonRetry: {
    backgroundColor: "#FF9800",
  },
  challengeNextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  challengeScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  challengeScoreLabel: {
    color: "#888",
    fontSize: 12,
  },
  challengeScoreValue: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 12,
  },
  challengeStreakLabel: {
    color: "#888",
    fontSize: 12,
  },
  challengeStreakValue: {
    color: "#FF9800",
    fontSize: 16,
    fontWeight: "700",
  },
  gaugeScalingContainer: {
    overflow: "visible",
  },
});

export default tunerStyles;
