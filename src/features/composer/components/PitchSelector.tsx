/**
 * PitchSelector Component
 *
 * A row of pitch buttons (C, D, E, F, G, A, B) for entering notes.
 * Tapping a pitch inserts a note at the current cursor position.
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
import Svg, { Rect, Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../../../constants";
import {
  PITCH_NAMES,
  DURATION,
  type PitchName,
  type DurationValue,
} from "../types";

// =============================================================================
// Rest Symbols
// =============================================================================

const REST_SYMBOLS: Record<DurationValue, string> = {
  [DURATION.WHOLE]: "\uE4E3",
  [DURATION.HALF]: "\uE4E4",
  [DURATION.QUARTER]: "\uE4E5",
  [DURATION.EIGHTH]: "\uE4E6",
  [DURATION.TRIPLET_QUARTER]: "\uE4E5", // Same as quarter rest
  [DURATION.TRIPLET_EIGHTH]: "\uE4E6", // Same as eighth rest
  [DURATION.SIXTEENTH]: "\uE4E7",
};

function WholeRestSvg({
  disabled,
}: {
  disabled?: boolean;
}): React.ReactElement {
  const fillColor = disabled ? colors.textSecondary : colors.textPrimary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Line x1={2} y1={8} x2={22} y2={8} stroke={fillColor} strokeWidth={1.5} />
      <Rect x={7} y={8} width={10} height={5} fill={fillColor} />
    </Svg>
  );
}

function HalfRestSvg({ disabled }: { disabled?: boolean }): React.ReactElement {
  const fillColor = disabled ? colors.textSecondary : colors.textPrimary;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Line
        x1={2}
        y1={16}
        x2={22}
        y2={16}
        stroke={fillColor}
        strokeWidth={1.5}
      />
      <Rect x={7} y={11} width={10} height={5} fill={fillColor} />
    </Svg>
  );
}

// =============================================================================
// Types
// =============================================================================

export interface PitchSelectorProps {
  /** Called when a pitch is tapped */
  onSelectPitch: (pitch: PitchName) => void;
  /** Called when rest is inserted */
  onInsertRest: () => void;
  /** Currently selected duration (for rest symbol) */
  selectedDuration: DurationValue;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional highlighted pitch (for showing last entered) */
  highlightedPitch?: PitchName | null;
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function PitchSelectorComponent({
  onSelectPitch,
  onInsertRest,
  selectedDuration,
  disabled = false,
  highlightedPitch,
  testID,
}: PitchSelectorProps): React.ReactElement {
  const [scrollState, setScrollState] = useState({
    scrollX: 0,
    containerWidth: 0,
  });

  // Calculate minimum content width: 8 buttons (rest + 7 pitches) * 44px + 7 gaps * 2px
  const MIN_CONTENT_WIDTH = 8 * 44 + 7 * 2; // 366px

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
    (pitch: PitchName) => {
      if (!disabled) {
        onSelectPitch(pitch);
      }
    },
    [disabled, onSelectPitch],
  );

  const handleRest = useCallback(() => {
    if (!disabled) {
      onInsertRest();
    }
  }, [disabled, onInsertRest]);

  const isWholeRest = selectedDuration === DURATION.WHOLE;
  const isHalfRest = selectedDuration === DURATION.HALF;
  const restSymbol =
    REST_SYMBOLS[selectedDuration] || REST_SYMBOLS[DURATION.QUARTER];

  // Calculate fade visibility based on minimum content width
  const canScrollLeft = scrollState.scrollX > 2;
  const canScrollRight =
    MIN_CONTENT_WIDTH > scrollState.containerWidth &&
    scrollState.scrollX < MIN_CONTENT_WIDTH - scrollState.containerWidth - 2;

  // Check if there's extra space - buttons should stretch to fill
  const hasExtraSpace = scrollState.containerWidth > MIN_CONTENT_WIDTH;

  return (
    <View style={styles.container} testID={testID}>
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
          {/* Rest button at the beginning */}
          <TouchableOpacity
            style={[
              styles.button,
              hasExtraSpace && styles.buttonFlex,
              disabled && styles.buttonDisabled,
            ]}
            onPress={handleRest}
            disabled={disabled}
            accessibilityRole={"button" as AccessibilityRole}
            accessibilityLabel="Rest"
            accessibilityState={{ disabled }}
            accessibilityHint="Insert a rest at cursor position"
            testID="pitch-rest"
          >
            {isWholeRest ? (
              <WholeRestSvg disabled={disabled} />
            ) : isHalfRest ? (
              <HalfRestSvg disabled={disabled} />
            ) : (
              <Text
                style={[
                  styles.restSymbol,
                  disabled && styles.pitchTextDisabled,
                ]}
              >
                {restSymbol}
              </Text>
            )}
          </TouchableOpacity>

          {PITCH_NAMES.map((pitch) => {
            const isHighlighted = highlightedPitch === pitch;
            return (
              <TouchableOpacity
                key={pitch}
                style={[
                  styles.button,
                  hasExtraSpace && styles.buttonFlex,
                  isHighlighted && styles.buttonHighlighted,
                  disabled && styles.buttonDisabled,
                ]}
                onPress={() => handlePress(pitch)}
                disabled={disabled}
                accessibilityRole={"button" as AccessibilityRole}
                accessibilityLabel={`Note ${pitch}`}
                accessibilityState={{ disabled }}
                accessibilityHint="Insert this note at cursor position"
                testID={`pitch-${pitch}`}
              >
                <Text
                  style={[
                    styles.pitchText,
                    isHighlighted && styles.pitchTextHighlighted,
                    disabled && styles.pitchTextDisabled,
                  ]}
                >
                  {pitch}
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
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    flexDirection: "row",
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
  restSymbol: {
    fontFamily: "Bravura",
    fontSize: 22,
    color: colors.textPrimary,
  },
  buttonHighlighted: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pitchText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pitchTextHighlighted: {
    color: colors.success,
  },
  pitchTextDisabled: {
    color: colors.textSecondary,
  },
});

// =============================================================================
// Export
// =============================================================================

export const PitchSelector = memo(PitchSelectorComponent);
