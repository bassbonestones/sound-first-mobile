/**
 * Tests for TuneList component
 *
 * Tests for tune list rendering and callback handling.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TuneList from "../src/screens/TuneMastery/components/TuneList";

// Mock TuneCard to simplify testing
jest.mock("../src/screens/TuneMastery/components/TuneCard", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockTuneCard({
    tune,
    onMoveUp,
    onMoveDown,
    onArchive,
    onRestore,
    onDelete,
    onRename,
    onUpdateSettings,
    onToggleExpand,
    isExpanded,
    isFirst,
    isLast,
    isArchive,
  }: {
    tune: { id: string; name: string };
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onArchive?: () => void;
    onRestore?: () => void;
    onDelete?: () => void;
    onRename?: (name: string) => void;
    onUpdateSettings?: (settings: Record<string, unknown>) => void;
    onToggleExpand: () => void;
    isExpanded: boolean;
    isFirst: boolean;
    isLast: boolean;
    isArchive: boolean;
  }) {
    return (
      <View testID={`tune-card-${tune.id}`}>
        <Text>{tune.name}</Text>
        <TouchableOpacity testID={`expand-${tune.id}`} onPress={onToggleExpand}>
          <Text>{isExpanded ? "Collapse" : "Expand"}</Text>
        </TouchableOpacity>
        {onMoveUp && (
          <TouchableOpacity testID={`move-up-${tune.id}`} onPress={onMoveUp}>
            <Text>Move Up</Text>
          </TouchableOpacity>
        )}
        {onMoveDown && (
          <TouchableOpacity
            testID={`move-down-${tune.id}`}
            onPress={onMoveDown}
          >
            <Text>Move Down</Text>
          </TouchableOpacity>
        )}
        {onArchive && (
          <TouchableOpacity testID={`archive-${tune.id}`} onPress={onArchive}>
            <Text>Archive</Text>
          </TouchableOpacity>
        )}
        {onRestore && (
          <TouchableOpacity testID={`restore-${tune.id}`} onPress={onRestore}>
            <Text>Restore</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity testID={`delete-${tune.id}`} onPress={onDelete}>
            <Text>Delete</Text>
          </TouchableOpacity>
        )}
        {onRename && (
          <TouchableOpacity
            testID={`rename-${tune.id}`}
            onPress={() => onRename("New Name")}
          >
            <Text>Rename</Text>
          </TouchableOpacity>
        )}
        {onUpdateSettings && (
          <TouchableOpacity
            testID={`settings-${tune.id}`}
            onPress={() => onUpdateSettings({ tempo: 120 })}
          >
            <Text>Settings</Text>
          </TouchableOpacity>
        )}
        <Text testID={`first-${tune.id}`}>{isFirst ? "first" : ""}</Text>
        <Text testID={`last-${tune.id}`}>{isLast ? "last" : ""}</Text>
        <Text testID={`archive-status-${tune.id}`}>
          {isArchive ? "archived" : "active"}
        </Text>
      </View>
    );
  };
});

const mockTunes = [
  {
    id: "tune1",
    name: "Autumn Leaves",
    keyScores: { C: 80, F: 60 },
    totalPracticeCount: 10,
    lastPracticed: "2024-01-01",
    createdAt: "2024-01-01",
    settings: { tempo: 100 },
  },
  {
    id: "tune2",
    name: "All The Things You Are",
    keyScores: { C: 75 },
    totalPracticeCount: 5,
    lastPracticed: "2024-01-02",
    createdAt: "2024-01-02",
    settings: { tempo: 120 },
  },
  {
    id: "tune3",
    name: "Blue Bossa",
    keyScores: {},
    totalPracticeCount: 0,
    lastPracticed: null,
    createdAt: "2024-01-03",
    settings: {},
  },
];

describe("TuneList", () => {
  describe("rendering", () => {
    it("renders empty state when no tunes", () => {
      const { getByText } = render(<TuneList tunes={[]} />);

      expect(getByText("No tunes yet. Add one to get started!")).toBeTruthy();
    });

    it("renders empty archive state when isArchive", () => {
      const { getByText } = render(<TuneList tunes={[]} isArchive={true} />);

      expect(getByText("No archived tunes")).toBeTruthy();
    });

    it("renders tune cards for each tune", () => {
      const { getByText } = render(<TuneList tunes={mockTunes} />);

      expect(getByText("Autumn Leaves")).toBeTruthy();
      expect(getByText("All The Things You Are")).toBeTruthy();
      expect(getByText("Blue Bossa")).toBeTruthy();
    });

    it("passes correct isFirst/isLast props", () => {
      const { getByTestId } = render(<TuneList tunes={mockTunes} />);

      expect(getByTestId("first-tune1").props.children).toBe("first");
      expect(getByTestId("last-tune1").props.children).toBe("");
      expect(getByTestId("first-tune3").props.children).toBe("");
      expect(getByTestId("last-tune3").props.children).toBe("last");
    });

    it("passes isArchive prop to cards", () => {
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} isArchive={true} />,
      );

      expect(getByTestId("archive-status-tune1").props.children).toBe(
        "archived",
      );
    });
  });

  describe("expand/collapse", () => {
    it("expands card on click", () => {
      const { getByTestId, getByText } = render(<TuneList tunes={mockTunes} />);

      // Initially all are collapsed
      expect(getByTestId("expand-tune1")).toBeTruthy();

      // Click to expand
      fireEvent.press(getByTestId("expand-tune1"));

      // Should now show Collapse
      expect(getByText("Collapse")).toBeTruthy();
    });

    it("collapses expanded card on second click", () => {
      const { getByTestId, queryByText, getAllByText } = render(
        <TuneList tunes={mockTunes} />,
      );

      // Expand first card
      fireEvent.press(getByTestId("expand-tune1"));

      // Collapse it
      fireEvent.press(getByTestId("expand-tune1"));

      // All should show Expand
      expect(getAllByText("Expand").length).toBe(3);
    });

    it("only one card expanded at a time", () => {
      const { getByTestId, getAllByText } = render(
        <TuneList tunes={mockTunes} />,
      );

      // Expand first card
      fireEvent.press(getByTestId("expand-tune1"));

      // Expand second card
      fireEvent.press(getByTestId("expand-tune2"));

      // Only one should be expanded
      expect(getAllByText("Collapse").length).toBe(1);
      expect(getAllByText("Expand").length).toBe(2);
    });
  });

  describe("callbacks", () => {
    it("calls onReorder with tune id and direction -1 for move up", () => {
      const mockOnReorder = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onReorder={mockOnReorder} />,
      );

      fireEvent.press(getByTestId("move-up-tune2"));

      expect(mockOnReorder).toHaveBeenCalledWith("tune2", -1);
    });

    it("calls onReorder with tune id and direction 1 for move down", () => {
      const mockOnReorder = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onReorder={mockOnReorder} />,
      );

      fireEvent.press(getByTestId("move-down-tune1"));

      expect(mockOnReorder).toHaveBeenCalledWith("tune1", 1);
    });

    it("calls onArchive with tune id", () => {
      const mockOnArchive = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onArchive={mockOnArchive} />,
      );

      fireEvent.press(getByTestId("archive-tune1"));

      expect(mockOnArchive).toHaveBeenCalledWith("tune1");
    });

    it("calls onRestore with tune id", () => {
      const mockOnRestore = jest.fn();
      const { getByTestId } = render(
        <TuneList
          tunes={mockTunes}
          onRestore={mockOnRestore}
          isArchive={true}
        />,
      );

      fireEvent.press(getByTestId("restore-tune1"));

      expect(mockOnRestore).toHaveBeenCalledWith("tune1");
    });

    it("calls onDelete with tune id", () => {
      const mockOnDelete = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onDelete={mockOnDelete} />,
      );

      fireEvent.press(getByTestId("delete-tune1"));

      expect(mockOnDelete).toHaveBeenCalledWith("tune1");
    });

    it("calls onRename with tune id and new name", () => {
      const mockOnRename = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onRename={mockOnRename} />,
      );

      fireEvent.press(getByTestId("rename-tune1"));

      expect(mockOnRename).toHaveBeenCalledWith("tune1", "New Name");
    });

    it("calls onUpdateSettings with tune id and settings", () => {
      const mockOnUpdateSettings = jest.fn();
      const { getByTestId } = render(
        <TuneList tunes={mockTunes} onUpdateSettings={mockOnUpdateSettings} />,
      );

      fireEvent.press(getByTestId("settings-tune2"));

      expect(mockOnUpdateSettings).toHaveBeenCalledWith("tune2", {
        tempo: 120,
      });
    });

    it("does not render move buttons when onReorder not provided", () => {
      const { queryByTestId } = render(<TuneList tunes={mockTunes} />);

      expect(queryByTestId("move-up-tune1")).toBeNull();
      expect(queryByTestId("move-down-tune1")).toBeNull();
    });

    it("does not render archive button when onArchive not provided", () => {
      const { queryByTestId } = render(<TuneList tunes={mockTunes} />);

      expect(queryByTestId("archive-tune1")).toBeNull();
    });
  });

  describe("accessibility", () => {
    it("has accessible empty state", () => {
      const { getByLabelText } = render(<TuneList tunes={[]} />);

      expect(
        getByLabelText("No tunes yet. Add one to get started"),
      ).toBeTruthy();
    });

    it("has correct accessibility label for tune list", () => {
      const { getByLabelText } = render(<TuneList tunes={mockTunes} />);

      expect(getByLabelText("Active tune list with 3 tunes")).toBeTruthy();
    });

    it("has correct accessibility label for archive list", () => {
      const { getByLabelText } = render(
        <TuneList tunes={mockTunes} isArchive={true} />,
      );

      expect(getByLabelText("Archived tune list with 3 tunes")).toBeTruthy();
    });

    it("has correct singular label for one tune", () => {
      const { getByLabelText } = render(<TuneList tunes={[mockTunes[0]]} />);

      expect(getByLabelText("Active tune list with 1 tune")).toBeTruthy();
    });
  });
});
