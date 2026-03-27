/**
 * usePracticeOverChanges Hook Tests
 *
 * Tests for the practice mode state management hook.
 */

import { renderHook, act } from "@testing-library/react-native";
import { usePracticeOverChanges } from "../src/features/tune-composer/hooks";
import {
  type TuneComposerScore,
  createScore,
} from "../src/features/tune-composer/types";
import * as generationApi from "../src/api/generation";

// Mock the API module
jest.mock("../src/api/generation", () => ({
  generateOverChanges: jest.fn(),
}));

const mockGenerateOverChanges = generationApi.generateOverChanges as jest.Mock;

describe("usePracticeOverChanges", () => {
  // Use createScore() which creates a valid score structure
  const createMockScore = (): TuneComposerScore => {
    const score = createScore();
    // Add a chord to the first measure in the active progression
    const progression = score.chordProgressions[0];
    progression.chords.push({
      symbol: "C",
      measureIndex: 0,
      beatPosition: 0,
    });
    progression.chords.push({
      symbol: "G",
      measureIndex: 1,
      beatPosition: 0,
    });
    return score;
  };

  const createEmptyChordScore = (): TuneComposerScore => {
    const score = createScore();
    // Keep progressions but with no chords
    score.chordProgressions[0].chords = [];
    return score;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateOverChanges.mockResolvedValue({
      segments: [
        {
          chord_symbol: "C",
          duration_beats: 4,
          events: [
            {
              midi_note: 60,
              pitch_name: "C4",
              duration_beats: 1,
              offset_beats: 0,
              velocity: 64,
              is_rest: false,
            },
            {
              midi_note: 62,
              pitch_name: "D4",
              duration_beats: 1,
              offset_beats: 1,
              velocity: 64,
              is_rest: false,
            },
          ],
        },
      ],
      events: [
        {
          midi_note: 60,
          pitch_name: "C4",
          duration_beats: 1,
          offset_beats: 0,
          velocity: 64,
          is_rest: false,
        },
        {
          midi_note: 62,
          pitch_name: "D4",
          duration_beats: 1,
          offset_beats: 1,
          velocity: 64,
          is_rest: false,
        },
      ],
      total_beats: 8,
    });
  });

  // ===========================================================================
  // Initial State
  // ===========================================================================

  describe("Initial State", () => {
    it("should initialize with practice mode off", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.isActive).toBe(false);
    });

    it("should initialize with default content type as scales", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.contentType).toBe("scales");
    });

    it("should initialize with no generated content", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.events).toEqual([]);
      expect(result.current.practiceState.segments).toEqual([]);
      expect(result.current.hasGeneratedContent).toBe(false);
    });

    it("should initialize with default range", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.rangeLowMidi).toBe(48); // C3
      expect(result.current.practiceState.rangeHighMidi).toBe(84); // C6
    });

    it("should initialize with null tempo override", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.tempoOverride).toBeNull();
    });

    it("should not be generating initially", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.isGenerating).toBe(false);
    });

    it("should have no error initially", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.practiceState.error).toBeNull();
    });
  });

  // ===========================================================================
  // Toggle Practice Mode
  // ===========================================================================

  describe("Toggle Practice Mode", () => {
    it("should toggle practice mode on", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.togglePracticeMode();
      });

      expect(result.current.practiceState.isActive).toBe(true);
    });

    it("should toggle practice mode off", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.togglePracticeMode();
      });

      expect(result.current.practiceState.isActive).toBe(true);

      act(() => {
        result.current.togglePracticeMode();
      });

      expect(result.current.practiceState.isActive).toBe(false);
    });
  });

  // ===========================================================================
  // Set Content Type
  // ===========================================================================

  describe("Set Content Type", () => {
    it("should change content type to arpeggios", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setContentType("arpeggios");
      });

      expect(result.current.practiceState.contentType).toBe("arpeggios");
    });

    it("should change content type to guide_tones", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setContentType("guide_tones");
      });

      expect(result.current.practiceState.contentType).toBe("guide_tones");
    });

    it("should change content type back to scales", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setContentType("arpeggios");
      });

      act(() => {
        result.current.setContentType("scales");
      });

      expect(result.current.practiceState.contentType).toBe("scales");
    });

    it("should clear pattern when changing content type", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setPattern("descending");
      });

      expect(result.current.practiceState.pattern).toBe("descending");

      act(() => {
        result.current.setContentType("arpeggios");
      });

      // Pattern should be cleared when changing content type
      expect(result.current.practiceState.pattern).toBeNull();
    });
  });

  // ===========================================================================
  // Set Pattern
  // ===========================================================================

  describe("Set Pattern", () => {
    it("should set pattern", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setPattern("descending");
      });

      expect(result.current.practiceState.pattern).toBe("descending");
    });

    it("should clear pattern with null", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setPattern("ascending");
      });

      act(() => {
        result.current.setPattern(null);
      });

      expect(result.current.practiceState.pattern).toBeNull();
    });
  });

  // ===========================================================================
  // Set Rhythm
  // ===========================================================================

  describe("Set Rhythm", () => {
    it("should set rhythm", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setRhythm("eighth_notes");
      });

      expect(result.current.practiceState.rhythm).toBe("eighth_notes");
    });
  });

  // ===========================================================================
  // Set Tempo Override
  // ===========================================================================

  describe("Set Tempo Override", () => {
    it("should set tempo override", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setTempoOverride(100);
      });

      expect(result.current.practiceState.tempoOverride).toBe(100);
    });

    it("should clear tempo override with null", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setTempoOverride(100);
      });

      act(() => {
        result.current.setTempoOverride(null);
      });

      expect(result.current.practiceState.tempoOverride).toBeNull();
    });
  });

  // ===========================================================================
  // Set Range
  // ===========================================================================

  describe("Set Range", () => {
    it("should set range min and max", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setRange(36, 72);
      });

      expect(result.current.practiceState.rangeLowMidi).toBe(36);
      expect(result.current.practiceState.rangeHighMidi).toBe(72);
    });

    it("should clamp range to valid MIDI values", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      act(() => {
        result.current.setRange(-10, 200);
      });

      expect(result.current.practiceState.rangeLowMidi).toBe(0);
      expect(result.current.practiceState.rangeHighMidi).toBe(127);
    });
  });

  // ===========================================================================
  // Generate
  // ===========================================================================

  describe("Generate", () => {
    it("should call API with correct parameters", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(mockGenerateOverChanges).toHaveBeenCalledTimes(1);
      expect(mockGenerateOverChanges).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: "scales",
        }),
      );
    });

    it("should populate generated events on success", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.events.length).toBeGreaterThan(0);
      expect(result.current.hasGeneratedContent).toBe(true);
    });

    it("should populate generated segments on success", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.segments.length).toBeGreaterThan(0);
    });

    it("should set error on API failure", async () => {
      mockGenerateOverChanges.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.error).toBe("API Error");
    });

    it("should not generate if no chords in score", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createEmptyChordScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(mockGenerateOverChanges).not.toHaveBeenCalled();
      expect(result.current.practiceState.error).toBe(
        "No chords available. Add chord symbols first.",
      );
    });
  });

  // ===========================================================================
  // Clear Generated
  // ===========================================================================

  describe("Clear Generated", () => {
    it("should clear generated events", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.events.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearGenerated();
      });

      expect(result.current.practiceState.events).toEqual([]);
      expect(result.current.hasGeneratedContent).toBe(false);
    });

    it("should clear generated segments", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.segments.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearGenerated();
      });

      expect(result.current.practiceState.segments).toEqual([]);
    });

    it("should clear total beats", async () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      act(() => {
        result.current.clearGenerated();
      });

      expect(result.current.practiceState.totalBeats).toBe(0);
    });

    it("should also clear error", async () => {
      mockGenerateOverChanges.mockRejectedValue(new Error("Error"));

      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.practiceState.error).toBeTruthy();

      act(() => {
        result.current.clearGenerated();
      });

      expect(result.current.practiceState.error).toBeNull();
    });
  });

  // ===========================================================================
  // Effective Tempo
  // ===========================================================================

  describe("Effective Tempo", () => {
    it("should use score tempo when no override", () => {
      const score = createMockScore();
      score.tempo = 140;
      const { result } = renderHook(() => usePracticeOverChanges(score));

      expect(result.current.effectiveTempo).toBe(140);
    });

    it("should use override tempo when set", () => {
      const score = createMockScore();
      score.tempo = 140;
      const { result } = renderHook(() => usePracticeOverChanges(score));

      act(() => {
        result.current.setTempoOverride(80);
      });

      expect(result.current.effectiveTempo).toBe(80);
    });
  });

  // ===========================================================================
  // Has Chords
  // ===========================================================================

  describe("Has Chords", () => {
    it("should return true when score has chords", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createMockScore()),
      );

      expect(result.current.hasChords).toBe(true);
    });

    it("should return false when score has no chords", () => {
      const { result } = renderHook(() =>
        usePracticeOverChanges(createEmptyChordScore()),
      );

      expect(result.current.hasChords).toBe(false);
    });
  });
});
