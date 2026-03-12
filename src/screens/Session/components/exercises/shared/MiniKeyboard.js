import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// Piano keys with sharp naming (default)
const PIANO_KEYS_SHARP = [
  { note: "C4", isBlack: false, label: "C" },
  { note: "C#4", isBlack: true, label: "C#" },
  { note: "D4", isBlack: false, label: "D" },
  { note: "D#4", isBlack: true, label: "D#" },
  { note: "E4", isBlack: false, label: "E" },
  { note: "F4", isBlack: false, label: "F" },
  { note: "F#4", isBlack: true, label: "F#" },
  { note: "G4", isBlack: false, label: "G" },
  { note: "G#4", isBlack: true, label: "G#" },
  { note: "A4", isBlack: false, label: "A" },
  { note: "A#4", isBlack: true, label: "A#" },
  { note: "B4", isBlack: false, label: "B" },
  { note: "C5", isBlack: false, label: "C" },
];

// Piano keys with flat naming
const PIANO_KEYS_FLAT = [
  { note: "C4", isBlack: false, label: "C" },
  { note: "Db4", isBlack: true, label: "Db" },
  { note: "D4", isBlack: false, label: "D" },
  { note: "Eb4", isBlack: true, label: "Eb" },
  { note: "E4", isBlack: false, label: "E" },
  { note: "F4", isBlack: false, label: "F" },
  { note: "Gb4", isBlack: true, label: "Gb" },
  { note: "G4", isBlack: false, label: "G" },
  { note: "Ab4", isBlack: true, label: "Ab" },
  { note: "A4", isBlack: false, label: "A" },
  { note: "Bb4", isBlack: true, label: "Bb" },
  { note: "B4", isBlack: false, label: "B" },
  { note: "C5", isBlack: false, label: "C" },
];

// Black key positioning indices (sharp note names)
const BLACK_KEY_INDICES_SHARP = {
  "C#4": 0,
  "D#4": 1,
  "F#4": 3,
  "G#4": 4,
  "A#4": 5,
};

// Black key positioning indices (flat note names)
const BLACK_KEY_INDICES_FLAT = {
  Db4: 0,
  Eb4: 1,
  Gb4: 3,
  Ab4: 4,
  Bb4: 5,
};

// Dimensions
const WHITE_KEY_WIDTH = 44;
const BLACK_KEY_WIDTH = 28;

/**
 * MiniKeyboard - A visual piano keyboard component for theory exercises
 *
 * @param {Array} highlightNotes - Notes to highlight in green
 * @param {string} highlightFlat - Note to highlight as flat (blue)
 * @param {string} highlightSharp - Note to highlight as sharp (orange)
 * @param {string} skippedNote - Note to show as "skip"
 * @param {Function} onKeyPress - Callback when a key is pressed
 * @param {boolean} interactive - Whether keys are pressable
 * @param {boolean} useFlatNames - Use flat note names (Db, Eb) vs sharp (C#, D#)
 */
