/**
 * Tests for Generation API client
 * Covers generation request/response handling
 */

// Save original fetch
const originalFetch = global.fetch;

describe("generation api", () => {
  let generateContent: typeof import("../src/api/generation").generateContent;
  let getScaleTypes: typeof import("../src/api/generation").getScaleTypes;
  let getArpeggioTypes: typeof import("../src/api/generation").getArpeggioTypes;
  let getRhythmTypes: typeof import("../src/api/generation").getRhythmTypes;
  let getKeys: typeof import("../src/api/generation").getKeys;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
    jest.isolateModules(() => {
      const module = require("../src/api/generation");
      generateContent = module.generateContent;
      getScaleTypes = module.getScaleTypes;
      getArpeggioTypes = module.getArpeggioTypes;
      getRhythmTypes = module.getRhythmTypes;
      getKeys = module.getKeys;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("generateContent", () => {
    it("makes POST request with request body", async () => {
      const mockResponse = {
        content_type: "scale",
        definition: "ionian",
        key: "C",
        octaves: 1,
        pattern: null,
        rhythm: "quarter_notes",
        dynamics: "none",
        articulation: "legato",
        effective_octaves: 1,
        range_used_low_midi: 60,
        range_used_high_midi: 72,
        events: [
          {
            midi_note: 60,
            pitch_name: "C4",
            duration_beats: 1,
            offset_beats: 0,
            velocity: 80,
            articulation: null,
          },
        ],
        total_beats: 8,
        tempo_range: null,
        capabilities_required: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        content_type: "scale" as const,
        definition: "ionian",
        octaves: 1 as const,
        rhythm: "quarter_notes" as const,
      };

      const result = await generateContent(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }),
      );
      expect(result.content_type).toBe("scale");
      expect(result.events).toHaveLength(1);
    });

    it("throws error on validation failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: "Unprocessable Entity",
        json: () => Promise.resolve({ detail: "Invalid scale type" }),
      });

      const request = {
        content_type: "scale" as const,
        definition: "invalid_scale",
      };

      await expect(generateContent(request)).rejects.toThrow(
        "Invalid scale type",
      );
    });

    it("handles all optional parameters", async () => {
      const mockResponse = {
        content_type: "scale",
        definition: "dorian",
        key: "G",
        octaves: 2,
        pattern: "in_3rds",
        rhythm: "eighth_notes",
        dynamics: "crescendo",
        articulation: "staccato",
        effective_octaves: 2,
        range_used_low_midi: 55,
        range_used_high_midi: 79,
        events: [],
        total_beats: 16,
        tempo_range: [80, 120],
        capabilities_required: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request = {
        content_type: "scale" as const,
        definition: "dorian",
        octaves: 2 as const,
        pattern: "in_3rds",
        rhythm: "eighth_notes" as const,
        key: "G" as const,
        dynamics: "crescendo" as const,
        articulation: "staccato" as const,
        tempo_min_bpm: 80,
        tempo_max_bpm: 120,
      };

      const result = await generateContent(request);

      expect(result.key).toBe("G");
      expect(result.pattern).toBe("in_3rds");
      expect(result.rhythm).toBe("eighth_notes");
    });
  });

  describe("getScaleTypes", () => {
    it("returns list of scale types", async () => {
      const mockScales = ["ionian", "dorian", "phrygian", "lydian"];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockScales),
      });

      const result = await getScaleTypes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate/scale-types"),
      );
      expect(result).toEqual(mockScales);
    });
  });

  describe("getArpeggioTypes", () => {
    it("returns list of arpeggio types", async () => {
      const mockArpeggios = ["major", "minor", "maj7", "dom7"];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockArpeggios),
      });

      const result = await getArpeggioTypes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate/arpeggio-types"),
      );
      expect(result).toEqual(mockArpeggios);
    });
  });

  describe("getRhythmTypes", () => {
    it("returns list of rhythm types", async () => {
      const mockRhythms = ["quarter_notes", "eighth_notes", "eighth_triplets"];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRhythms),
      });

      const result = await getRhythmTypes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate/rhythm-types"),
      );
      expect(result).toEqual(mockRhythms);
    });
  });

  describe("getKeys", () => {
    it("returns list of available keys", async () => {
      const mockKeys = ["C", "Db", "D", "Eb", "E", "F"];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKeys),
      });

      const result = await getKeys();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/generate/keys"),
      );
      expect(result).toEqual(mockKeys);
    });
  });
});

describe("generation types", () => {
  it("PitchEvent has required fields", () => {
    const event: import("../src/api/generation").PitchEvent = {
      midi_note: 60,
      pitch_name: "C4",
      duration_beats: 1,
      offset_beats: 0,
      velocity: 80,
      articulation: null,
    };

    expect(event.midi_note).toBe(60);
    expect(event.pitch_name).toBe("C4");
    expect(event.duration_beats).toBe(1);
  });

  it("GenerationRequest accepts valid types", () => {
    const request: import("../src/api/generation").GenerationRequest = {
      content_type: "scale",
      definition: "dorian",
      octaves: 2,
      rhythm: "eighth_notes",
      key: "G",
      dynamics: "crescendo",
      articulation: "staccato",
    };

    expect(request.content_type).toBe("scale");
    expect(request.key).toBe("G");
  });

  it("GenerationResponse has all fields", () => {
    const response: import("../src/api/generation").GenerationResponse = {
      content_type: "arpeggio",
      definition: "maj7",
      key: "Bb",
      octaves: 2,
      pattern: "broken",
      rhythm: "eighth_notes",
      dynamics: "none",
      articulation: "legato",
      effective_octaves: 2,
      range_used_low_midi: 58,
      range_used_high_midi: 82,
      events: [],
      total_beats: 8,
      tempo_range: [60, 120],
      capabilities_required: ["cap_001"],
    };

    expect(response.definition).toBe("maj7");
    expect(response.tempo_range).toEqual([60, 120]);
  });
});
