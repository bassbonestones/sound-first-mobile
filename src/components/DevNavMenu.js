import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { getBackendUrl } from "../api/client";
import { DEV_NAV_ITEMS } from "../constants/devNavItems";

/**
 * Dev Navigation Menu - Generic version for use outside FirstNote
 * Shows a floating button that opens a menu overlay with screen navigation
 * Styled identically to FirstNote's DevNavMenu
 */
export function DevNavMenu({ userId = 1 }) {
  const navigation = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const performReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${getBackendUrl()}/users/${userId}/reset`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to reset");
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        }),
      );
    } catch (err) {
      console.error("Reset error:", err);
      if (Platform.OS === "web") {
        alert("Failed to reset: " + err.message);
      } else {
        Alert.alert("Error", "Failed to reset: " + err.message);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleReset = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Reset all progress and start over?")) {
        performReset();
      }
    } else {
      Alert.alert(
        "Reset Progress",
        "This will clear all your data and start over. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: performReset },
        ],
      );
    }
  };

  const navigateTo = (screen) => {
    setIsOpen(false);
    navigation.navigate(screen);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.menuButtonText}>🔧</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.menuOverlay}>
      <View style={styles.menuContainer}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Dev Navigation</Text>
          <TouchableOpacity
            onPress={() => {
              setIsOpen(false);
            }}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.menuScroll}>
          {DEV_NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.stageRow}
              onPress={() => navigateTo(item.screen)}
            >
              <Text style={styles.stageIcon}>•</Text>
              <Text style={styles.stageName}>
                {item.icon} {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.resetButton, isResetting && { opacity: 0.6 }]}
          onPress={handleReset}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? "Resetting..." : "🔄 Reset User Data"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resetButton,
            { backgroundColor: "#3b2c1a", marginTop: 8 },
          ]}
          onPress={() => {
            setIsOpen(false);
            navigation.navigate("Admin");
          }}
        >
          <Text style={styles.resetButtonText}>⚙️ Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    zIndex: 1000,
  },
  menuButtonText: {
    fontSize: 24,
  },
  menuOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: "#1a1410",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderBottomWidth: 0,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3b2c1a",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
  },
  closeButton: {
    fontSize: 20,
    color: "#FFD700",
    padding: 5,
  },
  menuScroll: {
    maxHeight: 350,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a1f15",
  },
  stageRowActive: {
    backgroundColor: "#2a1f15",
  },
  stageIcon: {
    fontSize: 12,
    color: "#FFD700",
    width: 20,
  },
  stageName: {
    fontSize: 16,
    color: "#fffbe6",
  },
  stageNameActive: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  subStepRow: {
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 16,
    backgroundColor: "#0d0a07",
  },
  subStepName: {
    fontSize: 14,
    color: "#a09080",
  },
  resetButton: {
    margin: 16,
    padding: 12,
    backgroundColor: "#8B0000",
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  settingsRow: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    backgroundColor: "#1a1410",
  },
  settingsName: {
    color: "#a09080",
    fontSize: 14,
  },
  settingsSubStep: {
    backgroundColor: "#151210",
  },
});

export default DevNavMenu;
