/**
 * CapabilityPath - Curriculum Planning Tool
 *
 * Allows organizing and planning the teaching order of capabilities.
 * Loads from capability_path.csv and persists changes to AsyncStorage.
 * Export function copies CSV back to clipboard for saving.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import ResetButton from "../../components/ResetButton";
import { devLog, devError } from "../../utils/devLogger";
import CapabilityRow from "./components/CapabilityRow";
import AddCapabilityModal from "./components/AddCapabilityModal";
import { CATEGORIES, STORAGE_KEY, DEFAULT_NEW_ITEM } from "./data/constants";
import { INITIAL_DATA, toCSV } from "./data/initialCapabilities";
import styles from "./styles";

interface CapabilityPathProps {
  navigation: {
    navigate?: (screen: string, params?: Record<string, unknown>) => void;
    goBack?: () => void;
  };
}

export default function CapabilityPath({ navigation }: CapabilityPathProps) {
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("teaching_order");
  const [filterCategory, setFilterCategory] = useState("All");
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ ...DEFAULT_NEW_ITEM });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (INITIAL_DATA.length > parsed.length) {
          devLog(
            `[CapabilityPath] Upgrading from ${parsed.length} to ${INITIAL_DATA.length} capabilities`,
          );
          setCapabilities(INITIAL_DATA);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        } else {
          setCapabilities(parsed);
        }
      } else {
        setCapabilities(INITIAL_DATA);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      }
    } catch (e) {
      devError("Failed to load capability data:", e);
      setCapabilities(INITIAL_DATA);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setHasUnsavedChanges(false);
      Alert.alert("Saved", "Changes saved locally");
    } catch (e) {
      devError("Failed to save:", e);
      Alert.alert("Error", "Failed to save changes");
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      "Reset to Defaults?",
      `This will restore all ${INITIAL_DATA.length} capabilities to their default values. Any changes will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(INITIAL_DATA),
            );
            setCapabilities(INITIAL_DATA);
            setHasUnsavedChanges(false);
            Alert.alert(
              "Reset Complete",
              `Loaded ${INITIAL_DATA.length} capabilities`,
            );
          },
        },
      ],
    );
  };

  const exportToClipboard = async () => {
    const csv = toCSV(capabilities);
    await Clipboard.setStringAsync(csv);
    Alert.alert(
      "Exported!",
      "CSV copied to clipboard.\n\nPaste into assets/capability_path.csv to persist changes.",
      [{ text: "OK" }],
    );
  };

  const getSortedData = useCallback(() => {
    let data = [...capabilities];

    if (filterCategory !== "All") {
      data = data.filter((c) => c.category === filterCategory);
    }

    if (sortBy === "teaching_order") {
      data.sort((a, b) => a.teaching_order - b.teaching_order);
    } else if (sortBy === "category") {
      data.sort((a, b) => {
        const catA = CATEGORIES.indexOf(a.category);
        const catB = CATEGORIES.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        return a.teaching_order - b.teaching_order;
      });
    }

    return data;
  }, [capabilities, sortBy, filterCategory]);

  const updateItem = (id, field, value) => {
    const updated = capabilities.map((c) =>
      c.id === id ? { ...c, [field]: value } : c,
    );
    setCapabilities(updated);
    setHasUnsavedChanges(true);
  };

  const moveItem = (id, direction) => {
    const sorted = getSortedData();
    const currentIndex = sorted.findIndex((c) => c.id === id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= sorted.length) return;

    const currentOrder = sorted[currentIndex].teaching_order;
    const swapOrder = sorted[swapIndex].teaching_order;

    const updated = capabilities.map((c) => {
      if (c.id === sorted[currentIndex].id)
        return { ...c, teaching_order: swapOrder };
      if (c.id === sorted[swapIndex].id)
        return { ...c, teaching_order: currentOrder };
      return c;
    });

    setCapabilities(updated);
    setHasUnsavedChanges(true);
  };

  const addNewItem = () => {
    const maxId = Math.max(...capabilities.map((c) => c.id), 0);
    const item = {
      ...newItem,
      id: maxId + 1,
    };
    setCapabilities([...capabilities, item]);
    setShowAddModal(false);
    setNewItem({ ...DEFAULT_NEW_ITEM });
    setHasUnsavedChanges(true);
  };

  const deleteItem = (id) => {
    Alert.alert(
      "Delete Capability?",
      "Are you sure you want to remove this capability?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCapabilities(capabilities.filter((c) => c.id !== id));
            setHasUnsavedChanges(true);
          },
        },
      ],
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Unsaved Changes", "Save before leaving?", [
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
        {
          text: "Save & Exit",
          onPress: async () => {
            await saveData(capabilities);
            navigation.goBack();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      navigation.goBack();
    }
  };

  const renderItem = ({ item, index }) => (
    <CapabilityRow
      item={item}
      index={index}
      isEditing={editingItem === item.id}
      onToggleEdit={() =>
        setEditingItem(editingItem === item.id ? null : item.id)
      }
      onUpdateItem={updateItem}
      onMoveItem={moveItem}
      onDeleteItem={deleteItem}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading capabilities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={styles.backBtn}
          onPress={handleBack}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Capability Path</Text>
        <Text style={styles.subtitle}>{capabilities.length} capabilities</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            accessibilityLabel="Sort by teaching order"
            accessibilityRole="button"
            style={[
              styles.sortBtn,
              sortBy === "teaching_order" && styles.sortBtnActive,
            ]}
            onPress={() => setSortBy("teaching_order")}
          >
            <Text
              style={[
                styles.sortBtnText,
                sortBy === "teaching_order" && styles.sortBtnTextActive,
              ]}
            >
              By Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Sort by category"
            accessibilityRole="button"
            style={[
              styles.sortBtn,
              sortBy === "category" && styles.sortBtnActive,
            ]}
            onPress={() => setSortBy("category")}
          >
            <Text
              style={[
                styles.sortBtnText,
                sortBy === "category" && styles.sortBtnTextActive,
              ]}
            >
              By Category
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            accessibilityLabel="Filter by all categories"
            accessibilityRole="button"
            style={[
              styles.filterBtn,
              filterCategory === "All" && styles.filterBtnActive,
            ]}
            onPress={() => setFilterCategory("All")}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterCategory === "All" && styles.filterBtnTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              accessibilityLabel={`Filter by ${cat} category`}
              accessibilityRole="button"
              style={[
                styles.filterBtn,
                filterCategory === cat && styles.filterBtnActive,
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filterCategory === cat && styles.filterBtnTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={getSortedData()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          accessibilityLabel="Add new capability"
          accessibilityRole="button"
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Save changes"
          accessibilityRole="button"
          style={[styles.saveBtn, !hasUnsavedChanges && styles.saveBtnDisabled]}
          onPress={() => saveData(capabilities)}
          disabled={!hasUnsavedChanges}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Export to clipboard"
          accessibilityRole="button"
          style={styles.exportBtn}
          onPress={exportToClipboard}
        >
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Reset to defaults"
          accessibilityRole="button"
          style={styles.resetBtn}
          onPress={resetToDefaults}
        >
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <AddCapabilityModal
        visible={showAddModal}
        newItem={newItem}
        onChangeItem={setNewItem}
        onAdd={addNewItem}
        onCancel={() => setShowAddModal(false)}
      />

      <ResetButton />
    </View>
  );
}
