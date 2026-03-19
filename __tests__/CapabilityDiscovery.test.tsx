/**
 * CapabilityDiscovery Component Tests
 *
 * Tests for the CapabilityDiscovery component that displays
 * capabilities discovered in an imported score.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { CapabilityDiscovery } from "../src/features/importMusic/components/CapabilityDiscovery";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Mock the analysis service
const mockAnalyzeCapabilities = jest.fn();
jest.mock(
  "../src/features/importMusic/services/capabilityAnalysisService",
  () => ({
    analyzeCapabilities: (...args: unknown[]) =>
      mockAnalyzeCapabilities(...args),
  }),
);

// Mock Feather icons
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Feather: ({ name, testID }: { name: string; testID?: string }) => (
      <Text testID={testID || `icon-${name}`}>{name}</Text>
    ),
  };
});

const mockMusicXml = `<?xml version="1.0"?>
<score-partwise><part id="P1"><measure number="1"/></part></score-partwise>`;

const mockAnalysisResult = {
  title: "Test Score",
  capabilities: [
    "treble_clef",
    "4_4_time",
    "quarter_note",
    "half_note",
    "whole_note",
    "piano",
    "forte",
    "m2_ascending",
    "M2_ascending",
  ],
  capabilities_by_domain: {
    clef: ["treble_clef"],
    time_signature: ["4_4_time"],
    note_value: ["quarter_note", "half_note", "whole_note"],
    dynamic: ["piano", "forte"],
    interval_melodic: ["m2_ascending", "M2_ascending"],
  },
  capability_count: 9,
  range_analysis: {
    lowest_pitch: "C4",
    highest_pitch: "G5",
    range_semitones: 19,
    pitch_density: null,
  },
  chromatic_complexity: 0.1,
  measure_count: 8,
  tempo_bpm: 120,
  tempo_marking: "Moderato",
  tempo_profile: null,
  soft_gates: {
    interval_velocity_score: 0.5,
    rhythm_velocity_score: 0.4,
    tonal_velocity_score: null,
    tempo_velocity_score: null,
    range_velocity_score: null,
    throughput_velocity_score: null,
  },
  unified_scores: {
    difficulty_score: 3.0,
    complexity_score: 2.5,
    accessibility_score: 7.0,
  },
  detailed_extraction: {
    clefs: ["G2"],
    time_signatures: ["4/4"],
    key_signatures: [],
    note_values: ["quarter", "half", "whole"],
    rests: [],
    dynamics: ["p", "f"],
    articulations: [],
    ornaments: [],
    tempo_terms: [],
    expression_terms: [],
    intervals: ["m2", "M2"],
    repeat_structures: [],
  },
};

describe("CapabilityDiscovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially", async () => {
    mockAnalyzeCapabilities.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { getByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    expect(getByText("Analyzing score...")).toBeTruthy();
  });

  it("displays capabilities after successful analysis", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { getByText, findByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    // Wait for loading to complete
    await findByText("9"); // capability_count

    // Check summary is displayed
    expect(getByText("Capabilities")).toBeTruthy();
    expect(getByText("8")).toBeTruthy(); // measure_count
    expect(getByText("120")).toBeTruthy(); // tempo_bpm
  });

  it("displays domain sections", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { findByText, getByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("9"); // Wait for load

    // Check domain labels are displayed
    expect(getByText("Clefs")).toBeTruthy();
    expect(getByText("Time Signatures")).toBeTruthy();
    expect(getByText("Note Values")).toBeTruthy();
    expect(getByText("Dynamics")).toBeTruthy();
  });

  it("shows error state on analysis failure", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message: "Backend error",
      },
    });

    const { findByText, getByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("Analysis Failed");
    expect(getByText("Backend error")).toBeTruthy();
  });

  it("toggles domain expansion on press", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { findByText, getByText, queryByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("9"); // Wait for load

    // Note Values domain has 3 items, so should be auto-expanded
    expect(getByText("Quarter Note")).toBeTruthy();

    // Click to collapse
    fireEvent.press(getByText("Note Values"));

    // Should be collapsed now (capabilities not visible)
    await waitFor(() => {
      expect(queryByText("Quarter Note")).toBeNull();
    });

    // Click to expand again
    fireEvent.press(getByText("Note Values"));

    await waitFor(() => {
      expect(getByText("Quarter Note")).toBeTruthy();
    });
  });

  it("calls onCapabilityPress when capability is pressed", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const onCapabilityPress = jest.fn();

    const { findByText, getByText } = render(
      <CapabilityDiscovery
        musicXml={mockMusicXml}
        onCapabilityPress={onCapabilityPress}
      />,
    );

    await findByText("9"); // Wait for load

    // Press a capability
    fireEvent.press(getByText("Treble Clef"));

    expect(onCapabilityPress).toHaveBeenCalledWith("treble_clef", "clef");
  });

  it("calls onAnalysisComplete when analysis completes", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const onAnalysisComplete = jest.fn();

    const { findByText } = render(
      <CapabilityDiscovery
        musicXml={mockMusicXml}
        onAnalysisComplete={onAnalysisComplete}
      />,
    );

    await findByText("9"); // Wait for load

    expect(onAnalysisComplete).toHaveBeenCalledWith(mockAnalysisResult);
  });

  it("displays difficulty score", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { findByText, getByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("9"); // Wait for load

    expect(getByText("Difficulty:")).toBeTruthy();
    expect(getByText("3.0/10")).toBeTruthy();
  });

  it("displays range analysis", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { findByText, getByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("9"); // Wait for load

    expect(getByText(/Range: C4 - G5/)).toBeTruthy();
  });

  it("expand/collapse all button works", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    const { findByText, getByText, queryByText } = render(
      <CapabilityDiscovery musicXml={mockMusicXml} />,
    );

    await findByText("9"); // Wait for load

    // Small domains are auto-expanded, so Collapse All should be visible
    // (all our test domains have <= 3 items)
    expect(getByText("Collapse All")).toBeTruthy();

    // Press collapse all
    fireEvent.press(getByText("Collapse All"));

    // Now should show Expand All
    await waitFor(() => {
      expect(getByText("Expand All")).toBeTruthy();
    });

    // Press expand all
    fireEvent.press(getByText("Expand All"));

    // All capabilities should be visible
    await waitFor(() => {
      expect(getByText("Treble Clef")).toBeTruthy();
      expect(getByText("4 4 Time")).toBeTruthy();
      expect(getByText("Piano")).toBeTruthy();
      expect(getByText("Forte")).toBeTruthy();
    });
  });

  it("passes title to analysis service", async () => {
    mockAnalyzeCapabilities.mockResolvedValueOnce({
      success: true,
      data: mockAnalysisResult,
    });

    render(<CapabilityDiscovery musicXml={mockMusicXml} title="My Score" />);

    await waitFor(() => {
      expect(mockAnalyzeCapabilities).toHaveBeenCalledWith(
        mockMusicXml,
        expect.objectContaining({ title: "My Score" }),
      );
    });
  });
});
