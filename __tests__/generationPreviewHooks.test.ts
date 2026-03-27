/**
 * Tests for generation preview hooks
 *
 * Tests useGeneratorMode and useTunesMode hooks extracted from GenerationPreviewScreen.
 */
import { renderHook, act, waitFor } from "@testing-library/react-native";

// Mock APIs
jest.mock("../src/api/generation", () => ({
  generateContent: jest.fn().mockResolvedValue({
    events: [
      { midi: 60, duration: 1, start: 0 },
      { midi: 62, duration: 1, start: 1 },
    ],
  }),
}));

jest.mock("../src/api/materials", () => ({
  listPreviewFiles: jest.fn().mockResolvedValue({ files: ["test.musicxml"] }),
  previewMaterial: jest.fn().mockResolvedValue({
    musicxml_content: "<score></score>",
    playback_events: [{ midi: 60, duration: 1, start: 0 }],
    tempo_bpm: 120,
  }),
  getSolfege: jest.fn().mockResolvedValue({
    solfege_xml: "<solfege></solfege>",
    key_used: "C",
  }),
  transposeMaterial: jest.fn().mockResolvedValue({
    musicxml_content: "<transposed></transposed>",
  }),
  analyzeMaterial: jest.fn().mockResolvedValue({
    capabilities: [],
    intervals: [],
  }),
}));

jest.mock("../src/services/generationPlayback", () => ({
  generationPlayback: {
    load: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    stop: jest.fn(),
    resume: jest.fn().mockResolvedValue(undefined),
    setTempo: jest.fn(),
  },
}));

jest.mock("../src/utils/generationNotation", () => ({
  eventsToMusicXml: jest.fn().mockReturnValue("<musicxml></musicxml>"),
  generateDisplayTitle: jest.fn().mockReturnValue("Test Title"),
  getMeasureIndexForNote: jest.fn().mockReturnValue(0),
}));

import { useGeneratorMode } from "../src/features/generation-preview/hooks/useGeneratorMode";
import { useTunesMode } from "../src/features/generation-preview/hooks/useTunesMode";
import { generateContent } from "../src/api/generation";
import {
  listPreviewFiles,
  previewMaterial,
  getSolfege,
} from "../src/api/materials";
import { generationPlayback } from "../src/services/generationPlayback";

