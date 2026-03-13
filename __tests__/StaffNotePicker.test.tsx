/**
 * Tests for StaffNotePicker component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StaffNotePicker from "../src/components/StaffNotePicker";

interface MockNotationDisplayProps {
  musicxml?: string;
}

// Mock NotationDisplay
jest.mock("../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  return function MockNotationDisplay({
    musicxml,
  }: MockNotationDisplayProps): React.JSX.Element {
    return (
      <View testID="notation-display">
        <Text>Notation Mock</Text>
      </View>
    );
  };
});

describe("StaffNotePicker", () => {
  describe("Rendering", () => {
    it("renders with treble clef by default", () => {
      const { getByText, getByTestId } = render(
        <StaffNotePicker onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
      expect(getByText(/I'll play it instead/)).toBeTruthy();
    });

    it("renders with bass clef", () => {
      const { getByTestId } = render(
        <StaffNotePicker clef="bass" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("renders with initial value", () => {
      const { getByTestId } = render(
        <StaffNotePicker value="C4" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("renders navigation buttons", () => {
      const { getByText } = render(<StaffNotePicker onChange={jest.fn()} />);
      expect(getByText("▲")).toBeTruthy();
      expect(getByText("▼")).toBeTruthy();
      expect(getByText("+")).toBeTruthy();
      expect(getByText("−")).toBeTruthy();
    });

    it("renders play to select button", () => {
      const { getByText } = render(<StaffNotePicker onChange={jest.fn()} />);
      expect(getByText(/I'll play it instead/)).toBeTruthy();
    });

    it("renders with default props", () => {
      const { toJSON } = render(<StaffNotePicker onChange={jest.fn()} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Note navigation", () => {
    it("calls onChange when moving note up", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      // Find and press the up arrow
      const upButton = getByText("▲");
      fireEvent.press(upButton);

      expect(onChange).toHaveBeenCalled();
    });

    it("calls onChange when moving note down", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      const downButton = getByText("▼");
      fireEvent.press(downButton);

      expect(onChange).toHaveBeenCalled();
    });

    it("calls onChange when changing octave up", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      const octaveUpButton = getByText("+");
      fireEvent.press(octaveUpButton);

      expect(onChange).toHaveBeenCalled();
    });

    it("calls onChange when changing octave down", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      const octaveDownButton = getByText("−");
      fireEvent.press(octaveDownButton);

      expect(onChange).toHaveBeenCalled();
    });

    it("calls onChange with correct argument on up press", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      fireEvent.press(getByText("▲"));

      expect(onChange).toHaveBeenCalledWith(expect.any(String));
    });

    it("calls onChange with correct argument on down press", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      fireEvent.press(getByText("▼"));

      expect(onChange).toHaveBeenCalledWith(expect.any(String));
    });

    it("allows multiple presses on up button", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      fireEvent.press(getByText("▲"));
      fireEvent.press(getByText("▲"));
      fireEvent.press(getByText("▲"));

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("allows multiple presses on down button", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker value="C4" onChange={onChange} />,
      );

      fireEvent.press(getByText("▼"));
      fireEvent.press(getByText("▼"));

      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Play to select mode", () => {
    it("calls onPlayToSelect when button is pressed", () => {
      const onPlayToSelect = jest.fn();
      const { getByText } = render(
        <StaffNotePicker
          onChange={jest.fn()}
          onPlayToSelect={onPlayToSelect}
        />,
      );

      fireEvent.press(getByText(/I'll play it instead/));

      expect(onPlayToSelect).toHaveBeenCalled();
    });

    it("calls onPlayToSelect only once per press", () => {
      const onPlayToSelect = jest.fn();
      const { getByText } = render(
        <StaffNotePicker
          onChange={jest.fn()}
          onPlayToSelect={onPlayToSelect}
        />,
      );

      fireEvent.press(getByText(/I'll play it instead/));

      expect(onPlayToSelect).toHaveBeenCalledTimes(1);
    });

    it("renders without onPlayToSelect callback", () => {
      // Should not throw
      expect(() => {
        render(<StaffNotePicker onChange={jest.fn()} />);
      }).not.toThrow();
    });
  });

  describe("Different clef modes", () => {
    it("renders treble clef explicitly", () => {
      const { getByTestId } = render(
        <StaffNotePicker clef="treble" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("renders bass clef", () => {
      const { getByTestId } = render(
        <StaffNotePicker clef="bass" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("navigation works with bass clef", () => {
      const onChange = jest.fn();
      const { getByText } = render(
        <StaffNotePicker clef="bass" value="F3" onChange={onChange} />,
      );

      fireEvent.press(getByText("▲"));

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("handles undefined value gracefully", () => {
      expect(() => {
        render(<StaffNotePicker onChange={jest.fn()} />);
      }).not.toThrow();
    });

    it("handles high notes", () => {
      const { getByTestId } = render(
        <StaffNotePicker value="C7" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("handles low notes", () => {
      const { getByTestId } = render(
        <StaffNotePicker value="C2" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { getByTestId } = render(
        <StaffNotePicker value="F#4" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { getByTestId } = render(
        <StaffNotePicker value="Bb3" onChange={jest.fn()} />,
      );
      expect(getByTestId("notation-display")).toBeTruthy();
    });
  });

  describe("Instrument prop", () => {
    it("accepts instrument prop", () => {
      const { toJSON } = render(
        <StaffNotePicker onChange={jest.fn()} instrument="trombone" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("works with different instruments", () => {
      expect(() => {
        render(<StaffNotePicker onChange={jest.fn()} instrument="trumpet" />);
      }).not.toThrow();

      expect(() => {
        render(<StaffNotePicker onChange={jest.fn()} instrument="clarinet" />);
      }).not.toThrow();
    });
  });
});
