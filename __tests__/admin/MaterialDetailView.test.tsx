/**
 * Tests for MaterialDetailView admin component
 * Tests material detail display and reanalysis
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import MaterialDetailView from "../../src/screens/Admin/tabs/MaterialExplorer/components/MaterialDetailView";

// Mock the api client
jest.mock("../../src/api/client", () => ({
  baseUrl: "http://test-api.com",
}));

// Mock devLogger
jest.mock("../../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Mock admin styles
jest.mock("../../src/screens/Admin/styles", () => ({
  detailContainer: {},
  detailHeader: {},
  detailTitle: {},
  detailHeaderButtons: {},
  closeButton: {},
  closeButtonText: {},
  detailSection: {},
  detailSectionTitle: {},
  detailRow: {},
  detailLabel: {},
  detailValue: {},
  reanalyzeSection: {},
  reanalyzeButton: {},
  reanalyzeButtonText: {},
  reanalyzeResult: {},
  reanalyzeResultSuccess: {},
  reanalyzeResultError: {},
  reanalyzeResultText: {},
  centered: {},
  gateSection: {},
  gateBadge: {},
  gateBadgePass: {},
  gateBadgeFail: {},
  gateBadgeText: {},
  gateDetail: {},
  capabilitySection: {},
  capabilityItem: {},
  capabilityName: {},
  capabilityDomain: {},
  noDataText: {},
}));

describe("MaterialDetailView", () => {
  const mockMaterial = {
    id: 1,
    title: "Test Material",
    original_key_center: "C",
    analysis: {
      difficulty_index: 0.45,
      range_semitones: 12,
      capability_count: 5,
      tonal_complexity_stage: 2,
      interval_sustained_stage: 1,
      interval_hazard_stage: 1,
      rhythm_complexity_stage: 2,
      range_usage_stage: 2,
    },
    capabilities: [
      { id: 1, name: "Basic Rhythm", domain: "Rhythm" },
      { id: 2, name: "Pitch Direction", domain: "Pitch" },
    ],
  };

  const defaultProps = {
    material: mockMaterial,
    userId: "1",
    onClose: jest.fn(),
    onTriggerAnalysis: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { getAllByText } = render(<MaterialDetailView {...defaultProps} />);
      const titles = getAllByText("Test Material");
      expect(titles.length).toBeGreaterThan(0);
    });

    it("returns null when material is null", () => {
      const { queryByText } = render(
        <MaterialDetailView {...defaultProps} material={null} />,
      );
      expect(queryByText("Test Material")).toBeNull();
    });

    it("shows close button", () => {
      const { getByText } = render(<MaterialDetailView {...defaultProps} />);
      expect(getByText("✕")).toBeTruthy();
    });

    it("shows material title in header", () => {
      const { getAllByText } = render(<MaterialDetailView {...defaultProps} />);
      const titles = getAllByText("Test Material");
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // BUTTON ACTIONS
  // ==========================================================================
  describe("Button Actions", () => {
    it("calls onClose when close button pressed", async () => {
      const { getByText } = render(<MaterialDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("✕"));
      });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // GATE STATUS
  // ==========================================================================
  describe("Gate Status", () => {
    it("loads gate status on mount", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ passes: true, gates: [] }),
      });

      render(<MaterialDetailView {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/admin/materials/1/gate-check"),
        );
      });
    });

    it("includes userId in gate check request", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ passes: true }),
      });

      render(<MaterialDetailView {...defaultProps} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("user_id=1"),
        );
      });
    });

    it("handles gate check error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const { getAllByText } = render(<MaterialDetailView {...defaultProps} />);

      // Should still render without crashing
      const titles = getAllByText("Test Material");
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // REANALYZE
  // ==========================================================================
  describe("Reanalyze", () => {
    it("shows reanalyze button", () => {
      const { getByText } = render(<MaterialDetailView {...defaultProps} />);
      expect(getByText("Reanalyze All")).toBeTruthy();
    });

    it("calls reanalyze API when button pressed", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ metrics_updated: ["stages"] }),
      });

      const { getByRole } = render(<MaterialDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Reanalyze all metrics" }));
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/materials/1/reanalyze"),
          expect.objectContaining({ method: "POST" }),
        );
      });
    });

    it("shows success message after reanalysis", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ metrics_updated: ["stages", "ranges"] }),
      });

      const { getByText, getByRole } = render(
        <MaterialDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Reanalyze all metrics" }));
      });

      await waitFor(() => {
        expect(getByText(/Updated: stages, ranges/)).toBeTruthy();
      });
    });

    it("calls onTriggerAnalysis after successful reanalysis", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ metrics_updated: ["stages"] }),
      });

      const { getByRole } = render(<MaterialDetailView {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Reanalyze all metrics" }));
      });

      await waitFor(() => {
        expect(defaultProps.onTriggerAnalysis).toHaveBeenCalledWith(1);
      });
    });

    it("handles reanalysis error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: "Analysis failed" }),
      });

      const { getByText, getByRole } = render(
        <MaterialDetailView {...defaultProps} />,
      );

      await act(async () => {
        fireEvent.press(getByRole("button", { name: "Reanalyze all metrics" }));
      });

      await waitFor(() => {
        expect(getByText(/Analysis failed/)).toBeTruthy();
      });
    });
  });

  // ==========================================================================
  // ANALYSIS DISPLAY
  // ==========================================================================
  describe("Analysis Display", () => {
    it("shows difficulty index", () => {
      const { getByText } = render(<MaterialDetailView {...defaultProps} />);

      // Should have difficulty percentage
      expect(getByText(/45/)).toBeTruthy(); // 0.45 * 100
    });

    it("shows range information", () => {
      const { getByText } = render(<MaterialDetailView {...defaultProps} />);

      expect(getByText(/12/)).toBeTruthy(); // range_semitones
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================
  describe("Accessibility", () => {
    it("has accessible close button", () => {
      const { getByRole } = render(<MaterialDetailView {...defaultProps} />);
      expect(
        getByRole("button", { name: "Close material detail" }),
      ).toBeTruthy();
    });
  });

  // ==========================================================================
  // WITHOUT USER ID
  // ==========================================================================
  describe("Without User ID", () => {
    it("does not load gate status when userId is empty", () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(<MaterialDetailView {...defaultProps} userId="" />);

      // Should not have called gate check
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/gate-check"),
      );
    });
  });
});
