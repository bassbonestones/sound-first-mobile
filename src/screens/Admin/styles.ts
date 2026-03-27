import { StyleSheet, Platform } from "react-native";
import capabilityExplorerStyles from "./capabilityExplorerStyles";
import materialExplorerStyles from "./materialExplorerStyles";
import userProgressStyles from "./userProgressStyles";

// Re-export domain-specific styles for direct imports
export { capabilityExplorerStyles, materialExplorerStyles, userProgressStyles };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  filterBar: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exportButton: {
    backgroundColor: "#673AB7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exportButtonDisabled: {
    backgroundColor: "#B39DDB",
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  exportStatus: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  exportStatusSuccess: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  exportStatusError: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  exportStatusSuccessText: {
    color: "#2e7d32",
    fontSize: 13,
  },
  exportStatusErrorText: {
    color: "#c62828",
    fontSize: 13,
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
  },
  domainScroll: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 50,
  },
  domainChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#e8e8e8",
    borderRadius: 16,
    marginRight: 8,
  },
  domainChipActive: {
    backgroundColor: "#2196F3",
  },
  domainChipText: {
    fontSize: 13,
    color: "#666",
  },
  domainChipTextActive: {
    color: "#fff",
  },
  resultCount: {
    padding: 12,
    color: "#666",
    fontSize: 13,
    backgroundColor: "#fff",
  },
  // Create button
  createButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
    flexDirection: "row",
    alignItems: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  listItemBadge: {
    backgroundColor: "#e3f2fd",
    color: "#1976D2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: "500",
    overflow: "hidden",
  },
  listItemDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  listItemDetail: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
    marginBottom: 4,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  listItemSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
    fontStyle: "italic",
  },
  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  detailHeader: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 18,
  },
  detailSection: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
  },
  deleteConfirmContainer: {
    backgroundColor: "#fef2f2",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  deleteConfirmText: {
    fontSize: 14,
    color: "#991b1b",
    marginBottom: 12,
    textAlign: "center",
  },
  deleteConfirmButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  deleteConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  deleteConfirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a237e",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 140,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  noDataText: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13,
  },
  prerequisiteItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  graphText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  dependencyItem: {
    fontSize: 12,
    color: "#666",
    marginLeft: 16,
    marginBottom: 2,
  },
  // User Selector
  userSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userSelectorLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  userIdInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    width: 80,
  },
  // User Selection Row
  userSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userSelectLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },
  userIdInputLarge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    width: 100,
    marginRight: 10,
  },
  loadButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  loadButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Sub-tabs
  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  subTabActive: {
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  subTabText: {
    fontSize: 12,
    color: "#666",
  },
  subTabTextActive: {
    color: "#2196F3",
    fontWeight: "600",
  },
  userContent: {
    flex: 1,
  },
  capabilityItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
  },
  promotionItem: {
    fontSize: 13,
    color: "#4CAF50",
    marginBottom: 4,
    marginLeft: 8,
  },
  softGateItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  softGateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  softGateValues: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  softGateValue: {
    fontSize: 12,
    color: "#666",
    marginRight: 12,
  },
  candidateCount: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },
  candidateItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  candidateTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  candidateReason: {
    fontSize: 12,
    color: "#4CAF50",
    marginTop: 4,
  },
  candidateReasonFail: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  // Action buttons
  actionRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: "#333",
  },
  diagnosticsContent: {
    flex: 1,
  },
  // Session diagnostics specific
  targetCapItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  gateItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  filterItem: {
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  filterName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  filterValue: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  candidateRankItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  candidateRankTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  candidateRankReason: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  miniSessionItem: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  miniSessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  miniSessionDetail: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  reasonItem: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  failureList: {
    fontSize: 12,
    color: "#f44336",
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  // Edit button in detail header
  detailHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Detail Modal Styles
  detailModal: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  detailModalHeader: {
    backgroundColor: "#1a237e",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  detailModalContent: {
    padding: 16,
    maxHeight: 400,
  },
  detailModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalEditButton: {
    backgroundColor: "#2196F3",
  },
  modalDeleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },
  confirmText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  confirmButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelConfirmButton: {
    backgroundColor: "#e0e0e0",
  },
  deleteConfirmButton: {
    backgroundColor: "#f44336",
  },
  confirmButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  promptItem: {
    marginBottom: 8,
  },
  promptKey: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  promptValue: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  listItemText: {
    fontSize: 13,
    color: "#333",
    marginBottom: 4,
    marginLeft: 8,
  },
  // Edit Modal Popup (for overlay-style modals)
  editModalPopup: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  editModalPopupContent: {
    padding: 16,
    maxHeight: 450,
  },
  // Edit Modal Styles (for full-screen modals)
  editModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  editModalHeader: {
    backgroundColor: "#1a237e",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  readOnlyNotice: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  readOnlyNoticeText: {
    fontSize: 13,
    color: "#856404",
    lineHeight: 18,
  },
  // Form Field Styles
  formFieldContainer: {
    marginBottom: 16,
  },
  formFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  formFieldInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  formFieldInputError: {
    borderColor: "#f44336",
    borderWidth: 2,
  },
  formFieldError: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
  },
  // Picker (segmented control style)
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerOption: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  pickerOptionText: {
    fontSize: 13,
    color: "#333",
  },
  pickerOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  // Switch row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  // Save / Cancel buttons
  editModalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  editModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  editModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  // Save status
  saveErrorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  saveErrorText: {
    color: "#c62828",
    fontSize: 14,
  },
  saveSuccessContainer: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  saveSuccessText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
  },
  // Prerequisite styles
  prereqHint: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  prereqList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  prereqEmptyText: {
    color: "#999",
    fontSize: 13,
    fontStyle: "italic",
  },
  prereqChip: {
    backgroundColor: "#e3f2fd",
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  prereqChipContent: {
    flexDirection: "column",
    marginRight: 6,
  },
  prereqChipText: {
    fontSize: 13,
    color: "#1976d2",
    fontWeight: "500",
  },
  prereqChipDomain: {
    fontSize: 10,
    color: "#64b5f6",
  },
  prereqChipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#bbdefb",
    alignItems: "center",
    justifyContent: "center",
  },
  prereqChipRemoveText: {
    color: "#1976d2",
    fontWeight: "bold",
    fontSize: 14,
    lineHeight: 16,
  },
  addPrereqButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addPrereqButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  prereqSelectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  prereqSelectorContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    height: "70%",
    padding: 16,
  },
  prereqSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  prereqSelectorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  prereqSelectorSearch: {
    marginBottom: 12,
  },
  prereqSearchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  prereqDomainScroll: {
    minHeight: 40,
    maxHeight: 50,
    marginBottom: 12,
    flexShrink: 0,
  },
  prereqDomainChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  prereqDomainChipActive: {
    backgroundColor: "#1976d2",
  },
  prereqDomainChipText: {
    fontSize: 13,
    color: "#666",
  },
  prereqDomainChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  prereqResultCount: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    flexShrink: 0,
  },
  prereqSelectorList: {
    flex: 1,
    marginTop: 4,
  },
  prereqSelectItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  prereqSelectItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  prereqSelectItemMeta: {
    flexDirection: "row",
    gap: 8,
  },
  prereqSelectItemDomain: {
    fontSize: 11,
    color: "#1976d2",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  prereqSelectItemId: {
    fontSize: 11,
    color: "#999",
  },
  prereqSelectorCancelButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  prereqSelectorCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  // Reorder buttons
  reorderButtons: {
    flexDirection: "column",
    marginLeft: 8,
  },
  reorderButton: {
    width: 32,
    height: 28,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  reorderButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.5,
  },
  reorderButtonText: {
    fontSize: 14,
    color: "#333",
  },
  // Add capability button
  addCapButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCapButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Domain manage button
  domainManageButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  domainManageButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Domain reorder item
  domainReorderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  domainReorderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  domainReorderCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  domainEditInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  domainEditButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  domainEditButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  domainEditActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  // Domain toggle buttons (Existing vs New)
  domainToggleContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 10,
  },
  domainToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  domainToggleButtonActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  domainToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  domainToggleTextActive: {
    color: "#1976D2",
    fontWeight: "600",
  },
  // Sub-tabs for Soft Gates
  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabActive: {
    borderBottomColor: "#2196F3",
  },
  subTabText: {
    fontSize: 14,
    color: "#666",
  },
  subTabTextActive: {
    color: "#2196F3",
    fontWeight: "600",
  },
  // Soft Gate Content
  softGateContent: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  // Soft Gate State Grid
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
  // User Picker
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
  // Picker Modal
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
  // Reset Buttons
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
  // Delete Rule Button
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
  // JSON Input
  jsonInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    minHeight: 100,
  },
  // Cancel new category button
  cancelNewButton: {
    marginTop: 8,
    padding: 8,
    alignItems: "center",
  },
  cancelNewButtonText: {
    color: "#666",
    fontSize: 13,
  },
  // Prompt display
  promptItem: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#e0e0e0",
  },
  promptKey: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 2,
  },
  promptValue: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  // Detail section title
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  // List item text
  listItemText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 8,
    marginBottom: 4,
  },
  // Detection Rule Editor styles
  detectionRuleContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    marginTop: 8,
  },
  detectionFieldRow: {
    marginBottom: 12,
  },
  detectionFieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 6,
  },
  detectionFieldInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
  },
  detectionPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  detectionPickerOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  detectionPickerOptionSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  detectionPickerOptionText: {
    fontSize: 12,
    color: "#495057",
  },
  detectionPickerOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  compoundRulesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  compoundRulesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  subRuleContainer: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  subRuleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subRuleIndex: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6c757d",
  },
  subRuleRemove: {
    padding: 4,
  },
  subRuleRemoveText: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "600",
  },
  addSubRuleButton: {
    backgroundColor: "#e9ecef",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  addSubRuleButtonText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "500",
  },
  removeRuleButton: {
    backgroundColor: "#fff3cd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  removeRuleButtonText: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "500",
  },
});

// Merge all styles for backward compatibility
// Components can use `import styles from "../../styles"` and get all styles
const mergedStyles = {
  ...styles,
  ...capabilityExplorerStyles,
  ...materialExplorerStyles,
  ...userProgressStyles,
};

export default mergedStyles;
