/**
 * useMyScores Hook
 *
 * Manages the list of saved scores with loading, refresh,
 * and delete operations.
 */

import { useState, useCallback, useEffect } from "react";
import {
  listScores,
  deleteScore,
  toggleFavorite,
  type StoredScoreSummary,
  type StorageError,
} from "../services/scoreStorageService";

// ============================================================================
// Types
// ============================================================================

export interface UseMyScoresState {
  /** List of saved scores */
  readonly scores: readonly StoredScoreSummary[];
  /** Whether scores are loading */
  readonly isLoading: boolean;
  /** Whether a refresh is in progress */
  readonly isRefreshing: boolean;
  /** Error message if load failed */
  readonly error: string | null;
}

export interface UseMyScoresActions {
  /** Refresh the list of scores */
  readonly refresh: () => Promise<void>;
  /** Delete a score by ID */
  readonly deleteScore: (id: string) => Promise<boolean>;
  /** Toggle favorite status */
  readonly toggleFavorite: (id: string) => Promise<boolean>;
}

export type UseMyScoresResult = UseMyScoresState & UseMyScoresActions;

// ============================================================================
// Hook
// ============================================================================

export function useMyScores(): UseMyScoresResult {
  const [scores, setScores] = useState<readonly StoredScoreSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scores on mount
  const loadScores = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const result = await listScores();

    if (result.success) {
      setScores(result.data);
    } else {
      setError(result.error.message);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadScores();
  }, [loadScores]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await loadScores(true);
  }, [loadScores]);

  // Delete handler
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteScore(id);
    if (result.success) {
      setScores((prev) => prev.filter((s) => s.id !== id));
      return true;
    }
    return false;
  }, []);

  // Toggle favorite handler
  const handleToggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await toggleFavorite(id);
      if (result.success) {
        setScores((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, isFavorite: result.data.storageMetadata.isFavorite }
              : s,
          ),
        );
        return true;
      }
      return false;
    },
    [],
  );

  return {
    scores,
    isLoading,
    isRefreshing,
    error,
    refresh,
    deleteScore: handleDelete,
    toggleFavorite: handleToggleFavorite,
  };
}
