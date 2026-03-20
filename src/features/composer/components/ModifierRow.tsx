/**
 * ModifierRow Component
 *
 * A row of modifier buttons for accidentals (sharp, flat, natural),
 * rest insertion, and tie toggling.
 */

import React, { memo, useCallback, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  AccessibilityRole,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../../../constants";
import type { Accidental } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface ModifierRowProps {
  /** Called when an accidental is selected */
  onAccidental: (accidental: Accidental) => void;
  /** Called when tie button is pressed */
  onTie: () => void;
  /** Called when octave changes */
  onOctaveChange: (direction: "up" | "down") => void;
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
  type: "accidental" | "tie";
  value?: Accidental;
  useBravura?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * SMuFL codepoints for Bravura accidentals
 */
const ACCIDENTAL_SYMBOLS = {
  "double-sharp": "\uE263",
  sharp: "\uE262",
  natural: "\uE261",
  flat: "\uE260",
  "double-flat": "\uE264",
};

const MODIFIER_BUTTONS: ModifierButton[] = [
  {
    id: "double-sharp",
    label: "Double Sharp",
    symbol: ACCIDENTAL_SYMBOLS["double-sharp"],
    type: "accidental",
    value: "double-sharp",
    useBravura: true,
  },
  {
    id: "sharp",
    label: "Sharp",
    symbol: ACCIDENTAL_SYMBOLS.sharp,
    type: "accidental",
    value: "sharp",
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
  {
    id: "flat",
    label: "Flat",
    symbol: ACCIDENTAL_SYMBOLS.flat,
    type: "accidental",
    value: "flat",
    useBravura: true,
  },
  {
    id: "double-flat",
    label: "Double Flat",
    symbol: ACCIDENTAL_SYMBOLS["double-flat"],
    type: "accidental",
    value: "double-flat",
    useBravura: true,
  },
  { id: "tie", label: "Tie", symbol: "\uE1FD", type: "tie", useBravura: true },
];

// =============================================================================
// Component
// =============================================================================

function ModifierRowComponent({
  onAccidental,
  onTie,
  onOctaveChange,
  activeAccidental,
  tieActive = false,
  disabled = false,
  hasSelection = false,
  testID,
}: ModifierRowProps): React.ReactElement {
  const [scrollState, setScrollState] = useState({
    scrollX: 0,
    containerWidth: 0,
  });

  // Calculate minimum content width: 6 buttons * 44px + 5 gaps * 2px
  const MIN_CONTENT_WIDTH = 6 * 44 + 5 * 2; // 274px

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollState((prev) => ({
        ...prev,
        scrollX: event.nativeEvent.contentOffset.x,
      }));
    },
    [],
  );

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollState((prev) => ({
      ...prev,
      containerWidth: event.nativeEvent.layout.width,
    }));
  }, []);

  const handlePress = useCallback(
    (button: ModifierButton) => {
      if (disabled) return;

      switch (button.type) {
        case "accidental":
          if (button.value) {
            onAccidental(button.value);
          }
          break;
        case "tie":
          onTie();
          break;
      }
    },
    [disabled, onAccidental, onTie],
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

  // Calculate fade visibility based on minimum content width
  const canScrollLeft = scrollState.scrollX > 2;
  const canScrollRight =
    MIN_CONTENT_WIDTH > scrollState.containerWidth &&
    scrollState.scrollX < MIN_CONTENT_WIDTH - scrollState.containerWidth - 2;

  // Check if there's extra space - buttons should stretch to fill
  const hasExtraSpace = scrollState.containerWidth > MIN_CONTENT_WIDTH;

  return (
    <View style={styles.container} testID={testID}>
      {/* Scrollable modifier buttons with border */}
      <View style={styles.scrollBorder}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            hasExtraSpace && styles.scrollContentFlex,
          ]}
          onScroll={handleScroll}
          onLayout={handleLayout}
          scrollEventThrottle={16}
        >
          {MODIFIER_BUTTONS.map((button) => {
            const isActive = isButtonActive(button);
            const buttonDisabled = isButtonDisabled(button);

            return (
              <TouchableOpacity
                key={button.id}
                style={[
                  styles.button,
                  hasExtraSpace && styles.buttonFlex,
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
                <Text
                  style={[
                    styles.symbol,
                    button.useBravura && styles.bravuraSymbol,
                    button.type === "tie" && styles.tieSymbol,
                    isActive && styles.symbolActive,
                    buttonDisabled && styles.symbolDisabled,
                  ]}
                >
                  {button.symbol}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Left fade */}
        {canScrollLeft && (
          <LinearGradient
            colors={[colors.primaryLight, `${colors.primaryLight}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeLeft}
            pointerEvents="none"
          />
        )}

        {/* Right fade */}
        {canScrollRight && (
          <LinearGradient
            colors={[`${colors.primaryLight}00`, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeRight}
            pointerEvents="none"
          />
        )}
      </View>

      {/* Fixed octave controls with fieldset-style border */}
      <View style={styles.octaveFieldset}>
        <View style={styles.octaveLabelContainer}>
          <Text style={styles.octaveLabel}>Octave</Text>
        </View>
        <View style={styles.octaveControls}>
          <TouchableOpacity
            style={[
              styles.octaveButton,
              (!hasSelection || disabled) && styles.buttonDisabled,
            ]}
            onPress={() => hasSelection && !disabled && onOctaveChange("up")}
            disabled={!hasSelection || disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Octave up"
            accessibilityState={{ disabled: !hasSelection || disabled }}
            testID="octave-up"
          >
            <Feather
              name="chevron-up"
              size={20}
              color={
                hasSelection && !disabled
                  ? colors.textPrimary
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.octaveButton,
              (!hasSelection || disabled) && styles.buttonDisabled,
            ]}
            onPress={() => hasSelection && !disabled && onOctaveChange("down")}
            disabled={!hasSelection || disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Octave down"
            accessibilityState={{ disabled: !hasSelection || disabled }}
            testID="octave-down"
          >
            <Feather
              name="chevron-down"
              size={20}
              color={
                hasSelection && !disabled
                  ? colors.textPrimary
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 0,
    gap: 8,
  },
  scrollBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
    padding: 4,
    position: "relative",
  },
  scrollContent: {
    flexDirection: "row",
    gap: 2,
  },
  scrollContentFlex: {
    flexGrow: 1,
  },
  fadeLeft: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    width: 32,
    borderRadius: 4,
  },
  fadeRight: {
    position: "absolute",
    right: 4,
    top: 4,
    bottom: 4,
    width: 32,
    borderRadius: 4,
  },
  button: {
    width: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
  buttonFlex: {
    flex: 1,
    width: undefined,
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
  tieSymbol: {
    transform: [{ scaleY: -1 }],
  },
  symbolActive: {
    color: colors.warning,
  },
  symbolDisabled: {
    color: colors.textSecondary,
  },
  octaveFieldset: {
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: 6,
    padding: 4,
    position: "relative",
  },
  octaveLabelContainer: {
    position: "absolute",
    top: -7,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  octaveLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: colors.background,
    paddingHorizontal: 3,
  },
  octaveControls: {
    flexDirection: "row",
    gap: 2,
  },
  octaveButton: {
    width: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 44,
  },
});

// =============================================================================
// Export
// =============================================================================

export const ModifierRow = memo(ModifierRowComponent);
