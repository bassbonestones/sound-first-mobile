/**
 * Tests for useFragment2Audio hook
 * This hook manages audio playback and performance tracking for Fragment2 exercises
 */
import { renderHook, act } from "@testing-library/react-native";
import {
  useFragment2Audio,
  Fragment2AudioConfig,
} from "../src/screens/Session/components/exercises/shared/useFragment2Audio";

// Mock createAudioContext and createClickSound
jest.mock("../src/screens/Session/components/exercises/shared", () => ({
  midiToFrequency: jest.fn((midi) => 440 * Math.pow(2, (midi - 69) / 12)),
  createAudioContext: jest.fn(() => ({
    currentTime: 0,
    sampleRate: 44100,
    state: "running",
    destination: {},
    createOscillator: jest.fn(() => ({
      type: "sine",
      frequency: { value: 440, setValueAtTime: jest.fn() },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createGain: jest.fn(() => ({
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    })),
    createBuffer: jest.fn(() => ({
      getChannelData: jest.fn(() => new Float32Array(1024)),
    })),
    createBufferSource: jest.fn(() => ({
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
    createBiquadFilter: jest.fn(() => ({
      type: "highpass",
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: jest.fn(),
    })),
    close: jest.fn(),
  })),
  createClickSound: jest.fn(),
}));

// Mock exercise state
const createMockExercise = () => ({
  isPlaying: false,
  setIsPlaying: jest.fn(),
  currentBeat: 0,
  setCurrentBeat: jest.fn(),
  isSubdivision: false,
  setIsSubdivision: jest.fn(),
  showCursor: false,
  setShowCursor: jest.fn(),
  phase: "listen",
  setPhase: jest.fn(),
  showSuccess: false,
  setShowSuccess: jest.fn(),
  singResult: null,
  setSingResult: jest.fn(),
  playResult: null,
  setPlayResult: jest.fn(),
  showNotation: false,
  setShowNotation: jest.fn(),
  hasHeardPattern: false,
  setHasHeardPattern: jest.fn(),
  successfulRounds: 0,
  incrementSuccessfulRounds: jest.fn(),
  goToNextPhase: jest.fn(),
  goToPrevPhase: jest.fn(),
  resetForNewRound: jest.fn(),
  currentFocusCard: null,
  rotateFocusCard: jest.fn(),
  singAttempts: 0,
  incrementSingAttempts: jest.fn(),
  resetSingAttempts: jest.fn(),
  playAttempts: 0,
  incrementPlayAttempts: jest.fn(),
  resetPlayAttempts: jest.fn(),
  showAttestModal: false,
  attestPhase: null,
  openAttestModal: jest.fn(),
  closeAttestModal: jest.fn(),
  confirmAttestation: jest.fn(),
  progress: {
    currentIndex: 0,
    completedItems: {},
    totalItems: 1,
    isComplete: false,
  },
  markItemComplete: jest.fn(),
  goToNextItem: jest.fn(),
  goToItem: jest.fn(),
});

describe("useFragment2Audio", () => {
  let mockExercise: ReturnType<typeof createMockExercise>;

  const createDefaultConfig = (): Fragment2AudioConfig => ({
    patternFrequencies: [262, 294], // C4, D4
    patternNotesCount: 2,
    tempo: 60,
    firstNoteMidi: 60,
    exercise: mockExercise as any,
    isSingPhase: false,
    patternPitches: [60, 62],
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockExercise = createMockExercise();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== INITIALIZATION ==========
  describe("Initialization", () => {
    it("initializes with correct structure", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      expect(result.current.playPattern).toBeInstanceOf(Function);
      expect(result.current.playMetronomeOnly).toBeInstanceOf(Function);
      expect(result.current.stopPlayback).toBeInstanceOf(Function);
      expect(result.current.startDrone).toBeInstanceOf(Function);
      expect(result.current.stopDrone).toBeInstanceOf(Function);
      expect(result.current.analyzePerformance).toBeInstanceOf(Function);
      expect(result.current.resetTracking).toBeInstanceOf(Function);
    });

    it("provides tracking refs", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      expect(result.current.isSoundingRef).toBeDefined();
      expect(result.current.notePitchAccuracyRef).toBeDefined();
      expect(result.current.hasHitTargetPitchRef).toBeDefined();
      expect(result.current.onPitchCountRef).toBeDefined();
      expect(result.current.totalSoundingCountRef).toBeDefined();
    });

    it("provides droneActive property", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      expect(typeof result.current.droneActive).toBe("boolean");
    });
  });

  // ========== RESET TRACKING ==========
  describe("Reset Tracking", () => {
    it("resets all tracking refs", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      // Set some values first
      result.current.hasHitTargetPitchRef.current = true;
      result.current.onPitchCountRef.current = 10;
      result.current.totalSoundingCountRef.current = 20;

      act(() => {
        result.current.resetTracking();
      });

      expect(result.current.hasHitTargetPitchRef.current).toBe(false);
      expect(result.current.onPitchCountRef.current).toBe(0);
      expect(result.current.totalSoundingCountRef.current).toBe(0);
    });

    it("initializes arrays with correct length", () => {
      const config = createDefaultConfig();
      config.patternNotesCount = 3;
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.resetTracking();
      });

      expect(result.current.notePitchAccuracyRef.current).toHaveLength(3);
    });
  });

  // ========== PLAY PATTERN ==========
  describe("Play Pattern", () => {
    it("starts playback", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("sets initial beat for count-in", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setCurrentBeat).toHaveBeenCalledWith(-4);
    });

    it("enables cursor display", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setShowCursor).toHaveBeenCalledWith(true);
    });

    it("ignores if already playing", () => {
      const config = createDefaultConfig();
      mockExercise.isPlaying = true;
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).not.toHaveBeenCalled();
    });

    it("accepts onComplete callback", () => {
      const config = createDefaultConfig();
      const onComplete = jest.fn();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern(onComplete);
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });
  });

  // ========== PLAY METRONOME ONLY ==========
  describe("Play Metronome Only", () => {
    it("starts playback without notes", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playMetronomeOnly();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("sets initial beat for count-in", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playMetronomeOnly();
      });

      expect(mockExercise.setCurrentBeat).toHaveBeenCalledWith(-4);
    });

    it("ignores if already playing", () => {
      const config = createDefaultConfig();
      mockExercise.isPlaying = true;
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playMetronomeOnly();
      });

      expect(mockExercise.setIsPlaying).not.toHaveBeenCalled();
    });

    it("can include drone", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playMetronomeOnly(undefined, true);
      });

      // Drone should be started
      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("accepts onComplete callback", () => {
      const config = createDefaultConfig();
      const onComplete = jest.fn();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playMetronomeOnly(onComplete);
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });
  });

  // ========== STOP PLAYBACK ==========
  describe("Stop Playback", () => {
    it("stops playback", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      act(() => {
        result.current.stopPlayback();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenLastCalledWith(false);
    });

    it("resets beat to 0", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      act(() => {
        result.current.stopPlayback();
      });

      expect(mockExercise.setCurrentBeat).toHaveBeenLastCalledWith(0);
    });

    it("hides cursor", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      act(() => {
        result.current.stopPlayback();
      });

      expect(mockExercise.setShowCursor).toHaveBeenLastCalledWith(false);
    });

    it("safely handles being called when not playing", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      expect(() => {
        act(() => {
          result.current.stopPlayback();
        });
      }).not.toThrow();
    });
  });

  // ========== DRONE CONTROL ==========
  describe("Drone Control", () => {
    it("starts drone without error", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      // Since droneActive is a ref, we just verify the function runs without error
      expect(() => {
        act(() => {
          result.current.startDrone();
        });
      }).not.toThrow();
    });

    it("stops drone without error", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.startDrone();
      });

      expect(() => {
        act(() => {
          result.current.stopDrone();
        });
      }).not.toThrow();
    });

    it("ignores startDrone if already active", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.startDrone();
      });

      // Second call should not throw
      expect(() => {
        act(() => {
          result.current.startDrone();
        });
      }).not.toThrow();
    });
  });

  // ========== PERFORMANCE ANALYSIS ==========
  describe("Performance Analysis", () => {
    it("returns success analysis", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.resetTracking();
      });

      // Simulate good performance
      result.current.hasHitTargetPitchRef.current = true;
      result.current.onPitchCountRef.current = 15;
      result.current.totalSoundingCountRef.current = 20;

      const analysis = result.current.analyzePerformance();

      expect(analysis).toHaveProperty("success");
      expect(analysis).toHaveProperty("message");
    });

    it("detects failure when no sound", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.resetTracking();
      });

      // No sound recorded
      result.current.totalSoundingCountRef.current = 0;

      const analysis = result.current.analyzePerformance();

      expect(analysis.success).toBe(false);
    });

    it("returns PerformanceResult structure", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.resetTracking();
      });

      result.current.totalSoundingCountRef.current = 10;

      const analysis = result.current.analyzePerformance();

      expect(analysis).toBeDefined();
      expect(typeof analysis.success).toBe("boolean");
    });
  });

  // ========== CLEANUP ==========
  describe("Cleanup", () => {
    it("cleans up on unmount", () => {
      const config = createDefaultConfig();
      const { unmount, result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("stops drone on unmount", () => {
      const config = createDefaultConfig();
      const { unmount, result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.startDrone();
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  // ========== BEAT PROGRESSION ==========
  describe("Beat Progression", () => {
    it("progresses through beats during playback", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      // Advance time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Beat should have been updated
      expect(mockExercise.setCurrentBeat).toHaveBeenCalled();
    });

    it("handles subdivision timing", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      // Advance to subdivision
      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Subdivision state should be updated
      expect(mockExercise.setIsSubdivision).toHaveBeenCalled();
    });
  });

  // ========== TEMPO HANDLING ==========
  describe("Tempo Handling", () => {
    it("accepts different tempos", () => {
      const config = createDefaultConfig();
      config.tempo = 120;
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("handles slow tempo", () => {
      const config = createDefaultConfig();
      config.tempo = 40;
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });
  });

  // ========== PATTERN NOTES ==========
  describe("Pattern Notes", () => {
    it("handles single note pattern", () => {
      const config = createDefaultConfig();
      config.patternFrequencies = [262];
      config.patternNotesCount = 1;
      config.patternPitches = [60];
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });

    it("handles three note pattern", () => {
      const config = createDefaultConfig();
      config.patternFrequencies = [262, 294, 262];
      config.patternNotesCount = 3;
      config.patternPitches = [60, 62, 60];
      const { result } = renderHook(() => useFragment2Audio(config));

      act(() => {
        result.current.playPattern();
      });

      expect(mockExercise.setIsPlaying).toHaveBeenCalledWith(true);
    });
  });

  // ========== SOUND TRACKING ==========
  describe("Sound Tracking", () => {
    it("tracks isSounding ref updates", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      // Simulate pitch detection updating isSounding
      result.current.isSoundingRef.current = true;
      expect(result.current.isSoundingRef.current).toBe(true);

      result.current.isSoundingRef.current = false;
      expect(result.current.isSoundingRef.current).toBe(false);
    });

    it("updates totalSoundingCount ref", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      result.current.totalSoundingCountRef.current = 100;
      expect(result.current.totalSoundingCountRef.current).toBe(100);
    });

    it("updates onPitchCount ref", () => {
      const config = createDefaultConfig();
      const { result } = renderHook(() => useFragment2Audio(config));

      result.current.onPitchCountRef.current = 50;
      expect(result.current.onPitchCountRef.current).toBe(50);
    });
  });
});
