/**
 * ComposerScreen Styles
 *
 * Extracted StyleSheet for the Practice Composer screen.
 * Optimized for small screens (320x568 minimum).
 */

import { StyleSheet } from "react-native";
import { colors, spacing } from "../../../constants";

export const composerScreenStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    // No flex - stacks components at their natural heights
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Viewport
  viewportWrapper: {
    minHeight: 120,
    position: "relative",
  },
  buttonDisabled: {
    opacity: 0.4,
  },

  // Compact controls row
  compactControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pitchButtons: {
    flexDirection: "row",
    gap: 4,
  },
  pitchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtons: {
    flexDirection: "row",
    gap: 4,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Playback panel
  playbackPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  transportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  playTransportButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  repeatActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  // Action buttons - pinned to bottom
  actionRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flex: 1,
    marginRight: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  practiceButton: {
    flex: 1,
    marginLeft: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  practiceButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  practiceButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButtonDisabled: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveButtonTextDisabled: {
    color: colors.textSecondary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: "center",
  },
  modalCancel: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
