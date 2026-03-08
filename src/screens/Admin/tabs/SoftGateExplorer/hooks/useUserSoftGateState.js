/**
 * useUserSoftGateState - Hook for user soft gate state management
 * Extracted from SoftGateExplorer for reusability
 */
import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../../../api/client";

/**
 * Hook for managing user soft gate states
 * @returns {Object} User state data and management functions
 */
export function useUserSoftGateState() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Fetch all users for dropdown
   */
  const fetchUsers = useCallback(async () => {
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
      console.error("[useUserSoftGateState] Fetch users error:", err);
    }
  }, [selectedUserId]);

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetch soft gate states for selected user
   */
  const fetchStates = useCallback(async () => {
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
      console.error("[useUserSoftGateState] Fetch states error:", err);
      setError(err.message);
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
   * @param {Array|null} dimensionNames - Specific dimensions to reset, or null for all
   * @returns {Object} Result with success status
   */
  const resetStates = async (dimensionNames = null) => {
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
      return { success: false, error: err.message };
    }
  };

  /**
   * Update a specific soft gate state
   * @param {Object} stateData - Updated state data
   * @returns {Object} Result with success status
   */
  const updateState = async (stateData) => {
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
      return { success: false, error: err.message };
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
