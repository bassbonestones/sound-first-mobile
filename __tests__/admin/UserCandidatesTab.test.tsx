/**
 * Tests for UserCandidatesTab admin component
 * Tests candidate display for materials and teaching modules
 */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { UserCandidatesTab } from "../../src/screens/Admin/tabs/UserProgressionInspector/UserCandidatesTab";

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
    centered: {},
    noDataText: {},
    candidateCount: {},
    candidateItem: {},
    candidateTitle: {},
    candidateReason: {},
    candidateReasonFail: {},
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserCandidatesTab", () => {
  const defaultProps = {
    userId: "123",
  };

  const mockCandidates = {
    eligible_materials: [
      { title: "Hot Cross Buns", eligibility_reason: "All gates pass" },
      {
        title: "Mary Had a Little Lamb",
        eligibility_reason: "Passes rhythm check",
      },
    ],
    ineligible_sample: [
      {
        title: "Flight of the Bumblebee",
        ineligibility_reason: "Tempo too fast",
      },
    ],
  };

  const mockModules = [
    {
      display_name: "Basic Pitch",
      capability_name: "pitch_basics",
      status: "not_started",
      lesson_count: 5,
      lessons_completed: 0,
      prerequisite_capability_names: [],
    },
    {
      display_name: "Quarter Notes",
      capability_name: "quarter_note",
      status: "in_progress",
      lesson_count: 8,
      lessons_completed: 3,
      prerequisite_capability_names: ["pitch_basics"],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("loading state", () => {
    it("shows loading indicator while fetching", async () => {
      // Never resolve the fetch
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { UNSAFE_getByType } = render(
        <UserCandidatesTab {...defaultProps} />,
      );
      const { ActivityIndicator } = require("react-native");

      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });
  });

  describe("teaching modules", () => {
    it("renders available teaching modules", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("Available Teaching Modules")).toBeTruthy();
        expect(getByText("2 modules available")).toBeTruthy();
        expect(getByText("Basic Pitch")).toBeTruthy();
        expect(getByText("Quarter Notes")).toBeTruthy();
      });
    });

    it("shows module status correctly", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText(/Not started/)).toBeTruthy();
        expect(getByText(/In progress \(3\/8\)/)).toBeTruthy();
      });
    });

    it("shows prerequisites when present", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText(/Prereqs: pitch_basics/)).toBeTruthy();
      });
    });

    it("shows empty state when no modules available", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(
          getByText("No teaching modules available (check prerequisites)"),
        ).toBeTruthy();
      });
    });
  });

  describe("eligible materials", () => {
    it("renders eligible materials", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("Candidate Pool for Next Session")).toBeTruthy();
        expect(getByText("2 eligible materials")).toBeTruthy();
        expect(getByText("Hot Cross Buns")).toBeTruthy();
        expect(getByText("Mary Had a Little Lamb")).toBeTruthy();
      });
    });

    it("shows eligibility reasons", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("All gates pass")).toBeTruthy();
        expect(getByText("Passes rhythm check")).toBeTruthy();
      });
    });

    it("shows empty state when no eligible materials", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ eligible_materials: [], ineligible_sample: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("No eligible materials")).toBeTruthy();
      });
    });
  });

  describe("ineligible materials", () => {
    it("renders ineligible materials sample", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(getByText("Ineligible Materials (Sample)")).toBeTruthy();
        expect(getByText("Flight of the Bumblebee")).toBeTruthy();
        expect(getByText("✗ Tempo too fast")).toBeTruthy();
      });
    });
  });

  describe("API calls", () => {
    it("fetches both candidates and modules on mount", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockModules),
        });

      render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/admin/users/123/session-candidates",
        );
        expect(mockFetch).toHaveBeenCalledWith(
          "http://test-api.com/modules/user/123/available",
        );
      });
    });
  });

  describe("error handling", () => {
    it("handles fetch error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(<UserCandidatesTab {...defaultProps} />);

      await waitFor(() => {
        // Should show empty states
        expect(
          getByText("No teaching modules available (check prerequisites)"),
        ).toBeTruthy();
        expect(getByText("No eligible materials")).toBeTruthy();
      });
    });
  });
});