describe("useGeneratorMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.generationType).toBe("scale");
      expect(result.current.scaleType).toBe("ionian");
      expect(result.current.arpeggioType).toBe("major");
      expect(result.current.scalePattern).toBe("straight_up_down");
      expect(result.current.rhythmType).toBe("quarter_notes");
      expect(result.current.rootKey).toBe("C");
      expect(result.current.startOctave).toBe(4);
      expect(result.current.numOctaves).toBe(1);
      expect(result.current.clef).toBe("treble");
      expect(result.current.tempo).toBe(120);
    });

    it("initializes with idle generation state", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationError).toBeNull();
      expect(result.current.response).toBeNull();
      expect(result.current.playbackState).toBe("stopped");
    });

    it("initializes with default randomize state", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.randomize.scaleType).toBe(false);
      expect(result.current.randomize.arpeggioType).toBe(false);
      expect(result.current.randomize.rhythmType).toBe(false);
    });
  });

  describe("Parameter Setters", () => {
    it("updates generation type", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.setGenerationType("arpeggio");
      });

      expect(result.current.generationType).toBe("arpeggio");
    });

    it("updates scale type", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.setScaleType("dorian");
      });

      expect(result.current.scaleType).toBe("dorian");
    });

    it("updates tempo", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.handleTempoChange(140);
      });

      expect(result.current.tempo).toBe(140);
      expect(generationPlayback.setTempo).toHaveBeenCalledWith(140);
    });
  });

  describe("Randomize Toggle", () => {
    it("toggles randomize field", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.randomize.scaleType).toBe(false);

      act(() => {
        result.current.toggleRandomize("scaleType");
      });

      expect(result.current.randomize.scaleType).toBe(true);

      act(() => {
        result.current.toggleRandomize("scaleType");
      });

      expect(result.current.randomize.scaleType).toBe(false);
    });
  });

  describe("Pool Mode", () => {
    it("toggles pool mode", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.poolModeEnabled).toBe(false);

      act(() => {
        result.current.setPoolModeEnabled(true);
      });

      expect(result.current.poolModeEnabled).toBe(true);
    });

    it("updates scale pool", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.setScalePool(["dorian", "mixolydian"]);
      });

      expect(result.current.scalePool).toEqual(["dorian", "mixolydian"]);
    });
  });

  describe("handleGenerate", () => {
    it("calls generateContent with correct parameters", async () => {
      const { result } = renderHook(() => useGeneratorMode());

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content_type: "scale",
          definition: "ionian",
          octaves: 1,
          pattern: "straight_up_down",
          rhythm: "quarter_notes",
          key: "C",
        }),
      );
    });

    it("sets isGenerating to false after generation completes", async () => {
      const { result } = renderHook(() => useGeneratorMode());

      await act(async () => {
        await result.current.handleGenerate();
      });

      // After generation completes, isGenerating should be false
      expect(result.current.isGenerating).toBe(false);
    });

    it("loads playback after successful generation with events", async () => {
      // Reset mock to return events
      (generateContent as jest.Mock).mockResolvedValueOnce({
        events: [
          { midi: 60, duration: 1, start: 0 },
          { midi: 62, duration: 1, start: 1 },
        ],
      });

      const { result } = renderHook(() => useGeneratorMode());

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(generationPlayback.load).toHaveBeenCalled();
    });

    it("handles generation error", async () => {
      (generateContent as jest.Mock).mockRejectedValueOnce(
        new Error("API Error"),
      );

      const { result } = renderHook(() => useGeneratorMode());

      await act(async () => {
        await result.current.handleGenerate();
      });

      expect(result.current.generationError).toBe("API Error");
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe("Playback Controls", () => {
    it("handlePlay calls playback service", async () => {
      const { result } = renderHook(() => useGeneratorMode());

      await act(async () => {
        await result.current.handlePlay();
      });

      expect(generationPlayback.resume).toHaveBeenCalled();
      expect(generationPlayback.play).toHaveBeenCalled();
    });

    it("handlePause calls playback service", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.handlePause();
      });

      expect(generationPlayback.pause).toHaveBeenCalled();
    });

    it("handleStop calls playback service", () => {
      const { result } = renderHook(() => useGeneratorMode());

      act(() => {
        result.current.handleStop();
      });

      expect(generationPlayback.stop).toHaveBeenCalled();
    });
  });

  describe("Computed Values", () => {
    it("computes available scale patterns based on scale type", () => {
      const { result } = renderHook(() => useGeneratorMode());

      // Default scale type is "ionian" - should have patterns
      expect(result.current.availableScalePatterns.length).toBeGreaterThan(0);
      expect(result.current.availableScalePatterns).toContain(
        "straight_up_down",
      );
    });

    it("computes max octaves", () => {
      const { result } = renderHook(() => useGeneratorMode());

      expect(result.current.maxOctaves).toBeGreaterThan(0);
      expect(result.current.maxOctaves).toBeLessThanOrEqual(3);
    });
  });
});

