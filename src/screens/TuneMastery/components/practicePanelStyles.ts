/**
 * PracticePanel Styles
 *
 * Extracted StyleSheet for the PracticePanel component.
 * Organized by UI section: container, header, content, focus card,
 * tool panels, rating, submit, and volume modal.
 */

import { StyleSheet, Platform } from "react-native";

export const practicePanelStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  // Header
  header: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a4e",
    backgroundColor: "#2a2a3e",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    rowGap: 8,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 80,
  },
  cancelButton: {
    padding: 6,
    marginRight: 4,
  },
  cancelButtonText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
  },
  titleContainer: {
    flexShrink: 1,
    minWidth: 60,
    alignItems: "flex-start",
    marginLeft: 4,
  },
  practiceTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  practiceKey: {
    color: "#FFD700",
    fontSize: 12,
    marginTop: 1,
  },
  headerToolsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  headerToolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3a3a4e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4a4a5e",
  },

  // Tuner button styles - lighter when closed, solid when expanded
  headerToolButtonActive: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    borderColor: "#FFD700",
  },
  headerToolButtonActiveExpanded: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },

  // Metronome button styles - lighter when closed, solid when expanded
  headerToolButtonMetronome: {
    backgroundColor: "rgba(156, 39, 176, 0.3)",
    borderColor: "#9C27B0",
  },
  headerToolButtonMetronomeExpanded: {
    backgroundColor: "#9C27B0",
    borderColor: "#9C27B0",
  },

  // Drone button styles - lighter when closed, solid when expanded
  headerToolButtonDrone: {
    backgroundColor: "rgba(0, 188, 212, 0.3)",
    borderColor: "#00BCD4",
  },
  headerToolButtonDroneExpanded: {
    backgroundColor: "#00BCD4",
    borderColor: "#00BCD4",
  },
  headerToolButtonMuted: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  headerToolEmoji: {
    fontSize: 20,
  },
  headerToolDivider: {
    width: 2,
    height: 28,
    backgroundColor: "#FFD700",
    marginHorizontal: 4,
    borderRadius: 1,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Focus Card
  focusCard: {
    backgroundColor: "#3b2c1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  focusCardCategory: {
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  focusCardName: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    marginBottom: 8,
  },
  focusCardCue: {
    color: "#fffbe6",
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    lineHeight: 22,
  },

  // Tool Panels
  tunerPanelFixed: {
    flex: 1,
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#FFD700",
    overflow: "hidden",
  },
  toolPanelFixed: {
    flex: 1,
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  toolPanelMetronome: {
    backgroundColor: "#1a1410",
    borderColor: "#9C27B0",
  },
  toolPanelDrone: {
    backgroundColor: "#1a1a2a",
    borderColor: "#00BCD4",
  },
  toolPanelCollapsed: {
    flex: 0,
    height: 0,
    margin: 0,
    borderWidth: 0,
    overflow: "hidden",
  },

  // Rating
  ratingSection: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  ratingLabel: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  scoreDisplay: {
    alignItems: "center",
    marginBottom: 4,
  },
  scoreValue: {
    color: "#FFD700",
    fontSize: 40,
    fontWeight: "bold",
  },
  scorePrevious: {
    color: "#666",
    fontSize: 13,
  },
  slider: {
    width: "100%",
    height: 32,
  },
  fineTuneRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  fineTuneButton: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fineTuneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Submit
  submitContainer: {
    padding: 16,
    backgroundColor: "#2a2a3e",
    borderTopWidth: 1,
    borderTopColor: "#3a3a4e",
  },
  submitButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Volume Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  volumeModalContainer: {
    backgroundColor: "#2a2a3e",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  volumeModalTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  volumeSection: {
    marginBottom: 24,
  },
  volumeLabelMetronome: {
    color: "#9C27B0",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeLabelDrone: {
    color: "#00BCD4",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  volumeSlider: {
    width: "100%",
    height: 40,
  },
  volumeDoneButton: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  volumeDoneButtonText: {
    color: "#1a1a2e",
    fontWeight: "bold",
    fontSize: 16,
  },
});
