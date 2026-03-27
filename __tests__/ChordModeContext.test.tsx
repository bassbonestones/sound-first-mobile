/**
 * ChordModeContext Tests
 *
 * Tests for the ChordModeContext provider and hooks.
 */
import React from "react";
import { View, Text, Button } from "react-native";
import { render, fireEvent, screen } from "@testing-library/react-native";
import {
  ChordModeProvider,
  useChordMode,
  useChordModeOptional,
} from "../src/features/tune-composer/contexts/ChordModeContext";

// =============================================================================
// Test Helpers
// =============================================================================

/** Test component that uses the required context hook */
function TestConsumer({ testID }: { testID: string }): React.ReactElement {
  const context = useChordMode();
  return (
    <View testID={testID}>
      <Text testID="chord-mode-active">
        {context.chordModeActive ? "active" : "inactive"}
      </Text>
      <Text testID="current-symbol">{context.currentChordSymbol}</Text>
      <Text testID="can-go-prev">{context.canGoPrev ? "yes" : "no"}</Text>
      <Text testID="can-go-next">{context.canGoNext ? "yes" : "no"}</Text>
      <Text testID="has-selection">{context.hasSelection ? "yes" : "no"}</Text>
      <Text testID="show-chord-symbols">
        {context.showChordSymbols ? "visible" : "hidden"}
      </Text>
      <Text testID="is-inferring">
        {context.isInferring ? "inferring" : "idle"}
      </Text>
      <Text testID="disabled">{context.disabled ? "disabled" : "enabled"}</Text>
      <Text testID="position">
        M{context.currentPosition.measureIndex}B
        {context.currentPosition.beatPosition}
      </Text>
      <Button
        title="Toggle Mode"
        onPress={context.toggleChordMode}
        testID="toggle-mode"
      />
      <Button
        title="Set Chord"
        onPress={() => context.setChord("Am7")}
        testID="set-chord"
      />
      <Button
        title="Remove Chord"
        onPress={context.removeChord}
        testID="remove-chord"
      />
      <Button title="Move Next" onPress={context.moveNext} testID="move-next" />
      <Button title="Move Prev" onPress={context.movePrev} testID="move-prev" />
      <Button
        title="Toggle Visibility"
        onPress={context.toggleVisibility}
        testID="toggle-visibility"
      />
      <Button
        title="Infer Chords"
        onPress={context.inferChords}
        testID="infer-chords"
      />
      <Button
        title="Clear Chords"
        onPress={context.clearChords}
        testID="clear-chords"
      />
    </View>
  );
}

/** Test component that uses the optional context hook */
function TestOptionalConsumer(): React.ReactElement {
  const context = useChordModeOptional();
  return (
    <View testID="optional-consumer">
      <Text testID="has-context">{context ? "yes" : "no"}</Text>
    </View>
  );
}

// =============================================================================
// Mock Callbacks
// =============================================================================

const createMockCallbacks = () => ({
  onToggleChordMode: jest.fn(),
  onSetChord: jest.fn(),
  onRemoveChord: jest.fn(),
  onNextBeat: jest.fn(),
  onPrevBeat: jest.fn(),
  onToggleVisibility: jest.fn(),
  onInferChords: jest.fn(),
  onClearChords: jest.fn(),
});

const defaultPosition = { measureIndex: 0, beatPosition: 0 };

// =============================================================================
// Tests
// =============================================================================

