/**
 * useFocusCards - Hook for focus card CRUD operations
 * Extracted from FocusCardExplorer for reusability
 */
import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../../../api/client";

/**
 * Hook for managing focus cards
 * @returns {Object} Focus cards state and CRUD functions
 */
export function useFocusCards() {
  const [focusCards, setFocusCards] = useState([]);
  const [filteredFocusCards, setFilteredFocusCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [selectedFocusCard, setSelectedFocusCard] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Fetch all focus cards
   */
  const fetchFocusCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/focus-cards`);
      if (response.ok) {
        const data = await response.json();
        setFocusCards(data);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(data.map((fc) => fc.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories.sort());
      } else {
        setError("Failed to fetch focus cards");
      }
    } catch (err) {
      console.error("[useFocusCards] Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load focus cards on mount
  useEffect(() => {
    fetchFocusCards();
  }, [fetchFocusCards]);

  // Filter focus cards when search/category changes
  useEffect(() => {
    filterFocusCards();
  }, [searchQuery, categoryFilter, focusCards]);

  /**
   * Filter focus cards based on search query and category
   */
  const filterFocusCards = useCallback(() => {
    let filtered = focusCards;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (fc) =>
          fc.name?.toLowerCase().includes(query) ||
          fc.description?.toLowerCase().includes(query) ||
          fc.category?.toLowerCase().includes(query),
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((fc) => fc.category === categoryFilter);
    }

    setFilteredFocusCards(filtered);
  }, [searchQuery, categoryFilter, focusCards]);

  /**
   * Create a new focus card
   * @param {Object} createData - Focus card data to create
   * @returns {Object} Result with success status
   */
  const createFocusCard = async (createData) => {
    try {
      const response = await fetch(`${baseUrl}/admin/focus-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        await fetchFocusCards();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to create" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Update an existing focus card
   * @param {number} focusCardId - Focus card ID to update
   * @param {Object} updateData - Updated focus card data
   * @returns {Object} Result with success status
   */
  const updateFocusCard = async (focusCardId, updateData) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/focus-cards/${focusCardId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );

      if (response.ok) {
        await fetchFocusCards();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to update" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Delete a focus card
   * @param {number} focusCardId - Focus card ID to delete
   * @returns {Object} Result with success status
   */
  const deleteFocusCard = async (focusCardId) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/focus-cards/${focusCardId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        await fetchFocusCards();
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, error: err.detail || "Failed to delete" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    // State
    focusCards,
    filteredFocusCards,
    loading,
    searchQuery,
    categoryFilter,
    categories,
    selectedFocusCard,
    error,

    // Setters
    setSearchQuery,
    setCategoryFilter,
    setSelectedFocusCard,

    // Actions
    fetchFocusCards,
    createFocusCard,
    updateFocusCard,
    deleteFocusCard,
  };
}

export default useFocusCards;
