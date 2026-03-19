/**
 * Capability Analysis Service Tests
 *
 * Tests for the capability analysis service that calls
 * the backend /materials/analyze endpoint.
 */

import {
  analyzeCapabilities,
  analyzeCapabilitiesMock,
  getMockAnalysisResult,
} from "../src/features/importMusic/services/capabilityAnalysisService";

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("capabilityAnalysisService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("getMockAnalysisResult", () => {
    it("returns mock analysis with default title", () => {
      const musicXml = "<score>test</score>";
      const result = getMockAnalysisResult(musicXml);

      expect(result.title).toBe("Mock Score");
      expect(result.capabilities).toContain("treble_clef");
      expect(result.capabilities).toContain("4_4_time");
      expect(result.capability_count).toBe(14);
      expect(result.capabilities_by_domain.clef).toContain("treble_clef");
    });

    it("uses provided title", () => {
      const musicXml = "<score>test</score>";
      const result = getMockAnalysisResult(musicXml, "Custom Title");

      expect(result.title).toBe("Custom Title");
    });

    it("includes range analysis", () => {
      const result = getMockAnalysisResult("<score/>");

      expect(result.range_analysis).not.toBeNull();
      expect(result.range_analysis?.lowest_pitch).toBe("C4");
      expect(result.range_analysis?.highest_pitch).toBe("G5");
      expect(result.range_analysis?.range_semitones).toBe(19);
    });

    it("includes soft gates", () => {
      const result = getMockAnalysisResult("<score/>");

      expect(result.soft_gates).toBeDefined();
      expect(result.soft_gates.interval_velocity_score).toBe(0.6);
      expect(result.soft_gates.rhythm_velocity_score).toBe(0.5);
    });

    it("includes unified scores", () => {
      const result = getMockAnalysisResult("<score/>");

      expect(result.unified_scores).toBeDefined();
      expect(result.unified_scores.difficulty_score).toBe(2.5);
      expect(result.unified_scores.complexity_score).toBe(3.0);
    });
  });

  describe("analyzeCapabilitiesMock", () => {
    it("returns success with mock data", async () => {
      const result = await analyzeCapabilitiesMock("<score/>", {
        title: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test");
        expect(result.data.capabilities.length).toBeGreaterThan(0);
      }
    });
  });

  describe("analyzeCapabilities", () => {
    const mockMusicXml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch></note>
    </measure>
  </part>
</score-partwise>`;

    it("makes POST request to /materials/analyze", async () => {
      const mockResponse = {
        title: "Test Score",
        capabilities: ["treble_clef"],
        capabilities_by_domain: { clef: ["treble_clef"] },
        capability_count: 1,
        range_analysis: null,
        chromatic_complexity: null,
        measure_count: 1,
        tempo_bpm: null,
        tempo_marking: null,
        tempo_profile: null,
        soft_gates: {},
        unified_scores: {},
        detailed_extraction: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await analyzeCapabilities(mockMusicXml, {
        title: "Test Score",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/materials/analyze"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("musicxml_content"),
        }),
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Score");
        expect(result.data.capabilities).toContain("treble_clef");
      }
    });

    it("returns error on non-OK response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "Bad request",
      });

      const result = await analyzeCapabilities(mockMusicXml);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("ANALYSIS_FAILED");
        expect(result.error.message).toContain("400");
      }
    });

    it("returns error on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await analyzeCapabilities(mockMusicXml);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("NETWORK_ERROR");
        expect(result.error.message).toContain("Network error");
      }
    });

    it("returns timeout error on AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await analyzeCapabilities(mockMusicXml);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TIMEOUT");
        expect(result.error.message).toContain("timed out");
      }
    });

    it("sends title in request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "My Song",
          capabilities: [],
          capabilities_by_domain: {},
          capability_count: 0,
          range_analysis: null,
          chromatic_complexity: null,
          measure_count: 0,
          tempo_bpm: null,
          tempo_marking: null,
          tempo_profile: null,
          soft_gates: {},
          unified_scores: {},
          detailed_extraction: {},
        }),
      });

      await analyzeCapabilities(mockMusicXml, { title: "My Song" });

      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.title).toBe("My Song");
    });
  });
});
