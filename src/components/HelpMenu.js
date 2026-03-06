import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";

function getBaseUrl() {
  const LOCAL_IP = "192.168.1.19";
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000`;
  } else if (Platform.OS === "web") {
    return `http://${window.location.hostname}:8000`;
  } else {
    return `http://${LOCAL_IP}:8000`;
  }
}

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
}) {
  const [capabilities, setCapabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && materialId) {
      fetchCapabilities();
    }
  }, [visible, materialId]);

  const fetchCapabilities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getBaseUrl()}/materials/${materialId}/help-capabilities`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCapabilities(data.capabilities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCapability = (cap) => {
    if (onSelectCapability) {
      onSelectCapability(cap);
    }
  };

  // Group capabilities by domain
  const groupedCapabilities = capabilities.reduce((acc, cap) => {
    const domain = cap.domain || "other";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(cap);
    return acc;
  }, {});

  const domainLabels = {
    clef: "Clefs",
    note_value: "Note Values",
    time_signature: "Time Signatures",
    key_signature: "Keys",
    articulation: "Articulations",
    dynamics: "Dynamics",
    expression: "Expression",
    other: "Other",
  };

  const domainIcons = {
    clef: "🎼",
    note_value: "🎵",
    time_signature: "⏱️",
    key_signature: "🔑",
    articulation: "✏️",
    dynamics: "📢",
    expression: "💫",
    other: "📝",
  };

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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
                      {domainIcons[domain] || "📝"}
                    </Text>
                    <Text style={styles.domainTitle}>
                      {domainLabels[domain] || domain}
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

const styles = {
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
};
