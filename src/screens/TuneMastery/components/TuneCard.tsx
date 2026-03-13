/**
 * TuneCard - Single tune with 12-key score grid
 */
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  GestureResponderEvent,
} from "react-native";
import { ALL_KEYS } from "../../../hooks/useTuneMasteryData";
import KeyBadge from "./KeyBadge";

const TIME_SIGNATURES = [
  "2/4",
  "3/4",
  "4/4",
  "5/4",
  "6/8",
  "7/8",
  "12/8",
] as const;
const SUBDIVISIONS = [1, 2, 3, 4] as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];
export type Subdivision = (typeof SUBDIVISIONS)[number];

export interface KeyScore {
  score: number;
  attempts: number;
}

export interface TuneData {
  id: string;
  name: string;
  keys: Record<string, KeyScore>;
  bpm?: number | null;
  timeSignature?: string;
  subdivision?: number;
  pitchSystem?: "equal" | "just";
  aHertz?: number | null;
}

export interface TuneSettings {
  bpm?: number | null;
  timeSignature?: string;
  subdivision?: number;
  pitchSystem?: "equal" | "just";
  aHertz?: number | null;
}

export interface TuneCardProps {
  tune: TuneData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFirst: boolean;
  isLast: boolean;
  isArchive?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onUpdateSettings?: (settings: TuneSettings) => void;
  masteryThreshold?: number;
}

