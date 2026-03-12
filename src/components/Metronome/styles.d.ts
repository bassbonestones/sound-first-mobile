/**
 * Metronome Styles
 *
 * Extracted StyleSheet for Metronome component to reduce inline styles.
 */

import { StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";

// Colors
export const colors = {
  gold: "#FFD700",
  goldDark: "#bfa76a",
  goldMuted: "#5a4a3a",
  background: "#1a1410",
  surface: "#3b2c1a",
  surfaceDark: "#2d232e",
  purple: "#9C27B0",
  accent: "#FF9800",
  textMuted: "#666",
  textLight: "#fff",
  textDark: "#3b2c1a",
} as const;

export type MetronomeColors = typeof colors;

// Style interface for type exports
export interface MetronomeStylesType {
  container: ViewStyle;
  bpmContainer: ViewStyle;
  bpmText: TextStyle;
  bpmLabel: TextStyle;
  selectorRow: ViewStyle;
  timeSigButton: ViewStyle;
  timeSigButtonActive: ViewStyle;
  timeSigButtonInactive: ViewStyle;
  timeSigButtonText: TextStyle;
  timeSigButtonTextActive: TextStyle;
  timeSigButtonTextInactive: TextStyle;
  [key: string]: ViewStyle | TextStyle;
}

export { styles } from "./styles.js";
