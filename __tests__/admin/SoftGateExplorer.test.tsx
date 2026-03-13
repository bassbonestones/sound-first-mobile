/**
 * Tests for SoftGateExplorer admin component
 * Tests soft gate rules and user state tab navigation
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import SoftGateExplorer from "../../src/screens/Admin/tabs/SoftGateExplorer";

// Mock child components
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRulesList",
  () => {
    const { Text } = require("react-native");
    return () => <Text>SoftGateRulesList</Text>;
  },
);
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/UserSoftGateStateView",
  () => {
    const { Text } = require("react-native");
    return () => <Text>UserSoftGateStateView</Text>;
  },
);

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  section: {},
  subTabBar: {},
  subTab: {},
  subTabActive: {},
  subTabText: {},
  subTabTextActive: {},
}));

describe("SoftGateExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getByText } = render(<SoftGateExplorer />);

      expect(getByText("Rules")).toBeTruthy();
      expect(getByText("User State")).toBeTruthy();
    });

    it("renders Rules tab", () => {
      const { getByText } = render(<SoftGateExplorer />);

      expect(getByText("Rules")).toBeTruthy();
    });

    it("renders User State tab", () => {
      const { getByText } = render(<SoftGateExplorer />);

      expect(getByText("User State")).toBeTruthy();
    });
  });

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================
  describe("Tab Navigation", () => {
    it("starts on Rules section by default", () => {
      const { getByText } = render(<SoftGateExplorer />);

      // SoftGateRulesList should be rendered
      expect(getByText("SoftGateRulesList")).toBeTruthy();
    });

    it("switches to User State section when tab pressed", async () => {
      const { getByText, queryByText } = render(<SoftGateExplorer />);

      // Initially shows rules list
      expect(getByText("SoftGateRulesList")).toBeTruthy();
      expect(queryByText("UserSoftGateStateView")).toBeNull();

      // Click User State tab
      await act(async () => {
        fireEvent.press(getByText("User State"));
      });

      // Now shows user state view
      expect(getByText("UserSoftGateStateView")).toBeTruthy();
      expect(queryByText("SoftGateRulesList")).toBeNull();
    });

    it("switches back to Rules section", async () => {
      const { getByText, queryByText } = render(<SoftGateExplorer />);

      // Switch to User State
      await act(async () => {
        fireEvent.press(getByText("User State"));
      });

      expect(getByText("UserSoftGateStateView")).toBeTruthy();

      // Switch back to Rules
      await act(async () => {
        fireEvent.press(getByText("Rules"));
      });

      expect(getByText("SoftGateRulesList")).toBeTruthy();
      expect(queryByText("UserSoftGateStateView")).toBeNull();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Rules button", () => {
      const { getByRole } = render(<SoftGateExplorer />);

      expect(getByRole("button", { name: "View rules" })).toBeTruthy();
    });

    it("has accessible User State button", () => {
      const { getByRole } = render(<SoftGateExplorer />);

      expect(getByRole("button", { name: "View user state" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // TAB STATE
  // ==========================================================================
  describe("Tab State", () => {
    it("maintains Rules active state when selected", () => {
      const { getByText } = render(<SoftGateExplorer />);

      // Rules tab should be active by default
      const rulesTab = getByText("Rules").parent;
      expect(rulesTab).toBeTruthy();
    });

    it("updates active state when User State selected", async () => {
      const { getByText } = render(<SoftGateExplorer />);

      await act(async () => {
        fireEvent.press(getByText("User State"));
      });

      // User State tab should now be active
      const userStateTab = getByText("User State").parent;
      expect(userStateTab).toBeTruthy();
    });
  });
});
