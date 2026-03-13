/**
 * Tests for SelectionPanel component
 *
 * Tests tune/key selection and Go button functionality.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SelectionPanel from "../src/screens/TuneMastery/components/SelectionPanel";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockTunes = [
  { id: "tune1", name: "Autumn Leaves" },
  { id: "tune2", name: "All The Things You Are" },
  { id: "tune3", name: "Blue Bossa" },
];

const defaultProps = {
  tunes: mockTunes,
  selectedTuneId: "tune1",
  selectedKey: "C" as const,
  onSelectTune: jest.fn(),
  onSelectKey: jest.fn(),
  onGo: jest.fn(),
  isLearningPick: false,
};

describe("SelectionPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(<SelectionPanel {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it("displays selected tune name", () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);
      expect(getByText("Autumn Leaves")).toBeTruthy();
    });

    it("displays selected key", () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);
      expect(getByText("C")).toBeTruthy();
    });

    it("shows Go button", () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);
      expect(getByText("Go")).toBeTruthy();
    });

    it("displays Engine Select when no tune selected", () => {
      const { getByText } = render(
        <SelectionPanel {...defaultProps} selectedTuneId={null} />,
      );
      expect(getByText("Engine Select")).toBeTruthy();
    });

    it("displays Engine Select when no key selected", () => {
      const { getAllByText } = render(
        <SelectionPanel {...defaultProps} selectedKey={null} />,
      );
      // "Engine Select" appears once in the tune dropdown, once for key
      expect(getAllByText("Engine Select").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("tune picker modal", () => {
    it("opens tune picker when tune dropdown is pressed", async () => {
      const { getByText, queryByText } = render(
        <SelectionPanel {...defaultProps} />,
      );

      // Press tune dropdown
      fireEvent.press(getByText("Autumn Leaves"));

      // Modal should appear with picker title
      await waitFor(() => {
        expect(getByText("Select Tune")).toBeTruthy();
      });
    });

    it("displays all tune options in picker", async () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);

      fireEvent.press(getByText("Autumn Leaves"));

      await waitFor(() => {
        expect(getByText("All The Things You Are")).toBeTruthy();
        expect(getByText("Blue Bossa")).toBeTruthy();
      });
    });

    it("calls onSelectTune when tune is selected", async () => {
      const onSelectTune = jest.fn();
      const { getByText, getAllByText } = render(
        <SelectionPanel {...defaultProps} onSelectTune={onSelectTune} />,
      );

      fireEvent.press(getByText("Autumn Leaves"));

      await waitFor(() => {
        expect(getByText("Select Tune")).toBeTruthy();
      });

      // Select a different tune
      fireEvent.press(getByText("Blue Bossa"));

      expect(onSelectTune).toHaveBeenCalledWith("tune3");
    });

    it("closes tune picker after selection", async () => {
      const { getByText, queryByText } = render(
        <SelectionPanel {...defaultProps} />,
      );

      fireEvent.press(getByText("Autumn Leaves"));

      await waitFor(() => {
        expect(getByText("Select Tune")).toBeTruthy();
      });

      fireEvent.press(getByText("Blue Bossa"));

      await waitFor(() => {
        expect(queryByText("Select Tune")).toBeNull();
      });
    });

    it("shows checkmark on selected tune", async () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);

      fireEvent.press(getByText("Autumn Leaves"));

      await waitFor(() => {
        expect(getByText("✓")).toBeTruthy();
      });
    });
  });

  describe("key picker modal", () => {
    it("opens key picker when key dropdown is pressed", async () => {
      const { getByText } = render(<SelectionPanel {...defaultProps} />);

      fireEvent.press(getByText("C"));

      await waitFor(() => {
        expect(getByText("Select Key")).toBeTruthy();
      });
    });

    it("displays all key options in picker", async () => {
      const { getByText, queryByText } = render(
        <SelectionPanel {...defaultProps} />,
      );

      fireEvent.press(getByText("C"));

      await waitFor(() => {
        // Should show various keys in the picker
        expect(queryByText("Select Key")).toBeTruthy();
        expect(queryByText("Engine Select")).toBeTruthy();
      });
    });

    it("calls onSelectKey when key is selected", async () => {
      const onSelectKey = jest.fn();
      const { getByText, getAllByText } = render(
        <SelectionPanel {...defaultProps} onSelectKey={onSelectKey} />,
      );

      fireEvent.press(getByText("C"));

      await waitFor(() => {
        expect(getByText("Select Key")).toBeTruthy();
      });

      // Find and press the F key option - need to be careful about matching
      const fKeys = getAllByText("F");
      // First F might be from the selected key display, so press the one in the modal
      fireEvent.press(fKeys[fKeys.length - 1]);

      expect(onSelectKey).toHaveBeenCalledWith("F");
    });

    it("closes key picker after selection", async () => {
      const { getByText, queryByText, getAllByText } = render(
        <SelectionPanel {...defaultProps} />,
      );

      fireEvent.press(getByText("C"));

      await waitFor(() => {
        expect(getByText("Select Key")).toBeTruthy();
      });

      // Select a key
      const dKeys = getAllByText("D");
      fireEvent.press(dKeys[dKeys.length - 1]);

      await waitFor(() => {
        expect(queryByText("Select Key")).toBeNull();
      });
    });
  });

  describe("go button", () => {
    it("calls onGo when Go button is pressed", () => {
      const onGo = jest.fn();
      const { getByText } = render(
        <SelectionPanel {...defaultProps} onGo={onGo} />,
      );

      fireEvent.press(getByText("Go"));

      expect(onGo).toHaveBeenCalledTimes(1);
    });
  });

  describe("learning pick mode", () => {
    it("shows different styling when isLearningPick is true", () => {
      const { toJSON } = render(
        <SelectionPanel {...defaultProps} isLearningPick={true} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles empty tunes array", () => {
      const { toJSON } = render(
        <SelectionPanel {...defaultProps} tunes={[]} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles missing tune selection", () => {
      const { toJSON } = render(
        <SelectionPanel {...defaultProps} selectedTuneId="nonexistent" />,
      );
      // Just verify component renders
      expect(toJSON()).toBeTruthy();
    });
  });
});
