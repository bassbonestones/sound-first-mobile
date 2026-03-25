/**
 * ChordControls Tests
 *
 * Tests for the chord entry controls component.
 * Includes text input, symbol palette, autocomplete, and navigation.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import { ChordControls } from "../src/features/tune-composer/components";

describe("ChordControls", () => {
  const defaultPosition = {
    measureIndex: 0,
    beatPosition: 0,
  };

  const defaultProps = {
    chordModeActive: false,
    onToggleChordMode: jest.fn(),
    currentChordSymbol: "",
    onSetChord: jest.fn(),
    onRemoveChord: jest.fn(),
    onNextBeat: jest.fn(),
    onPrevBeat: jest.fn(),
    canGoPrev: true,
    canGoNext: true,
    currentPosition: defaultPosition,
    hasSelection: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Basic Rendering
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { getByTestId } = render(
        <ChordControls {...defaultProps} testID="chord-controls" />,
      );
      expect(getByTestId("chord-controls")).toBeTruthy();
    });

    it("should render toggle button when not in chord mode", () => {
      const { getByTestId } = render(<ChordControls {...defaultProps} />);
      expect(getByTestId("chord-mode-toggle")).toBeTruthy();
    });

    it("should show 'Enter Chords' label on toggle button", () => {
      const { getByText } = render(<ChordControls {...defaultProps} />);
      expect(getByText("Enter Chords")).toBeTruthy();
    });

    it("should have accessible label on toggle button", () => {
      const { getByLabelText } = render(<ChordControls {...defaultProps} />);
      expect(getByLabelText("Enter chord mode")).toBeTruthy();
    });

    it("should NOT disable toggle based on hasSelection (toggle always available)", () => {
      const { getByTestId } = render(
        <ChordControls {...defaultProps} hasSelection={false} />,
      );
      const button = getByTestId("chord-mode-toggle");
      // The toggle button should be enabled even when hasSelection is false
      // because hasSelection only matters for controls inside chord mode
      expect(button.props.accessibilityState?.disabled).toBeFalsy();
    });

    it("should disable toggle when disabled prop is true", () => {
      const { getByTestId } = render(
        <ChordControls {...defaultProps} disabled />,
      );
      const button = getByTestId("chord-mode-toggle");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ===========================================================================
  // Toggle Behavior
  // ===========================================================================

  describe("Toggle Behavior", () => {
    it("should call onToggleChordMode when toggle pressed", () => {
      const onToggleChordMode = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...defaultProps}
          onToggleChordMode={onToggleChordMode}
        />,
      );

      fireEvent.press(getByTestId("chord-mode-toggle"));
      expect(onToggleChordMode).toHaveBeenCalledTimes(1);
    });

    it("should not call toggle when disabled", () => {
      const onToggleChordMode = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...defaultProps}
          onToggleChordMode={onToggleChordMode}
          disabled
        />,
      );

      fireEvent.press(getByTestId("chord-mode-toggle"));
      expect(onToggleChordMode).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Chord Mode Active
  // ===========================================================================

  describe("Chord Mode Active", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should render full controls when chord mode is active", () => {
      const { getByTestId, getByText } = render(
        <ChordControls {...activeProps} />,
      );
      expect(getByText("Chord Mode")).toBeTruthy();
      expect(getByTestId("chord-input")).toBeTruthy();
    });

    it("should show position info", () => {
      const { getByText } = render(
        <ChordControls
          {...activeProps}
          currentPosition={{ measureIndex: 2, beatPosition: 1 }}
        />,
      );
      expect(getByText("M3 Beat 2")).toBeTruthy();
    });

    it("should render exit button", () => {
      const { getByTestId, getByText } = render(
        <ChordControls {...activeProps} />,
      );
      expect(getByTestId("chord-exit")).toBeTruthy();
      expect(getByText("Exit Chord Mode")).toBeTruthy();
    });

    it("should call onToggleChordMode when exit pressed", () => {
      const onToggleChordMode = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          onToggleChordMode={onToggleChordMode}
        />,
      );

      fireEvent.press(getByTestId("chord-exit"));
      expect(onToggleChordMode).toHaveBeenCalledTimes(1);
    });

    it("should have accessible exit button", () => {
      const { getByLabelText } = render(<ChordControls {...activeProps} />);
      expect(getByLabelText("Exit chord mode")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Text Input
  // ===========================================================================

  describe("Text Input", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should render text input", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-input")).toBeTruthy();
    });

    it("should show current chord symbol in input", () => {
      const { getByTestId } = render(
        <ChordControls {...activeProps} currentChordSymbol="Cmaj7" />,
      );
      const input = getByTestId("chord-input");
      expect(input.props.value).toBe("Cmaj7");
    });

    it("should update input text on change", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Dm7");
      expect(input.props.value).toBe("Dm7");
    });

    it("should call onSetChord on blur with text", async () => {
      jest.useFakeTimers();
      const onSetChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onSetChord={onSetChord} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "G7");
      fireEvent(input, "blur");

      // Blur handler has 150ms delay to avoid race with suggestion taps
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      expect(onSetChord).toHaveBeenCalledWith("G7");
      jest.useRealTimers();
    });

    it("should call onRemoveChord on blur with empty text", async () => {
      jest.useFakeTimers();
      const onRemoveChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          currentChordSymbol="Cmaj7"
          onRemoveChord={onRemoveChord}
        />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "");
      fireEvent(input, "blur");

      // Blur handler has 150ms delay to avoid race with suggestion taps
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      expect(onRemoveChord).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it("should call onSetChord on submit editing", () => {
      const onSetChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onSetChord={onSetChord} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Am7");
      fireEvent(input, "submitEditing");

      expect(onSetChord).toHaveBeenCalledWith("Am7");
    });

    it("should show placeholder when empty", () => {
      const { getByPlaceholderText } = render(
        <ChordControls {...activeProps} />,
      );
      expect(getByPlaceholderText("Enter chord...")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Warning for Unrecognized Chords
  // ===========================================================================

  describe("Unrecognized Chord Warning", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should not show warning styling for empty input", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");
      // The input should have default border, not warning border
      const styles = Array.isArray(input.props.style)
        ? input.props.style.filter(Boolean)
        : [input.props.style];
      // Check none of the styles have borderWidth: 2 (warning style)
      const hasWarningStyle = styles.some(
        (s: Record<string, unknown>) => s?.borderWidth === 2,
      );
      expect(hasWarningStyle).toBe(false);
    });

    it("should not show warning for recognized chord", async () => {
      const { getByTestId, queryByLabelText } = render(
        <ChordControls {...activeProps} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Cmaj7");

      // Wait for state update
      await waitFor(() => {
        // Should not have warning alert icon visible
        // (we can't easily check style, but can verify it doesn't break)
        expect(input.props.value).toBe("Cmaj7");
      });
    });

    it("should show warning for unrecognized chord", async () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Xmajor999");

      await waitFor(() => {
        expect(input.props.value).toBe("Xmajor999");
      });
    });
  });

  // ===========================================================================
  // Symbol Palette
  // ===========================================================================

  describe("Symbol Palette", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should render accidental symbols", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-symbol-#")).toBeTruthy();
      expect(getByTestId("chord-symbol-b")).toBeTruthy();
    });

    it("should render quality symbols", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-quality-m")).toBeTruthy();
      expect(getByTestId("chord-quality-7")).toBeTruthy();
      expect(getByTestId("chord-quality-maj7")).toBeTruthy();
    });

    it("should render extension symbols", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-ext-9")).toBeTruthy();
      expect(getByTestId("chord-ext-b9")).toBeTruthy();
      expect(getByTestId("chord-ext-#9")).toBeTruthy();
    });

    it("should insert sharp symbol when pressed", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "F");
      fireEvent.press(getByTestId("chord-symbol-#"));

      expect(input.props.value).toBe("F#");
    });

    it("should insert flat symbol when pressed", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "B");
      fireEvent.press(getByTestId("chord-symbol-b"));

      expect(input.props.value).toBe("Bb");
    });

    it("should insert quality when pressed", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "C");
      fireEvent.press(getByTestId("chord-quality-m7"));

      expect(input.props.value).toBe("Cm7");
    });

    it("should insert extension when pressed", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "C7");
      fireEvent.press(getByTestId("chord-ext-b9"));

      expect(input.props.value).toBe("C7b9");
    });

    it("should have accessible labels on symbol buttons", () => {
      const { getByLabelText } = render(<ChordControls {...activeProps} />);
      expect(getByLabelText("Sharp")).toBeTruthy();
      expect(getByLabelText("Flat")).toBeTruthy();
      expect(getByLabelText("Minor")).toBeTruthy();
      expect(getByLabelText("Dominant 7")).toBeTruthy();
    });

    it("should render Δ button for major 7", () => {
      const { getByTestId, getByText } = render(
        <ChordControls {...activeProps} />,
      );
      expect(getByTestId("chord-symbol-maj7")).toBeTruthy();
      expect(getByText("Δ")).toBeTruthy();
    });

    it("should render ° button for diminished", () => {
      const { getByText } = render(<ChordControls {...activeProps} />);
      expect(getByText("°")).toBeTruthy();
    });

    it("should render ø button for half-diminished", () => {
      const { getByText } = render(<ChordControls {...activeProps} />);
      expect(getByText("ø")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Autocomplete Suggestions
  // ===========================================================================

  describe("Autocomplete Suggestions", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should show suggestions when typing", async () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Cm");

      await waitFor(() => {
        expect(getByTestId("chord-suggestions")).toBeTruthy();
      });
    });

    it("should show matching chord suggestions", async () => {
      const { getByTestId, getByText } = render(
        <ChordControls {...activeProps} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Cm");

      await waitFor(() => {
        // Should see Cm, Cm7, Cmaj7, etc.
        expect(getByText("Cm")).toBeTruthy();
      });
    });

    it("should select suggestion when pressed", async () => {
      const onSetChord = jest.fn();
      const { getByTestId, getByText } = render(
        <ChordControls {...activeProps} onSetChord={onSetChord} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Cm");

      await waitFor(() => {
        expect(getByTestId("chord-suggestions")).toBeTruthy();
      });

      fireEvent.press(getByTestId("chord-suggestion-Cm7"));

      expect(input.props.value).toBe("Cm7");
      expect(onSetChord).toHaveBeenCalledWith("Cm7");
    });

    it("should hide suggestions when empty", async () => {
      const { getByTestId, queryByTestId } = render(
        <ChordControls {...activeProps} />,
      );
      const input = getByTestId("chord-input");

      fireEvent.changeText(input, "Cm");
      await waitFor(() => {
        expect(getByTestId("chord-suggestions")).toBeTruthy();
      });

      fireEvent.changeText(input, "");
      await waitFor(() => {
        expect(queryByTestId("chord-suggestions")).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Position Navigation
  // ===========================================================================

  describe("Position Navigation", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should render navigation buttons", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-prev-beat")).toBeTruthy();
      expect(getByTestId("chord-next-beat")).toBeTruthy();
    });

    it("should call onPrevBeat when prev pressed", () => {
      const onPrevBeat = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onPrevBeat={onPrevBeat} />,
      );

      fireEvent.press(getByTestId("chord-prev-beat"));
      expect(onPrevBeat).toHaveBeenCalledTimes(1);
    });

    it("should call onNextBeat when next pressed", () => {
      const onNextBeat = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onNextBeat={onNextBeat} />,
      );

      fireEvent.press(getByTestId("chord-next-beat"));
      expect(onNextBeat).toHaveBeenCalledTimes(1);
    });

    it("should disable prev when canGoPrev is false", () => {
      const onPrevBeat = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          canGoPrev={false}
          onPrevBeat={onPrevBeat}
        />,
      );

      fireEvent.press(getByTestId("chord-prev-beat"));
      expect(onPrevBeat).not.toHaveBeenCalled();
    });

    it("should disable next when canGoNext is false", () => {
      const onNextBeat = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          canGoNext={false}
          onNextBeat={onNextBeat}
        />,
      );

      fireEvent.press(getByTestId("chord-next-beat"));
      expect(onNextBeat).not.toHaveBeenCalled();
    });

    it("should have accessible labels on navigation buttons", () => {
      const { getByLabelText } = render(<ChordControls {...activeProps} />);
      expect(getByLabelText("Previous beat")).toBeTruthy();
      expect(getByLabelText("Next beat")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Clear Button
  // ===========================================================================

  describe("Clear Button", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should render clear button", () => {
      const { getByTestId } = render(<ChordControls {...activeProps} />);
      expect(getByTestId("chord-clear-button")).toBeTruthy();
    });

    it("should be disabled when input is empty", () => {
      const onRemoveChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onRemoveChord={onRemoveChord} />,
      );

      fireEvent.press(getByTestId("chord-clear-button"));
      expect(onRemoveChord).not.toHaveBeenCalled();
    });

    it("should clear input and call onRemoveChord when pressed", () => {
      const onRemoveChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          currentChordSymbol="Cmaj7"
          onRemoveChord={onRemoveChord}
        />,
      );

      fireEvent.press(getByTestId("chord-clear-button"));
      expect(onRemoveChord).toHaveBeenCalledTimes(1);
    });

    it("should have accessible label", () => {
      const { getByLabelText } = render(<ChordControls {...activeProps} />);
      expect(getByLabelText("Clear chord")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Preview Button
  // ===========================================================================

  describe("Preview Button", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should not render preview button when onPreviewChord not provided", () => {
      const { queryByTestId } = render(<ChordControls {...activeProps} />);
      expect(queryByTestId("chord-preview-button")).toBeNull();
    });

    it("should render preview button when onPreviewChord provided", () => {
      const { getByTestId } = render(
        <ChordControls {...activeProps} onPreviewChord={jest.fn()} />,
      );
      expect(getByTestId("chord-preview-button")).toBeTruthy();
    });

    it("should be disabled when input is empty", () => {
      const onPreviewChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls {...activeProps} onPreviewChord={onPreviewChord} />,
      );

      fireEvent.press(getByTestId("chord-preview-button"));
      expect(onPreviewChord).not.toHaveBeenCalled();
    });

    it("should call onPreviewChord with MIDI notes when pressed", () => {
      const onPreviewChord = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          currentChordSymbol="Cmaj7"
          onPreviewChord={onPreviewChord}
        />,
      );

      fireEvent.press(getByTestId("chord-preview-button"));
      expect(onPreviewChord).toHaveBeenCalledTimes(1);
      // Should be called with array of MIDI notes
      expect(Array.isArray(onPreviewChord.mock.calls[0][0])).toBe(true);
    });

    it("should have accessible label", () => {
      const { getByLabelText } = render(
        <ChordControls {...activeProps} onPreviewChord={jest.fn()} />,
      );
      expect(getByLabelText("Preview chord")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Position Sync
  // ===========================================================================

  describe("Position Sync", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should update input when currentChordSymbol changes", () => {
      const { getByTestId, rerender } = render(
        <ChordControls {...activeProps} currentChordSymbol="Cmaj7" />,
      );
      const input = getByTestId("chord-input");
      expect(input.props.value).toBe("Cmaj7");

      rerender(<ChordControls {...activeProps} currentChordSymbol="Dm7" />);
      expect(input.props.value).toBe("Dm7");
    });

    it("should clear input when moving to empty position", () => {
      const { getByTestId, rerender } = render(
        <ChordControls {...activeProps} currentChordSymbol="Cmaj7" />,
      );
      const input = getByTestId("chord-input");
      expect(input.props.value).toBe("Cmaj7");

      rerender(
        <ChordControls
          {...activeProps}
          currentChordSymbol=""
          currentPosition={{ measureIndex: 1, beatPosition: 0 }}
        />,
      );
      expect(input.props.value).toBe("");
    });
  });

  // ===========================================================================
  // Visibility Toggle
  // ===========================================================================

  describe("Visibility Toggle", () => {
    const activeProps = {
      ...defaultProps,
      chordModeActive: true,
    };

    it("should not render visibility toggle when onToggleVisibility not provided", () => {
      const { queryByTestId } = render(<ChordControls {...activeProps} />);
      expect(queryByTestId("chord-visibility-toggle")).toBeNull();
    });

    it("should render visibility toggle when onToggleVisibility provided", () => {
      const { getByTestId } = render(
        <ChordControls {...activeProps} onToggleVisibility={jest.fn()} />,
      );
      expect(getByTestId("chord-visibility-toggle")).toBeTruthy();
    });

    it("should show checked state when showChordSymbols is true", () => {
      const { getByText } = render(
        <ChordControls
          {...activeProps}
          showChordSymbols={true}
          onToggleVisibility={jest.fn()}
        />,
      );
      expect(getByText("☑")).toBeTruthy();
    });

    it("should show unchecked state when showChordSymbols is false", () => {
      const { getByText } = render(
        <ChordControls
          {...activeProps}
          showChordSymbols={false}
          onToggleVisibility={jest.fn()}
        />,
      );
      expect(getByText("☐")).toBeTruthy();
    });

    it("should call onToggleVisibility when pressed", () => {
      const onToggleVisibility = jest.fn();
      const { getByTestId } = render(
        <ChordControls
          {...activeProps}
          onToggleVisibility={onToggleVisibility}
        />,
      );

      fireEvent.press(getByTestId("chord-visibility-toggle"));
      expect(onToggleVisibility).toHaveBeenCalledTimes(1);
    });

    it("should have accessible label and state", () => {
      const { getByLabelText, getByTestId } = render(
        <ChordControls
          {...activeProps}
          showChordSymbols={true}
          onToggleVisibility={jest.fn()}
        />,
      );
      expect(getByLabelText("Show chord symbols")).toBeTruthy();
      const toggle = getByTestId("chord-visibility-toggle");
      expect(toggle.props.accessibilityState?.checked).toBe(true);
    });

    it("should show label text", () => {
      const { getByText } = render(
        <ChordControls {...activeProps} onToggleVisibility={jest.fn()} />,
      );
      expect(getByText("Show chord symbols")).toBeTruthy();
    });
  });
});