const TuneCard = React.memo(function TuneCard({
  tune,
  isExpanded,
  onToggleExpand,
  isFirst,
  isLast,
  isArchive = false,
  onMoveUp,
  onMoveDown,
  onArchive,
  onRestore,
  onDelete,
  onRename,
  onUpdateSettings,
  masteryThreshold = 95,
}: TuneCardProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tune.name);
  const [editBpm, setEditBpm] = useState(
    tune.bpm !== null && tune.bpm !== undefined ? String(tune.bpm) : "",
  );
  const [editAHertz, setEditAHertz] = useState(
    tune.aHertz !== null && tune.aHertz !== undefined
      ? String(tune.aHertz)
      : "440",
  );

  // Tap tempo tracking
  const tapTimesRef = useRef<number[]>([]);

  // Calculate tune progress
  const masteredCount = ALL_KEYS.filter(
    (key) => (tune.keys[key]?.score || 0) >= masteryThreshold,
  ).length;
  const isMastered = masteredCount === ALL_KEYS.length;
  const progressPercent = Math.round((masteredCount / ALL_KEYS.length) * 100);

  const handleRename = useCallback(() => {
    if (editName.trim() && editName.trim() !== tune.name) {
      onRename?.(editName.trim());
    } else {
      setEditName(tune.name);
    }
    setIsEditing(false);
  }, [editName, tune.name, onRename]);

  const handleBpmBlur = useCallback(() => {
    const bpmValue = editBpm.trim() === "" ? null : parseInt(editBpm, 10);
    if (bpmValue !== tune.bpm && (bpmValue === null || !isNaN(bpmValue))) {
      onUpdateSettings?.({ bpm: bpmValue });
    }
  }, [editBpm, tune.bpm, onUpdateSettings]);

  const handleAHertzBlur = useCallback(() => {
    const hertzValue =
      editAHertz.trim() === "" ? null : parseInt(editAHertz, 10);
    const currentValue = tune.aHertz ?? 440;
    if (
      hertzValue !== currentValue &&
      (hertzValue === null || !isNaN(hertzValue))
    ) {
      onUpdateSettings?.({ aHertz: hertzValue });
    }
  }, [editAHertz, tune.aHertz, onUpdateSettings]);

  // BPM adjustment handlers
  const handleBpmChange = useCallback(
    (newBpm: number) => {
      const clampedBpm = Math.max(20, Math.min(350, newBpm));
      setEditBpm(String(clampedBpm));
      onUpdateSettings?.({ bpm: clampedBpm });
    },
    [onUpdateSettings],
  );

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);

    // Keep only last 4 taps
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }

    // Calculate average BPM from taps
    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }

    // Reset if too much time passed
    setTimeout(() => {
      if (
        tapTimesRef.current.length > 0 &&
        Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1] > 2000
      ) {
        tapTimesRef.current = [];
      }
    }, 2000);
  }, [handleBpmChange]);

  // aHertz adjustment handler
  const handleAHertzChange = useCallback(
    (newHz: number) => {
      const clampedHz = Math.max(400, Math.min(480, newHz));
      setEditAHertz(String(clampedHz));
      onUpdateSettings?.({ aHertz: clampedHz });
    },
    [onUpdateSettings],
  );

  const handleTimeSignatureChange = useCallback(
    (timeSig: string) => {
      if (timeSig !== tune.timeSignature) {
        onUpdateSettings?.({ timeSignature: timeSig });
      }
    },
    [tune.timeSignature, onUpdateSettings],
  );

  const handleSubdivisionChange = useCallback(
    (sub: number) => {
      if (sub !== tune.subdivision) {
        onUpdateSettings?.({ subdivision: sub });
      }
    },
    [tune.subdivision, onUpdateSettings],
  );

  const handlePitchSystemChange = useCallback(
    (pitchSystem: "equal" | "just") => {
      if (pitchSystem !== tune.pitchSystem) {
        onUpdateSettings?.({ pitchSystem });
      }
    },
    [tune.pitchSystem, onUpdateSettings],
  );

  const handleLongPress = useCallback(() => {
    if (!isArchive && onRename) {
      setIsEditing(true);
    }
  }, [isArchive, onRename]);

  return (
    <View style={[styles.container, isMastered && styles.containerMastered]}>
      {/* Header Row */}
      <View style={styles.header}>
        {/* Expandable area - tap to expand/collapse */}
        <TouchableOpacity
          style={styles.headerExpandable}
          onPress={onToggleExpand}
          onLongPress={handleLongPress}
          accessibilityLabel={`${tune.name}, ${masteredCount} of 12 keys mastered`}
          accessibilityHint={
            isExpanded ? "Collapse" : "Expand to see key scores"
          }
          accessibilityRole="button"
        >
          <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>

          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              onBlur={handleRename}
              onSubmitEditing={handleRename}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Text style={styles.tuneName} numberOfLines={1}>
              {tune.name}
            </Text>
          )}

          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{masteredCount}/12</Text>
          </View>
        </TouchableOpacity>

        {/* Reorder buttons (only for active tunes) - outside the expandable area */}
        {!isArchive && (
          <View style={styles.reorderButtons}>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                isFirst && styles.reorderButtonDisabled,
              ]}
              onPress={() => onMoveUp?.()}
              disabled={isFirst}
              accessibilityLabel="Move up"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.reorderButtonText,
                  isFirst && styles.reorderButtonTextDisabled,
                ]}
              >
                ↑
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.reorderButton,
                isLast && styles.reorderButtonDisabled,
              ]}
              onPress={() => onMoveDown?.()}
              disabled={isLast}
              accessibilityLabel="Move down"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.reorderButtonText,
                  isLast && styles.reorderButtonTextDisabled,
                ]}
              >
                ↓
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Key Grid */}
          <View style={styles.keyGrid}>
            {ALL_KEYS.map((key) => (
              <KeyBadge
                key={key}
                keyName={key}
                score={tune.keys[key]?.score || 0}
                attempts={tune.keys[key]?.attempts || 0}
                masteryThreshold={masteryThreshold}
              />
            ))}
          </View>

          {/* Tempo Settings Row - only for active tunes */}
          {!isArchive && onUpdateSettings && (
            <View style={styles.tempoSection}>
              {/* BPM */}
              <View style={styles.tempoItem}>
                <Text style={styles.tempoLabel}>BPM</Text>
                <View style={styles.adjustRow}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleBpmChange((tune.bpm || 120) - 5)}
                    accessibilityLabel="Decrease BPM by 5"
                  >
                    <Text style={styles.adjustButtonTextSmall}>−5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleBpmChange((tune.bpm || 120) - 1)}
                    accessibilityLabel="Decrease BPM by 1"
                  >
                    <Text style={styles.adjustButtonTextSmall}>−1</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.bpmInput}
                    value={editBpm}
                    onChangeText={setEditBpm}
                    onBlur={handleBpmBlur}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor="#666"
                    maxLength={3}
                  />
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleBpmChange((tune.bpm || 120) + 1)}
                    accessibilityLabel="Increase BPM by 1"
                  >
                    <Text style={styles.adjustButtonTextSmall}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleBpmChange((tune.bpm || 120) + 5)}
                    accessibilityLabel="Increase BPM by 5"
                  >
                    <Text style={styles.adjustButtonTextSmall}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.tapButton}
                    onPress={handleTapTempo}
                    accessibilityLabel="Tap tempo"
                    accessibilityHint="Tap repeatedly to set tempo"
                  >
                    <Text style={styles.tapButtonText}>Tap</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Signature */}
              <View style={styles.tempoItem}>
                <Text style={styles.tempoLabel}>Time</Text>
                <View style={styles.pickerRow}>
                  {TIME_SIGNATURES.map((ts) => (
                    <TouchableOpacity
                      key={ts}
                      style={[
                        styles.pickerOption,
                        tune.timeSignature === ts && styles.pickerOptionActive,
                      ]}
                      onPress={() => handleTimeSignatureChange(ts)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          tune.timeSignature === ts &&
                            styles.pickerOptionTextActive,
                        ]}
                      >
                        {ts}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subdivision */}
              <View style={styles.tempoItem}>
                <Text style={styles.tempoLabel}>Sub</Text>
                <View style={styles.pickerRow}>
                  {SUBDIVISIONS.map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.pickerOption,
                        tune.subdivision === sub && styles.pickerOptionActive,
                      ]}
                      onPress={() => handleSubdivisionChange(sub)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          tune.subdivision === sub &&
                            styles.pickerOptionTextActive,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pitch System */}
              <View style={styles.tempoItem}>
                <Text style={styles.tempoLabel}>Pitch</Text>
                <View style={styles.pickerRow}>
                  {(["equal", "just"] as const).map((ps) => (
                    <TouchableOpacity
                      key={ps}
                      style={[
                        styles.pickerOption,
                        (tune.pitchSystem || "just") === ps &&
                          styles.pickerOptionActive,
                      ]}
                      onPress={() => handlePitchSystemChange(ps)}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          (tune.pitchSystem || "just") === ps &&
                            styles.pickerOptionTextActive,
                        ]}
                      >
                        {ps === "equal" ? "Equal" : "Just"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Concert A */}
              <View style={styles.tempoItem}>
                <Text style={styles.tempoLabel}>A=</Text>
                <View style={styles.adjustRow}>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleAHertzChange((tune.aHertz || 440) - 5)}
                    accessibilityLabel="Decrease Hz by 5"
                  >
                    <Text style={styles.adjustButtonTextSmall}>−5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleAHertzChange((tune.aHertz || 440) - 1)}
                    accessibilityLabel="Decrease Hz by 1"
                  >
                    <Text style={styles.adjustButtonTextSmall}>−1</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.bpmInput}
                    value={editAHertz}
                    onChangeText={setEditAHertz}
                    onBlur={handleAHertzBlur}
                    keyboardType="numeric"
                    placeholder="440"
                    placeholderTextColor="#666"
                    maxLength={3}
                  />
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleAHertzChange((tune.aHertz || 440) + 1)}
                    accessibilityLabel="Increase Hz by 1"
                  >
                    <Text style={styles.adjustButtonTextSmall}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.adjustButtonSmall}
                    onPress={() => handleAHertzChange((tune.aHertz || 440) + 5)}
                    accessibilityLabel="Increase Hz by 5"
                  >
                    <Text style={styles.adjustButtonTextSmall}>+5</Text>
                  </TouchableOpacity>
                  <Text style={styles.aHertzUnit}>Hz</Text>
                </View>
              </View>
            </View>
          )}

          {/* Actions row */}
          <View style={styles.actionsRow}>
            {isArchive ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onRestore}
                  accessibilityLabel="Restore tune"
                  accessibilityRole="button"
                >
                  <Text style={styles.actionButtonText}>Restore</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={onDelete}
                  accessibilityLabel="Delete tune permanently"
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onArchive}
                accessibilityLabel="Archive tune"
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>Archive</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2a2a3e",
    borderRadius: 12,
    overflow: "hidden",
  },
  containerMastered: {
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  headerExpandable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  expandIcon: {
    color: "#888",
    fontSize: 12,
    width: 16,
  },
  tuneName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  nameInput: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    backgroundColor: "#3a3a4e",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBadge: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressText: {
    color: "#888",
    fontSize: 12,
  },
  reorderButtons: {
    flexDirection: "row",
    gap: 4,
  },
  reorderButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  reorderButtonTextDisabled: {
    color: "#666",
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  keyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#3a3a4e",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: "#888",
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  deleteButtonText: {
    color: "#FF6B6B",
    fontSize: 12,
  },

  // Tempo settings
  tempoSection: {
    backgroundColor: "#1a1a2e",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 10,
  },
  tempoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tempoLabel: {
    color: "#888",
    fontSize: 12,
    width: 36,
  },
  bpmInput: {
    backgroundColor: "#3a3a4e",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#FFFFFF",
    fontSize: 14,
    width: 60,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  pickerOption: {
    backgroundColor: "#3a3a4e",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickerOptionActive: {
    backgroundColor: "#FFD700",
  },
  pickerOptionText: {
    color: "#888",
    fontSize: 11,
  },
  pickerOptionTextActive: {
    color: "#1a1a2e",
    fontWeight: "600",
  },
  aHertzRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aHertzUnit: {
    color: "#888",
    fontSize: 12,
  },
  // Adjustment controls
  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  adjustButtonSmall: {
    backgroundColor: "#3a3a4e",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5a4a3a",
  },
  adjustButtonTextSmall: {
    color: "#bfa76a",
    fontSize: 12,
  },
  tapButton: {
    backgroundColor: "#3a3a4e",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginLeft: 4,
  },
  tapButtonText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default TuneCard;
