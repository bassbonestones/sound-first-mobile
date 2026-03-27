/**
 * Tests for ChordProgressionContext
 *
 * Covers the context provider and hooks for chord progression management.
 */
import React from "react";
import { render, renderHook, act } from "@testing-library/react-native";
import { Text, View } from "react-native";
import {
  ChordProgressionProvider,
  useChordProgression,
  useChordProgressionOptional,
} from "../src/features/tune-composer/contexts/ChordProgressionContext";
import type { ChordProgression } from "../src/features/tune-composer/types";

// =============================================================================
// Mock Data
// =============================================================================

const mockProgressions: ChordProgression[] = [
  {
    id: "prog-1",
    name: "Default",
    isDefault: true,
    chords: [],
  },
  {
    id: "prog-2",
    name: "Jazz Changes",
    isDefault: false,
    chords: [],
  },
];

const mockCallbacks = {
  onSelectProgression: jest.fn(),
  onCreateProgression: jest.fn(),
  onDuplicateProgression: jest.fn(),
  onDeleteProgression: jest.fn(),
  onRenameProgression: jest.fn(),
  onToggleEditMode: jest.fn(),
};

// =============================================================================
// Test Component
// =============================================================================

function TestConsumer() {
  const context = useChordProgression();
  return (
    <View>
      <Text testID="progressions-count">{context.progressions.length}</Text>
      <Text testID="active-id">{context.activeProgressionId ?? "none"}</Text>
      <Text testID="is-edit-mode">{context.isEditMode ? "true" : "false"}</Text>
      <Text testID="disabled">{context.disabled ? "true" : "false"}</Text>
    </View>
  );
}

function OptionalConsumer() {
  const context = useChordProgressionOptional();
  return (
    <View>
      <Text testID="has-context">{context ? "yes" : "no"}</Text>
    </View>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe("ChordProgressionContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ChordProgressionProvider", () => {
    it("provides progressions to children", () => {
      const { getByTestId } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          <TestConsumer />
        </ChordProgressionProvider>,
      );

      expect(getByTestId("progressions-count").props.children).toBe(2);
    });

    it("provides activeProgressionId to children", () => {
      const { getByTestId } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-2"
          isEditMode={false}
          {...mockCallbacks}
        >
          <TestConsumer />
        </ChordProgressionProvider>,
      );

      expect(getByTestId("active-id").props.children).toBe("prog-2");
    });

    it("provides isEditMode to children", () => {
      const { getByTestId } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={true}
          {...mockCallbacks}
        >
          <TestConsumer />
        </ChordProgressionProvider>,
      );

      expect(getByTestId("is-edit-mode").props.children).toBe("true");
    });

    it("provides disabled state to children", () => {
      const { getByTestId } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          disabled={true}
          {...mockCallbacks}
        >
          <TestConsumer />
        </ChordProgressionProvider>,
      );

      expect(getByTestId("disabled").props.children).toBe("true");
    });

    it("defaults disabled to false", () => {
      const { getByTestId } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          <TestConsumer />
        </ChordProgressionProvider>,
      );

      expect(getByTestId("disabled").props.children).toBe("false");
    });
  });

  describe("useChordProgression", () => {
    it("throws error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useChordProgression());
      }).toThrow(
        "useChordProgression must be used within a ChordProgressionProvider",
      );

      consoleSpy.mockRestore();
    });

    it("returns context value when used within provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      expect(result.current.progressions).toBe(mockProgressions);
      expect(result.current.activeProgressionId).toBe("prog-1");
      expect(result.current.isEditMode).toBe(false);
    });

    it("exposes selectProgression callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.selectProgression("prog-2");
      });

      expect(mockCallbacks.onSelectProgression).toHaveBeenCalledWith("prog-2");
    });

    it("exposes createProgression callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.createProgression("New Progression");
      });

      expect(mockCallbacks.onCreateProgression).toHaveBeenCalledWith(
        "New Progression",
      );
    });

    it("exposes duplicateProgression callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.duplicateProgression("prog-1", "Copy of Default");
      });

      expect(mockCallbacks.onDuplicateProgression).toHaveBeenCalledWith(
        "prog-1",
        "Copy of Default",
      );
    });

    it("exposes deleteProgression callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.deleteProgression("prog-2");
      });

      expect(mockCallbacks.onDeleteProgression).toHaveBeenCalledWith("prog-2");
    });

    it("exposes renameProgression callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.renameProgression("prog-1", "Renamed");
      });

      expect(mockCallbacks.onRenameProgression).toHaveBeenCalledWith(
        "prog-1",
        "Renamed",
      );
    });

    it("exposes toggleEditMode callback", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgression(), { wrapper });

      act(() => {
        result.current.toggleEditMode();
      });

      expect(mockCallbacks.onToggleEditMode).toHaveBeenCalled();
    });
  });

  describe("useChordProgressionOptional", () => {
    it("returns null when used outside provider", () => {
      const { result } = renderHook(() => useChordProgressionOptional());
      expect(result.current).toBeNull();
    });

    it("returns context value when used within provider", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          {children}
        </ChordProgressionProvider>
      );

      const { result } = renderHook(() => useChordProgressionOptional(), {
        wrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.progressions).toBe(mockProgressions);
    });

    it("can be used safely with component rendering", () => {
      // Outside provider - should show "no"
      const { getByTestId: getOutside } = render(<OptionalConsumer />);
      expect(getOutside("has-context").props.children).toBe("no");

      // Inside provider - should show "yes"
      const { getByTestId: getInside } = render(
        <ChordProgressionProvider
          progressions={mockProgressions}
          activeProgressionId="prog-1"
          isEditMode={false}
          {...mockCallbacks}
        >
          <OptionalConsumer />
        </ChordProgressionProvider>,
      );
      expect(getInside("has-context").props.children).toBe("yes");
    });
  });
});
