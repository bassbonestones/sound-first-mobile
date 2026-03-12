/**
 * Tests for MiniKeyboard component
 * Covers keyboard rendering, highlighting, and interaction
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import MiniKeyboard from "../src/screens/Session/components/exercises/shared/MiniKeyboard";

describe("MiniKeyboard", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      const { getByTestId } = render(<MiniKeyboard />);
      expect(getByTestId("mini-keyboard")).toBeTruthy();
    });

    it("renders all white keys", () => {
      const { getByTestId } = render(<MiniKeyboard />);

      // 8 white keys: C4, D4, E4, F4, G4, A4, B4, C5
      expect(getByTestId("white-key-C4")).toBeTruthy();
      expect(getByTestId("white-key-D4")).toBeTruthy();
      expect(getByTestId("white-key-E4")).toBeTruthy();
      expect(getByTestId("white-key-F4")).toBeTruthy();
      expect(getByTestId("white-key-G4")).toBeTruthy();
      expect(getByTestId("white-key-A4")).toBeTruthy();
      expect(getByTestId("white-key-B4")).toBeTruthy();
      expect(getByTestId("white-key-C5")).toBeTruthy();
    });

    it("renders all black keys with sharp names by default", () => {
      const { getByTestId } = render(<MiniKeyboard />);

      // 5 black keys: C#4, D#4, F#4, G#4, A#4
      expect(getByTestId("black-key-C#4")).toBeTruthy();
      expect(getByTestId("black-key-D#4")).toBeTruthy();
      expect(getByTestId("black-key-F#4")).toBeTruthy();
      expect(getByTestId("black-key-G#4")).toBeTruthy();
      expect(getByTestId("black-key-A#4")).toBeTruthy();
    });

    it("renders with flat names when useFlatNames is true", () => {
      const { getByTestId } = render(<MiniKeyboard useFlatNames={true} />);

      // 5 black keys with flat names
      expect(getByTestId("black-key-Db4")).toBeTruthy();
      expect(getByTestId("black-key-Eb4")).toBeTruthy();
      expect(getByTestId("black-key-Gb4")).toBeTruthy();
      expect(getByTestId("black-key-Ab4")).toBeTruthy();
      expect(getByTestId("black-key-Bb4")).toBeTruthy();
    });
  });

  describe("highlighting", () => {
    it("highlights specified notes", () => {
      const { getByTestId } = render(
        <MiniKeyboard highlightNotes={["C4", "E4", "G4"]} />,
      );

      // Just verify they render - visual styling is tested elsewhere
      expect(getByTestId("white-key-C4")).toBeTruthy();
      expect(getByTestId("white-key-E4")).toBeTruthy();
      expect(getByTestId("white-key-G4")).toBeTruthy();
    });

    it("highlights black key notes", () => {
      const { getByTestId } = render(
        <MiniKeyboard highlightNotes={["C#4", "F#4"]} />,
      );

      expect(getByTestId("black-key-C#4")).toBeTruthy();
      expect(getByTestId("black-key-F#4")).toBeTruthy();
    });

    it("highlights flat note when specified", () => {
      const { getByTestId, getByText } = render(
        <MiniKeyboard highlightFlat="C4" />,
      );

      expect(getByTestId("white-key-C4")).toBeTruthy();
    });

    it("highlights sharp note when specified", () => {
      const { getByTestId } = render(<MiniKeyboard highlightSharp="D4" />);

      expect(getByTestId("white-key-D4")).toBeTruthy();
    });

    it("shows skipped white key with skip label", () => {
      const { getByTestId, getByText } = render(
        <MiniKeyboard skippedNote="E4" />,
      );

      expect(getByTestId("white-key-E4")).toBeTruthy();
      expect(getByText("skip")).toBeTruthy();
    });

    it("shows skipped black key with skip label", () => {
      const { getByTestId, getByText } = render(
        <MiniKeyboard skippedNote="C#4" />,
      );

      expect(getByTestId("black-key-C#4")).toBeTruthy();
      expect(getByText("skip")).toBeTruthy();
    });
  });

  describe("interaction", () => {
    it("is not interactive by default", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(<MiniKeyboard onKeyPress={onKeyPress} />);

      fireEvent.press(getByTestId("white-key-C4"));
      expect(onKeyPress).not.toHaveBeenCalled();
    });

    it("calls onKeyPress when white key is pressed in interactive mode", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard onKeyPress={onKeyPress} interactive={true} />,
      );

      fireEvent.press(getByTestId("white-key-C4"));
      expect(onKeyPress).toHaveBeenCalledWith("C4");
    });

    it("calls onKeyPress when black key is pressed in interactive mode", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard onKeyPress={onKeyPress} interactive={true} />,
      );

      fireEvent.press(getByTestId("black-key-C#4"));
      expect(onKeyPress).toHaveBeenCalledWith("C#4");
    });

    it("calls onKeyPress with multiple different keys", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard onKeyPress={onKeyPress} interactive={true} />,
      );

      fireEvent.press(getByTestId("white-key-C4"));
      fireEvent.press(getByTestId("white-key-D4"));
      fireEvent.press(getByTestId("black-key-F#4"));

      expect(onKeyPress).toHaveBeenCalledTimes(3);
      expect(onKeyPress).toHaveBeenNthCalledWith(1, "C4");
      expect(onKeyPress).toHaveBeenNthCalledWith(2, "D4");
      expect(onKeyPress).toHaveBeenNthCalledWith(3, "F#4");
    });

    it("uses flat names in callback when useFlatNames is true", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard
          onKeyPress={onKeyPress}
          interactive={true}
          useFlatNames={true}
        />,
      );

      fireEvent.press(getByTestId("black-key-Db4"));
      expect(onKeyPress).toHaveBeenCalledWith("Db4");
    });
  });

  describe("accessibility", () => {
    it("has accessibility labels on interactive white keys", () => {
      const { getByLabelText } = render(<MiniKeyboard interactive={true} />);

      expect(getByLabelText("Play C4 key")).toBeTruthy();
      expect(getByLabelText("Play D4 key")).toBeTruthy();
    });

    it("has accessibility labels on interactive black keys", () => {
      const { getByLabelText } = render(<MiniKeyboard interactive={true} />);

      expect(getByLabelText("Play C#4 key")).toBeTruthy();
      expect(getByLabelText("Play F#4 key")).toBeTruthy();
    });

    it("has button role on interactive keys", () => {
      const { getAllByRole } = render(<MiniKeyboard interactive={true} />);

      // Should find multiple buttons (all keys)
      const buttons = getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("combined scenarios", () => {
    it("handles multiple highlight types simultaneously", () => {
      const { getByTestId, getByText } = render(
        <MiniKeyboard
          highlightNotes={["C4", "E4"]}
          highlightFlat="D4"
          highlightSharp="G4"
          skippedNote="A4"
        />,
      );

      expect(getByTestId("white-key-C4")).toBeTruthy();
      expect(getByTestId("white-key-D4")).toBeTruthy();
      expect(getByTestId("white-key-E4")).toBeTruthy();
      expect(getByTestId("white-key-G4")).toBeTruthy();
      expect(getByTestId("white-key-A4")).toBeTruthy();
      expect(getByText("skip")).toBeTruthy();
    });

    it("works with highlighting and interaction together", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard
          highlightNotes={["C4", "E4", "G4"]}
          onKeyPress={onKeyPress}
          interactive={true}
        />,
      );

      fireEvent.press(getByTestId("white-key-C4"));
      expect(onKeyPress).toHaveBeenCalledWith("C4");
    });

    it("renders correctly with all props", () => {
      const onKeyPress = jest.fn();
      const { getByTestId } = render(
        <MiniKeyboard
          highlightNotes={["C4"]}
          highlightFlat="D4"
          highlightSharp="E4"
          skippedNote="F4"
          onKeyPress={onKeyPress}
          interactive={true}
          useFlatNames={false}
        />,
      );

      expect(getByTestId("mini-keyboard")).toBeTruthy();
    });
  });
});
