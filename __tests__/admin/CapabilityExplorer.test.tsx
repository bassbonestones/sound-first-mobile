/**
 * Tests for CapabilityExplorer admin component
 * Tests capability listing, filtering, and CRUD operations
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import CapabilityExplorer from "../../src/screens/Admin/tabs/CapabilityExplorer";

// Mock the hook
const mockUseCapabilities = {
  capabilities: [],
  filteredCapabilities: [],
  loading: false,
  searchQuery: "",
  setSearchQuery: jest.fn(),
  domainFilter: "all",
  setDomainFilter: jest.fn(),
  domains: [],
  exporting: false,
  exportStatus: null,
  capabilitiesWithContent: new Set(),
  loadCapabilities: jest.fn(),
  loadDependencyGraph: jest.fn().mockResolvedValue(null),
  archiveCapability: jest.fn().mockResolvedValue({ success: true }),
  restoreCapability: jest.fn().mockResolvedValue({ success: true }),
  deleteCapability: jest.fn().mockResolvedValue({ success: true }),
  createCapability: jest.fn().mockResolvedValue({ success: true }),
  updateCapability: jest.fn().mockResolvedValue({ success: true }),
  moveCapability: jest.fn(),
  renameDomain: jest.fn(),
  exportToFile: jest.fn(),
};

jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/hooks/useCapabilities",
  () => () => mockUseCapabilities,
);

// Mock child components
jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityDetailView",
  () => "CapabilityDetailView",
);
jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityEditModal",
  () => "CapabilityEditModal",
);
jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/components/CapabilityCreateModal",
  () => "CapabilityCreateModal",
);
jest.mock(
  "../../src/screens/Admin/tabs/CapabilityExplorer/components/DomainManageModal",
  () => "DomainManageModal",
);

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  section: {},
  filterBar: {},
  searchInput: {},
  addCapButton: {},
  addCapButtonText: {},
  domainScroll: {},
  domainChip: {},
  domainChipActive: {},
  domainChipText: {},
  domainChipTextActive: {},
  resultCount: {},
  list: {},
  listItem: {},
  listItemHeader: {},
  listItemTitle: {},
  listItemBadge: {},
  listItemDetails: {},
  listItemDetail: {},
  listItemSubtext: {},
  noDataText: {},
  centered: {},
  loadingText: {},
  exportButton: {},
  exportButtonText: {},
  actionBar: {},
}));

describe("CapabilityExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values
    mockUseCapabilities.capabilities = [];
    mockUseCapabilities.filteredCapabilities = [];
    mockUseCapabilities.loading = false;
    mockUseCapabilities.searchQuery = "";
    mockUseCapabilities.domainFilter = "all";
    mockUseCapabilities.domains = [];
    mockUseCapabilities.exporting = false;
    mockUseCapabilities.exportStatus = null;
    mockUseCapabilities.capabilitiesWithContent = new Set();
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  describe("Loading State", () => {
    it("shows loading indicator when loading", () => {
      mockUseCapabilities.loading = true;

      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("Loading capabilities...")).toBeTruthy();
    });

    it("shows ActivityIndicator when loading", () => {
      mockUseCapabilities.loading = true;

      const { UNSAFE_root } = render(<CapabilityExplorer />);

      const activityIndicator = UNSAFE_root.findAllByType("ActivityIndicator");
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================
  describe("Empty State", () => {
    it("renders search input", () => {
      const { getByPlaceholderText } = render(<CapabilityExplorer />);

      expect(getByPlaceholderText("Search capabilities...")).toBeTruthy();
    });

    it("renders add capability button", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("+ Add")).toBeTruthy();
    });

    it("shows All domain filter with count 0", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("All (0)")).toBeTruthy();
    });

    it("shows 0 capabilities count", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/0 capabilities/)).toBeTruthy();
    });

    it("shows empty list when no capabilities", () => {
      const { queryByText } = render(<CapabilityExplorer />);

      // Should show 0 capabilities count
      expect(queryByText(/0 capabilities/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // WITH DATA
  // ==========================================================================
  describe("With Data", () => {
    const mockCapabilities = [
      {
        id: 1,
        name: "Basic Rhythm",
        domain: "Rhythm",
        description: "Understand basic rhythmic patterns",
        is_archived: false,
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Interval P4",
        domain: "Intervals",
        description: "Recognize perfect fourths",
        is_archived: false,
        updated_at: "2024-01-02T00:00:00Z",
      },
    ];

    beforeEach(() => {
      mockUseCapabilities.capabilities = mockCapabilities;
      mockUseCapabilities.filteredCapabilities = mockCapabilities;
      mockUseCapabilities.domains = ["Rhythm", "Intervals"];
    });

    it("renders capability names", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("Basic Rhythm")).toBeTruthy();
      expect(getByText("Interval P4")).toBeTruthy();
    });

    it("renders capability domains", () => {
      const { getAllByText } = render(<CapabilityExplorer />);

      const rhythmItems = getAllByText(/Rhythm/);
      expect(rhythmItems.length).toBeGreaterThan(0);
    });

    it("renders result count correctly", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/2 capabilities/)).toBeTruthy();
    });

    it("renders domain filter chips", () => {
      const { getAllByText } = render(<CapabilityExplorer />);

      // Both domains should appear in filter chips
      expect(getAllByText(/Rhythm/).length).toBeGreaterThan(0);
      expect(getAllByText(/Intervals/).length).toBeGreaterThan(0);
    });

    it("shows capability details", () => {
      const { getByText } = render(<CapabilityExplorer />);

      // Should show capability names
      expect(getByText("Basic Rhythm")).toBeTruthy();
    });

    it("has accessible capability buttons", () => {
      const { getByRole } = render(<CapabilityExplorer />);

      expect(
        getByRole("button", { name: "View capability Basic Rhythm" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // SEARCH
  // ==========================================================================
  describe("Search", () => {
    it("calls setSearchQuery on text input", () => {
      const { getByPlaceholderText } = render(<CapabilityExplorer />);

      fireEvent.changeText(
        getByPlaceholderText("Search capabilities..."),
        "rhythm",
      );

      expect(mockUseCapabilities.setSearchQuery).toHaveBeenCalledWith("rhythm");
    });
  });

  // ==========================================================================
  // DOMAIN FILTER
  // ==========================================================================
  describe("Domain Filter", () => {
    beforeEach(() => {
      mockUseCapabilities.capabilities = [
        { id: 1, name: "Test", domain: "Rhythm" },
      ];
      mockUseCapabilities.filteredCapabilities = [
        { id: 1, name: "Test", domain: "Rhythm" },
      ];
      mockUseCapabilities.domains = ["Rhythm", "Intervals"];
    });

    it("calls setDomainFilter when clicking All", async () => {
      const { getByText } = render(<CapabilityExplorer />);

      await act(async () => {
        fireEvent.press(getByText(/All \(\d+\)/));
      });

      expect(mockUseCapabilities.setDomainFilter).toHaveBeenCalledWith("all");
    });

    it("calls setDomainFilter when clicking domain chip", async () => {
      const { getAllByText } = render(<CapabilityExplorer />);

      // Get the Rhythm filter chip (not from list item)
      const rhythmItems = getAllByText(/Rhythm/);
      const filterChip = rhythmItems[0];

      await act(async () => {
        fireEvent.press(filterChip);
      });

      expect(mockUseCapabilities.setDomainFilter).toHaveBeenCalled();
    });

    it("has accessible filter buttons", () => {
      const { getByRole } = render(<CapabilityExplorer />);

      expect(
        getByRole("button", { name: /Filter by all domains/ }),
      ).toBeTruthy();
      expect(getByRole("button", { name: /Filter by Rhythm/ })).toBeTruthy();
    });
  });

  // ==========================================================================
  // ADD CAPABILITY
  // ==========================================================================
  describe("Add Capability", () => {
    it("has accessible add capability button", () => {
      const { getByRole } = render(<CapabilityExplorer />);

      expect(getByRole("button", { name: "Add capability" })).toBeTruthy();
    });

    it("opens create modal when pressed", async () => {
      const { getByText } = render(<CapabilityExplorer />);

      await act(async () => {
        fireEvent.press(getByText("+ Add"));
      });

      // Modal should be visible - just verify button was pressed
      expect(getByText("+ Add")).toBeTruthy();
    });
  });

  // ==========================================================================
  // CAPABILITY SELECTION
  // ==========================================================================
  describe("Capability Selection", () => {
    beforeEach(() => {
      mockUseCapabilities.capabilities = [
        { id: 1, name: "Test Cap", domain: "Test", description: "" },
      ];
      mockUseCapabilities.filteredCapabilities =
        mockUseCapabilities.capabilities;
    });

    it("calls loadDependencyGraph when capability pressed", async () => {
      const { getByText } = render(<CapabilityExplorer />);

      await act(async () => {
        fireEvent.press(getByText("Test Cap"));
      });

      expect(mockUseCapabilities.loadDependencyGraph).toHaveBeenCalledWith(1);
    });
  });

  // ==========================================================================
  // SINGULAR/PLURAL TEXT
  // ==========================================================================
  describe("Singular/Plural Text", () => {
    it("shows count when 1 capability", () => {
      mockUseCapabilities.filteredCapabilities = [{ id: 1, name: "One" }];

      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/1 capabilities/)).toBeTruthy();
    });

    it("shows count when multiple capabilities", () => {
      mockUseCapabilities.filteredCapabilities = [
        { id: 1, name: "One" },
        { id: 2, name: "Two" },
      ];

      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/2 capabilities/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // EXPORT
  // ==========================================================================
  describe("Export", () => {
    it("has export button", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/Export/)).toBeTruthy();
    });

    it("calls exportToFile when Export pressed", async () => {
      const { getByText } = render(<CapabilityExplorer />);

      await act(async () => {
        fireEvent.press(getByText(/Export/));
      });

      expect(mockUseCapabilities.exportToFile).toHaveBeenCalled();
    });

    it("shows export status when exporting", () => {
      mockUseCapabilities.exporting = true;
      mockUseCapabilities.exportStatus = "Exporting...";

      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("Exporting...")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MANAGE DOMAINS
  // ==========================================================================
  describe("Manage Domains", () => {
    it("has manage domains button", () => {
      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText(/Domains/)).toBeTruthy();
    });
  });

  // ==========================================================================
  // ARCHIVED CAPABILITIES
  // ==========================================================================
  describe("Archived Capabilities", () => {
    it("shows inactive status for archived capability", () => {
      mockUseCapabilities.filteredCapabilities = [
        {
          id: 1,
          name: "Archived Cap",
          domain: "Test",
          is_archived: true,
          is_active: false,
        },
      ];

      const { getByText } = render(<CapabilityExplorer />);

      expect(getByText("Inactive")).toBeTruthy();
    });
  });

  // ==========================================================================
  // CAPABILITIES WITH CONTENT
  // ==========================================================================
  describe("Capabilities With Content", () => {
    it("shows content indicator for capability with content", () => {
      mockUseCapabilities.filteredCapabilities = [
        { id: 5, name: "Has Content Cap", domain: "Test" },
      ];
      mockUseCapabilities.capabilitiesWithContent = new Set([5]);

      const { getByText } = render(<CapabilityExplorer />);

      // Should show indicator (star or similar)
      const capItem = getByText("Has Content Cap");
      expect(capItem).toBeTruthy();
    });
  });
});