describe("useTunesMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("initializes with empty state", () => {
      const { result } = renderHook(() => useTunesMode());

      expect(result.current.previewFiles).toEqual([]);
      expect(result.current.selectedPreviewFile).toBeNull();
      expect(result.current.isLoadingPreview).toBe(false);
      expect(result.current.previewError).toBeNull();
      expect(result.current.previewResponse).toBeNull();
    });

    it("initializes with default clef and key", () => {
      const { result } = renderHook(() => useTunesMode());

      expect(result.current.tuneClef).toBe("treble");
      expect(result.current.tuneKey).toBe("C");
    });

    it("initializes playback state as stopped", () => {
      const { result } = renderHook(() => useTunesMode());

      expect(result.current.playbackState).toBe("stopped");
    });
  });

  describe("loadPreviewFiles", () => {
    it("loads preview files from API", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.loadPreviewFiles();
      });

      expect(listPreviewFiles).toHaveBeenCalled();
      expect(result.current.previewFiles).toEqual(["test.musicxml"]);
    });

    it("handles load error", async () => {
      (listPreviewFiles as jest.Mock).mockRejectedValueOnce(
        new Error("Load Error"),
      );

      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.loadPreviewFiles();
      });

      expect(result.current.previewError).toBe("Load Error");
    });
  });

  describe("handlePreviewFile", () => {
    it("loads preview for selected file", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      expect(previewMaterial).toHaveBeenCalledWith("test.musicxml");
      expect(result.current.selectedPreviewFile).toBe("test.musicxml");
    });

    it("loads playback events", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      expect(generationPlayback.load).toHaveBeenCalled();
    });

    it("does nothing for empty filename", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePreviewFile("");
      });

      expect(previewMaterial).not.toHaveBeenCalled();
    });
  });

  describe("Solfège Toggle", () => {
    it("toggles solfège view", async () => {
      const { result } = renderHook(() => useTunesMode());

      // First, load a file
      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      expect(result.current.showSolfege).toBe(false);

      await act(async () => {
        await result.current.handleSolfegeToggle();
      });

      expect(result.current.showSolfege).toBe(true);
      expect(getSolfege).toHaveBeenCalledWith("test.musicxml", "C");
    });
  });

  describe("Clef Change Modal", () => {
    it("opens clef change modal", async () => {
      const { result } = renderHook(() => useTunesMode());

      // First, load a file
      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      act(() => {
        result.current.handleTuneClefChange("bass");
      });

      expect(result.current.clefChangeModal.visible).toBe(true);
      expect(result.current.clefChangeModal.targetClef).toBe("bass");
    });

    it("cancels clef change", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      act(() => {
        result.current.handleTuneClefChange("bass");
      });

      act(() => {
        result.current.handleClefChangeCancel();
      });

      expect(result.current.clefChangeModal.visible).toBe(false);
    });
  });

  describe("Key Change Modal", () => {
    it("opens key change modal", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePreviewFile("test.musicxml");
      });

      act(() => {
        result.current.handleTuneKeyChange("G");
      });

      expect(result.current.keyChangeModal.visible).toBe(true);
      expect(result.current.keyChangeModal.targetKey).toBe("G");
    });

    it("calculates transpose intervals correctly", () => {
      const { result } = renderHook(() => useTunesMode());

      // From C to G is 7 semitones up or -5 down
      const intervals = result.current.getKeyTransposeIntervals("G");
      expect(intervals.up).toBe(7);
      expect(intervals.down).toBe(-5);
    });
  });

  describe("Tempo Control", () => {
    it("updates preview tempo", () => {
      const { result } = renderHook(() => useTunesMode());

      act(() => {
        result.current.handlePreviewTempoChange(100);
      });

      expect(result.current.previewTempo).toBe(100);
      expect(generationPlayback.setTempo).toHaveBeenCalledWith(100);
    });
  });

  describe("Playback Controls", () => {
    it("handlePlay calls playback service", async () => {
      const { result } = renderHook(() => useTunesMode());

      await act(async () => {
        await result.current.handlePlay();
      });

      expect(generationPlayback.resume).toHaveBeenCalled();
      expect(generationPlayback.play).toHaveBeenCalled();
    });

    it("handleStop stops playback", () => {
      const { result } = renderHook(() => useTunesMode());

      act(() => {
        result.current.handleStop();
      });

      expect(generationPlayback.stop).toHaveBeenCalled();
    });
  });
});
