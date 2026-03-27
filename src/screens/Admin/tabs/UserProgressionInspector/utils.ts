/**
 * Utility functions for UserProgressionInspector
 */
import { Alert, Platform } from "react-native";

interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

/**
 * Cross-platform alert helper (Alert doesn't work on web)
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
): void => {
  if (Platform.OS === "web") {
    // For web, use window.confirm for destructive actions
    const confirmButton = buttons?.find((b) => b.style === "destructive");
    const cancelButton = buttons?.find((b) => b.style === "cancel");
    if (confirmButton && cancelButton) {
      if (window.confirm(`${title}\n\n${message}`)) {
        confirmButton.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
