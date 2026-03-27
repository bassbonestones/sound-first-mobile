/**
 * Tests for UserCapabilitiesTab admin component
 * Tests capability display, add/remove/toggle mastery operations
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { UserCapabilitiesTab } from "../../src/screens/Admin/tabs/UserProgressionInspector/UserCapabilitiesTab";

// Mock the api client
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
  devWarn: jest.fn(),
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  default: {
    detailSection: {},
    detailSectionTitle: {},
    noDataText: {},
  },
}));

// Mock local styles
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/styles",
  () => ({
    localStyles: {
      addButton: {},
      addButtonText: {},
      capRow: {},
      capInfo: {},
      capName: {},
      capNameIntro: {},
      capMeta: {},
      capActions: {},
      capActionButton: {},
      capActionText: {},
      removeButton: {},
      removeButtonText: {},
      modalOverlay: {},
      modalContent: {},
      modalTitle: {},
      searchInput: {},
      resultCount: {},
      modalScroll: {},
      modalCapRow: {},
      modalCapName: {},
      modalCapDomain: {},
      modalCapActions: {},
      modalAddButton: {},
      modalAddText: {},
      modalMasterButton: {},
      modalMasterText: {},
      modalCloseButton: {},
      modalCloseText: {},
    },
  }),
);

// Mock utils with showAlert
const mockShowAlert = jest.fn();
jest.mock(
  "../../src/screens/Admin/tabs/UserProgressionInspector/utils",
  () => ({
    showAlert: (...args: unknown[]) => mockShowAlert(...args),
  }),
);

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserCapabilitiesTab", () => {
  const mockOnRefresh = jest.fn();

  const defaultProps = {
    userData: {
      capabilities: {
        mastered: [
          {
            id: 1,
            name: "basic_pitch",
            display_name: "Basic Pitch",
            domain: "Pitch",
            is_global: true,
          },
        ],
        introduced: [
          {
            id: 2,
            name: "quarter_note",
            display_name: "Quarter Note",
            domain: "Rhythm",
            is_global: false,
            instrument_id: 5,
          },
        ],
      },
    },
    userId: "123",
    selectedInstrumentId: 5,
    onRefresh: mockOnRefresh,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("rendering", () => {
    it("renders mastered capabilities section", () => {
      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      expect(getByText("Mastered Capabilities (1)")).toBeTruthy();
      expect(getByText("✓ Basic Pitch")).toBeTruthy();
    });

    it("renders introduced capabilities section", () => {
      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      expect(getByText("Introduced (not mastered) (1)")).toBeTruthy();
      expect(getByText("○ Quarter Note")).toBeTruthy();
    });

    it("shows empty state when no capabilities", () => {
      const props = {
        ...defaultProps,
        userData: { capabilities: { mastered: [], introduced: [] } },
      };
      const { getByText } = render(<UserCapabilitiesTab {...props} />);

      expect(getByText("No mastered capabilities yet")).toBeTruthy();
      expect(getByText("None")).toBeTruthy();
    });

    it("renders add capability button", () => {
      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      expect(getByText("+ Add Capability")).toBeTruthy();
    });

    it("shows global indicator for global capabilities", () => {
      const { getAllByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      expect(getAllByText("🌐 Global").length).toBeGreaterThan(0);
    });

    it("shows instrument-specific indicator for non-global capabilities", () => {
      const { getAllByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      expect(getAllByText("🎸 Instrument-specific").length).toBeGreaterThan(0);
    });
  });

  describe("add capability modal", () => {
    it("opens modal and loads capabilities on button press", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              {
                id: 3,
                name: "new_cap",
                display_name: "New Capability",
                domain: "Test",
              },
            ],
          }),
      });

      const { getByText, queryByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      // Modal not visible initially
      expect(queryByText("Add Capability")).toBeFalsy();

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("Add Capability")).toBeTruthy();
      });

      // Verify fetch was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        "http://test-api.com/admin/users/123/capabilities/available?instrument_id=5",
      );
    });

    it("filters capabilities by search query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              {
                id: 3,
                name: "pitch_cap",
                display_name: "Pitch Cap",
                domain: "Pitch",
              },
              {
                id: 4,
                name: "rhythm_cap",
                display_name: "Rhythm Cap",
                domain: "Rhythm",
              },
            ],
          }),
      });

      const { getByText, getByPlaceholderText, queryByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("2 available")).toBeTruthy();
      });

      // Search for "pitch"
      await act(async () => {
        fireEvent.changeText(
          getByPlaceholderText("Search capabilities..."),
          "pitch",
        );
      });

      expect(getByText("Pitch Cap")).toBeTruthy();
      expect(queryByText("Rhythm Cap")).toBeFalsy();
    });

    it("closes modal on close button press", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ capabilities: [] }),
      });

      const { getByText, queryByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("Close")).toBeTruthy();
      });

      // Close modal
      await act(async () => {
        fireEvent.press(getByText("Close"));
      });

      // Modal should be closed (title not visible as Modal title, just section title)
      // The Add Capability text should only appear in the button now
      expect(queryByText("0 available")).toBeFalsy();
    });
  });

  describe("add capability actions", () => {
    it("adds capability as introduced", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              capabilities: [
                {
                  id: 3,
                  name: "new_cap",
                  display_name: "New Capability",
                  domain: "Test",
                  is_global: false,
                },
              ],
            }),
        })
        .mockResolvedValueOnce({ ok: true });

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("Introduce")).toBeTruthy();
      });

      // Click introduce
      await act(async () => {
        fireEvent.press(getByText("Introduce"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "http://test-api.com/admin/users/123/capabilities",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              capability_id: 3,
              mastered: false,
              instrument_id: 5,
            }),
          }),
        );
      });

      expect(mockShowAlert).toHaveBeenCalledWith("Success", "Capability added");
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("adds capability as mastered", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              capabilities: [
                {
                  id: 3,
                  name: "new_cap",
                  display_name: "New Capability",
                  domain: "Test",
                  is_global: true,
                },
              ],
            }),
        })
        .mockResolvedValueOnce({ ok: true });

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      // Open modal
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("+ Mastered")).toBeTruthy();
      });

      // Click mastered
      await act(async () => {
        fireEvent.press(getByText("+ Mastered"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "http://test-api.com/admin/users/123/capabilities",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              capability_id: 3,
              mastered: true,
            }),
          }),
        );
      });
    });
  });

  describe("toggle mastery", () => {
    it("unmasters a mastered capability", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Unmaster"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users/123/capabilities/1/toggle-mastery",
          { method: "PUT" },
        );
      });

      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("masters an introduced capability", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Master"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users/123/capabilities/2/toggle-mastery?instrument_id=5",
          { method: "PUT" },
        );
      });
    });
  });

  describe("remove capability", () => {
    it("shows confirmation dialog for remove", () => {
      const { getAllByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      // Click remove button (×)
      fireEvent.press(getAllByText("×")[0]);

      expect(mockShowAlert).toHaveBeenCalledWith(
        "Remove Capability",
        'Remove "Basic Pitch" from this user?',
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel" }),
          expect.objectContaining({ text: "Remove", style: "destructive" }),
        ]),
      );
    });

    it("removes capability when confirmed", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      // Capture the onPress callback from showAlert
      let removeCallback: (() => void) | undefined;
      mockShowAlert.mockImplementation((_title, _msg, buttons) => {
        const removeBtn = buttons?.find(
          (b: { text: string }) => b.text === "Remove",
        );
        removeCallback = removeBtn?.onPress;
      });

      const { getAllByText } = render(
        <UserCapabilitiesTab {...defaultProps} />,
      );

      // Click remove button
      fireEvent.press(getAllByText("×")[0]);

      // Simulate confirming
      await act(async () => {
        removeCallback?.();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users/123/capabilities/1",
          { method: "DELETE" },
        );
      });

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("shows error when add capability fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              capabilities: [
                {
                  id: 3,
                  name: "new_cap",
                  display_name: "New Capability",
                  domain: "Test",
                },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ detail: "Already exists" }),
        });

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      await waitFor(() => {
        expect(getByText("Introduce")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText("Introduce"));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith("Error", "Already exists");
      });
    });

    it("handles network error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(<UserCapabilitiesTab {...defaultProps} />);

      // Open modal - should handle fetch error
      await act(async () => {
        fireEvent.press(getByText("+ Add Capability"));
      });

      // Modal should still open even if fetch fails
      await waitFor(() => {
        expect(getByText("0 available")).toBeTruthy();
      });
    });
  });
});