const MiniKeyboard = React.memo(function MiniKeyboard({
  highlightNotes = [],
  highlightFlat = null,
  highlightSharp = null,
  skippedNote = null,
  onKeyPress,
  interactive = false,
  useFlatNames = false,
}) {
  const PIANO_KEYS = useFlatNames ? PIANO_KEYS_FLAT : PIANO_KEYS_SHARP;
  const BLACK_KEY_INDICES = useFlatNames
    ? BLACK_KEY_INDICES_FLAT
    : BLACK_KEY_INDICES_SHARP;

  const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);
  const blackKeys = PIANO_KEYS.filter((k) => k.isBlack);

  const isWhiteKeySkipped =
    skippedNote && !skippedNote.includes("#") && !skippedNote.includes("b");

  const renderWhiteKey = (key) => {
    const isHighlighted = highlightNotes.includes(key.note);
    const isFlatHighlight = highlightFlat === key.note;
    const isSharpHighlight = highlightSharp === key.note;
    const isSkipped = isWhiteKeySkipped && skippedNote === key.note;

    const keyStyle = [
      styles.whiteKey,
      isHighlighted && styles.whiteKeyHighlighted,
      isFlatHighlight && styles.whiteKeyFlat,
      isSharpHighlight && styles.whiteKeySharp,
      isSkipped && styles.whiteKeySkipped,
    ];

    const labelStyle = [
      styles.whiteKeyLabel,
      (isHighlighted || isFlatHighlight || isSharpHighlight) &&
        styles.keyLabelHighlighted,
      isSkipped && styles.skippedKeyLabel,
    ];

    const label = isSkipped ? "skip" : key.label;

    if (interactive) {
      return (
        <TouchableOpacity
          key={key.note}
          style={keyStyle}
          onPress={() => onKeyPress?.(key.note)}
          disabled={!interactive}
          testID={`white-key-${key.note}`}
          accessibilityLabel={`Play ${key.note} key`}
          accessibilityRole="button"
        >
          <Text style={labelStyle}>{label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View key={key.note} style={keyStyle} testID={`white-key-${key.note}`}>
        <Text style={labelStyle}>{label}</Text>
      </View>
    );
  };

  const renderBlackKey = (key) => {
    const isHighlighted = highlightNotes.includes(key.note);
    const isFlatHighlight = highlightFlat === key.note;
    const isSharpHighlight = highlightSharp === key.note;
    const isSkipped = skippedNote === key.note;

    const whiteIdx = BLACK_KEY_INDICES[key.note];
    if (whiteIdx === undefined) return null;

    const leftPos = (whiteIdx + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2;

    const keyStyle = [
      styles.blackKey,
      { left: leftPos },
      isHighlighted && styles.blackKeyHighlighted,
      isFlatHighlight && styles.blackKeyFlat,
      isSharpHighlight && styles.blackKeySharp,
      isSkipped && styles.blackKeySkipped,
    ];

    const labelStyle = [
      styles.blackKeyLabel,
      (isHighlighted || isFlatHighlight || isSharpHighlight || isSkipped) &&
        styles.keyLabelHighlighted,
    ];

    const label = isSkipped ? "skip" : key.label;

    if (interactive) {
      return (
        <TouchableOpacity
          key={key.note}
          style={keyStyle}
          onPress={() => onKeyPress?.(key.note)}
          disabled={!interactive}
          testID={`black-key-${key.note}`}
          accessibilityLabel={`Play ${key.note} key`}
          accessibilityRole="button"
        >
          <Text style={labelStyle}>{label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View key={key.note} style={keyStyle} testID={`black-key-${key.note}`}>
        <Text style={labelStyle}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="mini-keyboard">
      <View style={styles.keyboardWrapper}>
        <View style={styles.whiteKeysRow}>{whiteKeys.map(renderWhiteKey)}</View>
        <View style={styles.blackKeysRow}>{blackKeys.map(renderBlackKey)}</View>
      </View>
    </View>
  );
});

MiniKeyboard.propTypes = {
  highlightNotes: PropTypes.arrayOf(PropTypes.string),
  highlightFlat: PropTypes.string,
  highlightSharp: PropTypes.string,
  skippedNote: PropTypes.string,
  onKeyPress: PropTypes.func,
  interactive: PropTypes.bool,
  useFlatNames: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    alignItems: "center",
    marginVertical: 16,
  },
  keyboardWrapper: {
    position: "relative",
    width: 352, // 8 white keys * 44px
    height: 120,
  },
  whiteKeysRow: {
    flexDirection: "row",
    position: "absolute",
    bottom: 0,
  },
  blackKeysRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  // White key styles
  whiteKey: {
    width: 40,
    height: 120,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 4,
    marginHorizontal: 2,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 8,
  },
  whiteKeyHighlighted: {
    backgroundColor: "#90EE90",
  },
  whiteKeyFlat: {
    backgroundColor: "#87CEEB",
  },
  whiteKeySharp: {
    backgroundColor: "#FFB347",
  },
  whiteKeySkipped: {
    backgroundColor: "#FFE4E1",
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  whiteKeyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
  },
  // Black key styles
  blackKey: {
    position: "absolute",
    width: BLACK_KEY_WIDTH,
    height: 70,
    backgroundColor: "#333333",
    borderRadius: 4,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
    zIndex: 1,
  },
  blackKeyHighlighted: {
    backgroundColor: "#228B22",
  },
  blackKeyFlat: {
    backgroundColor: "#4682B4",
  },
  blackKeySharp: {
    backgroundColor: "#FF8C00",
  },
  blackKeySkipped: {
    backgroundColor: "#FF6B6B",
  },
  blackKeyLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  keyLabelHighlighted: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  skippedKeyLabel: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "700",
  },
});

export default MiniKeyboard;
