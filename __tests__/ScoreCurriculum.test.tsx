/**
 * ScoreCurriculum Tests
 *
 * Tests for the ScoreCurriculum component that displays learning paths.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

import { ScoreCurriculum } from "../src/features/importMusic/components/ScoreCurriculum";
import * as capabilityService from "../src/features/importMusic/services/capabilityAnalysisService";
import type { LearningPathResponse } from "../src/features/importMusic/types/analysisTypes";

// Mock the service
jest.mock(
  "../src/features/importMusic/services/capabilityAnalysisService",
  () => ({
    ...jest.requireActual(
      "../src/features/importMusic/services/capabilityAnalysisService",
    ),
    generateLearningPath: jest.fn(),
    generateLearningPathMock: jest.fn(),
  }),
);

// Mock Feather icons
jest.mock("@expo/vector-icons", () => ({
  Feather: "Feather",
}));

describe("ScoreCurriculum", () => {
  const mockCapabilityNames = [
    "treble_clef",
    "4_4_time",
    "quarter_note",
    "half_note",
  ];

  const mockLearningPath: LearningPathResponse = {
    user_id: 1,
    total_capabilities_in_score: 4,
    capabilities_already_mastered: 2,
    capabilities_to_learn: 2,
    learning_path: [
      {
        id: 1,
        name: "treble_clef",
        display_name: "Treble Clef",
        domain: "clef",
        difficulty_tier: 1,
        is_mastered: true,
        prerequisite_names: [],
        depth: 0,
      },
      {
        id: 2,
        name: "4_4_time",
        display_name: "4/4 Time",
        domain: "time_signature",
        difficulty_tier: 1,
        is_mastered: true,
        prerequisite_names: [],
        depth: 0,
      },
      {
        id: 3,
        name: "quarter_note",
        display_name: "Quarter Note",
        domain: "note_value",
        difficulty_tier: 1,
        is_mastered: false,
        prerequisite_names: [],
        depth: 0,
      },
      {
        id: 4,
        name: "half_note",
        display_name: "Half Note",
        domain: "note_value",
        difficulty_tier: 1,
        is_mastered: false,
        prerequisite_names: ["quarter_note"],
        depth: 1,
      },
    ],
    path_by_domain: {
      note_value: [
        {
          id: 3,
          name: "quarter_note",
          display_name: "Quarter Note",
          domain: "note_value",
          difficulty_tier: 1,
          is_mastered: false,
          prerequisite_names: [],
          depth: 0,
        },
        {
          id: 4,
          name: "half_note",
          display_name: "Half Note",
          domain: "note_value",
          difficulty_tier: 1,
          is_mastered: false,
          prerequisite_names: ["quarter_note"],
          depth: 1,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (capabilityService.generateLearningPath as jest.Mock).mockResolvedValue({
      success: true,
      data: mockLearningPath,
    });
  });

  describe("rendering", () => {
    it("shows loading state initially", async () => {
      // Delay resolution to capture loading state
      let resolvePromise: (value: unknown) => void;
      (capabilityService.generateLearningPath as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const { getByText } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      expect(getByText("Building your learning path...")).toBeTruthy();

      // Resolve to prevent test cleanup issues
      await act(async () => {
        resolvePromise!({ success: true, data: mockLearningPath });
      });
    });

    it("shows empty state when no capabilities", () => {
      const { getByText } = render(
        <ScoreCurriculum capabilityNames={[]} userId={1} />,
      );

      expect(
        getByText("Analyze a score to see your learning path"),
      ).toBeTruthy();
    });

    it("renders learning path after loading", async () => {
      const { getByText, getByTestId } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      await waitFor(() => {
        expect(getByTestId("score-curriculum")).toBeTruthy();
      });

      // Check summary
      expect(getByText("Your Progress")).toBeTruthy();
      expect(getByText("50%")).toBeTruthy();
      expect(getByText("2 mastered")).toBeTruthy();
      expect(getByText("2 to learn")).toBeTruthy();
    });

    it("shows error state on failure", async () => {
      (capabilityService.generateLearningPath as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Failed to load learning path",
        },
      });

      const { getByText } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      await waitFor(() => {
        expect(getByText("Failed to load learning path")).toBeTruthy();
      });
    });
  });

  describe("interactions", () => {
    it("calls onCapabilityPress when capability is tapped", async () => {
      const onCapabilityPress = jest.fn();

      const { getByTestId, queryByTestId } = render(
        <ScoreCurriculum
          capabilityNames={mockCapabilityNames}
          userId={1}
          onCapabilityPress={onCapabilityPress}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("score-curriculum")).toBeTruthy();
      });

      // Expand the note_value domain if not already expanded
      if (!queryByTestId("capability-quarter_note")) {
        fireEvent.press(getByTestId("domain-note_value"));
      }

      // Now the capability should be visible
      await waitFor(() => {
        expect(getByTestId("capability-quarter_note")).toBeTruthy();
      });

      // Tap a capability
      fireEvent.press(getByTestId("capability-quarter_note"));

      expect(onCapabilityPress).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "quarter_note",
          display_name: "Quarter Note",
        }),
      );
    });

    it("calls onStartLearning when Start Learning is pressed", async () => {
      const onStartLearning = jest.fn();

      const { getByTestId, getByText } = render(
        <ScoreCurriculum
          capabilityNames={mockCapabilityNames}
          userId={1}
          onStartLearning={onStartLearning}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("score-curriculum")).toBeTruthy();
      });

      fireEvent.press(getByTestId("start-learning-button"));

      expect(onStartLearning).toHaveBeenCalledWith(mockLearningPath);
    });

    it("expands and collapses domains when header is pressed", async () => {
      const { getByTestId, queryByTestId } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      await waitFor(() => {
        expect(getByTestId("score-curriculum")).toBeTruthy();
      });

      // Expand note_value if not already expanded
      if (!queryByTestId("capability-quarter_note")) {
        fireEvent.press(getByTestId("domain-note_value"));
        await waitFor(() => {
          expect(getByTestId("capability-quarter_note")).toBeTruthy();
        });
      }

      // Collapse
      fireEvent.press(getByTestId("domain-note_value"));

      // Now capability should not be visible
      await waitFor(() => {
        expect(queryByTestId("capability-quarter_note")).toBeNull();
      });

      // Expand again
      fireEvent.press(getByTestId("domain-note_value"));

      await waitFor(() => {
        expect(getByTestId("capability-quarter_note")).toBeTruthy();
      });
    });
  });

  describe("mock mode", () => {
    it("uses mock service when useMock is true", async () => {
      (
        capabilityService.generateLearningPathMock as jest.Mock
      ).mockResolvedValue({
        success: true,
        data: mockLearningPath,
      });

      const { getByTestId } = render(
        <ScoreCurriculum
          capabilityNames={mockCapabilityNames}
          userId={1}
          useMock={true}
        />,
      );

      await waitFor(() => {
        expect(getByTestId("score-curriculum")).toBeTruthy();
      });

      expect(capabilityService.generateLearningPathMock).toHaveBeenCalledWith(
        mockCapabilityNames,
        1,
      );
      expect(capabilityService.generateLearningPath).not.toHaveBeenCalled();
    });
  });

  describe("progress display", () => {
    it("shows 100% when all capabilities are mastered", async () => {
      const allMasteredPath: LearningPathResponse = {
        ...mockLearningPath,
        capabilities_already_mastered: 4,
        capabilities_to_learn: 0,
        learning_path: mockLearningPath.learning_path.map((cap) => ({
          ...cap,
          is_mastered: true,
        })),
        path_by_domain: {},
      };

      (capabilityService.generateLearningPath as jest.Mock).mockResolvedValue({
        success: true,
        data: allMasteredPath,
      });

      const { getByText } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      await waitFor(() => {
        expect(getByText("100%")).toBeTruthy();
        expect(getByText("4 mastered")).toBeTruthy();
        expect(getByText("0 to learn")).toBeTruthy();
      });
    });

    it("shows 0% when no capabilities are mastered", async () => {
      const noneMasteredPath: LearningPathResponse = {
        ...mockLearningPath,
        capabilities_already_mastered: 0,
        capabilities_to_learn: 4,
        learning_path: mockLearningPath.learning_path.map((cap) => ({
          ...cap,
          is_mastered: false,
        })),
      };

      (capabilityService.generateLearningPath as jest.Mock).mockResolvedValue({
        success: true,
        data: noneMasteredPath,
      });

      const { getByText } = render(
        <ScoreCurriculum capabilityNames={mockCapabilityNames} userId={1} />,
      );

      await waitFor(() => {
        expect(getByText("0%")).toBeTruthy();
        expect(getByText("0 mastered")).toBeTruthy();
        expect(getByText("4 to learn")).toBeTruthy();
      });
    });
  });
});
