/**
 * Tests for API sessions module
 */
import {
  generateSession,
  completeStep,
  completeSession,
  getSessionHistory,
  getSessionCandidates,
  generateDiagnosticSession,
  getLastSessionDiagnostics,
} from "../src/api/sessions";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("sessions API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("generateSession", () => {
    it("calls POST /generate-session with params", async () => {
      const mockSession = {
        id: 1,
        steps: [{ type: "pitch_matching" }],
        user_id: 5,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await generateSession({ user_id: 5 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate-session"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ user_id: 5 }),
        }),
      );
      expect(result).toEqual(mockSession);
    });

    it("includes focus_card_id when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, steps: [] }),
      });

      await generateSession({ user_id: 1, focus_card_id: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ user_id: 1, focus_card_id: 10 }),
        }),
      );
    });
  });

  describe("completeStep", () => {
    it("calls POST to complete step endpoint", async () => {
      const mockResult = { id: 1, steps: [{ type: "test", completed: true }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResult),
      });

      const stepResult = { success: true, score: 90 };
      const result = await completeStep(5, 0, stepResult);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sessions/5/steps/0/complete"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(stepResult),
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe("completeSession", () => {
    it("calls POST to complete session endpoint", async () => {
      const mockSummary = {
        id: 1,
        total_steps: 5,
        completed_steps: 5,
        rating: 4,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSummary),
      });

      const completionData = { rating: 4, fatigue: 2 };
      const result = await completeSession(1, completionData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sessions/1/complete"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(completionData),
        }),
      );
      expect(result).toEqual(mockSummary);
    });
  });

  describe("getSessionHistory", () => {
    it("calls GET to user sessions endpoint", async () => {
      const mockHistory = [
        { id: 1, completed_at: "2024-01-01", steps: [] },
        { id: 2, completed_at: "2024-01-02", steps: [] },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistory),
      });

      const result = await getSessionHistory(1);

      // api.get() only passes URL to fetch
      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/users/1/sessions");
      expect(result).toEqual(mockHistory);
    });

    it("includes limit parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await getSessionHistory(1, 20);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("limit=20");
    });
  });

  describe("getSessionCandidates", () => {
    it("calls GET to admin session candidates endpoint", async () => {
      const mockCandidates = {
        materials: [{ id: 1, title: "Test" }],
        focus_cards: [{ id: 1, title: "Card" }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCandidates),
      });

      const result = await getSessionCandidates(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/session-candidates"),
      );
      expect(result).toEqual(mockCandidates);
    });

    it("throws on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getSessionCandidates(1)).rejects.toThrow(
        "Failed to fetch session candidates",
      );
    });
  });

  describe("generateDiagnosticSession", () => {
    it("calls POST to generate diagnostic session", async () => {
      const mockSession = { id: 1, steps: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSession),
      });

      const result = await generateDiagnosticSession(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/generate-diagnostic-session"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(result).toEqual(mockSession);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(generateDiagnosticSession(1)).rejects.toThrow(
        "Failed to generate diagnostic session",
      );
    });
  });

  describe("getLastSessionDiagnostics", () => {
    it("calls GET to diagnostics endpoint", async () => {
      const mockDiagnostics = { session_id: 1, steps: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDiagnostics),
      });

      const result = await getLastSessionDiagnostics(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/1/last-session-diagnostics"),
      );
      expect(result).toEqual(mockDiagnostics);
    });

    it("throws on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getLastSessionDiagnostics(1)).rejects.toThrow(
        "Failed to fetch diagnostics",
      );
    });
  });
});
