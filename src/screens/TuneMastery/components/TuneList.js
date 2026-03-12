/**
 * TuneList - List of tunes with expand/collapse and reorder
 */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";
import TuneCard from "./TuneCard";

export default function TuneList({
  tunes,
  isArchive = false,
  onReorder,
  onArchive,
  onRestore,
  onDelete,
  onRename,
  onUpdateSettings,
  masteryThreshold = 95,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggleExpand = (tuneId) => {
    setExpandedId((prev) => (prev === tuneId ? null : tuneId));
  };

  if (tunes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {isArchive
            ? "No archived tunes"
            : "No tunes yet. Add one to get started!"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          onRename={onRename ? (name) => onRename(tune.id, name) : undefined}
          onUpdateSettings={
            onUpdateSettings
              ? (settings) => onUpdateSettings(tune.id, settings)
              : undefined
          }
          masteryThreshold={masteryThreshold}
        />
      ))}
    </View>
  );
}

TuneList.propTypes = {
  tunes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      keys: PropTypes.object.isRequired,
    }),
  ).isRequired,
  isArchive: PropTypes.bool,
  onReorder: PropTypes.func,
  onArchive: PropTypes.func,
  onRestore: PropTypes.func,
  onDelete: PropTypes.func,
  onRename: PropTypes.func,
  onUpdateSettings: PropTypes.func,
  masteryThreshold: PropTypes.number,
};

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
