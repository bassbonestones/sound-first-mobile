/**
 * Metronome Colors
 *
 * Shared color palette for Metronome styles, extracted to avoid circular dependencies.
 */

interface ColorsType {
  gold: string;
  goldDark: string;
  goldMuted: string;
  background: string;
  surface: string;
  surfaceDark: string;
  purple: string;
  accent: string;
  textMuted: string;
  textLight: string;
  textDark: string;
}

export const colors: ColorsType = {
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
};
