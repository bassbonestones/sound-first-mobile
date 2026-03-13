/**
 * Tests for UserSoftGateStateEditModal component
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
} from "@testing-library/react-native";
import UserSoftGateStateEditModal from "../../src/screens/Admin/tabs/SoftGateExplorer/components/UserSoftGateStateEditModal";

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
  resetDimensionButton: {},
  resetDimensionButtonText: {},
}));

// Mock FormField
jest.mock(
  "../../src/screens/Admin/tabs/SoftGateExplorer/components/FormField",
  () => {
    const { View, TextInput, Text } = require("react-native");
    return function MockFormField({ label, value, onChangeText }: any) {
      return (
        <View>
          <Text>{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            testID={`field-${label.replace(/\s+/g, "-").toLowerCase()}`}
          />
        </View>
      );
    };
  },
);

describe("UserSoftGateStateEditModal", () => {
  const mockState = {
    id: 1,
    dimension_name: "tonal_complexity",
    comfortable_value: 2.5,
    max_demonstrated_value: 3.0,
    frontier_success_ema: 0.85,
    frontier_attempt_count_since_last_promo: 5,
  };

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const mockOnReset = jest.fn();

  const defaultProps = {
    state: mockState,
    onClose: mockOnClose,
    onSave: mockOnSave,
    onReset: mockOnReset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Rendering", () => {
    it("renders dimension name as title", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByText("tonal_complexity")).toBeTruthy();
    });

    it("renders close button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Close edit modal")).toBeTruthy();
    });

    it("renders all form fields with initial values", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByTestId("field-comfortable-value").props.value).toBe(
        "2.5",
      );
      expect(
        screen.getByTestId("field-max-demonstrated-value").props.value,
      ).toBe("3");
      expect(screen.getByTestId("field-frontier-success-ema").props.value).toBe(
        "0.85",
      );
      expect(
        screen.getByTestId("field-frontier-attempts-since-promotion").props
          .value,
      ).toBe("5");
    });

    it("renders Cancel button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Cancel")).toBeTruthy();
    });

    it("renders Save button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Save changes")).toBeTruthy();
    });

    it("renders Reset This Dimension button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      expect(screen.getByLabelText("Reset this dimension")).toBeTruthy();
    });
  });

  describe("Form Interaction", () => {
    it("updates comfortable value field", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-comfortable-value");
      fireEvent.changeText(input, "3.5");
      expect(input.props.value).toBe("3.5");
    });

    it("updates max demonstrated value field", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-max-demonstrated-value");
      fireEvent.changeText(input, "4.0");
      expect(input.props.value).toBe("4.0");
    });

    it("updates frontier success EMA field", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const input = screen.getByTestId("field-frontier-success-ema");
      fireEvent.changeText(input, "0.90");
      expect(input.props.value).toBe("0.90");
    });

    it("updates frontier attempts field", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const input = screen.getByTestId(
        "field-frontier-attempts-since-promotion",
      );
      fireEvent.changeText(input, "10");
      expect(input.props.value).toBe("10");
    });
  });

  describe("Close Action", () => {
    it("calls onClose when close button pressed", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close edit modal"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel pressed", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Reset Action", () => {
    it("calls onReset when Reset This Dimension pressed", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Reset this dimension"));
      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe("Save Submission", () => {
    it("calls API with form data when saved", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/user-soft-gate-state/1"),
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

      render(<UserSoftGateStateEditModal {...defaultProps} />);

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
        json: async () => ({ detail: "Validation error" }),
      });

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Validation error")).toBeTruthy();
      });
    });

    it("shows generic error on API failure without detail", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<UserSoftGateStateEditModal {...defaultProps} />);

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

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeTruthy();
      });
    });

    it("sends correct data types in request body", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(call[1].body);

      expect(typeof body.comfortable_value).toBe("number");
      expect(typeof body.max_demonstrated_value).toBe("number");
      expect(typeof body.frontier_success_ema).toBe("number");
      expect(typeof body.frontier_attempt_count_since_last_promo).toBe(
        "number",
      );
    });

    it("disables button while saving", async () => {
      let resolvePromise: (value: any) => void;
      (global.fetch as jest.Mock).mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      expect(screen.getByLabelText("Saving")).toBeTruthy();

      await act(async () => {
        resolvePromise!({ ok: true, json: async () => ({ id: 1 }) });
      });
    });
  });

  describe("Error Clearing", () => {
    it("clears error when form field is updated", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Error message" }),
      });

      render(<UserSoftGateStateEditModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save changes"));
      });

      await waitFor(() => {
        expect(screen.getByText("Error message")).toBeTruthy();
      });

      fireEvent.changeText(
        screen.getByTestId("field-comfortable-value"),
        "3.0",
      );

      expect(screen.queryByText("Error message")).toBeNull();
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Close edit modal");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Cancel");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible save button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Save changes");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible reset button", () => {
      render(<UserSoftGateStateEditModal {...defaultProps} />);
      const button = screen.getByLabelText("Reset this dimension");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
