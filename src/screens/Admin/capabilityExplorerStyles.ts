/**
 * CapabilityExplorer-specific styles
 *
 * Styles used exclusively by the CapabilityExplorer tab and its components:
 * - Prerequisite selector
 * - Domain management
 * - Detection rule editor
 */
import { StyleSheet, Platform } from "react-native";

const capabilityExplorerStyles = StyleSheet.create({
  // ==========================================================================
  // Prerequisite Selector Styles
  // ==========================================================================
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
  // Prerequisite Selector Modal
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

  // ==========================================================================
  // Domain Management Styles
  // ==========================================================================
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

  // ==========================================================================
  // Add/Reorder Capability Styles
  // ==========================================================================
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

  // ==========================================================================
  // Detection Rule Editor Styles
  // ==========================================================================
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

  // ==========================================================================
  // Capability Tags Display
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
});

export default capabilityExplorerStyles;
