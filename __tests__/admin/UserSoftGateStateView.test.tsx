/**
 * Tests for UserSoftGateStateView component
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react-native";
import UserSoftGateStateView from "../../src/screens/Admin/tabs/SoftGateExplorer/components/UserSoftGateStateView";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  softGateContent: {},
  userPickerContainer: {},
  userPickerLabel: {},
  userPickerButton: {},
  userPickerButtonText: {},
  userPickerArrow: {},
  resetAllButton: {},
  resetAllButtonText: {},
  centered: {},
  list: {},
  listItem: {},
  listItemHeader: {},
  listItemTitle: {},
  softGateStateGrid: {},
  softGateStatCell: {},
  softGateStatLabel: {},
  softGateStatValue: {},
  listItemSubtext: {},
  noDataText: {},
  pickerModalOverlay: {},
  pickerModalContent: {},
  pickerModalTitle: {},
  pickerModalItem: {},
  pickerModalItemSelected: {},
  pickerModalItemText: {},
  pickerModalItemSubtext: {},
  pickerModalList: {},
}));

// Mock useUserSoftGateState hook
const mockFetchStates = jest.fn();
const mockResetStates = jest.fn();
const mockSetSelectedUserId = jest.fn();
const mockSetSelectedState = jest.fn();

jest.mock("../../src/screens/Admin/tabs/SoftGateExplorer/hooks", () => ({
  useUserSoftGateState: () => ({
    users: [
      { id: 1, email: "user1@test.com", instrument: "trumpet" },
      { id: 2, email: "user2@test.com", instrument: "trombone" },
    ],
    selectedUserId: 1,
    selectedUser: { id: 1, email: "user1@test.com", instrument: "trumpet" },
    states: [
      {
        id: 1,
        dimension_name: "tonal_complexity",
        comfortable_value: 2.5,
        max_demonstrated_value: 3.0,
        frontier_success_ema: 0.85,
        frontier_attempt_count_since_last_promo: 5,
        updated_at: "2024-01-15T10:30:00Z",
      },
      {
        id: 2,
        dimension_name: "rhythm_complexity",
        comfortable_value: 1.5,
        max_demonstrated_value: 2.0,
        frontier_success_ema: 0.75,
        frontier_attempt_count_since_last_promo: 3,
        updated_at: "2024-01-14T09:00:00Z",
      },
    ],
    loading: false,
    selectedState: null,
    setSelectedUserId: mockSetSelectedUserId,
    setSelectedState: mockSetSelectedState,
    fetchStates: mockFetchStates,
    resetStates: mockResetStates,
  }),
}));

// Mock UserSoftGateStateEditModal
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/UserSoftGateStateEditModal",
  () => {
    const { View, Text } = require("react-native");
    return function MockEditModal() {
      return (
        <View>
          <Text>Edit Modal</Text>
        </View>
      );
    };
  },
);

// Mock alert
global.alert = jest.fn();

describe("UserSoftGateStateView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders user picker", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("User:")).toBeTruthy();
    });

    it("shows selected user email", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText(/user1@test\.com/)).toBeTruthy();
    });

    it("renders Reset All Dimensions button", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByLabelText("Reset all dimensions")).toBeTruthy();
    });

    it("renders state items", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("tonal_complexity")).toBeTruthy();
      expect(screen.getByText("rhythm_complexity")).toBeTruthy();
    });

    it("shows comfort values", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("2.50")).toBeTruthy();
      expect(screen.getByText("1.50")).toBeTruthy();
    });

    it("shows max demonstrated values", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("3.00")).toBeTruthy();
      expect(screen.getByText("2.00")).toBeTruthy();
    });

    it("shows EMA values", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("0.850")).toBeTruthy();
      expect(screen.getByText("0.750")).toBeTruthy();
    });

    it("shows attempt counts", () => {
      render(<UserSoftGateStateView />);
      expect(screen.getByText("5")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
    });
  });

  describe("User Picker", () => {
    it("opens user picker when button pressed", () => {
      render(<UserSoftGateStateView />);
      fireEvent.press(screen.getByLabelText(/Selected user/));
      expect(screen.getByText("Select User")).toBeTruthy();
    });

    it("shows users in picker", () => {
      render(<UserSoftGateStateView />);
      fireEvent.press(screen.getByLabelText(/Selected user/));
      expect(screen.getByLabelText("Select user user1@test.com")).toBeTruthy();
      expect(screen.getByLabelText("Select user user2@test.com")).toBeTruthy();
    });

    it("selects user when picker item pressed", () => {
      render(<UserSoftGateStateView />);
      fireEvent.press(screen.getByLabelText(/Selected user/));
      fireEvent.press(screen.getByLabelText("Select user user2@test.com"));
      expect(mockSetSelectedUserId).toHaveBeenCalledWith(2);
    });

    it("closes picker when overlay pressed", () => {
      render(<UserSoftGateStateView />);
      fireEvent.press(screen.getByLabelText(/Selected user/));
      expect(screen.getByText("Select User")).toBeTruthy();
      fireEvent.press(screen.getByLabelText("Close user picker"));
      // Modal should close
    });
  });

  describe("Reset All", () => {
    it("calls resetStates when Reset All pressed", async () => {
      mockResetStates.mockResolvedValueOnce({ success: true });
      render(<UserSoftGateStateView />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Reset all dimensions"));
      });

      expect(mockResetStates).toHaveBeenCalledWith(null);
    });

    it("shows alert on reset failure", async () => {
      mockResetStates.mockResolvedValueOnce({
        success: false,
        error: "Reset failed",
      });
      render(<UserSoftGateStateView />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Reset all dimensions"));
      });

      expect(global.alert).toHaveBeenCalledWith("Reset failed");
    });

    it("shows generic alert on reset failure without error", async () => {
      mockResetStates.mockResolvedValueOnce({ success: false });
      render(<UserSoftGateStateView />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Reset all dimensions"));
      });

      expect(global.alert).toHaveBeenCalledWith("Failed to reset");
    });
  });

  describe("State Item Interaction", () => {
    it("opens edit modal when state item pressed", () => {
      render(<UserSoftGateStateView />);
      fireEvent.press(screen.getByLabelText("Edit tonal_complexity state"));
      expect(mockSetSelectedState).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has accessible user picker button", () => {
      render(<UserSoftGateStateView />);
      const button = screen.getByLabelText(/Selected user/);
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible reset all button", () => {
      render(<UserSoftGateStateView />);
      const button = screen.getByLabelText("Reset all dimensions");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible state item buttons", () => {
      render(<UserSoftGateStateView />);
      const button = screen.getByLabelText("Edit tonal_complexity state");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
