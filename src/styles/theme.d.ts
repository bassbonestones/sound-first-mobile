/**
 * Theme utilities type declarations
 */

import { ViewStyle } from "react-native";

// Re-exports from constants/colors
export { colors, spacing, fontSizes, borderRadius } from "../constants/colors";

/**
 * Common shadow styles - platform-aware
 */
export declare const shadows: {
  small: ViewStyle;
  medium: ViewStyle;
  large: ViewStyle;
};

/**
 * Get platform-specific font family
 */
export declare function getFontFamily(weight?: "regular" | "bold"): string;

/**
 * Common text presets
 */
export declare const textPresets: {
  heading: object;
  subheading: object;
  body: object;
  caption: object;
  button: object;
};
