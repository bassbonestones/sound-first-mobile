/**
 * UserContext tests
 *
 * Tests for user state management context.
 */
import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock api/users
const mockGetUserInstruments = jest.fn();
const mockCreateUserInstrument = jest.fn();
const mockUpdateUserInstrument = jest.fn();
const mockSelectUserInstrument = jest.fn();

jest.mock("../src/api/users", () => ({
  getUserInstruments: (...args: unknown[]) => mockGetUserInstruments(...args),
  createUserInstrument: (...args: unknown[]) =>
    mockCreateUserInstrument(...args),
  updateUserInstrument: (...args: unknown[]) =>
    mockUpdateUserInstrument(...args),
  selectUserInstrument: (...args: unknown[]) =>
    mockSelectUserInstrument(...args),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

import {
  UserProvider,
  useUser,
  UserContextValue,
} from "../src/context/UserContext";

// Test wrapper
const createWrapper = (initialUserId = 1) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProvider initialUserId={initialUserId}>{children}</UserProvider>
  );
  return Wrapper;
};

// Mock instrument data
const mockInstruments = [
  {
    id: 1,
    instrument_name: "Trumpet",
    clef: "treble",
    transposition: "Bb",
    low_note: "E3",
    high_note: "C6",
    first_note_detected: null,
    first_note_confirmed: false,
  },
  {
    id: 2,
    instrument_name: "Piano",
    clef: "treble",
    transposition: "C",
    low_note: "A0",
    high_note: "C8",
    first_note_detected: "C4",
    first_note_confirmed: true,
  },
];

describe("UserContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserInstruments.mockResolvedValue({
      instruments: mockInstruments,
      last_instrument_id: null,
    });
    mockSelectUserInstrument.mockResolvedValue({ success: true });
    mockCreateUserInstrument.mockResolvedValue({
      instrument: mockInstruments[0],
    });
    mockUpdateUserInstrument.mockResolvedValue({
      instrument: mockInstruments[0],
    });
  });

  describe("useUser hook", () => {
    it("throws error when used outside UserProvider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useUser());
      }).toThrow("useUser must be used within a UserProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("initialization", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      expect(result.current.userId).toBe(1);
      expect(result.current.instruments).toEqual([]);
      expect(result.current.selectedInstrument).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("uses custom initial userId", () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(42),
      });

      expect(result.current.userId).toBe(42);
    });
  });

  describe("loadInstruments", () => {
    it("fetches instruments from API", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      expect(mockGetUserInstruments).toHaveBeenCalledWith(1);
      expect(result.current.instruments).toEqual(mockInstruments);
    });

    it("sets loading to false after fetch completes", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      // Initially not loading
      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.loadInstruments();
      });

      // After completion, loading should be false
      expect(result.current.loading).toBe(false);
      // And instruments should be loaded
      expect(result.current.instruments.length).toBeGreaterThan(0);
    });

    it("auto-selects first instrument when no last_instrument_id", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      expect(result.current.selectedInstrument).toEqual(mockInstruments[0]);
    });

    it("auto-selects last used instrument when available", async () => {
      mockGetUserInstruments.mockResolvedValue({
        instruments: mockInstruments,
        last_instrument_id: 2,
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      expect(result.current.selectedInstrument?.id).toBe(2);
    });

    it("handles API error", async () => {
      mockGetUserInstruments.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.loading).toBe(false);
    });

    it("handles empty instruments list", async () => {
      mockGetUserInstruments.mockResolvedValue({ instruments: [] });

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      expect(result.current.instruments).toEqual([]);
      expect(result.current.selectedInstrument).toBeNull();
    });
  });

  describe("selectInstrument", () => {
    it("updates selected instrument locally", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await act(async () => {
        await result.current.selectInstrument(mockInstruments[1]);
      });

      expect(result.current.selectedInstrument).toEqual(mockInstruments[1]);
    });

    it("persists selection to server", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await act(async () => {
        await result.current.selectInstrument(mockInstruments[1]);
      });

      expect(mockSelectUserInstrument).toHaveBeenCalledWith(1, 2);
    });

    it("continues working even if server persist fails", async () => {
      mockSelectUserInstrument.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await act(async () => {
        await result.current.selectInstrument(mockInstruments[1]);
      });

      // Local selection should still work
      expect(result.current.selectedInstrument).toEqual(mockInstruments[1]);
    });
  });

  describe("addInstrument", () => {
    it("creates instrument via API", async () => {
      const newInstrumentData = {
        instrument_name: "Saxophone",
        clef: "treble",
        transposition: "Bb",
      };

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addInstrument(newInstrumentData);
      });

      expect(mockCreateUserInstrument).toHaveBeenCalledWith(
        1,
        newInstrumentData,
      );
    });

    it("refreshes instrument list after adding", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addInstrument({
          instrument_name: "Saxophone",
          clef: "treble",
        });
      });

      // loadInstruments should have been called
      expect(mockGetUserInstruments).toHaveBeenCalled();
    });

    it("handles API error", async () => {
      mockCreateUserInstrument.mockRejectedValue(new Error("Create failed"));

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      // Use try/catch to handle the rejection and allow state to settle
      await act(async () => {
        try {
          await result.current.addInstrument({
            instrument_name: "Saxophone",
            clef: "treble",
          });
        } catch (e) {
          // Expected to throw
        }
      });

      // Error should be set after the catch
      expect(result.current.error).toBe("Create failed");
    });
  });

  describe("updateInstrument", () => {
    it("updates instrument via API", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await act(async () => {
        await result.current.updateInstrument(1, { high_note: "D6" });
      });

      expect(mockUpdateUserInstrument).toHaveBeenCalledWith(1, 1, {
        high_note: "D6",
      });
    });

    it("updates local instrument state", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await act(async () => {
        await result.current.updateInstrument(1, { high_note: "D6" });
      });

      const updatedInstrument = result.current.instruments.find(
        (i) => i.id === 1,
      );
      expect(updatedInstrument?.high_note).toBe("D6");
    });

    it("updates selected instrument if it matches", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      // First instrument is selected by default
      expect(result.current.selectedInstrument?.id).toBe(1);

      await act(async () => {
        await result.current.updateInstrument(1, {
          first_note_confirmed: true,
        });
      });

      expect(result.current.selectedInstrument?.first_note_confirmed).toBe(
        true,
      );
    });

    it("does not update selected if different instrument updated", async () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      // Select first instrument (id: 1)
      const originalSelected = result.current.selectedInstrument;

      await act(async () => {
        await result.current.updateInstrument(2, { high_note: "C9" });
      });

      // Selected instrument should be unchanged
      expect(result.current.selectedInstrument).toEqual(originalSelected);
    });

    it("handles API error", async () => {
      mockUpdateUserInstrument.mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.loadInstruments();
      });

      await expect(
        act(async () => {
          await result.current.updateInstrument(1, { high_note: "D6" });
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("context value", () => {
    it("provides all expected functions", () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.loadInstruments).toBe("function");
      expect(typeof result.current.selectInstrument).toBe("function");
      expect(typeof result.current.addInstrument).toBe("function");
      expect(typeof result.current.updateInstrument).toBe("function");
    });
  });
});
