/**
 * Shared modal styles for TuneComposer modals
 */
import { StyleSheet } from "react-native";
import { colors, spacing } from "../../../../constants";

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  option: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: "center",
  },
  cancel: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  cancelOption: {
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  textDisabled: {
    opacity: 0.5,
  },
});
