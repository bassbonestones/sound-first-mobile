/**
 * ComposerTopBar Tests
 *
 * Tests for the score settings top bar component.
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { ComposerTopBar } from "../src/features/composer/components";
import type {
  TimeSignature,
  KeySignature,
  Clef,
} from "../src/features/composer/types";

describe("ComposerTopBar", () => {
  const defaultProps = {
    title: "My Score",
    onTitleChange: jest.fn(),
    clef: "treble" as Clef,
    onClefChange: jest.fn(),
    timeSignature: { beats: 4, beatUnit: 4 } as TimeSignature,
    onTimeSignatureChange: jest.fn(),
    keySignature: 0 as KeySignature,
    onKeySignatureChange: jest.fn(),
    tempo: 120,
    onTempoChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Title", () => {
    it("should render title input", () => {
      const { getByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByTestId("topbar-title")).toBeTruthy();
    });

    it("should display current title", () => {
      const { getByDisplayValue } = render(
        <ComposerTopBar {...defaultProps} title="Test Title" />,
      );
      expect(getByDisplayValue("Test Title")).toBeTruthy();
    });

    it("should call onTitleChange when title edited", () => {
      const onTitleChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onTitleChange={onTitleChange} />,
      );

      fireEvent.changeText(getByTestId("topbar-title"), "New Title");
      expect(onTitleChange).toHaveBeenCalledWith("New Title");
    });
  });

  describe("Back Button", () => {
    it("should render back button when onBack provided", () => {
      const onBack = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onBack={onBack} />,
      );
      expect(getByTestId("topbar-back")).toBeTruthy();
    });

    it("should not render back button when onBack not provided", () => {
      const { queryByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(queryByTestId("topbar-back")).toBeNull();
    });

    it("should call onBack when back pressed", () => {
      const onBack = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onBack={onBack} />,
      );

      fireEvent.press(getByTestId("topbar-back"));
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("Clef Selector", () => {
    it("should render clef dropdown", () => {
      const { getByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByTestId("topbar-clef")).toBeTruthy();
    });

    it("should display current clef", () => {
      const { getByText } = render(
        <ComposerTopBar {...defaultProps} clef="bass" />,
      );
      expect(getByText("Bass")).toBeTruthy();
    });

    it("should open clef modal on press", () => {
      const { getByTestId, getByText } = render(
        <ComposerTopBar {...defaultProps} />,
      );

      fireEvent.press(getByTestId("topbar-clef"));
      expect(getByText("Select Clef")).toBeTruthy();
    });

    it("should call onClefChange when clef selected", async () => {
      const onClefChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onClefChange={onClefChange} />,
      );

      fireEvent.press(getByTestId("topbar-clef"));
      fireEvent.press(getByTestId("clef-bass"));

      expect(onClefChange).toHaveBeenCalledWith("bass");
    });
  });

  describe("Time Signature Selector", () => {
    it("should render time signature dropdown", () => {
      const { getByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByTestId("topbar-time")).toBeTruthy();
    });

    it("should display current time signature", () => {
      const { getByText } = render(
        <ComposerTopBar
          {...defaultProps}
          timeSignature={{ beats: 3, beatUnit: 4 }}
        />,
      );
      expect(getByText("3/4")).toBeTruthy();
    });

    it("should open time modal on press", () => {
      const { getByTestId, getByText } = render(
        <ComposerTopBar {...defaultProps} />,
      );

      fireEvent.press(getByTestId("topbar-time"));
      expect(getByText("Select Time Signature")).toBeTruthy();
    });

    it("should call onTimeSignatureChange when time selected", () => {
      const onTimeSignatureChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar
          {...defaultProps}
          onTimeSignatureChange={onTimeSignatureChange}
        />,
      );

      fireEvent.press(getByTestId("topbar-time"));
      fireEvent.press(getByTestId("time-3/4"));

      expect(onTimeSignatureChange).toHaveBeenCalledWith({
        beats: 3,
        beatUnit: 4,
      });
    });
  });

  describe("Key Signature Selector", () => {
    it("should render key signature dropdown", () => {
      const { getByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByTestId("topbar-key")).toBeTruthy();
    });

    it("should display current key", () => {
      const { getByText } = render(
        <ComposerTopBar {...defaultProps} keySignature={2} />,
      );
      expect(getByText("D Major")).toBeTruthy();
    });

    it("should open key modal on press", () => {
      const { getByTestId, getByText } = render(
        <ComposerTopBar {...defaultProps} />,
      );

      fireEvent.press(getByTestId("topbar-key"));
      expect(getByText("Select Key")).toBeTruthy();
    });

    it("should call onKeySignatureChange when key selected", () => {
      const onKeySignatureChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar
          {...defaultProps}
          onKeySignatureChange={onKeySignatureChange}
        />,
      );

      fireEvent.press(getByTestId("topbar-key"));
      fireEvent.press(getByTestId("key-1"));

      expect(onKeySignatureChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Tempo Selector", () => {
    it("should render tempo dropdown", () => {
      const { getByTestId } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByTestId("topbar-tempo")).toBeTruthy();
    });

    it("should display current tempo", () => {
      const { getByText } = render(
        <ComposerTopBar {...defaultProps} tempo={80} />,
      );
      expect(getByText("80")).toBeTruthy();
    });

    it("should open tempo modal on press", () => {
      const { getByTestId, getByText } = render(
        <ComposerTopBar {...defaultProps} />,
      );

      fireEvent.press(getByTestId("topbar-tempo"));
      expect(getByText("Set Tempo (BPM)")).toBeTruthy();
    });

    it("should call onTempoChange when tempo confirmed", () => {
      const onTempoChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onTempoChange={onTempoChange} />,
      );

      fireEvent.press(getByTestId("topbar-tempo"));
      fireEvent.changeText(getByTestId("tempo-input"), "100");
      fireEvent.press(getByTestId("tempo-confirm"));

      expect(onTempoChange).toHaveBeenCalledWith(100);
    });

    it("should not call onTempoChange for invalid tempo", () => {
      const onTempoChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar {...defaultProps} onTempoChange={onTempoChange} />,
      );

      fireEvent.press(getByTestId("topbar-tempo"));
      fireEvent.changeText(getByTestId("tempo-input"), "500");
      fireEvent.press(getByTestId("tempo-confirm"));

      expect(onTempoChange).not.toHaveBeenCalled();
    });

    it("should close modal on cancel", () => {
      const { getByTestId, queryByText } = render(
        <ComposerTopBar {...defaultProps} />,
      );

      fireEvent.press(getByTestId("topbar-tempo"));
      fireEvent.press(getByTestId("tempo-cancel"));

      expect(queryByText("Set Tempo (BPM)")).toBeNull();
    });
  });

  describe("Disabled State", () => {
    it("should disable dropdowns when disabled", () => {
      const onClefChange = jest.fn();
      const { getByTestId, queryByText } = render(
        <ComposerTopBar
          {...defaultProps}
          onClefChange={onClefChange}
          disabled
        />,
      );

      fireEvent.press(getByTestId("topbar-clef"));
      expect(queryByText("Select Clef")).toBeNull();
    });

    it("should disable title input when disabled", () => {
      const onTitleChange = jest.fn();
      const { getByTestId } = render(
        <ComposerTopBar
          {...defaultProps}
          onTitleChange={onTitleChange}
          disabled
        />,
      );

      const titleInput = getByTestId("topbar-title");
      expect(titleInput.props.editable).toBe(false);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label for title", () => {
      const { getByLabelText } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByLabelText("Score title")).toBeTruthy();
    });

    it("should have accessible label for back button", () => {
      const { getByLabelText } = render(
        <ComposerTopBar {...defaultProps} onBack={jest.fn()} />,
      );
      expect(getByLabelText("Go back")).toBeTruthy();
    });

    it("should have accessible labels for dropdowns", () => {
      const { getByLabelText } = render(<ComposerTopBar {...defaultProps} />);
      expect(getByLabelText(/Clef/)).toBeTruthy();
      expect(getByLabelText(/Time/)).toBeTruthy();
      expect(getByLabelText(/Key/)).toBeTruthy();
      expect(getByLabelText(/Tempo/)).toBeTruthy();
    });
  });
});
