/**
 * Shared styles for Admin screen components
 * Extracted from AdminScreen.js for reuse across all admin explorer tabs
 */

import { StyleSheet, Platform } from "react-native";

// Base colors used across admin components
export const AdminColors = {
  primary: "#1a237e",
  primaryLight: "#534bae",
  accent: "#2196F3",
  success: "#4CAF50",
  warning: "#ff9800",
  error: "#f44336",
  background: "#f5f5f5",
  surface: "#ffffff",
  border: "#e0e0e0",
  text: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999",
};

// Domain-specific colors
export const DomainColors = {
  rhythm: "#e91e63",
  pitch: "#2196f3",
  harmony: "#4caf50",
  expression: "#ff9800",
  sight_reading: "#9c27b0",
  technique: "#607d8b",
  default: "#757575",
};

export const getDomainColor = (domain) => {
  if (!domain) return DomainColors.default;
  const key = domain.toLowerCase().replace(/\s+/g, "_");
  return DomainColors[key] || DomainColors.default;
};

export const adminStyles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: AdminColors.background,
  },

  // Header
  header: {
    backgroundColor: AdminColors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  headerButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
    flexWrap: "wrap",
  },
  tab: {
    minWidth: "16%",
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: AdminColors.accent,
  },
  tabText: {
    fontSize: 11,
    color: AdminColors.textSecondary,
    textAlign: "center",
  },
  tabTextActive: {
    color: AdminColors.accent,
    fontWeight: "600",
  },

  // Sub-tabs
  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  subTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  subTabActive: {
    borderBottomColor: AdminColors.accent,
  },
  subTabText: {
    fontSize: 14,
    color: AdminColors.textSecondary,
  },
  subTabTextActive: {
    color: AdminColors.accent,
    fontWeight: "600",
  },

  // Filter bar / Search
  filterBar: {
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: AdminColors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: AdminColors.border,
  },

  // Domain chips
  domainScroll: {
    marginTop: 8,
    maxHeight: 40,
  },
  domainChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  domainChipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // List items
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
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: AdminColors.text,
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  listItemId: {
    fontSize: 12,
    color: AdminColors.textMuted,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  listItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 11,
    overflow: "hidden",
  },
  listItemText: {
    fontSize: 13,
    color: AdminColors.text,
    marginBottom: 4,
    marginLeft: 8,
  },

  // Detail container (split view)
  detailContainer: {
    flex: 1,
    flexDirection: "row",
  },
  listPane: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: AdminColors.border,
  },
  detailPane: {
    width: "60%",
    backgroundColor: "#fff",
  },
  detailPanePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  detailPanePlaceholderText: {
    fontSize: 14,
    color: AdminColors.textMuted,
    textAlign: "center",
  },

  // Detail header
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
    backgroundColor: AdminColors.background,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AdminColors.text,
    flex: 1,
  },
  detailHeaderButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: AdminColors.textSecondary,
  },

  // Detail section content
  detailScroll: {
    flex: 1,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: AdminColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailLabel: {
    width: 90,
    fontSize: 13,
    color: AdminColors.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: AdminColors.text,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: AdminColors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: AdminColors.text,
  },

  // User selector
  userSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  userPickerButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  userPickerButtonText: {
    fontSize: 12,
    color: AdminColors.text,
  },
  clearButton: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: AdminColors.error,
  },

  // User picker container
  userPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  userPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: AdminColors.text,
    marginRight: 8,
  },
  userPickerArrow: {
    fontSize: 10,
    color: AdminColors.textSecondary,
  },

  // Soft gate items
  softGateItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  softGateItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: AdminColors.text,
    marginBottom: 4,
  },
  softGateItemValue: {
    fontSize: 13,
    color: AdminColors.textSecondary,
  },
  softGateContent: {
    flex: 1,
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
    color: AdminColors.textSecondary,
    marginBottom: 2,
  },
  softGateStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: AdminColors.text,
  },

  // Candidate items
  candidateItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AdminColors.border,
  },
  candidateItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: AdminColors.text,
    marginBottom: 4,
  },
  candidateItemMeta: {
    flexDirection: "row",
    gap: 8,
  },
  candidateItemBadge: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
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
    color: AdminColors.text,
  },
  candidateRankReason: {
    fontSize: 12,
    color: AdminColors.textSecondary,
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
    backgroundColor: AdminColors.accent,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 13,
    color: AdminColors.text,
  },
  diagnosticsContent: {
    flex: 1,
  },

  // Session diagnostics specific
  targetCapItem: {
    fontSize: 13,
    color: AdminColors.text,
    marginBottom: 4,
    marginLeft: 8,
  },
  gateItem: {
    fontSize: 13,
    color: AdminColors.text,
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
    color: AdminColors.text,
  },
  filterValue: {
    fontSize: 12,
    color: AdminColors.textSecondary,
    marginTop: 2,
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
    color: AdminColors.textSecondary,
    marginTop: 4,
  },
  reasonItem: {
    fontSize: 13,
    color: AdminColors.text,
    marginBottom: 4,
    marginLeft: 8,
  },
  failureList: {
    fontSize: 12,
    color: AdminColors.error,
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 8,
  },

  // Edit button in detail header
  editButton: {
    backgroundColor: AdminColors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: AdminColors.error,
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
    backgroundColor: AdminColors.primary,
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
    borderTopColor: AdminColors.border,
    gap: 12,
  },

  // Confirm overlay
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
    backgroundColor: AdminColors.error,
  },
  confirmButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },

  // Prompt items
  promptItem: {
    marginBottom: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: AdminColors.border,
  },
  promptKey: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1976d2",
    marginBottom: 2,
  },
  promptValue: {
    fontSize: 13,
    color: AdminColors.text,
    lineHeight: 18,
  },

  // Edit Modal Popup
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

  // Edit Modal (full-screen)
  editModalContainer: {
    flex: 1,
    backgroundColor: AdminColors.background,
  },
  editModalHeader: {
    backgroundColor: AdminColors.primary,
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

  // Read-only notice
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
    color: AdminColors.text,
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
    color: AdminColors.text,
  },
  formFieldInputError: {
    borderColor: AdminColors.error,
    borderWidth: 2,
  },
  formFieldError: {
    color: AdminColors.error,
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
    backgroundColor: AdminColors.accent,
    borderColor: AdminColors.accent,
  },
  pickerOptionText: {
    fontSize: 13,
    color: AdminColors.text,
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
    color: AdminColors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },

  // Edit modal footer
  editModalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AdminColors.border,
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
    backgroundColor: AdminColors.background,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: AdminColors.textSecondary,
    fontWeight: "600",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: AdminColors.success,
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
    borderLeftColor: AdminColors.error,
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
    borderLeftColor: AdminColors.success,
  },
  saveSuccessText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
  },

  // Prerequisite styles
  prereqHint: {
    fontSize: 12,
    color: AdminColors.textSecondary,
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
    color: AdminColors.textMuted,
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

  // Prerequisite selector
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
    color: AdminColors.text,
  },
  prereqSelectorSearch: {
    marginBottom: 12,
  },
  prereqSearchInput: {
    backgroundColor: AdminColors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: AdminColors.border,
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
    color: AdminColors.textSecondary,
  },
  prereqDomainChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  prereqResultCount: {
    fontSize: 12,
    color: AdminColors.textMuted,
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
    color: AdminColors.text,
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
    color: AdminColors.textMuted,
  },
  prereqSelectorCancelButton: {
    backgroundColor: AdminColors.background,
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
    color: AdminColors.textSecondary,
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
    backgroundColor: AdminColors.background,
    opacity: 0.5,
  },
  reorderButtonText: {
    fontSize: 14,
    color: AdminColors.text,
  },

  // Add capability button
  addCapButton: {
    backgroundColor: AdminColors.success,
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
    backgroundColor: AdminColors.warning,
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
    color: AdminColors.text,
  },
  domainReorderCount: {
    fontSize: 12,
    color: AdminColors.textSecondary,
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

  // Domain toggle buttons
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
    borderColor: AdminColors.border,
    alignItems: "center",
  },
  domainToggleButtonActive: {
    backgroundColor: "#e3f2fd",
    borderColor: AdminColors.accent,
  },
  domainToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: AdminColors.textSecondary,
  },
  domainToggleTextActive: {
    color: "#1976D2",
    fontWeight: "600",
  },

  // Picker modal
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
    borderBottomColor: AdminColors.border,
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
    color: AdminColors.text,
  },
  pickerModalItemSubtext: {
    fontSize: 12,
    color: AdminColors.textSecondary,
    marginTop: 2,
  },

  // Reset buttons
  resetAllButton: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AdminColors.warning,
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
    borderColor: AdminColors.warning,
  },
  resetDimensionButtonText: {
    color: "#e65100",
    fontWeight: "600",
    fontSize: 14,
  },

  // Delete rule button
  deleteRuleButton: {
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AdminColors.error,
  },
  deleteRuleButtonText: {
    color: "#c62828",
    fontWeight: "600",
    fontSize: 14,
  },

  // JSON input
  jsonInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    minHeight: 100,
  },

  // Cancel new category
  cancelNewButton: {
    marginTop: 8,
    padding: 8,
    alignItems: "center",
  },
  cancelNewButtonText: {
    color: AdminColors.textSecondary,
    fontSize: 13,
  },
});

export default adminStyles;
