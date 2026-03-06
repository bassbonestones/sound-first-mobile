/**
 * Theme - Shared styling constants and utilities
 * 
 * Usage:
 *   import { colors, spacing, fontSizes } from '../styles/theme';
 */

import { Platform } from "react-native";

// Re-export from colors.js
export { colors, spacing, fontSizes, borderRadius } from "../constants/colors";
import { colors, spacing, fontSizes, borderRadius } from "../constants/colors";

/**
 * Common shadow styles
 */
export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

/**
 * Platform-specific header padding
 */
export const headerPadding = {
  paddingTop: Platform.OS === "ios" ? 50 : 20,
  paddingBottom: 15,
  paddingHorizontal: 20,
};

/**
 * Common component styles that can be spread into StyleSheet.create()
 */
export const commonStyles = {
  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Card/Surface styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  
  // Header styles (admin/light theme)
  header: {
    backgroundColor: colors.headerBg,
    ...headerPadding,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  headerTitle: {
    color: colors.textLight,
    fontSize: fontSizes.header,
    fontWeight: "bold",
  },
  
  // List item styles
  listItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    ...shadows.small,
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Button styles
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  
  primaryButtonText: {
    color: colors.textLight,
    fontSize: fontSizes.base,
    fontWeight: "600",
  },
  
  secondaryButton: {
    backgroundColor: colors.chipBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: "600",
  },
  
  dangerButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  
  dangerButtonText: {
    color: colors.textLight,
    fontSize: fontSizes.base,
    fontWeight: "600",
  },
  
  // Input styles
  textInput: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  modalContent: {
    width: "90%",
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  
  modalHeader: {
    backgroundColor: colors.headerBg,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  modalTitle: {
    color: colors.textLight,
    fontSize: fontSizes.xxl,
    fontWeight: "bold",
    flex: 1,
  },
  
  // Text styles
  title: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  
  caption: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
  },
  
  // Chip/Badge styles
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.chipBg,
    borderRadius: borderRadius.round,
  },
  
  chipActive: {
    backgroundColor: colors.chipActiveBg,
  },
  
  chipText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  
  chipTextActive: {
    color: colors.textLight,
  },
  
  // Badge (small, inline)
  badge: {
    backgroundColor: colors.primaryLight,
    color: colors.primaryDark,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xl,
    fontSize: fontSizes.xs,
    fontWeight: "500",
    overflow: "hidden",
  },
};

export default { colors, spacing, fontSizes, borderRadius, shadows, commonStyles, headerPadding };
