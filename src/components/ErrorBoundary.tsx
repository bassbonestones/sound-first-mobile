/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in child component tree,
 * logs the error, and displays a fallback UI.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Or with custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { devError } from "../utils/devLogger";

declare const __DEV__: boolean;

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console (could also send to error reporting service)
    devError("[ErrorBoundary] Caught error:", error);
    devError("[ErrorBoundary] Error info:", errorInfo);
    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1410",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    backgroundColor: "#2a1f18",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#bfa76a",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: "#1a1410",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    color: "#ff6b6b",
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: "#1a1410",
    fontSize: 16,
    fontWeight: "bold",
  },
});
