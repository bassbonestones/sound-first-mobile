/**
 * ChordPreview Component
 *
 * Displays chord tones on a mini staff using OSMD/MusicXML rendering.
 * Used by ChordControls to provide visual preview of chord voicings.
 */

import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import NotationDisplay from "../../../components/NotationDisplay";
import { colors, spacing } from "../../../constants";
import { generateChordPreviewMusicXml } from "../services";

// =============================================================================
// Types
// =============================================================================

export interface ChordPreviewProps {
  /** Chord symbol to preview */
  symbol: string;
  /** Callback to close the preview */
  onClose: () => void;
  /** Optional MIDI note for root (default 60 = C4) */
  rootMidi?: number;
  /** Optional clef type (default 'treble') */
  clef?: "treble" | "bass";
  /** Test ID for testing */
  testID?: string;
}

// =============================================================================
// Component
// =============================================================================

function ChordPreviewComponent({
  symbol,
  onClose,
  rootMidi = 60,
  clef = "treble",
  testID,
}: ChordPreviewProps): React.ReactElement | null {
  // Generate MusicXML for the chord
  const musicXml = useMemo(() => {
    return generateChordPreviewMusicXml(symbol, rootMidi, clef);
  }, [symbol, rootMidi, clef]);

  // If chord can't be rendered, show error message
  if (!musicXml) {
    return (
      <View style={styles.container} testID={testID}>
        <View style={styles.header}>
          <Text style={styles.title}>{symbol}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close preview"
            accessibilityRole="button"
            testID="chord-preview-close"
          >
            <Feather name="x" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to preview this chord</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.title}>{symbol}</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="Close preview"
          accessibilityRole="button"
          testID="chord-preview-close"
        >
          <Feather name="x" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.staffContainer}>
        <NotationDisplay musicxml={musicXml} width={160} height={120} />
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  staffContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: "hidden",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
});

// =============================================================================
// Export
// =============================================================================

export const ChordPreview = memo(ChordPreviewComponent);
