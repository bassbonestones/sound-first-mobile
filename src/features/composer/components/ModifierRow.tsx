/**
 * ModifierRow Component
 *
 * A row of modifier buttons for accidentals (sharp, flat, natural),
 * rest insertion, and tie toggling.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
} from "react-native";
import Svg, { Rect, Line } from "react-native-svg";

import { colors, spacing } from "../../../constants";
import type { Accidental, DurationValue } from "../types";
import { DURATION } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface ModifierRowProps {
  /** Called when an accidental is selected */
  onAccidental: (accidental: Accidental) => void;
  /** Called when rest button is pressed */
  onRest: () => void;
  /** Called when tie button is pressed */
  onTie: () => void;
  /** Currently selected duration (for dynamic rest symbol) */
  selectedDuration: DurationValue;
  /** Currently active accidental (if any) */
  activeAccidental?: Accidental | null;
  /** Whether a tie is currently active on selected note */
  tieActive?: boolean;
  /** Whether modifiers are disabled */
  disabled?: boolean;
  /** Whether there's a note selected (for accidental/tie to work) */
  hasSelection?: boolean;
  /** Test ID for testing */
  testID?: string;
}

interface ModifierButton {
  id: string;
  label: string;
  symbol: string;
  type: "accidental" | "rest" | "tie";
  value?: Accidental;
  useBravura?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * SMuFL codepoints for Bravura font rest symbols
 */
const REST_SYMBOLS: Record<DurationValue, string> = {
  [DURATION.WHOLE]: "\uE4E3", // restWhole
  [DURATION.HALF]: "\uE4E4", // restHalf
  [DURATION.QUARTER]: "\uE4E5", // restQuarter
  [DURATION.EIGHTH]: "\uE4E6", // rest8th
  [DURATION.SIXTEENTH]: "\uE4E7", // rest16th
};

/**
 * SMuFL codepoints for Bravura accidentals
 */
const ACCIDENTAL_SYMBOLS = {
  sharp: "\uE262", // accidentalSharp
  flat: "\uE260", // accidentalFlat
  natural: "\uE261", // accidentalNatural
};

const BASE_MODIFIER_BUTTONS: ModifierButton[] = [
  {
    id: "sharp",
    label: "Sharp",
    symbol: ACCIDENTAL_SYMBOLS.sharp,
    type: "accidental",
    value: "sharp",
    useBravura: true,
  },
  {
    id: "flat",
    label: "Flat",
    symbol: ACCIDENTAL_SYMBOLS.flat,
    type: "accidental",
    value: "flat",
    useBravura: true,
  },
  {
    id: "natural",
    label: "Natural",
    symbol: ACCIDENTAL_SYMBOLS.natural,
    type: "accidental",
    value: "natural",
    useBravura: true,
  },
  // Rest button is added dynamically based on selectedDuration
  { id: "tie", label: "Tie", symbol: "\uE1FD", type: "tie", useBravura: true }, // tie SMuFL
];

// =============================================================================
// SVG Rest Components
// =============================================================================

/** Whole rest: rectangle hanging below the line */
function WholeRestSvg({
  disabled,
}: {
  disabled?: boolean;
}): React.ReactElement {
  const fillColor = disabled ? colors.textSecondary : colors.textPrimary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {/* Staff line */}
      <Line x1={2} y1={8} x2={22} y2={8} stroke={fillColor} strokeWidth={1.5} />
      {/* Rest rectangle hanging below */}
      <Rect x={7} y={8} width={10} height={5} fill={fillColor} />
    </Svg>
  );
}

/** Half rest: rectangle sitting on top of the line */
function HalfRestSvg({ disabled }: { disabled?: boolean }): React.ReactElement {
  const fillColor = disabled ? colors.textSecondary : colors.textPrimary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {/* Staff line */}
      <Line
        x1={2}
        y1={16}
        x2={22}
        y2={16}
        stroke={fillColor}
        strokeWidth={1.5}
      />
      {/* Rest rectangle sitting on top */}
      <Rect x={7} y={11} width={10} height={5} fill={fillColor} />
    </Svg>
  );
}

// =============================================================================
// Component
// =============================================================================

function ModifierRowComponent({
  onAccidental,
  onRest,
  onTie,
  selectedDuration,
  activeAccidental,
  tieActive = false,
  disabled = false,
  hasSelection = false,
  testID,
}: ModifierRowProps): React.ReactElement {
  // Build buttons with dynamic rest symbol
  const MODIFIER_BUTTONS: ModifierButton[] = [
    ...BASE_MODIFIER_BUTTONS.slice(0, 3), // accidentals
    {
      id: "rest",
      label: "Rest",
      symbol: REST_SYMBOLS[selectedDuration] || REST_SYMBOLS[DURATION.QUARTER],
      type: "rest",
      useBravura: true,
    },
    ...BASE_MODIFIER_BUTTONS.slice(3), // tie
  ];

  // Check if rest needs special SVG rendering (whole or half)
  const isWholeRest = selectedDuration === DURATION.WHOLE;
  const isHalfRest = selectedDuration === DURATION.HALF;

  const handlePress = useCallback(
    (button: ModifierButton) => {
      if (disabled) return;

      switch (button.type) {
        case "accidental":
          if (button.value) {
            onAccidental(button.value);
          }
          break;
        case "rest":
          onRest();
          break;
        case "tie":
          onTie();
          break;
      }
    },
    [disabled, onAccidental, onRest, onTie],
  );

  const isButtonActive = (button: ModifierButton): boolean => {
    if (button.type === "accidental" && button.value) {
      return activeAccidental === button.value;
    }
    if (button.type === "tie") {
      return tieActive;
    }
    return false;
  };

  const isButtonDisabled = (button: ModifierButton): boolean => {
    if (disabled) return true;
    // Accidentals and ties require a note to be selected
    if (button.type === "accidental" || button.type === "tie") {
      return !hasSelection;
    }
    return false;
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Modifiers</Text>
      <View style={styles.buttonRow}>
        {MODIFIER_BUTTONS.map((button) => {
          const isActive = isButtonActive(button);
          const buttonDisabled = isButtonDisabled(button);

          return (
            <TouchableOpacity
              key={button.id}
              style={[
                styles.button,
                isActive && styles.buttonActive,
                buttonDisabled && styles.buttonDisabled,
              ]}
              onPress={() => handlePress(button)}
              disabled={buttonDisabled}
              accessibilityRole={"button" as AccessibilityRole}
              accessibilityLabel={button.label}
              accessibilityState={{
                selected: isActive,
                disabled: buttonDisabled,
              }}
              testID={`modifier-${button.id}`}
            >
              {button.type === "rest" && isWholeRest ? (
                <WholeRestSvg disabled={buttonDisabled} />
              ) : button.type === "rest" && isHalfRest ? (
                <HalfRestSvg disabled={buttonDisabled} />
              ) : (
                <Text
                  style={[
                    styles.symbol,
                    button.useBravura && styles.bravuraSymbol,
                    isActive && styles.symbolActive,
                    buttonDisabled && styles.symbolDisabled,
                  ]}
                >
                  {button.symbol}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 44,
  },
  buttonActive: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  symbol: {
    fontSize: 22,
    color: colors.textPrimary,
  },
  bravuraSymbol: {
    fontFamily: "Bravura",
    fontSize: 24,
  },
  symbolActive: {
    color: colors.warning,
  },
  symbolDisabled: {
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ModifierRow = memo(ModifierRowComponent);
