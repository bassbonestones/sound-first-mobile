/**
 * AddCapabilityModal - Modal for adding new capabilities
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { CATEGORIES } from "../data/constants";
import styles from "../styles";

interface NewItem {
  capability: string;
  display_name: string;
  category: string;
  teaching_order: number;
  type: string;
}

interface AddCapabilityModalProps {
  visible: boolean;
  newItem: NewItem;
  onChangeItem: (item: NewItem) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export default function AddCapabilityModal({
  visible,
  newItem,
  onChangeItem,
  onAdd,
  onCancel,
}: AddCapabilityModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Capability</Text>

          <Text style={styles.modalLabel}>Capability Code:</Text>
          <TextInput
            style={styles.modalInput}
            value={newItem.capability}
            onChangeText={(text) =>
              onChangeItem({ ...newItem, capability: text })
            }
            placeholder="e.g., note_whole"
            autoCapitalize="none"
          />

          <Text style={styles.modalLabel}>Display Name:</Text>
          <TextInput
            style={styles.modalInput}
            value={newItem.display_name}
            onChangeText={(text) =>
              onChangeItem({ ...newItem, display_name: text })
            }
            placeholder="e.g., Whole Note"
          />

          <Text style={styles.modalLabel}>Category:</Text>
          <ScrollView horizontal style={styles.categoryPicker}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                accessibilityLabel={`Select ${cat} category`}
                accessibilityRole="button"
                style={[
                  styles.catOption,
                  newItem.category === cat && styles.catOptionActive,
                ]}
                onPress={() => onChangeItem({ ...newItem, category: cat })}
              >
                <Text
                  style={[
                    styles.catOptionText,
                    newItem.category === cat && styles.catOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.modalLabel}>Teaching Order:</Text>
          <TextInput
            style={styles.modalInput}
            value={newItem.teaching_order.toString()}
            onChangeText={(text) =>
              onChangeItem({
                ...newItem,
                teaching_order: parseInt(text, 10) || 0,
              })
            }
            keyboardType="numeric"
          />

          <Text style={styles.modalLabel}>Type:</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              accessibilityLabel="Set type to prerequisite"
              accessibilityRole="button"
              style={[
                styles.typeSelectorBtn,
                newItem.type === "P" && styles.typeSelectorBtnActive,
              ]}
              onPress={() => onChangeItem({ ...newItem, type: "P" })}
            >
              <Text
                style={
                  newItem.type === "P"
                    ? styles.typeSelectorTextActive
                    : styles.typeSelectorText
                }
              >
                P - Prerequisite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Set type to teachable"
              accessibilityRole="button"
              style={[
                styles.typeSelectorBtn,
                newItem.type === "T" && styles.typeSelectorBtnActive,
              ]}
              onPress={() => onChangeItem({ ...newItem, type: "T" })}
            >
              <Text
                style={
                  newItem.type === "T"
                    ? styles.typeSelectorTextActive
                    : styles.typeSelectorText
                }
              >
                T - Teachable
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              accessibilityLabel="Cancel adding capability"
              accessibilityRole="button"
              style={styles.modalCancelBtn}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Add new capability"
              accessibilityRole="button"
              style={styles.modalAddBtn}
              onPress={onAdd}
            >
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
