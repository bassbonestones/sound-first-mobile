/**
 * Tests for FocusCardDetailView admin component
 * Tests focus card detail display and actions
 */
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import FocusCardDetailView from "../../src/screens/Admin/tabs/FocusCardExplorer/components/FocusCardDetailView";

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  modalOverlay: {},
  detailModal: {},
  detailModalHeader: {},
  detailModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  detailModalContent: {},
  detailSectionTitle: {},
  listItemText: {},
  listItemSubtext: {},
  promptItem: {},
  promptKey: {},
  promptValue: {},
  detailModalActions: {},
  actionButton: {},
  modalEditButton: {},
  deleteButton: {},
  actionButtonText: {},
  confirmOverlay: {},
  confirmBox: {},
  confirmText: {},
  confirmButtons: {},
  confirmButton: {},
  cancelConfirmButton: {},
  deleteConfirmButton: {},
  confirmButtonText: {},
}));

// Mock DetailRow component
jest.mock(
  "../../src/screens/Admin/tabs/FocusCardExplorer/components/DetailRow",
  () => {
    const { View, Text } = require("react-native");
    return ({ label, value }: { label: string; value: string | number }) => (
      <View testID="detail-row">
        <Text>
          {label}: {String(value)}
        </Text>
      </View>
    );
  },
);

describe("FocusCardDetailView", () => {
  const mockFocusCard = {
    id: 1,
    name: "Test Focus Card",
    category: "Rhythm",
    description: "A test focus card description",
    attention_cue: "Pay attention to the beat",
    micro_cues: ["count", "tap", "listen"],
    prompts: {
      intro: "Welcome to the lesson",
      practice: "Now try it yourself",
    },
  };

  const defaultProps = {
    focusCard: mockFocusCard,
    onClose: jest.fn(),
    onEdit: jest.fn(),
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
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Test Focus Card")).toBeTruthy();
    });

    it("shows focus card name in header", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Test Focus Card")).toBeTruthy();
    });

    it("shows close button", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("✕")).toBeTruthy();
    });

    it("shows Edit button", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Edit")).toBeTruthy();
    });

    it("shows Delete button", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Delete")).toBeTruthy();
    });

    it("renders detail rows", () => {
      const { getAllByTestId } = render(
        <FocusCardDetailView {...defaultProps} />,
      );
      const detailRows = getAllByTestId("detail-row");
      expect(detailRows.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // MICRO CUES
  // ==========================================================================
  describe("Micro Cues", () => {
    it("shows micro cues section title", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Micro Cues")).toBeTruthy();
    });

    it("shows micro cue items", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("• count")).toBeTruthy();
      expect(getByText("• tap")).toBeTruthy();
      expect(getByText("• listen")).toBeTruthy();
    });

    it("shows no micro cues message when empty", () => {
      const focusCardNoMicroCues = { ...mockFocusCard, micro_cues: [] };
      const { getByText } = render(
        <FocusCardDetailView
          {...defaultProps}
          focusCard={focusCardNoMicroCues}
        />,
      );
      expect(getByText("No micro cues defined")).toBeTruthy();
    });
  });

  // ==========================================================================
  // PROMPTS
  // ==========================================================================
  describe("Prompts", () => {
    it("shows prompts section title", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("Prompts")).toBeTruthy();
    });

    it("shows prompt keys and values", () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByText("intro:")).toBeTruthy();
      expect(getByText("Welcome to the lesson")).toBeTruthy();
    });

    it("shows no prompts message when empty", () => {
      const focusCardNoPrompts = { ...mockFocusCard, prompts: {} };
      const { getByText } = render(
        <FocusCardDetailView
          {...defaultProps}
          focusCard={focusCardNoPrompts}
        />,
      );
      expect(getByText("No prompts defined")).toBeTruthy();
    });
  });

  // ==========================================================================
  // BUTTON ACTIONS
  // ==========================================================================
  describe("Button Actions", () => {
    it("calls onClose when close button pressed", async () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("✕"));
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("calls onEdit when Edit button pressed", async () => {
      const { getByText } = render(<FocusCardDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Edit"));
      });

      expect(defaultProps.onEdit).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DELETE CONFIRMATION
  // ==========================================================================
  describe("Delete Confirmation", () => {
    it("shows delete confirmation when Delete pressed", async () => {
      const { getByText, queryByText } = render(
        <FocusCardDetailView {...defaultProps} />,
      );

      // Initially no confirmation
      expect(queryByText(/Delete "Test Focus Card"/)).toBeNull();

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      expect(getByText(/Delete "Test Focus Card"/)).toBeTruthy();
    });

    it("calls onDelete when confirmed", async () => {
      const { getByText, getByRole } = render(
        <FocusCardDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Confirm delete" }));
      });

      expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it("hides confirmation when Cancel pressed", async () => {
      const { getByText, getByRole, queryByText } = render(
        <FocusCardDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Delete"));
      });

      expect(getByText(/Delete "Test Focus Card"/)).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Cancel delete" }));
      });

      expect(queryByText(/Delete "Test Focus Card"/)).toBeNull();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible close button", () => {
      const { getByRole } = render(<FocusCardDetailView {...defaultProps} />);
      expect(
        getByRole("button", { name: "Close focus card detail" }),
      ).toBeTruthy();
    });

    it("has accessible edit button", () => {
      const { getByRole } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Edit focus card" })).toBeTruthy();
    });

    it("has accessible delete button", () => {
      const { getByRole } = render(<FocusCardDetailView {...defaultProps} />);
      expect(getByRole("button", { name: "Delete focus card" })).toBeTruthy();
    });
  });

  // ==========================================================================
  // OPTIONAL FIELDS
  // ==========================================================================
  describe("Optional Fields", () => {
    it("shows None for missing category", () => {
      const focusCardNoCategory = { ...mockFocusCard, category: null };
      const { getByText } = render(
        <FocusCardDetailView
          {...defaultProps}
          focusCard={focusCardNoCategory}
        />,
      );
      expect(getByText(/None/)).toBeTruthy();
    });

    it("shows None for missing description", () => {
      const focusCardNoDesc = { ...mockFocusCard, description: null };
      const { getByText } = render(
        <FocusCardDetailView {...defaultProps} focusCard={focusCardNoDesc} />,
      );
      expect(getByText(/None/)).toBeTruthy();
    });
  });
});
