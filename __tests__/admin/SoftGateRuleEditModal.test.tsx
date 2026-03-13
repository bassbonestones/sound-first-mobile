/**
 * Tests for SoftGateRuleEditModal component
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react-native";
import SoftGateRuleEditModal from "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRuleEditModal";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  modalOverlay: {},
  editModalPopup: {},
  detailModalHeader: {},
  detailModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  editModalPopupContent: {},
  editModalFooter: {},
  editModalButton: {},
  cancelButton: {},
  cancelButtonText: {},
  saveButton: {},
  saveButtonDisabled: {},
  saveButtonText: {},
  saveErrorContainer: {},
  saveErrorText: {},
  deleteRuleButton: {},
  deleteRuleButtonText: {},
  confirmOverlay: {},
  confirmBox: {},
  confirmText: {},
  confirmButtons: {},
  confirmButton: {},
  cancelConfirmButton: {},
  deleteConfirmButton: {},
  confirmButtonText: {},
}));

// Mock FormField
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/FormField",
  () => {
    const { View, TextInput, Text } = require("react-native");
    return function MockFormField({
      label,
      value,
      onChangeText,
      placeholder,
    }: any) {
      return (
        <View>
          <Text>{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            testID={`field-${label.replace(/\s+/g, "-").toLowerCase()}`}
          />
        </View>
      );
    };
  },
);

describe("SoftGateRuleEditModal", () => {
  const mockRule = {
    id: 1,
    dimension_name: "test_dimension",
    frontier_buffer: 1.5,
    promotion_step: 1.0,
    min_attempts: 10,
    success_rating_threshold: 4,
    success_required_count: 8,
    success_window_count: null,
    decay_halflife_days: null,
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    rule: mockRule,
    onClose: mockOnClose,
    onSave: mockOnSave,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Rendering", () => {
    it("renders edit modal title", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByText("Edit Rule")).toBeTruthy();
    });

    it("renders close button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Close edit modal")).toBeTruthy();
    });

    it("renders all form fields with initial values", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByTestId("field-dimension-name").props.value).toBe(
        "test_dimension",
      );
      expect(screen.getByTestId("field-frontier-buffer").props.value).toBe(
        "1.5",
      );
      expect(screen.getByTestId("field-promotion-step").props.value).toBe("1");
      expect(screen.getByTestId("field-min-attempts").props.value).toBe("10");
    });

    it("renders Cancel button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Cancel")).toBeTruthy();
    });

    it("renders Save button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Save changes")).toBeTruthy();
    });

    it("renders Delete Rule button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Delete rule")).toBeTruthy();
    });
  });

  describe("Form Interaction", () => {
    it("updates dimension name field", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-dimension-name");
      fireEvent.changeText(input, "new_dimension");
      expect(input.props.value).toBe("new_dimension");
    });

    it("updates frontier buffer field", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-frontier-buffer");
      fireEvent.changeText(input, "2.5");
      expect(input.props.value).toBe("2.5");
    });

    it("updates promotion step field", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-promotion-step");
      fireEvent.changeText(input, "0.5");
      expect(input.props.value).toBe("0.5");
    });
  });

  describe("Close Action", () => {
    it("calls onClose when close button pressed", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close edit modal"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel pressed", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Save Submission", () => {
    it("calls API with form data when saved", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules/1"),
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("calls onSave on success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it("shows error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Validation failed" }),
      });

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Validation failed")).toBeTruthy();
      });
    });

    it("shows generic error on API failure without detail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeTruthy();
      });
    });

    it("shows error on network failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeTruthy();
      });
    });

    it("disables button while saving", async () => {
      let resolvePromise: (value: any) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      expect(screen.getByLabelText("Saving")).toBeTruthy();

      await act(async () => {
        resolvePromise!({ ok: true, json: async () => ({ id: 1 }) });
      });
    });
  });

  describe("Delete Confirmation", () => {
    it("shows delete confirmation when Delete Rule pressed", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Delete rule"));
      expect(screen.getByText(/Delete rule "test_dimension"/)).toBeTruthy();
    });

    it("hides confirmation when Cancel pressed", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Delete rule"));
      fireEvent.press(screen.getByLabelText("Cancel delete"));
      expect(screen.queryByText(/Delete rule "test_dimension"/)).toBeNull();
    });

    it("calls onDelete when Confirm Delete pressed", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Delete rule"));
      fireEvent.press(screen.getByLabelText("Confirm delete"));
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  describe("Optional Fields", () => {
    it("populates success_window_count when present", () => {
      const ruleWithWindow = {
        ...mockRule,
        success_window_count: 20,
      };
      render(<SoftGateRuleEditModal {...defaultProps} rule={ruleWithWindow} />);
      expect(
        screen.getByTestId("field-success-window-count-(optional)").props.value,
      ).toBe("20");
    });

    it("populates decay_halflife_days when present", () => {
      const ruleWithDecay = {
        ...mockRule,
        decay_halflife_days: 7.5,
      };
      render(<SoftGateRuleEditModal {...defaultProps} rule={ruleWithDecay} />);
      expect(
        screen.getByTestId("field-decay-halflife-days-(optional)").props.value,
      ).toBe("7.5");
    });

    it("sends null for empty optional fields", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.success_window_count).toBeNull();
      expect(body.decay_halflife_days).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Close edit modal");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Cancel");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible save button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Save changes");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible delete button", () => {
      render(<SoftGateRuleEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Delete rule");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
