/**
 * useUserSoftGateState - Hook for user soft gate state management
 * Extracted from SoftGateExplorer for reusability
 */
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { baseUrl } from "../../../../../api/client";
import { devError } from "../../../../../utils/devLogger";
import type { User } from "../../../../../types/user";
import type { UserSoftGateState } from "../../../../../api/users";

/** Result of a soft gate state operation */
export interface SoftGateOperationResult {
  success: boolean;
  error?: string;
}

/** Data for updating a soft gate state */
export interface SoftGateStateUpdateData {
  dimension_name: string;
  current_stage?: number;
  current_value?: number;
  passed?: boolean;
}

/** Return type for useUserSoftGateState hook */
export interface UseUserSoftGateStateReturn {
  // State
  users: User[];
  selectedUserId: number | null;
  selectedUser: User | null;
  states: UserSoftGateState[];
  loading: boolean;
  selectedState: UserSoftGateState | null;
  error: string | null;

  // Setters
  setSelectedUserId: Dispatch<SetStateAction<number | null>>;
  setSelectedState: Dispatch<SetStateAction<UserSoftGateState | null>>;

  // Actions
  fetchUsers: () => Promise<void>;
  fetchStates: () => Promise<void>;
  resetStates: (
    dimensionNames?: string[] | null,
  ) => Promise<SoftGateOperationResult>;
  updateState: (
    stateData: SoftGateStateUpdateData,
  ) => Promise<SoftGateOperationResult>;
}

/**
 * Hook for managing user soft gate states
 * @returns Object containing user state data and management functions
 */
export function useUserSoftGateState(): UseUserSoftGateStateReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [states, setStates] = useState<UserSoftGateState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<UserSoftGateState | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all users for dropdown
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`${baseUrl}/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        // Auto-select first user if none selected
        if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].id);
        }
      }
    } catch (err) {
      devError("[useUserSoftGateState] Fetch users error:", err);
    }
  }, [selectedUserId]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetch soft gate states for selected user
   */
  const fetchStates = useCallback(async (): Promise<void> => {
    if (!selectedUserId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${baseUrl}/admin/user-soft-gate-state?user_id=${selectedUserId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStates(data);
      } else {
        setError("Failed to fetch states");
      }
    } catch (err) {
      devError("[useUserSoftGateState] Fetch states error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Fetch states when user changes
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  /**
   * Reset user soft gate states
   * @param dimensionNames - Specific dimensions to reset, or null for all
   * @returns Result with success status
   */
  const resetStates = async (
    dimensionNames: string[] | null = null,
  ): Promise<SoftGateOperationResult> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/user-soft-gate-state/reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUserId,
            dimension_names: dimensionNames,
          }),
        },
      );

      if (response.ok) {
        await fetchStates();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to reset" };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  };

  /**
   * Update a specific soft gate state
   * @param stateData - Updated state data
   * @returns Result with success status
   */
  const updateState = async (
    stateData: SoftGateStateUpdateData,
  ): Promise<SoftGateOperationResult> => {
    try {
      const response = await fetch(`${baseUrl}/admin/user-soft-gate-state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          ...stateData,
        }),
      });

      if (response.ok) {
        await fetchStates();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to update" };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  };

  // Get currently selected user object
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;

  return {
    // State
    users,
    selectedUserId,
    selectedUser,
    states,
    loading,
    selectedState,
    error,

    // Setters
    setSelectedUserId,
    setSelectedState,

    // Actions
    fetchUsers,
    fetchStates,
    resetStates,
    updateState,
  };
}

export default useUserSoftGateState;