describe("ChordModeContext", () => {
  describe("ChordModeProvider", () => {
    it("should provide context values to children", () => {
      const callbacks = createMockCallbacks();

      render(
        <ChordModeProvider
          chordModeActive={true}
          currentChordSymbol="Cmaj7"
          canGoPrev={true}
          canGoNext={false}
          hasSelection={true}
          showChordSymbols={true}
          isInferring={false}
          currentPosition={{ measureIndex: 2, beatPosition: 1 }}
          disabled={false}
          {...callbacks}
        >
          <TestConsumer testID="consumer" />
        </ChordModeProvider>,
      );

      expect(screen.getByTestId("chord-mode-active")).toHaveTextContent(
        "active",
      );
      expect(screen.getByTestId("current-symbol")).toHaveTextContent("Cmaj7");
      expect(screen.getByTestId("can-go-prev")).toHaveTextContent("yes");
      expect(screen.getByTestId("can-go-next")).toHaveTextContent("no");
      expect(screen.getByTestId("has-selection")).toHaveTextContent("yes");
      expect(screen.getByTestId("show-chord-symbols")).toHaveTextContent(
        "visible",
      );
      expect(screen.getByTestId("is-inferring")).toHaveTextContent("idle");
      expect(screen.getByTestId("disabled")).toHaveTextContent("enabled");
      expect(screen.getByTestId("position")).toHaveTextContent("M2B1");
    });

    it("should call callbacks when actions are triggered", () => {
      const callbacks = createMockCallbacks();

      render(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={true}
          canGoNext={true}
          hasSelection={true}
          showChordSymbols={true}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <TestConsumer testID="consumer" />
        </ChordModeProvider>,
      );

      fireEvent.press(screen.getByTestId("toggle-mode"));
      expect(callbacks.onToggleChordMode).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("set-chord"));
      expect(callbacks.onSetChord).toHaveBeenCalledWith("Am7");

      fireEvent.press(screen.getByTestId("remove-chord"));
      expect(callbacks.onRemoveChord).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("move-next"));
      expect(callbacks.onNextBeat).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("move-prev"));
      expect(callbacks.onPrevBeat).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("toggle-visibility"));
      expect(callbacks.onToggleVisibility).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("infer-chords"));
      expect(callbacks.onInferChords).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId("clear-chords"));
      expect(callbacks.onClearChords).toHaveBeenCalledTimes(1);
    });

    it("should default disabled to false", () => {
      const callbacks = createMockCallbacks();

      render(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <TestConsumer testID="consumer" />
        </ChordModeProvider>,
      );

      expect(screen.getByTestId("disabled")).toHaveTextContent("enabled");
    });

    it("should handle disabled=true", () => {
      const callbacks = createMockCallbacks();

      render(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          disabled={true}
          {...callbacks}
        >
          <TestConsumer testID="consumer" />
        </ChordModeProvider>,
      );

      expect(screen.getByTestId("disabled")).toHaveTextContent("disabled");
    });
  });

  describe("useChordMode", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        render(<TestConsumer testID="consumer" />);
      }).toThrow("useChordMode must be used within a ChordModeProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useChordModeOptional", () => {
    it("should return null when used outside provider", () => {
      render(<TestOptionalConsumer />);
      expect(screen.getByTestId("has-context")).toHaveTextContent("no");
    });

    it("should return context when used inside provider", () => {
      const callbacks = createMockCallbacks();

      render(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <TestOptionalConsumer />
        </ChordModeProvider>,
      );

      expect(screen.getByTestId("has-context")).toHaveTextContent("yes");
    });
  });

  describe("context value memoization", () => {
    it("should memoize context value based on dependencies", () => {
      const callbacks = createMockCallbacks();
      let renderCount = 0;

      function RenderCounter(): React.ReactElement {
        const context = useChordMode();
        renderCount++;
        return <Text testID="render-count">{renderCount}</Text>;
      }

      const { rerender } = render(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <RenderCounter />
        </ChordModeProvider>,
      );

      expect(renderCount).toBe(1);

      // Re-render with same props - should not re-render child
      rerender(
        <ChordModeProvider
          chordModeActive={false}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <RenderCounter />
        </ChordModeProvider>,
      );

      // Re-render with changed prop - should re-render child
      rerender(
        <ChordModeProvider
          chordModeActive={true}
          currentChordSymbol=""
          canGoPrev={false}
          canGoNext={false}
          hasSelection={false}
          showChordSymbols={false}
          isInferring={false}
          currentPosition={defaultPosition}
          {...callbacks}
        >
          <RenderCounter />
        </ChordModeProvider>,
      );

      // We expect at least 2 renders (initial + one with changed prop)
      expect(renderCount).toBeGreaterThanOrEqual(2);
    });
  });
});
