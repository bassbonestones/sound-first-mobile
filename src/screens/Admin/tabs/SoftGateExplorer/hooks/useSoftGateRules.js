/**
 * useSoftGateRules - Hook for soft gate rule CRUD operations
 * Extracted from SoftGateExplorer for reusability
 */
import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../../../api/client";

/**
 * Hook for managing soft gate rules
 * @returns {Object} Rules state and CRUD functions
 */
export function useSoftGateRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Fetch all soft gate rules
   */
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/admin/soft-gate-rules`);
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        setError("Failed to fetch rules");
      }
    } catch (err) {
      console.error("[useSoftGateRules] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load rules on mount
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  /**
   * Create a new soft gate rule
   * @param {Object} ruleData - Rule data to create
   * @returns {Object} Result with success status
   */
  const createRule = async (ruleData) => {
    try {
      const response = await fetch(`${baseUrl}/admin/soft-gate-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        await fetchRules();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to create rule" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update an existing soft gate rule
   * @param {number} ruleId - Rule ID to update
   * @param {Object} ruleData - Updated rule data
   * @returns {Object} Result with success status
   */
  const updateRule = async (ruleId, ruleData) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/soft-gate-rules/${ruleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ruleData),
        },
      );

      if (response.ok) {
        await fetchRules();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to update rule" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Delete a soft gate rule
   * @param {number} ruleId - Rule ID to delete
   * @returns {Object} Result with success status
   */
  const deleteRule = async (ruleId) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/soft-gate-rules/${ruleId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await fetchRules();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to delete rule" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    // State
    rules,
    loading,
    selectedRule,
    error,

    // Setters
    setSelectedRule,

    // Actions
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
  };
}

export default useSoftGateRules;
