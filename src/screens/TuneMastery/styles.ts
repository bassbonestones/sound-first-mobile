/**
 * TuneMasteryScreen Styles
 */
import { StyleSheet, Platform } from "react-native";

export const colors = {
  background: "#1a1a2e",
  surface: "#2a2a3e",
  surfaceLight: "#3a3a4e",
  primary: "#FFD700",
  text: "#FFFFFF",
  textSecondary: "#888888",
  textMuted: "#666666",
  success: "#4CAF50",
  warning: "#FFA500",
  error: "#FF6B6B",
  border: "#444444",
};

export default StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: "bold",
  },
  errorDetail: {
    color: colors.textSecondary,
    marginTop: 8,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },

  // Stats Bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Add Tune Button
  addTuneButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  addTuneButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  // Archive Toggle
  archiveToggle: {
    paddingVertical: 12,
    marginTop: 8,
  },
  archiveToggleText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalAddButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});
