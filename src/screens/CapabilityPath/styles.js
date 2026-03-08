/**
 * Styles for CapabilityPath screen
 */

import { StyleSheet, Platform } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#16213e",
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: "#4facfe",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    backgroundColor: "#16213e",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  sortButtons: {
    flexDirection: "row",
    marginBottom: 10,
  },
  sortBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#2a2a4a",
  },
  sortBtnActive: {
    backgroundColor: "#4facfe",
  },
  sortBtnText: {
    color: "#888",
    fontSize: 14,
  },
  sortBtnTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#2a2a4a",
  },
  filterBtnActive: {
    backgroundColor: "#00f2fe",
  },
  filterBtnText: {
    color: "#888",
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: "#000",
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    backgroundColor: "#1e1e3f",
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  rowAlt: {
    backgroundColor: "#252550",
  },
  orderCol: {
    width: 50,
    alignItems: "center",
  },
  orderNum: {
    color: "#4facfe",
    fontSize: 18,
    fontWeight: "bold",
  },
  moveButtons: {
    flexDirection: "row",
    marginTop: 4,
  },
  moveBtn: {
    padding: 4,
  },
  moveBtnText: {
    color: "#666",
    fontSize: 12,
  },
  mainCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  displayName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  capability: {
    color: "#888",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  categoryBadge: {
    color: "#00f2fe",
    fontSize: 11,
    marginTop: 4,
    backgroundColor: "rgba(0,242,254,0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeCol: {
    width: 70,
    alignItems: "center",
  },
  typeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  typeP: {
    backgroundColor: "#ff6b6b",
  },
  typeT: {
    backgroundColor: "#51cf66",
  },
  typeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  masteryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  masteryLabel: {
    color: "#888",
    fontSize: 10,
    marginRight: 4,
  },
  masteryBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  masteryCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 6,
  },
  editBtn: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    color: "#666",
    fontSize: 12,
  },
  editSection: {
    width: "100%",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  editLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
    marginTop: 8,
  },
  editInput: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  deleteBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#ff4757",
    borderRadius: 6,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#16213e",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  addBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#4facfe",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#51cf66",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  saveBtnDisabled: {
    backgroundColor: "#555",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  exportBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#ffa502",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  exportBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    alignItems: "center",
  },
  resetBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1e1e3f",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
  },
  categoryPicker: {
    maxHeight: 40,
  },
  catOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#333",
  },
  catOptionActive: {
    backgroundColor: "#4facfe",
  },
  catOptionText: {
    color: "#888",
    fontSize: 12,
  },
  catOptionTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  typeSelector: {
    flexDirection: "row",
  },
  typeSelectorBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#333",
    alignItems: "center",
    marginRight: 8,
    borderRadius: 6,
  },
  typeSelectorBtnActive: {
    backgroundColor: "#4facfe",
  },
  typeSelectorText: {
    color: "#888",
    fontSize: 12,
  },
  typeSelectorTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#333",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelText: {
    color: "#888",
    fontWeight: "bold",
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#51cf66",
    borderRadius: 8,
    alignItems: "center",
  },
  modalAddText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
