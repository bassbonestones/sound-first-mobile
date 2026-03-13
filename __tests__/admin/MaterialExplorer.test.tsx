/**
 * Tests for MaterialExplorer admin component
 * Tests material listing, filtering, and actions
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import MaterialExplorer from "../../src/screens/Admin/tabs/MaterialExplorer";

// Mock useMaterials hook
const mockUseMaterials = {
  materials: [],
  filteredMaterials: [],
  loading: false,
  searchQuery: "",
  selectedMaterial: null,
  ingesting: false,
  exporting: false,
  actionStatus: null,
  setSearchQuery: jest.fn(),
  setSelectedMaterial: jest.fn(),
  setActionStatus: jest.fn(),
  loadMaterials: jest.fn(),
  fetchMaterialDetail: jest.fn(),
  handleBatchIngest: jest.fn(),
  handleExportToJson: jest.fn(),
};

// Mock useUpload hook
const mockUseUpload = {
  showModal: false,
  openModal: jest.fn(),
  closeModal: jest.fn(),
  step: "SELECT",
  setStep: jest.fn(),
  fileName: "",
  fileContent: "",
  title: "",
  setTitle: jest.fn(),
  keyCenter: "",
  setKeyCenter: jest.fn(),
  preview: null,
  error: null,
  saving: false,
  setFileName: jest.fn(),
  setContent: jest.fn(),
  handleFilePick: jest.fn(),
  analyzeFile: jest.fn(),
  confirmUpload: jest.fn(),
};

jest.mock("../../src/screens/Admin/tabs/MaterialExplorer/hooks", () => ({
  useMaterials: () => mockUseMaterials,
  useUpload: () => mockUseUpload,
}));

// Mock child components
jest.mock(
  "../../src/screens/Admin/tabs/MaterialExplorer/components/MaterialDetailView",
  () => "MaterialDetailView",
);
jest.mock(
  "../../src/screens/Admin/tabs/MaterialExplorer/components/MaterialUploadContent",
  () => "MaterialUploadContent",
);
jest.mock("../../src/screens/Admin/tabs/MaterialExplorer/softGateHelp", () => ({
  SOFT_GATE_HELP: {},
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  section: {},
  filterBar: {},
  searchInput: {},
  actionBar: {},
  actionBarButton: {},
  actionBarButtonExport: {},
  actionBarButtonText: {},
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
  statusText: {},
  statusTextExporting: {},
  resultCount: {},
}));

describe("MaterialExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values
    mockUseMaterials.materials = [];
    mockUseMaterials.filteredMaterials = [];
    mockUseMaterials.loading = false;
    mockUseMaterials.searchQuery = "";
    mockUseMaterials.selectedMaterial = null;
    mockUseMaterials.ingesting = false;
    mockUseMaterials.exporting = false;
    mockUseMaterials.actionStatus = null;
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  describe("Loading State", () => {
    it("shows loading indicator when loading", () => {
      mockUseMaterials.loading = true;

      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Loading materials...")).toBeTruthy();
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================
  describe("Empty State", () => {
    it("renders search input", () => {
      const { getByPlaceholderText } = render(<MaterialExplorer />);

      expect(getByPlaceholderText("Search materials...")).toBeTruthy();
    });

    it("renders action buttons", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("+ Upload")).toBeTruthy();
      expect(getByText("Batch Ingest")).toBeTruthy();
      expect(getByText("JSON")).toBeTruthy();
    });

    it("shows no materials message when list is empty", () => {
      mockUseMaterials.filteredMaterials = [];

      const { getByText } = render(<MaterialExplorer />);

      // FlatList is empty, count should be 0
      expect(getByText("0 materials")).toBeTruthy();
    });

    it("shows 0 materials count", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("0 materials")).toBeTruthy();
    });
  });

  // ==========================================================================
  // WITH DATA
  // ==========================================================================
  describe("With Data", () => {
    const mockMaterials = [
      {
        id: 1,
        title: "Simple Song",
        original_key_center: "C",
        analysis: {
          difficulty_index: 0.2,
          range_semitones: 12,
          capability_count: 5,
          tonal_complexity_stage: 1,
          interval_sustained_stage: 1,
          interval_hazard_stage: 1,
          rhythm_complexity_stage: 1,
          range_usage_stage: 1,
        },
      },
      {
        id: 2,
        title: "Complex Piece",
        original_key_center: "Bb",
        analysis: {
          difficulty_index: 0.8,
          range_semitones: 24,
          capability_count: 15,
          tonal_complexity_stage: 3,
          interval_sustained_stage: 4,
          interval_hazard_stage: 2,
          rhythm_complexity_stage: 3,
          range_usage_stage: 2,
        },
      },
    ];

    beforeEach(() => {
      mockUseMaterials.materials = mockMaterials;
      mockUseMaterials.filteredMaterials = mockMaterials;
    });

    it("renders material titles", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Simple Song")).toBeTruthy();
      expect(getByText("Complex Piece")).toBeTruthy();
    });

    it("shows material IDs", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("ID: 1")).toBeTruthy();
      expect(getByText("ID: 2")).toBeTruthy();
    });

    it("shows key centers", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Key: C")).toBeTruthy();
      expect(getByText("Key: Bb")).toBeTruthy();
    });

    it("shows range in semitones", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Range: 12st")).toBeTruthy();
      expect(getByText("Range: 24st")).toBeTruthy();
    });

    it("shows capability count", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Caps: 5")).toBeTruthy();
      expect(getByText("Caps: 15")).toBeTruthy();
    });

    it("shows difficulty badge", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("20%")).toBeTruthy(); // 0.2 * 100
      expect(getByText("80%")).toBeTruthy(); // 0.8 * 100
    });

    it("shows stage information", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText(/Stages: T1/)).toBeTruthy();
    });

    it("renders correct result count", () => {
      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("2 materials")).toBeTruthy();
    });

    it("has accessible material buttons", () => {
      const { getByRole } = render(<MaterialExplorer />);

      expect(
        getByRole("button", { name: "View material Simple Song" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // SEARCH
  // ==========================================================================
  describe("Search", () => {
    it("calls setSearchQuery on text input", () => {
      const { getByPlaceholderText } = render(<MaterialExplorer />);

      fireEvent.changeText(getByPlaceholderText("Search materials..."), "song");

      expect(mockUseMaterials.setSearchQuery).toHaveBeenCalledWith("song");
    });
  });

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================
  describe("Action Buttons", () => {
    it("opens upload modal when Upload pressed", async () => {
      const { getByText } = render(<MaterialExplorer />);

      await act(async () => {
        fireEvent.press(getByText("+ Upload"));
      });

      expect(mockUseUpload.openModal).toHaveBeenCalled();
    });

    it("calls handleBatchIngest when Batch Ingest pressed", async () => {
      const { getByText } = render(<MaterialExplorer />);

      await act(async () => {
        fireEvent.press(getByText("Batch Ingest"));
      });

      expect(mockUseMaterials.handleBatchIngest).toHaveBeenCalled();
    });

    it("calls handleExportToJson when JSON pressed", async () => {
      const { getByText } = render(<MaterialExplorer />);

      await act(async () => {
        fireEvent.press(getByText("JSON"));
      });

      expect(mockUseMaterials.handleExportToJson).toHaveBeenCalled();
    });

    it("shows ingesting status", () => {
      mockUseMaterials.ingesting = true;
      mockUseMaterials.actionStatus = {
        type: "info",
        message: "Processing 5 of 10...",
      };

      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Processing 5 of 10...")).toBeTruthy();
    });

    it("shows exporting status", () => {
      mockUseMaterials.exporting = true;
      mockUseMaterials.actionStatus = { type: "info", message: "Exporting..." };

      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Exporting...")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MATERIAL SELECTION
  // ==========================================================================
  describe("Material Selection", () => {
    beforeEach(() => {
      mockUseMaterials.filteredMaterials = [
        {
          id: 1,
          title: "Test Material",
          original_key_center: "C",
          analysis: null,
        },
      ];
    });

    it("calls setSelectedMaterial when material pressed", async () => {
      const { getByText } = render(<MaterialExplorer />);

      await act(async () => {
        fireEvent.press(getByText("Test Material"));
      });

      expect(mockUseMaterials.setSelectedMaterial).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, title: "Test Material" }),
      );
    });

    it("calls fetchMaterialDetail when material pressed", async () => {
      const { getByText } = render(<MaterialExplorer />);

      await act(async () => {
        fireEvent.press(getByText("Test Material"));
      });

      expect(mockUseMaterials.fetchMaterialDetail).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SINGULAR/PLURAL TEXT
  // ==========================================================================
  describe("Singular/Plural Text", () => {
    it("shows correct count when 1 material", () => {
      mockUseMaterials.filteredMaterials = [{ id: 1, title: "One" }];

      const { getByText } = render(<MaterialExplorer />);

      // Always shows "materials" (no singular form)
      expect(getByText("1 materials")).toBeTruthy();
    });
  });

  // ==========================================================================
  // MATERIALS WITHOUT ANALYSIS
  // ==========================================================================
  describe("Materials Without Analysis", () => {
    it("shows ? for missing key center", () => {
      mockUseMaterials.filteredMaterials = [
        { id: 1, title: "No Key", original_key_center: null, analysis: null },
      ];

      const { getByText } = render(<MaterialExplorer />);

      expect(getByText("Key: ?")).toBeTruthy();
    });

    it("does not show difficulty badge without analysis", () => {
      mockUseMaterials.filteredMaterials = [
        {
          id: 1,
          title: "No Analysis",
          original_key_center: "C",
          analysis: null,
        },
      ];

      const { queryByText } = render(<MaterialExplorer />);

      // Should not have a percentage badge
      expect(queryByText(/%$/)).toBeNull();
    });
  });

  // ==========================================================================
  // ACCESSIBLE BUTTONS
  // ==========================================================================
  describe("Accessible Buttons", () => {
    it("has accessible upload button", () => {
      const { getByRole } = render(<MaterialExplorer />);

      expect(getByRole("button", { name: "Upload material" })).toBeTruthy();
    });

    it("has accessible batch ingest button", () => {
      const { getByRole } = render(<MaterialExplorer />);

      expect(getByRole("button", { name: /Batch ingest/i })).toBeTruthy();
    });

    it("has accessible export button", () => {
      const { getByRole } = render(<MaterialExplorer />);

      expect(getByRole("button", { name: /Export/i })).toBeTruthy();
    });
  });
});
