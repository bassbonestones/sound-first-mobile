/**
 * PrerequisiteSelector - Modal for selecting capability prerequisites
 *
 * Allows selecting capabilities as prerequisites with:
 * - Domain filtering
 * - Search by name
 * - Excludes current capability and already selected ones
 * - Backend validates for circular dependencies
 */
import React from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import styles from "../../../styles";

interface Capability {
  id: number;
  name?: string;
  display_name?: string;
  domain?: string;
}

interface PrerequisiteSelectorProps {
  currentCapabilityId?: number;
  allCapabilities: Capability[];
  selectedIds: number[];
  onSelect: (id: number) => void;
  onClose: () => void;
  prereqDomainFilter?: string;
  setPrereqDomainFilter?: (filter: string) => void;
  prereqSearchQuery?: string;
  setPrereqSearchQuery?: (query: string) => void;
}

export default function PrerequisiteSelector({
  currentCapabilityId,
  allCapabilities,
  selectedIds,
  onSelect,
  onClose,
  prereqDomainFilter,
  setPrereqDomainFilter,
  prereqSearchQuery,
  setPrereqSearchQuery,
}: PrerequisiteSelectorProps) {
  // Get unique domains for filter
  const domains = [...new Set(allCapabilities.map((c) => c.domain))].sort();

  // Filter available capabilities
  const availableCapabilities = allCapabilities.filter((cap) => {
    // Exclude self
    if (cap.id === currentCapabilityId) return false;
    // Exclude already selected
    if (selectedIds.includes(cap.id)) return false;
    // Apply domain filter
    if (prereqDomainFilter !== "all" && cap.domain !== prereqDomainFilter)
      return false;
    // Apply search filter
    if (prereqSearchQuery) {
      const query = prereqSearchQuery.toLowerCase();
      const matchesName = cap.name?.toLowerCase().includes(query);
      const matchesDisplayName = cap.display_name
        ?.toLowerCase()
        .includes(query);
      if (!matchesName && !matchesDisplayName) return false;
    }
    return true;
  });

  // Sort by domain then name
  availableCapabilities.sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  return (
    <View style={styles.prereqSelectorOverlay}>
      <View style={styles.prereqSelectorContainer}>
        <View style={styles.prereqSelectorHeader}>
          <Text style={styles.prereqSelectorTitle}>Select Prerequisite</Text>
          <TouchableOpacity
            accessibilityLabel="Close prerequisite selector"
            accessibilityRole="button"
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.prereqSelectorSearch}>
          <TextInput
            style={styles.prereqSearchInput}
            placeholder="Search capabilities..."
            value={prereqSearchQuery}
            onChangeText={setPrereqSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Domain filter chips */}
        <ScrollView
          horizontal
          style={styles.prereqDomainScroll}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            accessibilityLabel="Show all domains"
            accessibilityRole="button"
            style={[
              styles.prereqDomainChip,
              prereqDomainFilter === "all" && styles.prereqDomainChipActive,
            ]}
            onPress={() => setPrereqDomainFilter("all")}
          >
            <Text
              style={[
                styles.prereqDomainChipText,
                prereqDomainFilter === "all" &&
                  styles.prereqDomainChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {domains.map((domain) => (
            <TouchableOpacity
              key={domain}
              accessibilityLabel={`Filter by ${domain} domain`}
              accessibilityRole="button"
              style={[
                styles.prereqDomainChip,
                prereqDomainFilter === domain && styles.prereqDomainChipActive,
              ]}
              onPress={() => setPrereqDomainFilter(domain)}
            >
              <Text
                style={[
                  styles.prereqDomainChipText,
                  prereqDomainFilter === domain &&
                    styles.prereqDomainChipTextActive,
                ]}
              >
                {domain}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <Text style={styles.prereqResultCount}>
          {availableCapabilities.length} available
        </Text>

        <FlatList
          data={availableCapabilities}
          keyExtractor={(item) => String(item.id)}
          style={styles.prereqSelectorList}
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityLabel={`Select ${item.display_name || item.name} as prerequisite`}
              accessibilityRole="button"
              style={styles.prereqSelectItem}
              onPress={() => {
                onSelect(item.id);
                onClose();
              }}
            >
              <Text style={styles.prereqSelectItemName}>
                {item.display_name || item.name}
              </Text>
              <View style={styles.prereqSelectItemMeta}>
                <Text style={styles.prereqSelectItemDomain}>{item.domain}</Text>
                <Text style={styles.prereqSelectItemId}>ID: {item.id}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.prereqEmptyText}>
              No matching capabilities found
            </Text>
          }
        />

        {/* Cancel Button */}
        <TouchableOpacity
          accessibilityLabel="Cancel"
          accessibilityRole="button"
          style={styles.prereqSelectorCancelButton}
          onPress={onClose}
        >
          <Text style={styles.prereqSelectorCancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
