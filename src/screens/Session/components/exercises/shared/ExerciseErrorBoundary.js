/**
 * ExerciseErrorBoundary - Error boundary for exercise components
 *
 * Catches JavaScript errors in exercise components and displays a
 * user-friendly fallback UI instead of crashing the entire app.
 */
import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { devError } from "../../../../../utils/devLogger";
import { COLORS } from "./lessonStyles";

class ExerciseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in development
    if (__DEV__) {
      devError("Exercise Error:", error);
      devError("Component Stack:", errorInfo?.componentStack);
    }
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleSkip = () => {
    if (this.props.onSkip) {
      this.props.onSkip();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>😕</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              This exercise encountered an error. You can try again or skip to
              the next exercise.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={this.handleRetry}
                accessibilityLabel="Retry exercise"
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {this.props.onSkip && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={this.handleSkip}
                  accessibilityLabel="Skip to next exercise"
                  accessibilityRole="button"
                >
                  <Text style={styles.skipButtonText}>Skip Exercise</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap exercise components with error boundary
 * @param {React.Component} WrappedComponent - Exercise component to wrap
 * @param {string} displayName - Optional display name for debugging
 * @returns {React.Component} Wrapped component with error boundary
 */
export function withExerciseErrorBoundary(WrappedComponent, displayName) {
  const WithErrorBoundary = (props) => {
    const handleSkip = () => {
      // Call onComplete with error result to allow session to continue
      if (props.onComplete) {
        props.onComplete({
          success: false,
          skipped: true,
          error: "Exercise skipped due to error",
        });
      }
    };

    return (
      <ExerciseErrorBoundary onSkip={handleSkip}>
        <WrappedComponent {...props} />
      </ExerciseErrorBoundary>
    );
  };

  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName || WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithErrorBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    fontSize: 24,
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
  debugContainer: {
    backgroundColor: "rgba(255, 82, 82, 0.1)",
    borderRadius: 8,
    padding: 12,
    width: "100%",
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.error,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: COLORS.error,
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  retryButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.secondary,
  },
});

ExerciseErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
  onSkip: PropTypes.func,
};

export default ExerciseErrorBoundary;
