/**
 * UserProgressionInspector-specific styles
 *
 * Styles used by the UserProgressionInspector tab and SoftGateExplorer:
 * - User picker
 * - Soft gate state display
 * - Unified score visualization
 * - Reset buttons
 */
import { StyleSheet, Platform } from "react-native";

const userProgressStyles = StyleSheet.create({
  // ==========================================================================
  // User Picker Styles
  // ==========================================================================
  userPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginRight: 8,
  },
  userPickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  userPickerButtonText: {
    fontSize: 14,
    color: "#333",
  },
  userPickerArrow: {
    fontSize: 10,
    color: "#666",
  },

  // ==========================================================================
  // Picker Modal Styles
  // ==========================================================================
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerModalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pickerModalList: {
    maxHeight: 400,
  },
  pickerModalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerModalItemSelected: {
    backgroundColor: "#e3f2fd",
  },
  pickerModalItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pickerModalItemSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // ==========================================================================
  // Soft Gate Content Styles
  // ==========================================================================
  softGateContent: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  softGateStateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  softGateStatCell: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 6,
  },
  softGateStatLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  softGateStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  softGateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  softGateCell: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  softGateCellLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  softGateCellValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  softGateLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },

  // ==========================================================================
  // Unified Score Styles
  // ==========================================================================
  unifiedScoreDomain: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  unifiedScoreDomainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  unifiedScoreDomainName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  unifiedScoreSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unifiedScoreLabel: {
    fontSize: 10,
    color: "#666",
  },
  unifiedScoreValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    minWidth: 28,
  },
  unifiedScoreStage: {
    fontSize: 10,
    color: "#1976D2",
    fontWeight: "600",
    marginLeft: 6,
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unifiedScoreFacets: {
    gap: 4,
  },
  unifiedScoreFacet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unifiedScoreFacetName: {
    fontSize: 10,
    color: "#666",
    width: 120,
    textTransform: "capitalize",
  },
  unifiedScoreFacetBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
  },
  unifiedScoreFacetFill: {
    height: "100%",
    backgroundColor: "#1976D2",
    borderRadius: 3,
  },
  unifiedScoreFacetValue: {
    fontSize: 10,
    color: "#666",
    width: 30,
    textAlign: "right",
  },
  unifiedScoreFlags: {
    marginTop: 6,
    gap: 2,
  },
  unifiedScoreFlag: {
    fontSize: 10,
    color: "#e74c3c",
  },
  unifiedScoreInteractionFlags: {
    backgroundColor: "#fff3e0",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  unifiedScoreInteractionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef6c00",
    marginBottom: 4,
  },
  unifiedScoreInteractionFlag: {
    fontSize: 11,
    color: "#333",
  },

  // ==========================================================================
  // Profile Details Styles
  // ==========================================================================
  profileToggle: {
    marginTop: 8,
    paddingVertical: 4,
  },
  profileToggleText: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
  },
  profileDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  profileKey: {
    fontSize: 10,
    color: "#666",
    flex: 1,
  },
  profileValue: {
    fontSize: 10,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "right",
  },

  // ==========================================================================
  // Help Modal Styles
  // ==========================================================================
  helpButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  helpModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: "100%",
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 8,
  },
  helpModalDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
  },
  helpModalSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 8,
    marginBottom: 4,
  },
  helpModalStage: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    marginBottom: 2,
    lineHeight: 18,
  },
  helpModalCalc: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginTop: 4,
    lineHeight: 18,
  },
  helpModalClose: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: "#1976D2",
    borderRadius: 8,
    alignItems: "center",
  },
  helpModalCloseText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // ==========================================================================
  // Reset Button Styles
  // ==========================================================================
  resetAllButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  resetAllButtonText: {
    color: "#e65100",
    fontWeight: "600",
    fontSize: 14,
  },
  resetDimensionButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  resetDimensionButtonText: {
    color: "#e65100",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteRuleButton: {
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f44336",
  },
  deleteRuleButtonText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default userProgressStyles;
