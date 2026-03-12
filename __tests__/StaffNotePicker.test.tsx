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
  return function MockNotationDisplay({ musicxml }: MockNotationDisplayProps): React.JSX.Element {
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
  });
});
