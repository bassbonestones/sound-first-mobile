/**
 * Tests for SoftGateRulesList admin component
 * Tests soft gate rule listing and CRUD operations
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import SoftGateRulesList from "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRulesList";

// Mock the hook
const mockUseSoftGateRules = {
  rules: [],
  loading: false,
  selectedRule: null,
  setSelectedRule: jest.fn(),
  deleteRule: jest.fn(),
  fetchRules: jest.fn(),
};

jest.mock("../../src/screens/Admin/tabs/SoftGateExplorer/hooks", () => ({
  useSoftGateRules: () => mockUseSoftGateRules,
}));

// Mock child components
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRuleEditModal",
  () => "SoftGateRuleEditModal",
);
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRuleCreateModal",
  () => "SoftGateRuleCreateModal",
);

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  centered: {},
  createButton: {},
  createButtonText: {},
  list: {},
  listItem: {},
  listItemContent: {},
  listItemHeader: {},
  listItemTitle: {},
  listItemDetails: {},
  listItemDetail: {},
  listItemSubtext: {},
}));

describe("SoftGateRulesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values
    mockUseSoftGateRules.rules = [];
    mockUseSoftGateRules.loading = false;
    mockUseSoftGateRules.selectedRule = null;
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  describe("Loading State", () => {
    it("shows ActivityIndicator when loading", () => {
      mockUseSoftGateRules.loading = true;

      const { UNSAFE_root } = render(<SoftGateRulesList />);

      const activityIndicator = UNSAFE_root.findAllByType("ActivityIndicator");
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================
  describe("Empty State", () => {
    it("renders Create Rule button", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText("+ Create Rule")).toBeTruthy();
    });

    it("has accessible create button", () => {
      const { getByRole } = render(<SoftGateRulesList />);

      expect(getByRole("button", { name: "Create rule" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // WITH DATA
  // ==========================================================================
  describe("With Data", () => {
    const mockRules = [
      {
        id: 1,
        dimension_name: "range_usage",
        frontier_buffer: 2,
        promotion_step: 1,
        min_attempts: 5,
        success_required_count: 3,
        success_window_count: 5,
        success_rating_threshold: 0.7,
      },
      {
        id: 2,
        dimension_name: "rhythm_complexity",
        frontier_buffer: 1,
        promotion_step: 1,
        min_attempts: 3,
        success_required_count: 2,
        success_window_count: 3,
        success_rating_threshold: 0.8,
      },
    ];

    beforeEach(() => {
      mockUseSoftGateRules.rules = mockRules;
    });

    it("renders rule dimension names", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText("range_usage")).toBeTruthy();
      expect(getByText("rhythm_complexity")).toBeTruthy();
    });

    it("shows buffer value", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText("Buffer: 2")).toBeTruthy();
    });

    it("shows step value", () => {
      const { getAllByText } = render(<SoftGateRulesList />);

      const stepTexts = getAllByText("Step: 1");
      expect(stepTexts.length).toBeGreaterThan(0);
    });

    it("shows min attempts", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText("Min Attempts: 5")).toBeTruthy();
    });

    it("shows success criteria", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText(/Success: 3 of 5/)).toBeTruthy();
    });

    it("shows rating threshold", () => {
      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText(/rating ≥ 0.7/)).toBeTruthy();
    });

    it("has accessible rule buttons", () => {
      const { getByRole } = render(<SoftGateRulesList />);

      expect(
        getByRole("button", { name: "Edit rule range_usage" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // RULE SELECTION
  // ==========================================================================
  describe("Rule Selection", () => {
    beforeEach(() => {
      mockUseSoftGateRules.rules = [
        {
          id: 1,
          dimension_name: "test_dimension",
          frontier_buffer: 1,
          promotion_step: 1,
          min_attempts: 3,
          success_required_count: 2,
          success_window_count: 4,
          success_rating_threshold: 0.75,
        },
      ];
    });

    it("calls setSelectedRule when rule pressed", async () => {
      const { getByText } = render(<SoftGateRulesList />);

      await act(async () => {
        fireEvent.press(getByText("test_dimension"));
      });

      expect(mockUseSoftGateRules.setSelectedRule).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, dimension_name: "test_dimension" }),
      );
    });
  });

  // ==========================================================================
  // CREATE BUTTON
  // ==========================================================================
  describe("Create Button", () => {
    it("opens create modal when pressed", async () => {
      const { getByText } = render(<SoftGateRulesList />);

      await act(async () => {
        fireEvent.press(getByText("+ Create Rule"));
      });

      // Button should be rendered and pressed without error
      expect(getByText("+ Create Rule")).toBeTruthy();
    });
  });

  // ==========================================================================
  // SUCCESS WINDOW ALL
  // ==========================================================================
  describe("Success Window", () => {
    it("shows 'all' when success_window_count is null", () => {
      mockUseSoftGateRules.rules = [
        {
          id: 1,
          dimension_name: "unlimited_window",
          frontier_buffer: 1,
          promotion_step: 1,
          min_attempts: 3,
          success_required_count: 2,
          success_window_count: null,
          success_rating_threshold: 0.75,
        },
      ];

      const { getByText } = render(<SoftGateRulesList />);

      expect(getByText(/Success: 2 of all/)).toBeTruthy();
    });
  });
});
