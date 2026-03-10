/**
 * TimeUpModal - Shows when target session duration is reached
 *
 * Offers options to:
 * - Continue practicing (dismiss modal, keep timer running)
 * - Finish session (go to session end screen)
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";

export default function TimeUpModal({
  visible,
  onDismiss,
  onExtend,
  onFinish,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.title}>Time's Up!</Text>
          <Text style={styles.subtitle}>
            You've reached your planned practice duration.
          </Text>
          <Text style={styles.message}>
            Great work! Would you like to keep going or wrap up?
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={onDismiss}
            >
              <Text style={styles.continueButtonText}>Keep Going</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.extendButton]}
              onPress={onExtend}
            >
              <Text style={styles.extendButtonText}>Add More Material</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.finishButton]}
              onPress={onFinish}
            >
              <Text style={styles.finishButtonText}>Finish Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#2a2a4a",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 24,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#FFD700",
  },
  continueButtonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "bold",
  },
  extendButton: {
    backgroundColor: "#3a3a5a",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  extendButtonText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
  },
  finishButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  finishButtonText: {
    color: "#aaa",
    fontSize: 16,
  },
});
