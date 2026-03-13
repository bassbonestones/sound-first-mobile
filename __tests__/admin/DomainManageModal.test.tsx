/**
 * Tests for DomainManageModal component
 */
import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  act,
  screen,
  cleanup,
} from "@testing-library/react-native";
import DomainManageModal from "../../src/screens/Admin/tabs/CapabilityExplorer/components/DomainManageModal";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  editModalContainer: {},
  editModalHeader: {},
  editModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  editModalContent: {},
  editModalFooter: {},
  editModalButton: {},
  cancelButton: {},
  cancelButtonText: {},
  domainReorderItem: {},
  domainReorderName: {},
  domainReorderCount: {},
  domainEditButton: {},
  domainEditButtonText: {},
  domainEditInput: {},
  domainEditActionButton: {},
}));

describe("DomainManageModal", () => {
  const mockDomains = ["pitch", "reading", "rhythm"];
  const mockCapabilities = [
    { id: 1, domain: "pitch" },
    { id: 2, domain: "pitch" },
    { id: 3, domain: "rhythm" },
    { id: 4, domain: "reading" },
    { id: 5, domain: "reading" },
    { id: 6, domain: "reading" },
  ];

  const mockOnClose = jest.fn();
  const mockOnRename = jest.fn();

  const defaultProps = {
    domains: mockDomains,
    capabilities: mockCapabilities,
    onClose: mockOnClose,
    onRename: mockOnRename,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("renders title", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByText("Manage Domains")).toBeTruthy();
    });

    it("renders close button", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByLabelText("Close domain management")).toBeTruthy();
    });

    it("renders info text", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(
        screen.getByText(/Domains are sorted alphabetically/),
      ).toBeTruthy();
    });

    it("renders all domain names", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByText("pitch")).toBeTruthy();
      expect(screen.getByText("reading")).toBeTruthy();
      expect(screen.getByText("rhythm")).toBeTruthy();
    });

    it("renders capability counts per domain", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByText("2 capabilities")).toBeTruthy(); // pitch
      expect(screen.getByText("3 capabilities")).toBeTruthy(); // reading
      expect(screen.getByText("1 capabilities")).toBeTruthy(); // rhythm
    });

    it("renders Edit buttons for each domain", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByLabelText("Edit pitch domain name")).toBeTruthy();
      expect(screen.getByLabelText("Edit reading domain name")).toBeTruthy();
      expect(screen.getByLabelText("Edit rhythm domain name")).toBeTruthy();
    });

    it("renders Close button in footer", () => {
      render(<DomainManageModal {...defaultProps} />);
      expect(screen.getByLabelText("Close")).toBeTruthy();
    });
  });

  describe("Editing Mode", () => {
    it("shows edit input when Edit pressed", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      expect(screen.getByDisplayValue("pitch")).toBeTruthy();
    });

    it("shows Cancel and Save buttons in edit mode", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      expect(screen.getByLabelText("Cancel rename")).toBeTruthy();
      expect(screen.getByLabelText("Save domain name")).toBeTruthy();
    });

    it("updates edit value when text changes", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "tone");
      expect(screen.getByDisplayValue("tone")).toBeTruthy();
    });

    it("cancels editing when Cancel pressed", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.press(screen.getByLabelText("Cancel rename"));
      // Should exit edit mode and show Edit button again
      expect(screen.getByLabelText("Edit pitch domain name")).toBeTruthy();
    });

    it("cancels editing if value unchanged", async () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));

      // Don't change the value, just save
      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      // Should auto-cancel since value matches original - no API call
      expect(mockOnRename).not.toHaveBeenCalled();
      // Should exit edit mode
      expect(screen.getByLabelText("Edit pitch domain name")).toBeTruthy();
    });
  });

  describe("Rename Validation", () => {
    it("shows error when domain name is empty", async () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      expect(screen.getByText("Domain name cannot be empty")).toBeTruthy();
      expect(mockOnRename).not.toHaveBeenCalled();
    });

    it("shows error when whitespace only", async () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "   ");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      expect(screen.getByText("Domain name cannot be empty")).toBeTruthy();
    });
  });

  describe("Rename Submission", () => {
    it("calls onRename with old and new values", async () => {
      mockOnRename.mockResolvedValueOnce({ success: true });
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "tonal");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      expect(mockOnRename).toHaveBeenCalledWith("pitch", "tonal");
    });

    it("exits edit mode on success", async () => {
      mockOnRename.mockResolvedValueOnce({ success: true });
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "tonal");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Edit pitch domain name")).toBeTruthy();
      });
    });

    it("shows error on failure", async () => {
      mockOnRename.mockResolvedValueOnce({
        success: false,
        error: "Domain already exists",
      });
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "rhythm");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      await waitFor(() => {
        expect(screen.getByText("Domain already exists")).toBeTruthy();
      });
    });

    it("calls onRename and completes save flow", async () => {
      mockOnRename.mockResolvedValueOnce({ success: true });

      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      fireEvent.changeText(screen.getByDisplayValue("pitch"), "tonal");

      await act(async () => {
        fireEvent.press(screen.getByLabelText("Save domain name"));
      });

      expect(mockOnRename).toHaveBeenCalledWith("pitch", "tonal");
    });
  });

  describe("Close Action", () => {
    it("calls onClose when close button pressed", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close domain management"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when footer Close pressed", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Empty Domains", () => {
    it("shows 0 capabilities for domains with no caps", () => {
      render(<DomainManageModal {...defaultProps} capabilities={[]} />);
      expect(screen.getAllByText("0 capabilities").length).toBe(3);
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      render(<DomainManageModal {...defaultProps} />);
      const button = screen.getByLabelText("Close domain management");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible edit buttons", () => {
      render(<DomainManageModal {...defaultProps} />);
      const button = screen.getByLabelText("Edit pitch domain name");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible save button in edit mode", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      const button = screen.getByLabelText("Save domain name");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button in edit mode", () => {
      render(<DomainManageModal {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Edit pitch domain name"));
      const button = screen.getByLabelText("Cancel rename");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
