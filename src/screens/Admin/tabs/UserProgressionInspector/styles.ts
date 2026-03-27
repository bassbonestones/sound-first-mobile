/**
 * Styles for UserProgressionInspector tab components
 */
import { ViewStyle, TextStyle } from "react-native";

// Type definitions for style objects
interface UserProgressionInspectorStyles {
  actionBar: ViewStyle;
  editButton: ViewStyle;
  editButtonText: TextStyle;
  resetButton: ViewStyle;
  resetButtonText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  editableRow: ViewStyle;
  editInput: TextStyle;
  toggleRow: ViewStyle;
  toggleButton: ViewStyle;
  toggleActive: ViewStyle;
  toggleText: TextStyle;
  dropdownRow: ViewStyle;
  stageButtons: ViewStyle;
  stageButton: ViewStyle;
  stageButtonActive: ViewStyle;
  stageButtonText: TextStyle;
  stageButtonTextActive: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  capRow: ViewStyle;
  capInfo: ViewStyle;
  capMeta: TextStyle;
  capName: TextStyle;
  capNameIntro: TextStyle;
  capActions: ViewStyle;
  capActionButton: ViewStyle;
  capActionText: TextStyle;
  removeButton: ViewStyle;
  removeButtonText: TextStyle;
  helpText: TextStyle;
  softGateCard: ViewStyle;
  softGateHeader: ViewStyle;
  softGateName: TextStyle;
  softGateExpand: TextStyle;
  softGateValues: ViewStyle;
  softGateValue: TextStyle;
  softGateEdit: ViewStyle;
  softGateActions: ViewStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  searchInput: TextStyle;
  resultCount: TextStyle;
  modalScroll: ViewStyle;
  modalCapRow: ViewStyle;
  modalCapName: TextStyle;
  modalCapDomain: TextStyle;
  modalCapActions: ViewStyle;
  modalAddButton: ViewStyle;
  modalAddText: TextStyle;
  modalMasterButton: ViewStyle;
  modalMasterText: TextStyle;
  modalCloseButton: ViewStyle;
  modalCloseText: TextStyle;
  instrumentSelectorRow: ViewStyle;
  instrumentSelectorLabel: TextStyle;
  instrumentScroll: ViewStyle;
  instrumentChip: ViewStyle;
  instrumentChipSelected: ViewStyle;
  instrumentChipText: TextStyle;
  instrumentChipTextSelected: TextStyle;
  instrumentButton: ViewStyle;
  instrumentButtonText: TextStyle;
  instrumentArrow: TextStyle;
  instrumentOption: ViewStyle;
  instrumentOptionSelected: ViewStyle;
  instrumentOptionText: TextStyle;
  instrumentOptionTextSelected: TextStyle;
  instrumentClef: TextStyle;
}

export const localStyles: UserProgressionInspectorStyles = {
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#666",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  editableRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  editInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#444",
    marginLeft: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#444",
    borderRadius: 4,
  },
  toggleActive: {
    backgroundColor: "#4CAF50",
  },
  toggleText: {
    color: "#fff",
    fontWeight: "600",
  },
  dropdownRow: {
    marginBottom: 8,
  },
  stageButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  stageButton: {
    width: 36,
    height: 36,
    backgroundColor: "#333",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  stageButtonActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  stageButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  stageButtonTextActive: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  capRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  capInfo: {
    flex: 1,
  },
  capMeta: {
    color: "#666",
    fontSize: 10,
    marginTop: 2,
  },
  capName: {
    color: "#4CAF50",
    fontSize: 13,
  },
  capNameIntro: {
    color: "#aaa",
    fontSize: 13,
  },
  capActions: {
    flexDirection: "row",
    gap: 8,
  },
  capActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#333",
    borderRadius: 4,
  },
  capActionText: {
    color: "#2196F3",
    fontSize: 11,
  },
  removeButton: {
    backgroundColor: "#5c2a2a",
  },
  removeButtonText: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "bold",
  },
  helpText: {
    color: "#888",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
  softGateCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  softGateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#333",
  },
  softGateName: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "600",
  },
  softGateExpand: {
    color: "#888",
    fontSize: 12,
  },
  softGateValues: {
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  softGateValue: {
    color: "#aaa",
    fontSize: 12,
  },
  softGateEdit: {
    padding: 10,
  },
  softGateActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 8,
    fontSize: 14,
  },
  resultCount: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalCapRow: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  modalCapName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalCapDomain: {
    color: "#888",
    fontSize: 11,
    marginBottom: 8,
  },
  modalCapActions: {
    flexDirection: "row",
    gap: 8,
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  modalAddText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "600",
  },
  modalMasterButton: {
    backgroundColor: "#2d4a2d",
  },
  modalMasterText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Instrument picker styles
  instrumentSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  instrumentSelectorLabel: {
    color: "#888",
    fontSize: 12,
    marginRight: 8,
  },
  instrumentScroll: {
    flexGrow: 0,
  },
  instrumentChip: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  instrumentChipSelected: {
    backgroundColor: "#1a3a5a",
    borderColor: "#2196F3",
  },
  instrumentChipText: {
    color: "#aaa",
    fontSize: 12,
  },
  instrumentChipTextSelected: {
    color: "#2196F3",
    fontWeight: "600",
  },
  instrumentButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
    marginVertical: 6,
  },
  instrumentButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  instrumentArrow: {
    color: "#888",
    fontSize: 12,
  },
  instrumentOption: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instrumentOptionSelected: {
    backgroundColor: "#1a3a1a",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  instrumentOptionText: {
    color: "#fff",
    fontSize: 14,
  },
  instrumentOptionTextSelected: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  instrumentClef: {
    color: "#888",
    fontSize: 12,
  },
};

export default localStyles;
