/**
 * UserContext - Global user state including selected instrument
 *
 * Provides:
 * - userId: Current user ID
 * - instruments: Array of user's instruments
 * - selectedInstrument: Currently selected instrument for practice
 * - Functions to fetch, select, add, and update instruments
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { devError } from "../utils/devLogger";
import {
  getUserInstruments,
  createUserInstrument,
  updateUserInstrument,
  selectUserInstrument,
} from "../api/users";
import type { Instrument, UserInstrumentsResponse } from "../types/user";

export interface InstrumentCreateData {
  instrument_name: string;
  clef: string;
  transposition?: string;
  low_note?: string;
  high_note?: string;
}

export interface InstrumentUpdateData {
  clef?: string;
  transposition?: string;
  low_note?: string;
  high_note?: string;
  first_note_detected?: string;
  first_note_confirmed?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface UserContextValue {
  userId: number;
  instruments: Instrument[];
  selectedInstrument: Instrument | null;
  loading: boolean;
  error: string | null;
  loadInstruments: () => Promise<void>;
  selectInstrument: (instrument: Instrument) => Promise<void>;
  addInstrument: (instrumentData: InstrumentCreateData) => Promise<Instrument>;
  updateInstrument: (
    instrumentId: number,
    updates: InstrumentUpdateData,
  ) => Promise<Instrument>;
}

const UserContext = createContext<UserContextValue | null>(null);

export interface UserProviderProps {
  children: ReactNode;
  initialUserId?: number;
}

export function UserProvider({
  children,
  initialUserId = 1,
}: UserProviderProps): React.JSX.Element {
  const [userId] = useState(initialUserId);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] =
    useState<Instrument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch instruments from API and select last used or first
   */
  const loadInstruments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getUserInstruments(
        userId,
      )) as UserInstrumentsResponse;
      setInstruments(data.instruments || []);

      // Auto-select: last used > primary > first
      if (data.instruments && data.instruments.length > 0) {
        let selected: Instrument | null = null;
        // Prefer last used instrument if available
        if (data.last_instrument_id) {
          selected =
            data.instruments.find((i) => i.id === data.last_instrument_id) ||
            null;
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
      devError("[UserContext] Failed to load instruments:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Select an instrument for practice (persisted to server)
   */
  const selectInstrument = useCallback(
    async (instrument: Instrument) => {
      setSelectedInstrument(instrument);
      // Persist selection to server (fire and forget)
      try {
        await selectUserInstrument(userId, instrument.id);
      } catch (err) {
        devError("[UserContext] Failed to persist instrument selection:", err);
        // Don't throw - local selection still works
      }
    },
    [userId],
  );

  /**
   * Add a new instrument
   */
  const addInstrument = useCallback(
    async (instrumentData: InstrumentCreateData): Promise<Instrument> => {
      setLoading(true);
      try {
        const result = await createUserInstrument(userId, instrumentData);
        // Refresh list
        await loadInstruments();
        return result.instrument as Instrument;
      } catch (err) {
        devError("[UserContext] Failed to add instrument:", err);
        setError(err instanceof Error ? err.message : String(err));
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
    async (
      instrumentId: number,
      updates: InstrumentUpdateData,
    ): Promise<Instrument> => {
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
          setSelectedInstrument((prev) =>
            prev ? { ...prev, ...updates } : prev,
          );
        }
        return result.instrument as Instrument;
      } catch (err) {
        devError("[UserContext] Failed to update instrument:", err);
        throw err;
      }
    },
    [userId, selectedInstrument],
  );

  const value: UserContextValue = {
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
export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export default UserContext;
