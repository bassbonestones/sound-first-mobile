/**
 * PitchDrone Styles
 *
 * Type declarations for the PitchDrone styles module.
 */

import { ViewStyle, TextStyle } from "react-native";

// Colors
export declare const colors: {
  readonly gold: "#FFD700";
  readonly goldDark: "#bfa76a";
  readonly background: "#1a1410";
  readonly surface: "#3b2c1a";
  readonly surfaceDark: "#2d232e";
  readonly surfaceDisabled: "#222";
  readonly purple: "#9C27B0";
  readonly green: "#27ae60";
  readonly border: "#444";
  readonly textMuted: "#666";
  readonly textLight: "#fff";
  readonly textDark: "#1a1a2e";
};

export type PitchDroneColors = typeof colors;

// Style declarations
export declare const styles: {
  container: ViewStyle;
  title: TextStyle;
  muteButton: ViewStyle;
  muteButtonMuted: ViewStyle;
  muteButtonUnmuted: ViewStyle;
  muteButtonText: TextStyle;
  settingsRow: ViewStyle;
  temperamentContainer: ViewStyle;
  temperamentButtonLeft: ViewStyle;
  [key: string]: ViewStyle | TextStyle;
};
