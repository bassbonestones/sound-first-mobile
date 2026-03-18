/**
 * useShareExtension Hook
 *
 * React hook for handling files shared from other apps.
 * Sets up listeners for incoming share URLs and provides
 * the imported file to the component.
 */

import { useEffect, useState, useCallback, useRef } from "react";

import type { ShareExtensionAsset } from "../services/shareExtensionService";
import {
  createShareExtensionListener,
  ShareExtensionError,
  cleanupSharedFilesCache,
} from "../services/shareExtensionService";

// ============================================================================
// Types
// ============================================================================

export interface UseShareExtensionOptions {
  /** Whether to listen for shared files (default: true) */
  readonly enabled?: boolean;
  /** Supported file extensions (default: all import types) */
  readonly supportedExtensions?: readonly string[];
  /** Callback when a file is received */
  readonly onFileReceived?: (asset: ShareExtensionAsset) => void;
  /** Callback when an error occurs */
  readonly onError?: (error: ShareExtensionError) => void;
  /** Whether to auto-cleanup old shared files (default: true) */
  readonly autoCleanup?: boolean;
}

export interface UseShareExtensionResult {
  /** The most recently received shared file */
  readonly sharedFile: ShareExtensionAsset | null;
  /** Any error that occurred */
  readonly error: ShareExtensionError | null;
  /** Whether we're currently processing a shared file */
  readonly isProcessing: boolean;
  /** Clear the current shared file */
  readonly clearSharedFile: () => void;
  /** Clear the current error */
  readonly clearError: () => void;
  /** Manually cleanup old shared files from cache */
  readonly cleanupCache: () => Promise<number>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_EXTENSIONS = [
  "xml",
  "musicxml",
  "mxl",
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "heic",
] as const;

// ============================================================================
// Hook
// ============================================================================

export function useShareExtension(
  options: UseShareExtensionOptions = {},
): UseShareExtensionResult {
  const {
    enabled = true,
    supportedExtensions = DEFAULT_EXTENSIONS,
    onFileReceived,
    onError,
    autoCleanup = true,
  } = options;

  const [sharedFile, setSharedFile] = useState<ShareExtensionAsset | null>(
    null,
  );
  const [error, setError] = useState<ShareExtensionError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs to avoid stale closures in callbacks
  const onFileReceivedRef = useRef(onFileReceived);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onFileReceivedRef.current = onFileReceived;
  }, [onFileReceived]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Set up share extension listener
  useEffect(() => {
    if (!enabled) return;

    setIsProcessing(true);

    const cleanup = createShareExtensionListener({
      supportedExtensions,
      onFileReceived: (asset) => {
        setIsProcessing(false);
        setError(null);
        setSharedFile(asset);
        onFileReceivedRef.current?.(asset);
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err);
        onErrorRef.current?.(err);
      },
    });

    // After initial URL check completes
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 500);

    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, [enabled, supportedExtensions]);

  // Auto-cleanup old shared files
  useEffect(() => {
    if (!autoCleanup) return;

    // Cleanup on mount
    cleanupSharedFilesCache();

    // Cleanup periodically (every hour)
    const interval = setInterval(
      () => {
        cleanupSharedFilesCache();
      },
      60 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [autoCleanup]);

  // Actions
  const clearSharedFile = useCallback(() => {
    setSharedFile(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cleanupCache = useCallback(async () => {
    return cleanupSharedFilesCache();
  }, []);

  return {
    sharedFile,
    error,
    isProcessing,
    clearSharedFile,
    clearError,
    cleanupCache,
  };
}
