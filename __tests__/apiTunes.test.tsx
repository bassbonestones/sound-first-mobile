/**
 * Tests for API tunes module
 */
import {
  listTunes,
  getTune,
  createTune,
  updateTune,
  deleteTune,
  restoreTune,
  duplicateTune,
  inferChords,
  analyzeChords,
} from "../src/api/tunes";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("tunes API", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("listTunes", () => {
    it("calls GET to tunes endpoint with user_id", async () => {
      const mockResponse = {
        tunes: [{ id: 1, title: "Test Tune" }],
        total_count: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await listTunes(42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes");
      expect(calledUrl).toContain("user_id=42");
      expect(result).toEqual(mockResponse);
    });

    it("passes optional parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ tunes: [], total_count: 0 }),
      });

      await listTunes(1, {
        includeArchived: true,
        limit: 50,
        offset: 10,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("include_archived=true");
      expect(calledUrl).toContain("limit=50");
      expect(calledUrl).toContain("offset=10");
    });
  });

  describe("getTune", () => {
    it("calls GET to tune endpoint", async () => {
      const mockTune = {
        id: 5,
        title: "My Tune",
        measures_json: "[]",
        chord_progressions: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTune),
      });

      const result = await getTune(5, 42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5");
      expect(calledUrl).toContain("user_id=42");
      expect(result).toEqual(mockTune);
    });
  });

  describe("createTune", () => {
    it("calls POST to tunes endpoint", async () => {
      const mockTune = { id: 10, title: "New Tune" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTune),
      });

      const result = await createTune(42, {
        title: "New Tune",
        measures_json: '[{"id": "m1", "notes": []}]',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes");
      expect(calledUrl).toContain("user_id=42");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
      expect(result).toEqual(mockTune);
    });
  });

  describe("updateTune", () => {
    it("calls PUT to tune endpoint", async () => {
      const mockTune = { id: 5, title: "Updated Tune" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTune),
      });

      const result = await updateTune(5, 42, { title: "Updated Tune" });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5");
      expect(calledUrl).toContain("user_id=42");
      expect(mockFetch.mock.calls[0][1].method).toBe("PUT");
      expect(result).toEqual(mockTune);
    });
  });

  describe("deleteTune", () => {
    it("calls DELETE to tune endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await deleteTune(5, 42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5");
      expect(calledUrl).toContain("user_id=42");
      expect(calledUrl).toContain("permanent=false");
      expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
    });

    it("passes permanent flag", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await deleteTune(5, 42, true);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("permanent=true");
    });
  });

  describe("restoreTune", () => {
    it("calls POST to restore endpoint", async () => {
      const mockTune = { id: 5, is_archived: false };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTune),
      });

      const result = await restoreTune(5, 42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5/restore");
      expect(calledUrl).toContain("user_id=42");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
      expect(result).toEqual(mockTune);
    });
  });

  describe("duplicateTune", () => {
    it("calls POST to duplicate endpoint", async () => {
      const mockTune = { id: 10, title: "My Tune (Copy)" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTune),
      });

      const result = await duplicateTune(5, 42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5/duplicate");
      expect(calledUrl).toContain("user_id=42");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
      expect(result).toEqual(mockTune);
    });
  });

  describe("inferChords", () => {
    it("calls POST to infer-chords endpoint", async () => {
      const mockResponse = {
        progression: {
          id: "prog-1",
          name: "Auto-Inferred",
          isAutoInferred: true,
          isSystemDefined: true,
          chords: [
            { id: "c1", symbol: "Cmaj7", beatPosition: 0, measureIndex: 0 },
          ],
        },
        chord_count: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await inferChords(5, 42);

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/5/infer-chords");
      expect(calledUrl).toContain("user_id=42");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
      expect(result).toEqual(mockResponse);
    });

    it("passes inference options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            progression: { id: "p1", name: "Auto", chords: [] },
            chord_count: 0,
          }),
      });

      await inferChords(5, 42, {
        use_seventh_chords: false,
        chords_per_measure: 2,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.use_seventh_chords).toBe(false);
      expect(body.chords_per_measure).toBe(2);
    });

    it("uses default options when not specified", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            progression: { id: "p1", name: "Auto", chords: [] },
            chord_count: 0,
          }),
      });

      await inferChords(5, 42);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.use_seventh_chords).toBe(true);
      expect(body.chords_per_measure).toBe(1);
    });
  });

  describe("analyzeChords", () => {
    it("calls POST to analyze-chords endpoint without tune ID", async () => {
      const mockResponse = {
        progression: {
          id: "prog-1",
          name: "Auto-Inferred",
          isAutoInferred: true,
          chords: [{ id: "c1", symbol: "C", beatPosition: 0, measureIndex: 0 }],
        },
        chord_count: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await analyzeChords({
        measures_json: '[{"id": "m1", "notes": []}]',
        key_signature: 0,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("/tunes/analyze-chords");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
      expect(result).toEqual(mockResponse);
    });

    it("passes all options to the API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            progression: { id: "p1", name: "Auto", chords: [] },
            chord_count: 0,
          }),
      });

      await analyzeChords({
        measures_json: "[]",
        key_signature: -1,
        time_signature: { beats: 3, beatUnit: 4 },
        use_seventh_chords: false,
        chords_per_measure: 2,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.measures_json).toBe("[]");
      expect(body.key_signature).toBe(-1);
      expect(body.time_signature).toEqual({ beats: 3, beatUnit: 4 });
      expect(body.use_seventh_chords).toBe(false);
      expect(body.chords_per_measure).toBe(2);
    });

    it("uses default values for optional parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            progression: { id: "p1", name: "Auto", chords: [] },
            chord_count: 0,
          }),
      });

      await analyzeChords({
        measures_json: "[]",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.key_signature).toBe(0);
      expect(body.time_signature).toEqual({ beats: 4, beatUnit: 4 });
      expect(body.use_seventh_chords).toBe(true);
      expect(body.chords_per_measure).toBe(1);
    });
  });
});
