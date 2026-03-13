/**
 * Tests for CapabilityDetailView component
 * Tests capability detail display and actions
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import CapabilityDetailView from "../../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityDetailView";

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  detailContainer: {},
  detailHeader: {},
  detailTitle: {},
  detailHeaderButtons: {},
  editButton: {},
  editButtonText: {},
  closeButton: {},
  closeButtonText: {},
  deleteConfirmContainer: {},
  deleteConfirmText: {},
  deleteConfirmButtons: {},
  deleteConfirmButton: {},
  deleteConfirmButtonText: {},
  detailSection: {},
  detailSectionTitle: {},
  detailSectionContent: {},
  prerequisiteItem: {},
  prerequisiteText: {},
  dependentsItem: {},
  dependentsText: {},
  noDataText: {},
  tagContainer: {},
  tagChip: {},
  tagText: {},
}));

// Mock DetailRow component
jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/components/DetailRow",
  () => {
    const { View, Text } = require("react-native");
    return ({ label, value }: { label: string; value: string | number }) => (
      <View testID="detail-row">
        <Text>
          {label}: {value}
        </Text>
      </View>
    );
  },
);

describe("CapabilityDetailView", () => {
  const mockCapability = {
    id: 1,
    name: "test_capability",
    display_name: "Test Capability",
    domain: "Rhythm",
    description: "A test capability",
    difficulty_tier: 2,
    bit_index: 5,
    requirement_type: "required",
    is_active: true,
    is_global: true,
    prerequisite_names: ["prereq_1", "prereq_2"],
    soft_gate_requirements: { range: 8, sight_reading: 5 },
    related_focus_area: "Focus A",
    detection_rules: [{ type: "rhythm", threshold: 0.8 }],
    tags: ["beginner", "essential"],
    updated_at: "2024-01-15T10:00:00Z",
  };

  const defaultProps = {
    capability: mockCapability,
    dependencyGraph: null,
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onArchive: jest.fn(),
    onRestore: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Test Capability")).toBeTruthy();
    });

    it("returns null when capability is null", () => {
      const { queryByText } = render(
        <CapabilityDetailView {...defaultProps} capability={null} />,
      );
      expect(queryByText("Test Capability")).toBeNull();
    });

    it("shows capability name when no display_name", () => {
      const capWithoutDisplayName = { ...mockCapability, display_name: null };
      const { getByText } = render(
        <CapabilityDetailView
          {...defaultProps}
          capability={capWithoutDisplayName}
        />,
      );
      expect(getByText("test_capability")).toBeTruthy();
    });

    it("shows Edit button", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Edit")).toBeTruthy();
    });

    it("shows Delete button", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Delete")).toBeTruthy();
    });

    it("shows close button", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("✕")).toBeTruthy();
    });
  });

  // ==========================================================================
  // ACTIVE STATE
  // ==========================================================================
  describe("Active State", () => {
    it("shows Archive button when capability is active", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Archive")).toBeTruthy();
    });

    it("shows Restore button when capability is inactive", () => {
      const inactiveCapability = { ...mockCapability, is_active: false };
      const { getByText } = render(
        <CapabilityDetailView
          {...defaultProps}
          capability={inactiveCapability}
        />,
      );
      expect(getByText("Restore")).toBeTruthy();
    });
  });

  // ==========================================================================
  // BUTTON ACTIONS
  // ==========================================================================
  describe("Button Actions", () => {
    it("calls onClose when close button pressed", async () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("✕"));
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("calls onEdit when Edit button pressed", async () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Edit"));
      });

      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockCapability);
    });

    it("calls onArchive when Archive button pressed", async () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Archive"));
      });

      expect(defaultProps.onArchive).toHaveBeenCalledWith(mockCapability);
    });

    it("calls onRestore when Restore button pressed", async () => {
      const inactiveCapability = { ...mockCapability, is_active: false };
      const { getByText } = render(
        <CapabilityDetailView
          {...defaultProps}
          capability={inactiveCapability}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText("Restore"));
      });

      expect(defaultProps.onRestore).toHaveBeenCalledWith(inactiveCapability);
    });
  });

  // ==========================================================================
  // DELETE CONFIRMATION
  // ==========================================================================
  describe("Delete Confirmation", () => {
    it("shows delete confirmation when Delete pressed", async () => {
      const { getByText, queryByText } = render(
        <CapabilityDetailView {...defaultProps} />,
      );

      // Initially no confirmation
      expect(queryByText(/Are you sure/)).toBeNull();

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      expect(
        getByText(/Are you sure you want to permanently delete/),
      ).toBeTruthy();
    });

    it("shows capability name in delete confirmation", async () => {
      const { getByText, getAllByText } = render(
        <CapabilityDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      // Multiple elements may have the capability name
      const matches = getAllByText(/test_capability/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it("calls onDelete when delete is confirmed", async () => {
      const { getByText, getByRole } = render(
        <CapabilityDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Confirm delete" }));
      });

      expect(defaultProps.onDelete).toHaveBeenCalledWith(mockCapability);
    });

    it("hides confirmation when Cancel pressed", async () => {
      const { getByText, getByRole, queryByText } = render(
        <CapabilityDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      expect(getByText(/Are you sure/)).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Cancel delete" }));
      });

      expect(queryByText(/Are you sure/)).toBeNull();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible Edit button", () => {
      const { getByRole } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Edit capability" })).toBeTruthy();
    });

    it("has accessible Archive button", () => {
      const { getByRole } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Archive capability" })).toBeTruthy();
    });

    it("has accessible Delete button", () => {
      const { getByRole } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Delete capability" })).toBeTruthy();
    });

    it("has accessible Close button", () => {
      const { getByRole } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Close detail view" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // DETAIL SECTIONS
  // ==========================================================================
  describe("Detail Sections", () => {
    it("renders detail rows", () => {
      const { getAllByTestId } = render(
        <CapabilityDetailView {...defaultProps} />,
      );
      const detailRows = getAllByTestId("detail-row");
      expect(detailRows.length).toBeGreaterThan(0);
    });

    it("renders header with capability name", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Test Capability")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PREREQUISITES
  // ==========================================================================
  describe("Prerequisites", () => {
    it("shows prerequisites when available", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText("Prerequisites")).toBeTruthy();
    });

    it("shows prerequisite names", () => {
      const { getByText } = render(<CapabilityDetailView {...defaultProps} />);
      expect(getByText(/prereq_1/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // SOFT GATES
  // ==========================================================================
  describe("Soft Gates", () => {
    it("renders when soft_gate_requirements present", () => {
      const { UNSAFE_root } = render(
        <CapabilityDetailView {...defaultProps} />,
      );
      // Component should render without errors
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  // ==========================================================================
  // TAGS
  // ==========================================================================
  describe("Tags", () => {
    it("renders component with tags in data", () => {
      const { UNSAFE_root } = render(
        <CapabilityDetailView {...defaultProps} />,
      );
      // Component should render without errors
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
