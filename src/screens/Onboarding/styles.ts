/**
 * Onboarding Styles
 *
 * Shared StyleSheet for all Onboarding step components
 */

import { StyleSheet, Platform } from "react-native";

export const colors = {
  background: "#1a1410",
  surface: "#3b2c1a",
  surfaceDark: "#2a1f12",
  gold: "#FFD700",
  goldMuted: "#bfa76a",
  goldDark: "#5a4a2a",
  textLight: "#e6cfa7",
  textMuted: "#8a7a5a",
  tuneGreen: "#2d5a2d",
  tunePurple: "#4a2d5a",
};

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  instrumentSelectionContainer: {
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    paddingBottom: 180,
  },
  scrollContentWithTopPadding: {
    flexGrow: 1,
    alignItems: "center",
    padding: 24,
    paddingBottom: 180,
    paddingTop: 60,
  },

  // Fixed bottom area
  fixedBottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Typography
  pageTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.gold,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    textAlign: "center",
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.gold,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textLight,
    fontSize: 18,
    marginBottom: 24,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    textAlign: "center",
  },
  description: {
    color: colors.textLight,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  hint: {
    color: colors.goldMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },

  // Back button
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  backButtonText: {
    color: colors.gold,
    fontSize: 16,
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    color: colors.goldMuted,
    fontSize: 14,
  },

  // Selection cards
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 450,
  },
  selectionGridNarrow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 400,
  },
  familyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    margin: 8,
    borderWidth: 2,
    borderColor: colors.goldMuted,
    width: 120,
    alignItems: "center",
  },
  instrumentCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    margin: 8,
    borderWidth: 2,
    borderColor: colors.goldMuted,
    width: 110,
    alignItems: "center",
  },
  instrumentCardSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  cardIconSmall: {
    fontSize: 32,
    marginBottom: 4,
  },
  cardLabel: {
    color: colors.gold,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  cardLabelSmall: {
    color: colors.gold,
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  cardLabelSelected: {
    color: colors.surface,
  },

  // Family header badge
  familyBadge: {
    backgroundColor: colors.surfaceDark,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  familyBadgeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  familyBadgeText: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "bold",
  },

  // Primary button (gold)
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.goldDark,
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "bold",
    fontSize: 18,
  },
  primaryButtonTextLarge: {
    color: colors.surface,
    fontWeight: "bold",
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
  },
  primaryButtonTextDisabled: {
    color: colors.textMuted,
  },

  // Admin button
  adminButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  adminButtonText: {
    color: colors.gold,
    fontSize: 12,
  },

  // Pitch detection display
  pitchIconText: {
    fontSize: 36,
    marginBottom: 8,
  },
  pitchLabel: {
    color: colors.textLight,
    fontSize: 16,
    marginBottom: 8,
  },
  pitchDisplayContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  pitchDisplayBox: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: colors.gold,
    minHeight: 90,
    justifyContent: "center",
  },
  pitchDisplayBoxDefault: {
    backgroundColor: colors.surface,
  },
  pitchDisplayBoxStopped: {
    backgroundColor: colors.tunePurple,
  },
  pitchDisplayBoxInTune: {
    backgroundColor: colors.tuneGreen,
  },
  pitchNoteText: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  pitchCentsText: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    minHeight: 18,
  },
});

export default styles;
