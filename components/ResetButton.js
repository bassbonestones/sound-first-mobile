import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";

function getBackendUrl() {
  const LOCAL_IP = "192.168.1.118";
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IP}:8000`;
  } else if (Platform.OS === "web") {
    return `http://${window.location.hostname}:8000`;
  }
  return `http://${LOCAL_IP}:8000`;
}

/**
 * Small reset button for bottom-left corner of screens.
 * Clears all user data and navigates back to onboarding.
 */
export default function ResetButton({ userId = 1 }) {
  const navigation = useNavigation();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    if (Platform.OS === "web") {
      // Web: use confirm dialog
      if (window.confirm("Reset all progress and start over?")) {
        performReset();
      }
    } else {
      // Native: use Alert
      Alert.alert(
        "Reset Progress",
        "This will clear all your data and start over. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Reset", style: "destructive", onPress: performReset },
        ]
      );
    }
  };

  const performReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`${getBackendUrl()}/users/${userId}/reset`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset user data");
      }

      // Navigate to Onboarding and reset the navigation stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        })
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

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleReset}
      disabled={isResetting}
    >
      {isResetting ? (
        <ActivityIndicator size="small" color="#888" />
      ) : (
        <Text style={styles.icon}>↺</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  icon: {
    fontSize: 20,
    color: "#666",
  },
});
