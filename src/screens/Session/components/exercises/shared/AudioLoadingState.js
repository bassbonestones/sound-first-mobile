/**
 * AudioLoadingState - Loading indicator for audio initialization
 *
 * Shows a spinner while audio context is being initialized,
 * and an error state with retry button if initialization fails.
 */
import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "./lessonStyles";

/**
 * Audio loading state component
 * @param {boolean} isLoading - Whether audio is still loading
 * @param {Error|null} error - Error if audio init failed
 * @param {Function} onRetry - Callback to retry audio initialization
 * @param {string} message - Custom loading message
 */
export function AudioLoadingState({
  isLoading = true,
  error = null,
  onRetry,
  message = "Initializing audio...",
}) {
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🔇</Text>
          <Text style={styles.title}>Audio Not Available</Text>
          <Text style={styles.message}>
            {error.message || "Could not initialize audio. Please try again."}
          </Text>

          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              accessibilityLabel="Retry audio initialization"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    );
  }

  return null;
}

/**
 * Wrapper component that shows loading state while audio initializes
 * @param {boolean} isAudioReady - Whether audio is ready
 * @param {Error|null} audioError - Audio initialization error
 * @param {Function} onRetry - Retry callback
 * @param {React.ReactNode} children - Content to render when ready
 */
export function WithAudioLoading({
  isAudioReady,
  audioError,
  onRetry,
  children,
}) {
  if (!isAudioReady || audioError) {
    return (
      <AudioLoadingState
        isLoading={!audioError && !isAudioReady}
        error={audioError}
        onRetry={onRetry}
      />
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
});

AudioLoadingState.propTypes = {
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  onRetry: PropTypes.func,
  message: PropTypes.string,
};

export default AudioLoadingState;
