/**
 * Tests for MaterialUploadContent component
 *
 * Tests the upload modal content for materials - file selection, analysis preview, and save.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import MaterialUploadContent from "../src/screens/Admin/tabs/MaterialExplorer/components/MaterialUploadContent";

// Mock fetch
global.fetch = jest.fn();

// Mock styles
jest.mock("../src/screens/Admin/styles", () => ({
  uploadModalContainer: {},
  detailHeader: {},
  detailTitle: {},
  closeButton: {},
  closeButtonText: {},
  uploadModalContent: {},
  uploadSelectStep: {},
  uploadLabel: {},
  filePickerButton: {},
  filePickerButtonText: {},
  xmlContentInput: {},
  uploadInput: {},
  uploadError: {},
  analyzeButton: {},
  analyzeButtonText: {},
  uploadPreviewStep: {},
  previewSection: {},
  previewSectionTitle: {},
  detailRow: {},
  detailLabel: {},
  detailValue: {},
  softGateGrid: {},
  softGateCell: {},
  softGateLabelRow: {},
  softGateCellLabel: {},
  softGateCellValue: {},
  helpButton: {},
  helpButtonText: {},
  helpModalOverlay: {},
  helpModalContent: {},
  helpModalTitle: {},
  helpModalDescription: {},
  helpModalSubtitle: {},
  helpModalStage: {},
  helpModalCalc: {},
  helpModalClose: {},
  helpModalCloseText: {},
  previewSectionHeader: {},
  toggleCapabilitiesButton: {},
  toggleCapabilitiesText: {},
  domainSection: {},
  domainHeader: {},
  domainHeaderText: {},
  capabilityTagsContainer: {},
  capabilityTag: {},
  capabilityTagText: {},
  uploadActions: {},
  backButton: {},
  backButtonText: {},
  confirmButton: {},
  confirmButtonText: {},
  buttonDisabled: {},
  centered: {},
  loadingText: {},
  unifiedScoreDomain: {},
  unifiedScoreDomainHeader: {},
  unifiedScoreDomainName: {},
  unifiedScoreSummary: {},
  unifiedScoreLabel: {},
  unifiedScoreValue: {},
  unifiedScoreStage: {},
  unifiedScoreFacets: {},
  unifiedScoreFacet: {},
  unifiedScoreFacetName: {},
  unifiedScoreFacetBar: {},
  unifiedScoreFacetFill: {},
  unifiedScoreFacetValue: {},
  unifiedScoreFlags: {},
  unifiedScoreFlag: {},
  profileToggle: {},
  profileToggleText: {},
  profileDetails: {},
  profileRow: {},
  profileKey: {},
  profileValue: {},
  unifiedScoreInteractionFlags: {},
  unifiedScoreInteractionTitle: {},
  unifiedScoreInteractionFlag: {},
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

const createMockUploadHook = (overrides = {}) => ({
  step: "select",
  setStep: jest.fn(),
  fileName: "",
  fileContent: "",
  title: "",
  setTitle: jest.fn(),
  keyCenter: "",
  setKeyCenter: jest.fn(),
  preview: null,
  error: "",
  saving: false,
  setContent: jest.fn(),
  handleFilePick: jest.fn(),
  analyzeFile: jest.fn(),
  confirmUpload: jest.fn(),
  closeModal: jest.fn(),
  ...overrides,
});

const mockSoftGateHelp = {
  d1_tonal: {
    title: "D1 - Tonal Complexity",
    description: "Measures harmonic complexity",
    stages: ["Stage 1: Simple", "Stage 2: Intermediate"],
    calculation: "Based on chord analysis",
  },
  d2_interval: {
    title: "D2 - Interval Demand",
    description: "Measures interval difficulty",
    stages: ["Stage 1: Simple intervals"],
    calculation: "Based on interval spans",
  },
};

describe("MaterialUploadContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ capabilities: [] }),
    });
  });

  describe("Select Step", () => {
    it("renders upload title", () => {
      const uploadHook = createMockUploadHook();
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Upload Material")).toBeTruthy();
    });

    it("renders file picker button", () => {
      const uploadHook = createMockUploadHook();
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Choose MusicXML file")).toBeTruthy();
    });

    it("shows selected filename in picker button", () => {
      const uploadHook = createMockUploadHook({ fileName: "test_piece.xml" });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Selected file: test_piece.xml")).toBeTruthy();
    });

    it("calls handleFilePick when picker button pressed", () => {
      const uploadHook = createMockUploadHook();
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Choose MusicXML file"));
      expect(uploadHook.handleFilePick).toHaveBeenCalled();
    });

    it("renders title input", () => {
      const uploadHook = createMockUploadHook();
      const { getByPlaceholderText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByPlaceholderText("Material title")).toBeTruthy();
    });

    it("calls setTitle on title input change", () => {
      const uploadHook = createMockUploadHook();
      const { getByPlaceholderText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.changeText(getByPlaceholderText("Material title"), "New Title");
      expect(uploadHook.setTitle).toHaveBeenCalledWith("New Title");
    });

    it("renders key center input", () => {
      const uploadHook = createMockUploadHook();
      const { getByPlaceholderText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByPlaceholderText("e.g., C, G, Bb")).toBeTruthy();
    });

    it("calls setKeyCenter on key center input change", () => {
      const uploadHook = createMockUploadHook();
      const { getByPlaceholderText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.changeText(getByPlaceholderText("e.g., C, G, Bb"), "Bb");
      expect(uploadHook.setKeyCenter).toHaveBeenCalledWith("Bb");
    });

    it("renders analyze button", () => {
      const uploadHook = createMockUploadHook();
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Analyze file")).toBeTruthy();
    });

    it("calls analyzeFile when analyze button pressed", () => {
      const uploadHook = createMockUploadHook({
        fileContent: "<xml>...</xml>",
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Analyze file"));
      expect(uploadHook.analyzeFile).toHaveBeenCalled();
    });

    it("shows error message when present", () => {
      const uploadHook = createMockUploadHook({
        error: "Failed to parse MusicXML",
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Failed to parse MusicXML")).toBeTruthy();
    });

    it("calls closeModal when close button pressed", () => {
      const uploadHook = createMockUploadHook();
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Close upload modal"));
      expect(uploadHook.closeModal).toHaveBeenCalled();
    });
  });

  describe("Preview Step", () => {
    const mockPreview = {
      title: "Test Piece",
      measure_count: 16,
      tempo_bpm: 120,
      tempo_marking: "Allegro",
      capability_count: 5,
      capabilities: ["clef_treble", "time_signature_4_4", "key_signature_c"],
      range_analysis: {
        lowest_pitch: "C4",
        highest_pitch: "G5",
        range_semitones: 19,
      },
      soft_gates: {
        tonal_complexity_stage: 2,
        interval_sustained_stage: 2,
        interval_hazard_stage: 2,
        rhythm_complexity_score: 0.35,
        rhythm_complexity_peak: 0.45,
        range_usage_stage: 2,
        interval_velocity_score: 0.4,
        interval_velocity_peak: 0.5,
        tempo_difficulty_score: 0.3,
        density_notes_per_measure: 8.5,
        density_notes_per_second: 2.1,
      },
    };

    it("shows preview title", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Analysis Preview")).toBeTruthy();
    });

    it("shows basic info section", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Basic Info")).toBeTruthy();
      expect(getByText("Test Piece")).toBeTruthy();
      expect(getByText("16")).toBeTruthy();
    });

    it("shows range analysis", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Range Analysis")).toBeTruthy();
      expect(getByText("C4")).toBeTruthy();
      expect(getByText("G5")).toBeTruthy();
      expect(getByText("19 semitones")).toBeTruthy();
    });

    it("shows soft gate scores section", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Soft Gate Scores")).toBeTruthy();
      expect(getByText("D1 - Tonal Complexity")).toBeTruthy();
    });

    it("shows detected capabilities count", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Detected Capabilities (5)")).toBeTruthy();
    });

    it("shows back button", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Go back to file selection")).toBeTruthy();
    });

    it("calls setStep when back button pressed", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Go back to file selection"));
      expect(uploadHook.setStep).toHaveBeenCalledWith("select");
    });

    it("shows save button", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Save to database")).toBeTruthy();
    });

    it("calls confirmUpload when save button pressed", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Save to database"));
      expect(uploadHook.confirmUpload).toHaveBeenCalled();
    });

    it("shows saving label when saving", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
        saving: true,
      });
      const { getByLabelText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByLabelText("Saving")).toBeTruthy();
    });

    it("expands all capabilities when toggle pressed", async () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText, getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Expand all capabilities"));

      await waitFor(() => {
        expect(getByLabelText("Collapse all capabilities")).toBeTruthy();
      });
    });
  });

  describe("Preview Step with capabilities_by_domain", () => {
    const mockPreviewWithDomains = {
      title: "Test Piece",
      measure_count: 8,
      capability_count: 3,
      capabilities: [],
      capabilities_by_domain: {
        clefs: ["clef_treble"],
        time_signatures: ["time_signature_4_4"],
      },
    };

    it("renders capabilities grouped by domain from preview", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreviewWithDomains,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText(/clefs/)).toBeTruthy();
      expect(getByText(/time signatures/)).toBeTruthy();
    });
  });

  describe("Preview Step - Loading", () => {
    it("shows loading indicator when preview is null", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: null,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Analyzing...")).toBeTruthy();
    });
  });

  describe("Soft Gate Help Modal", () => {
    const mockPreview = {
      title: "Test",
      measure_count: 8,
      capability_count: 0,
      capabilities: [],
      soft_gates: {
        tonal_complexity_stage: 1,
      },
    };

    it("opens help modal when help button pressed", async () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText, getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Help for D1 - Tonal Complexity"));

      await waitFor(() => {
        expect(getByText("Measures harmonic complexity")).toBeTruthy();
      });
    });

    it("closes help modal when close button pressed", async () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreview,
      });
      const { getByLabelText, getByText, queryByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      fireEvent.press(getByLabelText("Help for D1 - Tonal Complexity"));

      await waitFor(() => {
        expect(getByText("Measures harmonic complexity")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Close help modal"));

      await waitFor(() => {
        expect(queryByText("Measures harmonic complexity")).toBeNull();
      });
    });
  });

  describe("Soft Gate Error", () => {
    it("shows soft gate error when present", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: {
          title: "Test",
          measure_count: 8,
          capability_count: 0,
          capabilities: [],
          soft_gates: { error: "Analysis failed" },
        },
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Error: Analysis failed")).toBeTruthy();
    });
  });

  describe("Unified Scores", () => {
    const mockPreviewWithUnifiedScores = {
      title: "Test",
      measure_count: 8,
      capability_count: 0,
      capabilities: [],
      unified_scores: {
        composite: {
          overall: 0.45,
          interaction_bonus: 0.05,
          flags: ["high_tempo_rhythm_interaction"],
        },
        interval: {
          scores: { primary: 0.3, hazard: 0.4, overall: 0.35 },
          bands: { overall_stage: 2 },
          facet_scores: { interval_magnitude: 0.35 },
          flags: [],
        },
      },
    };

    it("shows unified scores section", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreviewWithUnifiedScores,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Unified Scores (Facet Analysis)")).toBeTruthy();
    });

    it("shows overall difficulty", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreviewWithUnifiedScores,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Overall Difficulty")).toBeTruthy();
      expect(getByText(/45%/)).toBeTruthy();
    });

    it("shows interaction flags", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreviewWithUnifiedScores,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Interaction Effects:")).toBeTruthy();
      expect(getByText(/high tempo rhythm interaction/)).toBeTruthy();
    });

    it("shows domain breakdowns", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: mockPreviewWithUnifiedScores,
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Interval")).toBeTruthy();
      expect(getByText("Stage 2")).toBeTruthy();
    });
  });

  describe("Interval Warning", () => {
    it("shows warning for large interval spike", () => {
      const uploadHook = createMockUploadHook({
        step: "preview",
        preview: {
          title: "Test",
          measure_count: 8,
          capability_count: 0,
          capabilities: [],
          soft_gates: {
            interval_sustained_stage: 1,
            interval_hazard_stage: 4,
          },
        },
      });
      const { getByText } = render(
        <MaterialUploadContent
          uploadHook={uploadHook}
          softGateHelp={mockSoftGateHelp}
        />,
      );

      expect(getByText("Warning: Large interval spike")).toBeTruthy();
    });
  });
});
