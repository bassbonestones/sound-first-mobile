import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { baseUrl } from "../api/client";

/**
 * Capability data from API
 */
interface Capability {
  id: string | number;
  name: string;
  display_name?: string;
  domain?: string;
  has_lesson?: boolean;
}

/**
 * HelpMenu props
 */
export interface HelpMenuProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Material ID to fetch capabilities for */
  materialId?: string;
  /** Callback when a capability is selected */
  onSelectCapability?: (capability: Capability) => void;
}

const DOMAIN_LABELS: Record<string, string> = {
  clef: "Clefs",
  note_value: "Note Values",
  time_signature: "Time Signatures",
  key_signature: "Keys",
  articulation: "Articulations",
  dynamics: "Dynamics",
  expression: "Expression",
  other: "Other",
};

const DOMAIN_ICONS: Record<string, string> = {
  clef: "🎼",
  note_value: "🎵",
  time_signature: "⏱️",
  key_signature: "🔑",
  articulation: "✏️",
  dynamics: "📢",
  expression: "💫",
  other: "📝",
};

/**
 * HelpMenu - Shows capabilities referenced in a material for quick review
 *
 * Allows users to access teaching content for any capability they encounter
 * during practice, even ones they've already learned.
 */
export default function HelpMenu({
  visible,
  onClose,
  materialId,
  onSelectCapability,
}: HelpMenuProps): React.ReactElement {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && materialId) {
      fetchCapabilities();
    }
  }, [visible, materialId]);

  const fetchCapabilities = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${baseUrl}/materials/${materialId}/help-capabilities`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCapabilities(data.capabilities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCapability = (cap: Capability): void => {
    if (onSelectCapability) {
      onSelectCapability(cap);
    }
  };

  // Group capabilities by domain
  const groupedCapabilities = capabilities.reduce<Record<string, Capability[]>>(
    (acc, cap) => {
      const domain = cap.domain || "other";
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(cap);
      return acc;
    },
    {},
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📚 Help Menu</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close help menu"
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Tap a concept to review its meaning
          </Text>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a90d9" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchCapabilities}
                accessibilityLabel="Retry loading help topics"
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : capabilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No concepts to review for this material.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>
              {Object.entries(groupedCapabilities).map(([domain, caps]) => (
                <View key={domain} style={styles.domainSection}>
                  <View style={styles.domainHeader}>
                    <Text style={styles.domainIcon}>
                      {DOMAIN_ICONS[domain] || "📝"}
                    </Text>
                    <Text style={styles.domainTitle}>
                      {DOMAIN_LABELS[domain] || domain}
                    </Text>
                  </View>

                  {caps.map((cap) => (
                    <TouchableOpacity
                      key={cap.id}
                      style={[
                        styles.capabilityItem,
                        !cap.has_lesson && styles.capabilityItemDisabled,
                      ]}
                      onPress={() =>
                        cap.has_lesson && handleSelectCapability(cap)
                      }
                      disabled={!cap.has_lesson}
                      accessibilityLabel={`Learn about ${cap.display_name || cap.name}${!cap.has_lesson ? ", coming soon" : ""}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.capabilityName}>
                        {cap.display_name || cap.name}
                      </Text>
                      {cap.has_lesson ? (
                        <Text style={styles.capabilityArrow}>→</Text>
                      ) : (
                        <Text style={styles.capabilityNoLesson}>
                          (coming soon)
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface Styles {
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  subtitle: TextStyle;
  scrollView: ViewStyle;
  domainSection: ViewStyle;
  domainHeader: ViewStyle;
  domainIcon: TextStyle;
  domainTitle: TextStyle;
  capabilityItem: ViewStyle;
  capabilityItemDisabled: ViewStyle;
  capabilityName: TextStyle;
  capabilityArrow: TextStyle;
  capabilityNoLesson: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryButton: ViewStyle;
  retryButtonText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#888888",
  },
  subtitle: {
    fontSize: 14,
    color: "#888888",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  domainSection: {
    marginBottom: 20,
  },
  domainHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 4,
  },
  domainIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  domainTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  capabilityItem: {
    backgroundColor: "#262626",
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capabilityItemDisabled: {
    opacity: 0.5,
  },
  capabilityName: {
    fontSize: 18,
    color: "#ffffff",
    flex: 1,
  },
  capabilityArrow: {
    fontSize: 20,
    color: "#4a90d9",
    marginLeft: 8,
  },
  capabilityNoLesson: {
    fontSize: 12,
    color: "#666666",
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#888888",
    marginTop: 12,
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4a90d9",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#888888",
    textAlign: "center",
  },
});
