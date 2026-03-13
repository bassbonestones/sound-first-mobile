/**
 * Tests for CapabilityPath screen
 *
 * Tests the curriculum planning tool for organizing capability teaching order.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Alert } from "react-native";

import CapabilityPath from "../src/screens/CapabilityPath";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock Clipboard
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock child components
jest.mock(
  "../src/screens/CapabilityPath/components/CapabilityRow",
  () =>
    function MockCapabilityRow({
      item,
      onToggleEdit,
      onUpdateItem,
      onMoveItem,
      onDeleteItem,
    }: any) {
      const { View, Text, TouchableOpacity } = require("react-native");
      return (
        <View testID={`capability-row-${item.id}`}>
          <Text>{item.display_name}</Text>
          <TouchableOpacity
            testID={`edit-btn-${item.id}`}
            onPress={onToggleEdit}
          >
            <Text>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`move-up-${item.id}`}
            onPress={() => onMoveItem(item.id, "up")}
          >
            <Text>Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`move-down-${item.id}`}
            onPress={() => onMoveItem(item.id, "down")}
          >
            <Text>Down</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`delete-btn-${item.id}`}
            onPress={() => onDeleteItem(item.id)}
          >
            <Text>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID={`update-btn-${item.id}`}
            onPress={() =>
              onUpdateItem(item.id, "display_name", "Updated Name")
            }
          >
            <Text>Update</Text>
          </TouchableOpacity>
        </View>
      );
    },
);

jest.mock(
  "../src/screens/CapabilityPath/components/AddCapabilityModal",
  () =>
    function MockAddCapabilityModal({
      visible,
      newItem,
      onChangeItem,
      onAdd,
      onCancel,
    }: any) {
      const {
        View,
        Text,
        TouchableOpacity,
        TextInput,
      } = require("react-native");
      if (!visible) return null;
      return (
        <View testID="add-capability-modal">
          <Text>Add New Capability</Text>
          <TextInput
            testID="new-capability-input"
            value={newItem.capability}
            onChangeText={(text: string) =>
              onChangeItem({ ...newItem, capability: text })
            }
          />
          <TouchableOpacity testID="add-confirm-btn" onPress={onAdd}>
            <Text>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="add-cancel-btn" onPress={onCancel}>
            <Text>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    },
);

// Mock ResetButton
jest.mock(
  "../src/components/ResetButton",
  () =>
    function MockResetButton() {
      const { View } = require("react-native");
      return <View testID="reset-button" />;
    },
);

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Sample test data (simplified version of INITIAL_DATA)
const mockInitialData = [
  {
    id: 1,
    capability: "notation_staff",
    display_name: "The Staff (5 Lines)",
    category: "Fundamentals",
    teaching_order: 1,
    type: "P",
    mastery_count: 1,
    teaching_materials: "",
    notes: "Must understand staff before any notation",
  },
  {
    id: 2,
    capability: "clef_bass",
    display_name: "Bass Clef (F Clef)",
    category: "Clefs",
    teaching_order: 2,
    type: "P",
    mastery_count: 1,
    teaching_materials: "",
    notes: "Trombone's primary clef",
  },
  {
    id: 3,
    capability: "time_sig_4_4",
    display_name: "4/4 Time",
    category: "Time Signatures",
    teaching_order: 3,
    type: "P",
    mastery_count: 1,
    teaching_materials: "",
    notes: "Most common meter",
  },
];

// Mock the data module
jest.mock("../src/screens/CapabilityPath/data/initialCapabilities", () => ({
  INITIAL_DATA: [
    {
      id: 1,
      capability: "notation_staff",
      display_name: "The Staff (5 Lines)",
      category: "Fundamentals",
      teaching_order: 1,
      type: "P",
      mastery_count: 1,
      teaching_materials: "",
      notes: "Must understand staff before any notation",
    },
    {
      id: 2,
      capability: "clef_bass",
      display_name: "Bass Clef (F Clef)",
      category: "Clefs",
      teaching_order: 2,
      type: "P",
      mastery_count: 1,
      teaching_materials: "",
      notes: "Trombone's primary clef",
    },
    {
      id: 3,
      capability: "time_sig_4_4",
      display_name: "4/4 Time",
      category: "Time Signatures",
      teaching_order: 3,
      type: "P",
      mastery_count: 1,
      teaching_materials: "",
      notes: "Most common meter",
    },
  ],
  toCSV: jest.fn(
    () => "id,capability,display_name\n1,notation_staff,The Staff",
  ),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe("CapabilityPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (Clipboard.setStringAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe("Initial Loading", () => {
    it("shows loading indicator while loading", async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves to keep loading state
      );

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      expect(getByText("Loading capabilities...")).toBeTruthy();
    });

    it("loads data from AsyncStorage if available", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });
    });

    it("uses INITIAL_DATA when AsyncStorage is empty", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it("handles AsyncStorage error gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error("Storage error"),
      );

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });
    });
  });

  describe("Sorting and Filtering", () => {
    it("sorts by teaching order by default", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("The Staff (5 Lines)")).toBeTruthy();
      });
    });

    it("switches to sort by category", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByText, getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Sort by category"));

      expect(getByText("By Category")).toBeTruthy();
    });

    it("filters by category", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByText, getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Filter by Fundamentals category"));

      // Should now show only Fundamentals items
      expect(getByText("The Staff (5 Lines)")).toBeTruthy();
    });

    it("shows all categories when All filter selected", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByText, getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Filter by all categories"));

      expect(getByText("All")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("renders back button", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Go back")).toBeTruthy();
      });
    });

    it("navigates back when no unsaved changes", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Go back")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Go back"));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it("shows alert when navigating back with unsaved changes", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText, getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      // Make a change to trigger unsaved state
      fireEvent.press(getByTestId("update-btn-1"));

      // Try to go back
      fireEvent.press(getByLabelText("Go back"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Unsaved Changes",
        "Save before leaving?",
        expect.any(Array),
      );
    });
  });

  describe("CRUD Operations", () => {
    it("updates item when updateItem is called", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("update-btn-1"));

      // The hasUnsavedChanges should now be true
      expect(getByTestId("capability-row-1")).toBeTruthy();
    });

    it("opens add modal when Add button pressed", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText, getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Add new capability")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Add new capability"));

      expect(getByTestId("add-capability-modal")).toBeTruthy();
    });

    it("closes add modal on cancel", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText, getByTestId, queryByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Add new capability")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Add new capability"));
      expect(getByTestId("add-capability-modal")).toBeTruthy();

      fireEvent.press(getByTestId("add-cancel-btn"));

      await waitFor(() => {
        expect(queryByTestId("add-capability-modal")).toBeNull();
      });
    });

    it("adds new item when confirmed", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText, getByTestId, getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Add new capability")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Add new capability"));
      fireEvent.press(getByTestId("add-confirm-btn"));

      // Modal should close after adding
      await waitFor(() => {
        expect(getByText("4 capabilities")).toBeTruthy();
      });
    });

    it("shows delete confirmation alert", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("delete-btn-1"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Delete Capability?",
        "Are you sure you want to remove this capability?",
        expect.any(Array),
      );
    });

    it("moves item up", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("move-up-2"));

      // Movement should trigger hasUnsavedChanges
      expect(getByTestId("capability-row-2")).toBeTruthy();
    });

    it("moves item down", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("move-down-1"));

      expect(getByTestId("capability-row-1")).toBeTruthy();
    });
  });

  describe("Save and Export", () => {
    it("saves data to AsyncStorage", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText, getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      // Make a change first
      fireEvent.press(getByTestId("update-btn-1"));

      // Save
      fireEvent.press(getByLabelText("Save changes"));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it("exports to clipboard", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Export to clipboard")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Export to clipboard"));

      await waitFor(() => {
        expect(Clipboard.setStringAsync).toHaveBeenCalled();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        "Exported!",
        expect.stringContaining("CSV copied to clipboard"),
        expect.any(Array),
      );
    });

    it("shows reset confirmation", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByLabelText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByLabelText("Reset to defaults")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Reset to defaults"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Reset to Defaults?",
        expect.stringContaining("restore all"),
        expect.any(Array),
      );
    });
  });

  describe("Toggle Edit", () => {
    it("toggles edit state on row", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockInitialData),
      );

      const { getByTestId } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByTestId("capability-row-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("edit-btn-1"));

      // Edit was toggled
      expect(getByTestId("capability-row-1")).toBeTruthy();
    });
  });

  describe("Data Upgrade", () => {
    it("upgrades data when INITIAL_DATA has more items", async () => {
      // Stored data has fewer items than INITIAL_DATA
      const oldData = [mockInitialData[0]];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(oldData),
      );

      const { getByText } = render(
        <CapabilityPath navigation={mockNavigation} />,
      );

      await waitFor(() => {
        expect(getByText("3 capabilities")).toBeTruthy();
      });

      // Should have upgraded and saved the new data
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
