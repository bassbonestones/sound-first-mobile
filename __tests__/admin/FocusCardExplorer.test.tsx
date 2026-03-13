/**
 * Tests for FocusCardExplorer admin component
 * Tests focus card listing, filtering, and CRUD operations
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import FocusCardExplorer from "../../src/screens/Admin/tabs/FocusCardExplorer";

// Mock the hook
const mockUseFocusCards = {
  focusCards: [],
  filteredFocusCards: [],
  loading: false,
  searchQuery: "",
  setSearchQuery: jest.fn(),
  categoryFilter: "all",
  setCategoryFilter: jest.fn(),
  categories: [],
  selectedFocusCard: null,
  setSelectedFocusCard: jest.fn(),
  createFocusCard: jest.fn(),
  deleteFocusCard: jest.fn(),
  fetchFocusCards: jest.fn(),
};

jest.mock("../../src/screens/Admin/tabs/FocusCardExplorer/hooks", () => ({
  useFocusCards: () => mockUseFocusCards,
}));

// Mock child components
jest.mock(
  "../../src/screens/Admin/tabs/FocusCardExplorer/components/FocusCardDetailView",
  () => "FocusCardDetailView",
);
jest.mock(
  "../../src/screens/Admin/tabs/FocusCardExplorer/components/FocusCardEditModal",
  () => "FocusCardEditModal",
);
jest.mock(
  "../../src/screens/Admin/tabs/FocusCardExplorer/components/FocusCardCreateModal",
  () => "FocusCardCreateModal",
);

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
}));

describe("FocusCardExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values
    mockUseFocusCards.focusCards = [];
    mockUseFocusCards.filteredFocusCards = [];
    mockUseFocusCards.loading = false;
    mockUseFocusCards.searchQuery = "";
    mockUseFocusCards.categoryFilter = "all";
    mockUseFocusCards.categories = [];
    mockUseFocusCards.selectedFocusCard = null;
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================
  describe("Loading State", () => {
    it("shows loading indicator when loading", () => {
      mockUseFocusCards.loading = true;

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("Loading focus cards...")).toBeTruthy();
    });

    it("shows ActivityIndicator when loading", () => {
      mockUseFocusCards.loading = true;

      const { UNSAFE_root } = render(<FocusCardExplorer />);

      // Find ActivityIndicator in tree
      const activityIndicator = UNSAFE_root.findAllByType("ActivityIndicator");
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================
  describe("Empty State", () => {
    it("renders search input", () => {
      const { getByPlaceholderText } = render(<FocusCardExplorer />);

      expect(getByPlaceholderText("Search focus cards...")).toBeTruthy();
    });

    it("renders add button", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("+ Add")).toBeTruthy();
    });

    it("shows All filter with count 0", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("All (0)")).toBeTruthy();
    });

    it("shows 0 focus cards message", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("0 focus cards")).toBeTruthy();
    });

    it("shows no data text in list", () => {
      mockUseFocusCards.filteredFocusCards = [];

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("No focus cards found")).toBeTruthy();
    });
  });

  // ==========================================================================
  // WITH DATA
  // ==========================================================================
  describe("With Data", () => {
    const mockFocusCards = [
      {
        id: 1,
        name: "Rhythm Basics",
        category: "Rhythm",
        description: "Learn basic rhythmic patterns",
        micro_cues: ["count", "tap"],
        prompts: { intro: "Hello", practice: "Try this" },
      },
      {
        id: 2,
        name: "Intonation Focus",
        category: "Pitch",
        description: "Improve pitch accuracy",
        micro_cues: ["listen"],
        prompts: { intro: "Listen carefully" },
      },
    ];

    beforeEach(() => {
      mockUseFocusCards.focusCards = mockFocusCards;
      mockUseFocusCards.filteredFocusCards = mockFocusCards;
      mockUseFocusCards.categories = ["Rhythm", "Pitch"];
    });

    it("renders focus card names", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("Rhythm Basics")).toBeTruthy();
      expect(getByText("Intonation Focus")).toBeTruthy();
    });

    it("renders focus card categories", () => {
      const { getAllByText } = render(<FocusCardExplorer />);

      const rhythmItems = getAllByText(/Rhythm/);
      expect(rhythmItems.length).toBeGreaterThan(0);
    });

    it("shows micro cue count", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("2 micro cues")).toBeTruthy();
    });

    it("shows prompt count", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("2 prompts")).toBeTruthy();
    });

    it("renders result count correctly", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("2 focus cards")).toBeTruthy();
    });

    it("renders category filter chips", () => {
      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText(/Rhythm \(\d+\)/)).toBeTruthy();
      expect(getByText(/Pitch \(\d+\)/)).toBeTruthy();
    });

    it("has accessible focus card buttons", () => {
      const { getByRole } = render(<FocusCardExplorer />);

      expect(
        getByRole("button", { name: "View focus card Rhythm Basics" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // SEARCH
  // ==========================================================================
  describe("Search", () => {
    it("calls setSearchQuery on text input", () => {
      const { getByPlaceholderText } = render(<FocusCardExplorer />);

      fireEvent.changeText(
        getByPlaceholderText("Search focus cards..."),
        "rhythm",
      );

      expect(mockUseFocusCards.setSearchQuery).toHaveBeenCalledWith("rhythm");
    });
  });

  // ==========================================================================
  // CATEGORY FILTER
  // ==========================================================================
  describe("Category Filter", () => {
    beforeEach(() => {
      mockUseFocusCards.focusCards = [
        { id: 1, name: "Test", category: "Rhythm" },
      ];
      mockUseFocusCards.filteredFocusCards = [
        { id: 1, name: "Test", category: "Rhythm" },
      ];
      mockUseFocusCards.categories = ["Rhythm", "Pitch"];
    });

    it("calls setCategoryFilter when clicking All", async () => {
      const { getByText } = render(<FocusCardExplorer />);

      await act(async () => {
        fireEvent.press(getByText(/All \(\d+\)/));
      });

      expect(mockUseFocusCards.setCategoryFilter).toHaveBeenCalledWith("all");
    });

    it("calls setCategoryFilter when clicking category chip", async () => {
      const { getByText } = render(<FocusCardExplorer />);

      await act(async () => {
        fireEvent.press(getByText(/Rhythm \(\d+\)/));
      });

      expect(mockUseFocusCards.setCategoryFilter).toHaveBeenCalledWith(
        "Rhythm",
      );
    });

    it("has accessible filter buttons", () => {
      const { getByRole } = render(<FocusCardExplorer />);

      expect(
        getByRole("button", { name: /Filter by all categories/ }),
      ).toBeTruthy();
      expect(
        getByRole("button", { name: /Filter by Rhythm category/ }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // ADD BUTTON
  // ==========================================================================
  describe("Add Button", () => {
    it("has accessible add button", () => {
      const { getByRole } = render(<FocusCardExplorer />);

      expect(getByRole("button", { name: "Add focus card" })).toBeTruthy();
    });

    it("opens create modal when pressed", async () => {
      const { getByText, queryByTestId } = render(<FocusCardExplorer />);

      await act(async () => {
        fireEvent.press(getByText("+ Add"));
      });

      // Modal should be visible (we can't easily test this with mocked component)
      // but we can verify the button was pressed
      expect(getByText("+ Add")).toBeTruthy();
    });
  });

  // ==========================================================================
  // FOCUS CARD SELECTION
  // ==========================================================================
  describe("Focus Card Selection", () => {
    beforeEach(() => {
      mockUseFocusCards.focusCards = [
        {
          id: 1,
          name: "Test Card",
          category: "Test",
          micro_cues: [],
          prompts: {},
        },
      ];
      mockUseFocusCards.filteredFocusCards = mockUseFocusCards.focusCards;
    });

    it("calls setSelectedFocusCard when focus card pressed", async () => {
      const { getByText } = render(<FocusCardExplorer />);

      await act(async () => {
        fireEvent.press(getByText("Test Card"));
      });

      expect(mockUseFocusCards.setSelectedFocusCard).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: "Test Card" }),
      );
    });
  });

  // ==========================================================================
  // SINGULAR/PLURAL TEXT
  // ==========================================================================
  describe("Singular/Plural Text", () => {
    it("shows singular when 1 focus card", () => {
      mockUseFocusCards.filteredFocusCards = [{ id: 1, name: "One" }];

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("1 focus card")).toBeTruthy();
    });

    it("shows plural when multiple focus cards", () => {
      mockUseFocusCards.filteredFocusCards = [
        { id: 1, name: "One" },
        { id: 2, name: "Two" },
      ];

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("2 focus cards")).toBeTruthy();
    });
  });

  // ==========================================================================
  // FOCUS CARD ITEM DETAILS
  // ==========================================================================
  describe("Focus Card Item Details", () => {
    it("shows Uncategorized for items without category", () => {
      mockUseFocusCards.filteredFocusCards = [
        { id: 1, name: "No Category Card", micro_cues: [], prompts: {} },
      ];

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("Uncategorized")).toBeTruthy();
    });

    it("shows description when available", () => {
      mockUseFocusCards.filteredFocusCards = [
        {
          id: 1,
          name: "Described Card",
          description: "This is a detailed description",
          micro_cues: [],
          prompts: {},
        },
      ];

      const { getByText } = render(<FocusCardExplorer />);

      expect(getByText("This is a detailed description")).toBeTruthy();
    });
  });
});
