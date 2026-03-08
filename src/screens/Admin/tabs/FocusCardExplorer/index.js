/**
 * FocusCardExplorer - Focus card management
 * Part of Admin console
 */
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import styles from "../../styles";
import { useFocusCards } from "./hooks";
import FocusCardDetailView from "./components/FocusCardDetailView";
import FocusCardEditModal from "./components/FocusCardEditModal";
import FocusCardCreateModal from "./components/FocusCardCreateModal";

function FocusCardExplorer() {
  // Use extracted hook for all state and CRUD operations
  const {
    focusCards,
    filteredFocusCards,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    categories,
    selectedFocusCard,
    setSelectedFocusCard,
    createFocusCard,
    deleteFocusCard,
    fetchFocusCards,
  } = useFocusCards();

  // Modal visibility state (UI-only, not in hook)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (focusCardId) => {
    const result = await deleteFocusCard(focusCardId);
    if (result.success) {
      setShowDetailModal(false);
      setSelectedFocusCard(null);
    } else {
      alert(result.error || "Failed to delete focus card");
    }
  };

  const handleCreate = async (createData) => {
    const result = await createFocusCard(createData);
    if (result.success) {
      setShowCreateModal(false);
    } else {
      throw new Error(result.error || "Failed to create focus card");
    }
  };

  const renderFocusCardItem = ({ item }) => (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => {
          setSelectedFocusCard(item);
          setShowDetailModal(true);
        }}
      >
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemTitle}>{item.name}</Text>
          <Text style={styles.listItemBadge}>
            {item.category || "Uncategorized"}
          </Text>
        </View>
        <View style={styles.listItemDetails}>
          <Text style={styles.listItemDetail}>
            {item.micro_cues?.length || 0} micro cues
          </Text>
          <Text style={styles.listItemDetail}>
            {Object.keys(item.prompts || {}).length} prompts
          </Text>
        </View>
        {item.description && (
          <Text style={styles.listItemSubtext} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading focus cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Search and Filters */}
      <View style={styles.filterBar}>
        <TextInput
          style={[styles.searchInput, { flex: 1 }]}
          placeholder="Search focus cards..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.addCapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addCapButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        style={styles.domainScroll}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.domainChip,
            categoryFilter === "all" && styles.domainChipActive,
          ]}
          onPress={() => setCategoryFilter("all")}
        >
          <Text
            style={[
              styles.domainChipText,
              categoryFilter === "all" && styles.domainChipTextActive,
            ]}
          >
            All ({focusCards.length})
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.domainChip,
              categoryFilter === cat && styles.domainChipActive,
            ]}
            onPress={() => setCategoryFilter(cat)}
          >
            <Text
              style={[
                styles.domainChipText,
                categoryFilter === cat && styles.domainChipTextActive,
              ]}
            >
              {cat} ({focusCards.filter((fc) => fc.category === cat).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      <Text style={styles.resultCount}>
        {filteredFocusCards.length} focus card
        {filteredFocusCards.length !== 1 ? "s" : ""}
      </Text>

      {/* Focus Cards List */}
      <FlatList
        data={filteredFocusCards}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFocusCardItem}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No focus cards found</Text>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedFocusCard && (
          <FocusCardDetailView
            focusCard={selectedFocusCard}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedFocusCard(null);
            }}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onDelete={() => handleDelete(selectedFocusCard.id)}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        {selectedFocusCard && (
          <FocusCardEditModal
            focusCard={selectedFocusCard}
            categories={categories}
            onClose={() => {
              setShowEditModal(false);
              setSelectedFocusCard(null);
            }}
            onSave={async () => {
              await fetchFocusCards();
              setShowEditModal(false);
              setSelectedFocusCard(null);
            }}
          />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <FocusCardCreateModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      </Modal>
    </View>
  );
}

export default FocusCardExplorer;
