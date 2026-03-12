/**
 * Theme Colors
 *
 * Centralized color definitions for consistent theming across the app.
 */

export interface MasteryColors {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export interface Colors {
  // Primary colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Admin/Header colors
  headerBg: string;

  // Session/Practice colors (dark theme)
  sessionBg: string;
  sessionGold: string;
  sessionText: string;

  // Semantic colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  errorDark: string;

  // Grayscale
  white: string;
  background: string;
  surfaceLight: string;
  surface: string;
  border: string;
  borderDark: string;
  divider: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textLight: string;

  // Specific UI elements
  inputBg: string;
  chipBg: string;
  chipActiveBg: string;

  // Mastery level colors
  mastery: MasteryColors;

  // Soft gate specific
  softGate: string;
}

export const colors: Colors = {
  // Primary colors
  primary: "#2196F3", // Blue - primary actions, links
  primaryDark: "#1976D2", // Darker blue for pressed states
  primaryLight: "#e3f2fd", // Light blue backgrounds

  // Admin/Header colors
  headerBg: "#1a237e", // Deep indigo for headers

  // Session/Practice colors (dark theme)
  sessionBg: "#1a1410", // Dark brown background
  sessionGold: "#FFD700", // Gold accent color
  sessionText: "#FFD700", // Gold text on dark

  // Semantic colors
  success: "#4CAF50", // Green
  successLight: "#e8f5e9", // Light green background
  warning: "#FF9800", // Orange
  warningLight: "#fff3cd", // Light orange background
  error: "#f44336", // Red
  errorLight: "#ffebee", // Light red background
  errorDark: "#c62828", // Dark red

  // Grayscale
  white: "#ffffff",
  background: "#f5f5f5", // Light gray background
  surfaceLight: "#fafafa", // Very light surface
  surface: "#ffffff", // White surface
  border: "#e0e0e0", // Light border
  borderDark: "#ddd", // Slightly darker border
  divider: "#f0f0f0", // Divider lines

  // Text colors
  textPrimary: "#333", // Primary text
  textSecondary: "#666", // Secondary text
  textTertiary: "#888", // Tertiary/muted text
  textDisabled: "#999", // Disabled text
  textLight: "#fff", // Light text (on dark bg)

  // Specific UI elements
  inputBg: "#f0f0f0", // Input background
  chipBg: "#e8e8e8", // Chip/badge background
  chipActiveBg: "#2196F3", // Active chip background

  // Mastery level colors
  mastery: {
    level0: "#9E9E9E", // Gray - not started
    level1: "#ef5350", // Red - just started
    level2: "#ff9800", // Orange - progressing
    level3: "#4caf50", // Green - proficient
    level4: "#2196f3", // Blue - advanced
    level5: "#9c27b0", // Purple - mastered
  },

  // Soft gate specific
  softGate: "#9C27B0", // Purple for soft gate indicators
};

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

// Spacing scale
export const spacing: Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export interface FontSizes {
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
  title: number;
  header: number;
}

// Font sizes
export const fontSizes: FontSizes = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  title: 20,
  header: 22,
};

export interface BorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
  full: number;
}

// Border radii
export const borderRadius: BorderRadius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  round: 16,
  full: 9999,
};

export default colors;
