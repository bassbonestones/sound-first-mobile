/**
 * TuneList - List of tunes with expand/collapse and reorder
 */
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import TuneCard, { TuneData, TuneSettings } from "./TuneCard";

export interface TuneListProps {
  tunes: TuneData[];
  isArchive?: boolean;
  onReorder?: (tuneId: string, direction: number) => void;
  onArchive?: (tuneId: string) => void;
  onRestore?: (tuneId: string) => void;
  onDelete?: (tuneId: string) => void;
  onRename?: (tuneId: string, name: string) => void;
  onUpdateSettings?: (tuneId: string, settings: TuneSettings) => void;
  masteryThreshold?: number;
}

const TuneList = React.memo(function TuneList({
  tunes,
  isArchive = false,
  onReorder,
  onArchive,
  onRestore,
  onDelete,
  onRename,
  onUpdateSettings,
  masteryThreshold = 95,
}: TuneListProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((tuneId: string) => {
    setExpandedId((prev) => (prev === tuneId ? null : tuneId));
  }, []);

  if (tunes.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
        accessible={true}
        accessibilityLabel={
          isArchive
            ? "No archived tunes"
            : "No tunes yet. Add one to get started"
        }
        accessibilityRole="text"
      >
        <Text style={styles.emptyText}>
          {isArchive
            ? "No archived tunes"
            : "No tunes yet. Add one to get started!"}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={false}
      accessibilityLabel={`${isArchive ? "Archived" : "Active"} tune list with ${tunes.length} ${tunes.length === 1 ? "tune" : "tunes"}`}
    >
      {tunes.map((tune, index) => (
        <TuneCard
          key={tune.id}
          tune={tune}
          isExpanded={expandedId === tune.id}
          onToggleExpand={() => handleToggleExpand(tune.id)}
          isFirst={index === 0}
          isLast={index === tunes.length - 1}
          isArchive={isArchive}
          onMoveUp={onReorder ? () => onReorder(tune.id, -1) : undefined}
          onMoveDown={onReorder ? () => onReorder(tune.id, 1) : undefined}
          onArchive={onArchive ? () => onArchive(tune.id) : undefined}
          onRestore={onRestore ? () => onRestore(tune.id) : undefined}
          onDelete={onDelete ? () => onDelete(tune.id) : undefined}
          onRename={
            onRename ? (name: string) => onRename(tune.id, name) : undefined
          }
          onUpdateSettings={
            onUpdateSettings
              ? (settings: TuneSettings) => onUpdateSettings(tune.id, settings)
              : undefined
          }
          masteryThreshold={masteryThreshold}
        />
      ))}
    </View>
  );
});

export default TuneList;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
  },
});
