/**
 * CapabilityRow - Individual capability item in the list
 */

import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import styles from "../styles";

const CapabilityRow = React.memo(function CapabilityRow({
  item,
  index,
  isEditing,
  onToggleEdit,
  onUpdateItem,
  onMoveItem,
  onDeleteItem,
}) {
  return (
    <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
      {/* Order number and move buttons */}
      <View style={styles.orderCol}>
        <Text style={styles.orderNum}>{item.teaching_order}</Text>
        <View style={styles.moveButtons}>
          <TouchableOpacity
            accessibilityLabel="Move capability up"
            accessibilityRole="button"
            onPress={() => onMoveItem(item.id, "up")}
            style={styles.moveBtn}
          >
            <Text style={styles.moveBtnText}>▲</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Move capability down"
            accessibilityRole="button"
            onPress={() => onMoveItem(item.id, "down")}
            style={styles.moveBtn}
          >
            <Text style={styles.moveBtnText}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.mainCol}>
        <Text style={styles.displayName}>{item.display_name}</Text>
        <Text style={styles.capability}>{item.capability}</Text>
        <Text style={styles.categoryBadge}>{item.category}</Text>
      </View>

      {/* Type and mastery */}
      <View style={styles.typeCol}>
        <TouchableOpacity
          accessibilityLabel={`Toggle type, currently ${item.type === "P" ? "prerequisite" : "teachable"}`}
          accessibilityRole="button"
          style={[
            styles.typeButton,
            item.type === "P" ? styles.typeP : styles.typeT,
          ]}
          onPress={() =>
            onUpdateItem(item.id, "type", item.type === "P" ? "T" : "P")
          }
        >
          <Text style={styles.typeText}>{item.type}</Text>
        </TouchableOpacity>
        <View style={styles.masteryRow}>
          <Text style={styles.masteryLabel}>Need:</Text>
          <TouchableOpacity
            accessibilityLabel="Decrease mastery count"
            accessibilityRole="button"
            style={styles.masteryBtn}
            onPress={() =>
              onUpdateItem(
                item.id,
                "mastery_count",
                Math.max(1, item.mastery_count - 1),
              )
            }
          >
            <Text>−</Text>
          </TouchableOpacity>
          <Text style={styles.masteryCount}>{item.mastery_count}</Text>
          <TouchableOpacity
            accessibilityLabel="Increase mastery count"
            accessibilityRole="button"
            style={styles.masteryBtn}
            onPress={() =>
              onUpdateItem(item.id, "mastery_count", item.mastery_count + 1)
            }
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit/expand button */}
      <TouchableOpacity
        accessibilityLabel={
          isEditing ? "Collapse edit section" : "Expand edit section"
        }
        accessibilityRole="button"
        style={styles.editBtn}
        onPress={onToggleEdit}
      >
        <Text style={styles.editBtnText}>{isEditing ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {/* Expanded edit section */}
      {isEditing && (
        <View style={styles.editSection}>
          <Text style={styles.editLabel}>Teaching Materials:</Text>
          <TextInput
            style={styles.editInput}
            value={item.teaching_materials}
            onChangeText={(text) =>
              onUpdateItem(item.id, "teaching_materials", text)
            }
            placeholder="material1.musicxml, material2.musicxml"
            placeholderTextColor="#999"
          />

          <Text style={styles.editLabel}>Notes:</Text>
          <TextInput
            style={[styles.editInput, styles.notesInput]}
            value={item.notes}
            onChangeText={(text) => onUpdateItem(item.id, "notes", text)}
            placeholder="Notes about teaching this capability..."
            placeholderTextColor="#999"
            multiline
          />

          <TouchableOpacity
            accessibilityLabel="Delete capability"
            accessibilityRole="button"
            style={styles.deleteBtn}
            onPress={() => onDeleteItem(item.id)}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

CapabilityRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    teaching_order: PropTypes.number,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onToggleEdit: PropTypes.func.isRequired,
  onUpdateItem: PropTypes.func.isRequired,
  onMoveItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
};

export default CapabilityRow;
