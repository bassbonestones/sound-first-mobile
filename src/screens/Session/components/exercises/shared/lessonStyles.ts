/**
 * Common styles for lesson exercises
 *
 * These styles are shared across WholeNoteLessonExercise, HalfNoteLessonExercise,
 * QuarterNoteLessonExercise, and the rest lesson exercises.
 */
import { StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";

export const COLORS = {
  // Core backgrounds
  background: "#1a1410",
  card: "#2a1f15",
  cardAlt: "#2d241a", // Slightly lighter card variant
  cardBorder: "#3d2e20",
  cardBorderAlt: "#3b2c1a", // Slightly different border

  // Primary text colors
  primary: "#e8d5b7",
  primaryBright: "#f5e6d3", // Brighter text variant
  secondary: "#c4b5a0",
  secondaryDark: "#a69580", // Darker secondary for subtle text
  muted: "#8a7a6a", // Muted/inactive text

  // Accent colors
  accent: "#d4a574",
  gold: "#FFD700",

  // Feedback colors
  success: "#4CAF50",
  error: "#FF5252",
  warning: "#FFC107",
  info: "#64B5F6",

  // Utility
  white: "#fff",
  shadow: "#000",
} as const;

export type ColorKey = keyof typeof COLORS;

interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export const SHADOWS: Record<string, ShadowStyle> = {
  card: Platform.select({
    ios: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ShadowStyle,
  button: Platform.select({
    ios: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as ShadowStyle,
};

interface LessonCommonStyles {
  // Container styles
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;

  // Header styles
  header: ViewStyle;
  headerText: TextStyle;
  subHeaderText: TextStyle;

  // Card styles
  card: ViewStyle;
  cardTitle: TextStyle;
  cardText: TextStyle;

  // Button styles
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonText: TextStyle;
  buttonTextDisabled: TextStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  secondaryButtonText: TextStyle;

  // Phase indicator styles
  phaseIndicator: ViewStyle;
  phaseDot: ViewStyle;
  phaseDotActive: ViewStyle;
  phaseDotComplete: ViewStyle;

  // Focus card styles
  focusCard: ViewStyle;
  focusCardTitle: TextStyle;
  focusCardContent: ViewStyle;
  focusCardText: TextStyle;
  focusCardHighlight: TextStyle;

  // Notation toggle styles
  notationToggle: ViewStyle;
  notationToggleText: TextStyle;

  // Beat indicator styles
  beatIndicatorContainer: ViewStyle;
  beatRow: ViewStyle;
  beatDot: ViewStyle;
  beatDotActive: ViewStyle;
  beatDotPlayed: ViewStyle;
  beatNumber: TextStyle;

  // Success/feedback styles
  successContainer: ViewStyle;
  successIcon: TextStyle;
  successText: TextStyle;
  successSubtext: TextStyle;

  // Error/retry styles
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;

  // Volume indicator styles
  volumeContainer: ViewStyle;
  volumeLabel: TextStyle;

  // Instruction text styles
  instructionText: TextStyle;

  // Count display styles
  countDisplay: ViewStyle;
  countText: TextStyle;
  countLabel: TextStyle;
}

export const lessonCommonStyles = StyleSheet.create<LessonCommonStyles>({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Header styles
  header: {
    paddingTop: Platform.select({ ios: 60, android: 40, default: 40 }),
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 8,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: COLORS.secondary,
    lineHeight: 24,
  },

  // Button styles
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: "center",
    ...SHADOWS.button,
  },
  buttonDisabled: {
    backgroundColor: "#4a3d30",
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
  },
  buttonTextDisabled: {
    color: COLORS.secondary,
  },
  primaryButton: {
    backgroundColor: COLORS.success,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  secondaryButtonText: {
    color: COLORS.accent,
  },

  // Phase indicator styles
  phaseIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3d2e20",
  },
  phaseDotActive: {
    backgroundColor: COLORS.accent,
  },
  phaseDotComplete: {
    backgroundColor: COLORS.success,
  },

  // Focus card styles
  focusCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  focusCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.gold,
    textAlign: "center",
    marginBottom: 16,
  },
  focusCardContent: {
    alignItems: "center",
  },
  focusCardText: {
    fontSize: 18,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 16,
  },
  focusCardHighlight: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
  },

  // Notation toggle styles
  notationToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  notationToggleText: {
    fontSize: 14,
    color: COLORS.secondary,
  },

  // Beat indicator styles
  beatIndicatorContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  beatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  beatDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3d2e20",
    borderWidth: 2,
    borderColor: "#4a3d30",
  },
  beatDotActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.gold,
  },
  beatDotPlayed: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  beatNumber: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 4,
  },

  // Success/feedback styles
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.success,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 8,
  },

  // Error/retry styles
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: "600",
  },

  // Volume indicator styles
  volumeContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  volumeLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
  },

  // Instruction text styles
  instructionText: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: "center",
    marginHorizontal: 20,
    marginVertical: 16,
    lineHeight: 26,
  },

  // Count display styles
  countDisplay: {
    alignItems: "center",
    marginVertical: 20,
  },
  countText: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.gold,
  },
  countLabel: {
    fontSize: 16,
    color: COLORS.secondary,
    marginTop: 8,
  },
});

interface ModalStyles {
  overlay: ViewStyle;
  container: ViewStyle;
  title: TextStyle;
  text: TextStyle;
  buttonRow: ViewStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
  confirmButton: ViewStyle;
  confirmButtonText: TextStyle;
}

// Modal styles (for attestation and other modals)
export const modalStyles = StyleSheet.create<ModalStyles>({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.secondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default {
  lessonCommonStyles,
  modalStyles,
  COLORS,
  SHADOWS,
};
