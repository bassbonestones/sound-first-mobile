/**
 * Network Utilities
 *
 * Network-related helpers for the import feature.
 * Includes connectivity checking and network error handling.
 *
 * Note: Uses @react-native-community/netinfo if available.
 * Falls back to assuming network is available if not installed.
 */

import { createImportError, type ImportError } from "../../../types/import";

// Network state interface (matches NetInfo's state shape)
interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
  details: { isConnectionExpensive?: boolean } | null;
}

// Try to load NetInfo, gracefully handle if not available
let netInfoFetch: (() => Promise<NetworkState>) | null = null;
let netInfoAddEventListener:
  | ((callback: (state: NetworkState) => void) => () => void)
  | null = null;

try {
  // Dynamic require to avoid build errors if module not present
  const NetInfo = require("@react-native-community/netinfo").default;
  netInfoFetch = () => NetInfo.fetch();
  netInfoAddEventListener = (callback: (state: NetworkState) => void) =>
    NetInfo.addEventListener(callback);
} catch {
  // NetInfo not available, will use fallbacks
}

// ============================================================================
// Types
// ============================================================================

/**
 * Network status result
 */
export interface NetworkStatus {
  /** Whether device has network connectivity */
  readonly isConnected: boolean;
  /** Whether connection is reachable (not just connected) */
  readonly isReachable: boolean;
  /** Connection type (wifi, cellular, etc.) */
  readonly type: string;
  /** Whether on a metered connection */
  readonly isMetered: boolean;
}

/**
 * Options for network check
 */
export interface NetworkCheckOptions {
  /** Whether to require reachability (not just connection) */
  readonly requireReachable?: boolean;
  /** Whether to allow metered connections */
  readonly allowMetered?: boolean;
  /** Custom error message if check fails */
  readonly errorMessage?: string;
}

// ============================================================================
// Network Status
// ============================================================================

/**
 * Get current network status
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!netInfoFetch) {
    // NetInfo not available, assume connected
    return {
      isConnected: true,
      isReachable: true,
      type: "unknown",
      isMetered: false,
    };
  }

  const state = await netInfoFetch();

  return {
    isConnected: state.isConnected ?? false,
    isReachable: state.isInternetReachable ?? false,
    type: state.type,
    isMetered: state.details?.isConnectionExpensive ?? false,
  };
}

/**
 * Check if network is available for operations
 *
 * @param options - Check options
 * @returns Object with success flag and optional error
 */
export async function checkNetworkAvailable(
  options: NetworkCheckOptions = {},
): Promise<{ available: boolean; error?: ImportError }> {
  const {
    requireReachable = true,
    allowMetered = true,
    errorMessage,
  } = options;

  try {
    const status = await getNetworkStatus();

    // Check basic connectivity
    if (!status.isConnected) {
      return {
        available: false,
        error: createImportError(
          "network_error",
          "No network connection available",
          errorMessage ??
            "Please check your internet connection and try again.",
          {
            severity: "recoverable",
            recoverable: true,
            recoveryHint: "Connect to Wi-Fi or cellular data",
            context: { networkStatus: status },
          },
        ),
      };
    }

    // Check reachability
    if (requireReachable && !status.isReachable) {
      return {
        available: false,
        error: createImportError(
          "network_error",
          "Network is connected but internet is not reachable",
          errorMessage ??
            "Your connection appears to be limited. Please try again.",
          {
            severity: "recoverable",
            recoverable: true,
            recoveryHint: "Check if you can open a web page",
            context: { networkStatus: status },
          },
        ),
      };
    }

    // Check metered connection
    if (!allowMetered && status.isMetered) {
      return {
        available: false,
        error: createImportError(
          "network_error",
          "Operation requires unmetered connection",
          errorMessage ??
            "This operation may use data. Connect to Wi-Fi to continue.",
          {
            severity: "recoverable",
            recoverable: true,
            recoveryHint: "Connect to Wi-Fi",
            context: { networkStatus: status },
          },
        ),
      };
    }

    return { available: true };
  } catch (_err) {
    // NetInfo check failed - assume network is available
    // Better to try and fail than block the user
    return { available: true };
  }
}

/**
 * Guard wrapper for network operations
 *
 * @param operation - Async function to execute
 * @param options - Network check options
 * @returns Result of operation or network error
 */
export async function withNetworkCheck<T>(
  operation: () => Promise<T>,
  options: NetworkCheckOptions = {},
): Promise<T | { networkError: ImportError }> {
  const networkCheck = await checkNetworkAvailable(options);

  if (!networkCheck.available && networkCheck.error) {
    return { networkError: networkCheck.error };
  }

  return operation();
}

/**
 * Type guard for network error result
 */
export function isNetworkError<T>(
  result: T | { networkError: ImportError },
): result is { networkError: ImportError } {
  return (
    typeof result === "object" && result !== null && "networkError" in result
  );
}

// ============================================================================
// Connection Change Listener
// ============================================================================

/**
 * Callback for network state changes
 */
export type NetworkChangeCallback = (status: NetworkStatus) => void;

/**
 * Subscribe to network state changes
 *
 * @param callback - Function to call when network state changes
 * @returns Unsubscribe function
 */
export function subscribeToNetworkChanges(
  callback: NetworkChangeCallback,
): () => void {
  if (!netInfoAddEventListener) {
    // NetInfo not available, return no-op unsubscribe
    return () => {};
  }

  const unsubscribe = netInfoAddEventListener((state) => {
    callback({
      isConnected: state.isConnected ?? false,
      isReachable: state.isInternetReachable ?? false,
      type: state.type,
      isMetered: state.details?.isConnectionExpensive ?? false,
    });
  });

  return unsubscribe;
}

// ============================================================================
// Timeout Utilities
// ============================================================================

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeout(
  ms: number,
  message = "Operation timed out",
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
}

/**
 * Race an operation against a timeout
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string,
): Promise<T> {
  return Promise.race([operation, createTimeout(timeoutMs, timeoutMessage)]);
}
