/**
 * Tests for SoftGateRuleCreateModal component
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react-native";
import SoftGateRuleCreateModal from "../../src/screens/Admin/tabs/SoftGateExplorer/components/SoftGateRuleCreateModal";

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

describe("SoftGateRuleCreateModal", () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  const defaultProps = {
    onClose: mockOnClose,
    onCreate: mockOnCreate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Rendering", () => {
    it("renders create modal title", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      expect(screen.getByText("Create Rule")).toBeTruthy();
    });

    it("renders close button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      expect(screen.getByLabelText("Close create modal")).toBeTruthy();
    });

    it("renders all form fields", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      expect(screen.getByText("Dimension Name")).toBeTruthy();
      expect(screen.getByText("Frontier Buffer")).toBeTruthy();
      expect(screen.getByText("Promotion Step")).toBeTruthy();
      expect(screen.getByText("Min Attempts")).toBeTruthy();
      expect(screen.getByText("Success Rating Threshold (1-5)")).toBeTruthy();
      expect(screen.getByText("Success Required Count")).toBeTruthy();
      expect(screen.getByText("Success Window Count (optional)")).toBeTruthy();
      expect(screen.getByText("Decay Halflife Days (optional)")).toBeTruthy();
    });

    it("renders Cancel button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      expect(screen.getByLabelText("Cancel")).toBeTruthy();
    });

    it("renders Create button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      expect(screen.getByLabelText("Create rule")).toBeTruthy();
    });
  });

  describe("Form Interaction", () => {
    it("updates dimension name field", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const input = screen.getByTestId("field-dimension-name");
      fireEvent.changeText(input, "test_dimension");
      expect(input.props.value).toBe("test_dimension");
    });

    it("updates frontier buffer field", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const input = screen.getByTestId("field-frontier-buffer");
      fireEvent.changeText(input, "2.5");
      expect(input.props.value).toBe("2.5");
    });

    it("updates promotion step field", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const input = screen.getByTestId("field-promotion-step");
      fireEvent.changeText(input, "0.5");
      expect(input.props.value).toBe("0.5");
    });

    it("updates min attempts field", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const input = screen.getByTestId("field-min-attempts");
      fireEvent.changeText(input, "15");
      expect(input.props.value).toBe("15");
    });
  });

  describe("Close Action", () => {
    it("calls onClose when close button pressed", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close create modal"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel pressed", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Validation", () => {
    it("shows error when dimension name is empty", async () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      expect(screen.getByText("Dimension name is required")).toBeTruthy();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("clears error when dimension name is entered", async () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      expect(screen.getByText("Dimension name is required")).toBeTruthy();

      fireEvent.changeText(screen.getByTestId("field-dimension-name"), "test");

      expect(screen.queryByText("Dimension name is required")).toBeNull();
    });
  });

  describe("Create Submission", () => {
    it("calls API with form data when valid", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/soft-gate-rules"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("calls onCreate on success", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });
    });

    it("shows error on API failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Duplicate dimension name" }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      await waitFor(() => {
        expect(screen.getByText("Duplicate dimension name")).toBeTruthy();
      });
    });

    it("shows generic error on API failure without detail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to create rule")).toBeTruthy();
      });
    });

    it("shows error on network failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
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

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      expect(screen.getByLabelText("Creating")).toBeTruthy();

      await act(async () => {
        resolvePromise!({ ok: true, json: async () => ({ id: 1 }) });
      });
    });
  });

  describe("Optional Fields", () => {
    it("sends null for empty success window count", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.success_window_count).toBeNull();
    });

    it("sends null for empty decay halflife days", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.decay_halflife_days).toBeNull();
    });

    it("sends value when success window count provided", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<SoftGateRuleCreateModal {...defaultProps} />);

      fireEvent.changeText(
        screen.getByTestId("field-dimension-name"),
        "test_dimension",
      );
      fireEvent.changeText(
        screen.getByTestId("field-success-window-count-(optional)"),
        "20",
      );

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Create rule"));
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.success_window_count).toBe(20);
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const button = screen.getByLabelText("Close create modal");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const button = screen.getByLabelText("Cancel");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible create button", () => {
      render(<SoftGateRuleCreateModal {...defaultProps} />);
      const button = screen.getByLabelText("Create rule");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
