/**
 * Tests for UserSoftGatesTab admin component
 * Tests soft gate display and editing
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { UserSoftGatesTab } from "../../src/screens/Admin/tabs/UserProgressionInspector/UserSoftGatesTab";

// Mock the api client
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
  devWarn: jest.fn(),
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  default: {
    detailSection: {},
    detailSectionTitle: {},
    centered: {},
    noDataText: {},
  },
}));

// Mock local styles
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/styles",
  () => ({
    localStyles: {
      helpText: {},
      softGateCard: {},
      softGateHeader: {},
      softGateName: {},
      softGateExpand: {},
      softGateEdit: {},
      softGateValues: {},
      softGateValue: {},
      softGateActions: {},
      saveButton: {},
      saveButtonText: {},
      cancelButton: {},
      cancelButtonText: {},
    },
  }),
);

// Mock utils with showAlert
const mockShowAlert = jest.fn();
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/utils",
  () => ({
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
);

// Mock EditableRow component
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/components",
  () => ({
    EditableRow: ({
      label,
      value,
      onChange,
    }: {
      label: string;
      value: string;
      onChange: (v: string) => void;
    }) => {
      const { View, Text, TextInput } = require("react-native");
      return (
        <View testID={`editable-row-${label}`}>
          <Text>{label}</Text>
          <TextInput
            testID={`input-${label}`}
            value={value}
            onChangeText={onChange}
          />
        </View>
      );
    },
  }),
);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserSoftGatesTab", () => {
  const mockOnRefresh = jest.fn();

  const defaultProps = {
    userData: {},
    userId: "123",
    onRefresh: mockOnRefresh,
  };

  const mockSoftGates = [
    {
      dimension_name: "interval_sustained",
      comfortable_value: 2.5,
      max_demonstrated_value: 4.0,
      frontier_success_ema: 0.75,
      frontier_attempt_count_since_last_promo: 3,
    },
    {
      dimension_name: "rhythm_complexity",
      comfortable_value: 1.0,
      max_demonstrated_value: 2.0,
      frontier_success_ema: 0.5,
      frontier_attempt_count_since_last_promo: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("loading state", () => {
    it("shows loading indicator while fetching", async () => {
      // Never resolve the fetch
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { UNSAFE_getByType } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );
      const { ActivityIndicator } = require("react-native");

      // ActivityIndicator should be present
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe("rendering", () => {
    it("renders soft gates after loading", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText, UNSAFE_queryByType } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );
      const { ActivityIndicator } = require("react-native");

      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeFalsy();
      });

      expect(getByText("interval_sustained")).toBeTruthy();
      expect(getByText("rhythm_complexity")).toBeTruthy();
      expect(getByText("Comfort: 2.5")).toBeTruthy();
      expect(getByText("Max: 4.0")).toBeTruthy();
    });

    it("shows help text", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText } = render(<UserSoftGatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("Tap a dimension to edit values")).toBeTruthy();
      });
    });

    it("shows empty state when no gates", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: [] }),
      });

      const { getByText } = render(<UserSoftGatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("No soft gate data available")).toBeTruthy();
      });
    });

    it("displays EMA as percentage", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText } = render(<UserSoftGatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("EMA: 75%")).toBeTruthy();
      });
    });
  });

  describe("editing", () => {
    it("expands gate for editing on tap", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText, getByTestId } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );

      await waitFor(() => {
        expect(getByText("interval_sustained")).toBeTruthy();
      });

      // Tap to expand
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      // Should show edit fields
      expect(getByTestId("editable-row-Comfort")).toBeTruthy();
      expect(getByTestId("editable-row-Max Demonstrated")).toBeTruthy();
      expect(getByTestId("editable-row-Success EMA")).toBeTruthy();
      expect(getByTestId("editable-row-Attempts Since Promo")).toBeTruthy();
    });

    it("collapses gate on second tap", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText, queryByTestId } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );

      await waitFor(() => {
        expect(getByText("interval_sustained")).toBeTruthy();
      });

      // Tap to expand
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      // Tap again to collapse
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      expect(queryByTestId("editable-row-Comfort")).toBeFalsy();
    });

    it("cancels editing on cancel button", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ soft_gates: mockSoftGates }),
      });

      const { getByText, queryByTestId } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );

      await waitFor(() => {
        expect(getByText("interval_sustained")).toBeTruthy();
      });

      // Tap to expand
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      // Click cancel
      await act(async () => {
        fireEvent.press(getByText("Cancel"));
      });

      expect(queryByTestId("editable-row-Comfort")).toBeFalsy();
    });

    it("saves changes on save button", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ soft_gates: mockSoftGates }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ soft_gates: mockSoftGates }),
        });

      const { getByText, getByTestId } = render(
        <UserSoftGatesTab {...defaultProps} />,
      );

      await waitFor(() => {
        expect(getByText("interval_sustained")).toBeTruthy();
      });

      // Tap to expand
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      // Change a value
      await act(async () => {
        fireEvent.changeText(getByTestId("input-Comfort"), "3.5");
      });

      // Save
      await act(async () => {
        fireEvent.press(getByText("Save"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users/123/soft-gates/interval_sustained",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("3.5"),
          }),
        );
      });
    });

    it("shows error alert on save failure", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ soft_gates: mockSoftGates }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(<UserSoftGatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("interval_sustained")).toBeTruthy();
      });

      // Tap to expand
      await act(async () => {
        fireEvent.press(getByText("interval_sustained"));
      });

      // Save
      await act(async () => {
        fireEvent.press(getByText("Save"));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          "Error",
          "Failed to save changes",
        );
      });
    });
  });

  describe("error handling", () => {
    it("handles fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(<UserSoftGatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("No soft gate data available")).toBeTruthy();
      });
    });
  });
});
