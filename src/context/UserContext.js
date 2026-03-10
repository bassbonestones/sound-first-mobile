/**
 * UserContext - Global user state including selected instrument
 *
 * Provides:
 * - userId: Current user ID
 * - instruments: Array of user's instruments
 * - selectedInstrument: Currently selected instrument for practice
 * - Functions to fetch, select, add, and update instruments
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  getUserInstruments,
  createUserInstrument,
  updateUserInstrument,
  selectUserInstrument,
} from "../api/users";

const UserContext = createContext(null);

export function UserProvider({ children, initialUserId = 1 }) {
  const [userId] = useState(initialUserId);
  const [instruments, setInstruments] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch instruments from API and select last used or first
   */
  const loadInstruments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserInstruments(userId);
      setInstruments(data.instruments || []);

      // Auto-select: last used > primary > first
      if (data.instruments && data.instruments.length > 0) {
        let selected = null;
        // Prefer last used instrument if available
        if (data.last_instrument_id) {
          selected = data.instruments.find(
            (i) => i.id === data.last_instrument_id,
          );
        }
        // Fall back to first in list
        if (!selected) {
          selected = data.instruments[0];
        }
        setSelectedInstrument(selected);
      } else {
        setSelectedInstrument(null);
      }
    } catch (err) {
      console.error("[UserContext] Failed to load instruments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Select an instrument for practice (persisted to server)
   */
  const selectInstrument = useCallback(
    async (instrument) => {
      setSelectedInstrument(instrument);
      // Persist selection to server (fire and forget)
      try {
        await selectUserInstrument(userId, instrument.id);
      } catch (err) {
        console.error(
          "[UserContext] Failed to persist instrument selection:",
          err,
        );
        // Don't throw - local selection still works
      }
    },
    [userId],
  );

  /**
   * Add a new instrument
   */
  const addInstrument = useCallback(
    async (instrumentData) => {
      setLoading(true);
      try {
        const result = await createUserInstrument(userId, instrumentData);
        // Refresh list
        await loadInstruments();
        return result.instrument;
      } catch (err) {
        console.error("[UserContext] Failed to add instrument:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, loadInstruments],
  );

  /**
   * Update an instrument (e.g., after completing Day 0)
   */
  const updateInstrument = useCallback(
    async (instrumentId, updates) => {
      try {
        const result = await updateUserInstrument(
          userId,
          instrumentId,
          updates,
        );
        // Update local state
        setInstruments((prev) =>
          prev.map((inst) =>
            inst.id === instrumentId ? { ...inst, ...updates } : inst,
          ),
        );
        // Update selected if it's the one being updated
        if (selectedInstrument?.id === instrumentId) {
          setSelectedInstrument((prev) => ({ ...prev, ...updates }));
        }
        return result.instrument;
      } catch (err) {
        console.error("[UserContext] Failed to update instrument:", err);
        throw err;
      }
    },
    [userId, selectedInstrument],
  );

  const value = {
    userId,
    instruments,
    selectedInstrument,
    loading,
    error,
    loadInstruments,
    selectInstrument,
    addInstrument,
    updateInstrument,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/**
 * Hook to access user context
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
