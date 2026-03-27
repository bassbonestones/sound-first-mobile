/**
 * MaterialExplorer-specific styles
 *
 * Styles used exclusively by the MaterialExplorer tab and its components:
 * - Material ingestion/upload
 * - File picker
 * - Analysis preview
 * - Soft gate grids
 * - Unified score display
 */
import { StyleSheet, Platform } from "react-native";

const materialExplorerStyles = StyleSheet.create({
  // ==========================================================================
  // Material Ingestion Action Bar
  // ==========================================================================
  actionBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  statusBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  statusError: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  statusText: {
    fontSize: 13,
    color: "#333",
  },
  // Action button row for side-by-side buttons
  actionButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  // ==========================================================================
  // Upload Button & Modal Styles
  // ==========================================================================
  uploadButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  uploadModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  uploadModalContent: {
    flex: 1,
    padding: 16,
  },
  uploadSelectStep: {
    flex: 1,
  },
  uploadPreviewStep: {
    flex: 1,
  },
  uploadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filePickerButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
  },
  filePickerButtonText: {
    fontSize: 14,
    color: "#666",
  },
  xmlContentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    minHeight: 150,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
  },
  uploadInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  uploadError: {
    color: "#f44336",
    fontSize: 13,
    marginTop: 12,
    padding: 10,
    backgroundColor: "#ffebee",
    borderRadius: 6,
  },
  analyzeButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // ==========================================================================
  // Preview Section Styles
  // ==========================================================================
  previewSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  previewSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 10,
  },
  previewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  toggleCapabilitiesButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
  },
  toggleCapabilitiesText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "500",
  },
  domainSection: {
    marginBottom: 12,
  },
  domainHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: "#e8f4fc",
    borderRadius: 6,
    marginBottom: 6,
  },
  domainHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1565C0",
    textTransform: "capitalize",
  },
  moreCapabilitiesButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  // ==========================================================================
  // Soft Gate Grid Styles
  // ==========================================================================
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

  // ==========================================================================
  // Profile Toggle & Details
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
  // Help Modal Styles
  // ==========================================================================
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
  // Capability Tags
  // ==========================================================================
  capabilityTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  capabilityTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capabilityTagText: {
    fontSize: 12,
    color: "#1976D2",
  },
  moreCapabilities: {
    fontSize: 12,
    color: "#666",
    alignSelf: "center",
    marginLeft: 8,
  },

  // ==========================================================================
  // Upload Actions
  // ==========================================================================
  uploadActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default materialExplorerStyles;
