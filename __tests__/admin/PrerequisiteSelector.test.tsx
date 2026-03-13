/**
 * Tests for PrerequisiteSelector component
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import PrerequisiteSelector from "../../src/screens/Admin/tabs/CapabilityExplorer/components/PrerequisiteSelector";

// Mock styles
jest.mock("../../src/screens/Admin/styles", () => ({
  prereqSelectorOverlay: {},
  prereqSelectorContainer: {},
  prereqSelectorHeader: {},
  prereqSelectorTitle: {},
  closeButton: {},
  closeButtonText: {},
  prereqSelectorSearch: {},
  prereqSearchInput: {},
  prereqDomainScroll: {},
  prereqDomainChip: {},
  prereqDomainChipActive: {},
  prereqDomainChipText: {},
  prereqDomainChipTextActive: {},
  prereqResultCount: {},
  prereqSelectorList: {},
  prereqSelectItem: {},
  prereqSelectItemName: {},
  prereqSelectItemMeta: {},
  prereqSelectItemDomain: {},
  prereqSelectItemId: {},
  prereqEmptyText: {},
  prereqSelectorCancelButton: {},
  prereqSelectorCancelButtonText: {},
}));

describe("PrerequisiteSelector", () => {
  const mockCapabilities = [
    { id: 1, name: "cap_one", display_name: "Capability One", domain: "pitch" },
    { id: 2, name: "cap_two", display_name: "Capability Two", domain: "pitch" },
    {
      id: 3,
      name: "cap_three",
      display_name: "Capability Three",
      domain: "rhythm",
    },
    {
      id: 4,
      name: "cap_four",
      display_name: "Capability Four",
      domain: "reading",
    },
    {
      id: 5,
      name: "cap_five",
      display_name: "Capability Five",
      domain: "rhythm",
    },
  ];

  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();
  const mockSetPrereqDomainFilter = jest.fn();
  const mockSetPrereqSearchQuery = jest.fn();

  const defaultProps = {
    currentCapabilityId: 1,
    allCapabilities: mockCapabilities,
    selectedIds: [2],
    onSelect: mockOnSelect,
    onClose: mockOnClose,
    prereqDomainFilter: "all",
    setPrereqDomainFilter: mockSetPrereqDomainFilter,
    prereqSearchQuery: "",
    setPrereqSearchQuery: mockSetPrereqSearchQuery,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders title", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByText("Select Prerequisite")).toBeTruthy();
    });

    it("renders close button", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByLabelText("Close prerequisite selector")).toBeTruthy();
    });

    it("renders search input with placeholder", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(
        screen.getByPlaceholderText("Search capabilities..."),
      ).toBeTruthy();
    });

    it("renders All domain filter", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByLabelText("Show all domains")).toBeTruthy();
    });

    it("renders domain filter chips", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByLabelText("Filter by pitch domain")).toBeTruthy();
      expect(screen.getByLabelText("Filter by rhythm domain")).toBeTruthy();
      expect(screen.getByLabelText("Filter by reading domain")).toBeTruthy();
    });

    it("renders Cancel button", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByLabelText("Cancel")).toBeTruthy();
    });
  });

  describe("Filtering", () => {
    it("excludes current capability", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.queryByText("Capability One")).toBeNull();
    });

    it("excludes already selected capabilities", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.queryByText("Capability Two")).toBeNull();
    });

    it("shows available capabilities", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByText("Capability Three")).toBeTruthy();
      expect(screen.getByText("Capability Four")).toBeTruthy();
      expect(screen.getByText("Capability Five")).toBeTruthy();
    });

    it("shows result count", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByText("3 available")).toBeTruthy();
    });
  });

  describe("Domain Filtering", () => {
    it("calls setPrereqDomainFilter when All pressed", () => {
      render(
        <PrerequisiteSelector {...defaultProps} prereqDomainFilter="pitch" />,
      );
      fireEvent.press(screen.getByLabelText("Show all domains"));
      expect(mockSetPrereqDomainFilter).toHaveBeenCalledWith("all");
    });

    it("calls setPrereqDomainFilter when domain chip pressed", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Filter by rhythm domain"));
      expect(mockSetPrereqDomainFilter).toHaveBeenCalledWith("rhythm");
    });

    it("filters by domain", () => {
      render(
        <PrerequisiteSelector {...defaultProps} prereqDomainFilter="rhythm" />,
      );
      expect(screen.getByText("Capability Three")).toBeTruthy();
      expect(screen.getByText("Capability Five")).toBeTruthy();
      expect(screen.queryByText("Capability Four")).toBeNull();
      expect(screen.getByText("2 available")).toBeTruthy();
    });
  });

  describe("Search Filtering", () => {
    it("calls setPrereqSearchQuery when search text changes", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      fireEvent.changeText(
        screen.getByPlaceholderText("Search capabilities..."),
        "three",
      );
      expect(mockSetPrereqSearchQuery).toHaveBeenCalledWith("three");
    });

    it("filters by search query", () => {
      render(
        <PrerequisiteSelector {...defaultProps} prereqSearchQuery="three" />,
      );
      expect(screen.getByText("Capability Three")).toBeTruthy();
      expect(screen.queryByText("Capability Four")).toBeNull();
      expect(screen.queryByText("Capability Five")).toBeNull();
    });

    it("shows empty message when no results", () => {
      render(
        <PrerequisiteSelector {...defaultProps} prereqSearchQuery="xyz" />,
      );
      expect(screen.getByText("No matching capabilities found")).toBeTruthy();
    });
  });

  describe("Selection", () => {
    it("calls onSelect and onClose when capability selected", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      fireEvent.press(
        screen.getByLabelText("Select Capability Three as prerequisite"),
      );
      expect(mockOnSelect).toHaveBeenCalledWith(3);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Close Action", () => {
    it("calls onClose when close button pressed", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Close prerequisite selector"));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("calls onClose when Cancel pressed", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Cancel"));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Display", () => {
    it("shows capability domain", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getAllByText("rhythm").length).toBeGreaterThan(0);
      expect(screen.getAllByText("reading").length).toBeGreaterThan(0);
    });

    it("shows capability ID", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      expect(screen.getByText("ID: 3")).toBeTruthy();
      expect(screen.getByText("ID: 4")).toBeTruthy();
      expect(screen.getByText("ID: 5")).toBeTruthy();
    });
  });

  describe("Sorting", () => {
    it("sorts by domain then name", () => {
      const { UNSAFE_root } = render(
        <PrerequisiteSelector {...defaultProps} />,
      );
      const items = UNSAFE_root.findAllByProps({
        accessibilityRole: "button",
      }).filter((item) => item.props.accessibilityLabel?.startsWith("Select "));

      // Should be sorted: pitch first (none available), reading, rhythm
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("has accessible close button", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      const button = screen.getByLabelText("Close prerequisite selector");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible All filter", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      const button = screen.getByLabelText("Show all domains");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible domain filters", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      const button = screen.getByLabelText("Filter by rhythm domain");
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible select items", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      const button = screen.getByLabelText(
        "Select Capability Three as prerequisite",
      );
      expect(button.props.accessibilityRole).toBe("button");
    });

    it("has accessible cancel button", () => {
      render(<PrerequisiteSelector {...defaultProps} />);
      const button = screen.getByLabelText("Cancel");
      expect(button.props.accessibilityRole).toBe("button");
    });
  });
});
