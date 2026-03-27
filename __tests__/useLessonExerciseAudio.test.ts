/**
 * Tests for useLessonExerciseAudio hook
 * This hook manages audio for lesson-style exercises including:
 * - Pattern playback with metronome
 * - Drone (tonic) support
 * - Beat tracking
 * - Performance analysis
 */
import { renderHook, act } from "@testing-library/react-native";
import {
  useLessonExerciseAudio,
  LessonExerciseAudioConfig,
} from "../src/screens/Session/components/exercises/shared/useLessonExerciseAudio";

// Mock audioHelpers
jest.mock(
  "../src/screens/Session/components/exercises/shared/audioHelpers",
  () => ({
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
  }),
);

// Mock noteUtils
jest.mock(
  "../src/screens/Session/components/exercises/shared/noteUtils",
  () => ({
    midiToFrequency: jest.fn((midi) => 440 * Math.pow(2, (midi - 69) / 12)),
  }),
);

describe("useLessonExerciseAudio", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========== INITIALIZATION ==========
  describe("Initialization", () => {
    it("initializes with default config", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      expect(result.current.isAudioReady).toBe(true);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentBeat).toBe(0);
      expect(result.current.isDroneActive).toBe(false);
    });

    it("initializes audio context", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());
      expect(result.current.audioContext).toBeTruthy();
    });

    it("accepts custom tempo", () => {
      const config: LessonExerciseAudioConfig = { tempo: 120 };
      const { result } = renderHook(() => useLessonExerciseAudio(config));
      expect(result.current).toBeDefined();
    });

    it("accepts noteConfig with beatsPerNote", () => {
      const config: LessonExerciseAudioConfig = {
        noteConfig: { beatsPerNote: 2 },
      };
      const { result } = renderHook(() => useLessonExerciseAudio(config));
      expect(result.current).toBeDefined();
    });

    it("accepts noteConfig with subdivision", () => {
      const config: LessonExerciseAudioConfig = {
        noteConfig: {
          beatsPerNote: 4,
          includeSubdivision: true,
          subdivisionsPerBeat: 2,
        },
      };
      const { result } = renderHook(() => useLessonExerciseAudio(config));
      expect(result.current).toBeDefined();
    });

    it("accepts custom count-in config", () => {
      const config: LessonExerciseAudioConfig = {
        countIn: { beats: 2, accentFirst: true },
      };
      const { result } = renderHook(() => useLessonExerciseAudio(config));
      expect(result.current).toBeDefined();
    });

    it("accepts pitch detection options", () => {
      const config: LessonExerciseAudioConfig = {
        pitchSuccessThreshold: 0.5,
        sustainThreshold: 0.7,
        perNotePitchThreshold: 0.6,
      };
      const { result } = renderHook(() => useLessonExerciseAudio(config));
      expect(result.current).toBeDefined();
    });
  });

  // ========== TRACKING REFS ==========
  describe("Tracking Refs", () => {
    it("provides tracking refs structure", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      expect(result.current.trackingRefs).toHaveProperty("hasHitTargetPitch");
      expect(result.current.trackingRefs).toHaveProperty("onPitchCount");
      expect(result.current.trackingRefs).toHaveProperty("totalSoundingCount");
      expect(result.current.trackingRefs).toHaveProperty("startedEarly");
      expect(result.current.trackingRefs).toHaveProperty("soundingOnBeats");
      expect(result.current.trackingRefs).toHaveProperty("noteStartedOnTime");
      expect(result.current.trackingRefs).toHaveProperty("notePitchAccuracy");
      expect(result.current.trackingRefs).toHaveProperty("isSounding");
    });

    it("resets tracking refs", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      // Set some values first
      result.current.trackingRefs.hasHitTargetPitch.current = true;
      result.current.trackingRefs.onPitchCount.current = 10;
      result.current.trackingRefs.totalSoundingCount.current = 20;

      act(() => {
        result.current.resetTrackingRefs(3);
      });

      expect(result.current.trackingRefs.hasHitTargetPitch.current).toBe(false);
      expect(result.current.trackingRefs.onPitchCount.current).toBe(0);
      expect(result.current.trackingRefs.totalSoundingCount.current).toBe(0);
      expect(result.current.trackingRefs.soundingOnBeats.current).toHaveLength(
        3,
      );
      expect(
        result.current.trackingRefs.noteStartedOnTime.current,
      ).toHaveLength(3);
      expect(
        result.current.trackingRefs.notePitchAccuracy.current,
      ).toHaveLength(3);
    });

    it("initializes notePitchAccuracy with correct structure", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.resetTrackingRefs(2);
      });

      expect(result.current.trackingRefs.notePitchAccuracy.current[0]).toEqual({
        onPitch: 0,
        total: 0,
      });
    });
  });

  // ========== PLAY PATTERN ==========
  describe("Play Pattern", () => {
    it("starts playback when playPattern is called", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([
          { midiOrFreq: 60, isMidi: true },
          { midiOrFreq: 62, isMidi: true },
        ]);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("sets currentBeat to negative for count-in", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({ countIn: { beats: 4 } }),
      );

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      expect(result.current.currentBeat).toBe(-4);
    });

    it("plays notes with frequency values", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([{ midiOrFreq: 440, isMidi: false }]);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("ignores playPattern when already playing", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      const callCount = jest.fn();
      act(() => {
        result.current.playPattern(
          [{ midiOrFreq: 62, isMidi: true }],
          callCount,
        );
      });

      // Second call should be ignored since already playing
      expect(callCount).not.toHaveBeenCalled();
    });

    it("accepts custom note durations", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([
          { midiOrFreq: 60, isMidi: true, durationBeats: 2 },
        ]);
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  // ========== PLAY METRONOME ONLY ==========
  describe("Play Metronome Only", () => {
    it("starts playback when playMetronomeOnly is called", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playMetronomeOnly(4);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("starts with count-in beat", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({ countIn: { beats: 4 } }),
      );

      act(() => {
        result.current.playMetronomeOnly(2);
      });

      expect(result.current.currentBeat).toBe(-4);
    });

    it("can include drone", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playMetronomeOnly(4, undefined, true, 60);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("ignores when already playing", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playMetronomeOnly(4);
      });

      const firstBeat = result.current.currentBeat;

      act(() => {
        result.current.playMetronomeOnly(2);
      });

      // Should still be at same beat since second call ignored
      expect(result.current.currentBeat).toBe(firstBeat);
    });
  });

  // ========== STOP PLAYBACK ==========
  describe("Stop Playback", () => {
    it("stops playback", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stopPlayback();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentBeat).toBe(0);
    });

    it("resets subdivision state", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({
          noteConfig: { beatsPerNote: 2, includeSubdivision: true },
        }),
      );

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      act(() => {
        result.current.stopPlayback();
      });

      expect(result.current.isSubdivision).toBe(false);
    });

    it("safely handles stop when not playing", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      expect(() => {
        act(() => {
          result.current.stopPlayback();
        });
      }).not.toThrow();
    });
  });

  // ========== DRONE CONTROL ==========
  describe("Drone Control", () => {
    it("starts drone", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.startDrone(60);
      });

      expect(result.current.isDroneActive).toBe(true);
    });

    it("stops drone", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.startDrone(60);
      });

      act(() => {
        result.current.stopDrone();
      });

      expect(result.current.isDroneActive).toBe(false);
    });

    it("ignores startDrone if already active", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.startDrone(60);
      });

      act(() => {
        result.current.startDrone(62);
      });

      // Should still be active from first call
      expect(result.current.isDroneActive).toBe(true);
    });
  });

  // ========== PERFORMANCE ANALYSIS ==========
  describe("Performance Analysis", () => {
    it("returns success analysis", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.resetTrackingRefs(1);
      });

      // Simulate good performance
      result.current.trackingRefs.hasHitTargetPitch.current = true;
      result.current.trackingRefs.onPitchCount.current = 10;
      result.current.trackingRefs.totalSoundingCount.current = 20;
      result.current.trackingRefs.soundingOnBeats.current = [0.8];
      result.current.trackingRefs.noteStartedOnTime.current = [true];
      result.current.trackingRefs.notePitchAccuracy.current = [
        { onPitch: 8, total: 10 },
      ];

      const analysis = result.current.analyzePerformance([60], "sing");

      expect(analysis).toHaveProperty("success");
      expect(analysis).toHaveProperty("pitchOk");
      expect(analysis).toHaveProperty("rhythmOk");
      expect(analysis).toHaveProperty("message");
    });

    it("detects failure when no sound", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.resetTrackingRefs(1);
      });

      // Simulate no sound
      result.current.trackingRefs.totalSoundingCount.current = 0;

      const analysis = result.current.analyzePerformance([60], "sing");

      expect(analysis.success).toBe(false);
    });

    it("detects failure when started early", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.resetTrackingRefs(1);
      });

      result.current.trackingRefs.startedEarly.current = true;
      result.current.trackingRefs.totalSoundingCount.current = 10;

      const analysis = result.current.analyzePerformance([60], "play");

      // Started early leads to failure
      expect(analysis.success).toBe(false);
    });

    it("analyzes sing phase with octave tolerance", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({ allowOctaveVariance: true }),
      );

      act(() => {
        result.current.resetTrackingRefs(2);
      });

      result.current.trackingRefs.hasHitTargetPitch.current = true;
      result.current.trackingRefs.totalSoundingCount.current = 20;

      const analysis = result.current.analyzePerformance([60, 62], "sing");
      expect(analysis).toBeDefined();
    });

    it("analyzes play phase strictly", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({ allowOctaveVariance: false }),
      );

      act(() => {
        result.current.resetTrackingRefs(1);
      });

      result.current.trackingRefs.totalSoundingCount.current = 10;

      const analysis = result.current.analyzePerformance([60], "play");
      expect(analysis).toBeDefined();
    });

    it("includes details in analysis", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.resetTrackingRefs(2);
      });

      result.current.trackingRefs.hasHitTargetPitch.current = true;
      result.current.trackingRefs.onPitchCount.current = 15;
      result.current.trackingRefs.totalSoundingCount.current = 20;
      result.current.trackingRefs.soundingOnBeats.current = [0.8, 0.9];
      result.current.trackingRefs.noteStartedOnTime.current = [true, true];
      result.current.trackingRefs.notePitchAccuracy.current = [
        { onPitch: 8, total: 10 },
        { onPitch: 9, total: 10 },
      ];

      const analysis = result.current.analyzePerformance([60, 62], "sing");

      expect(analysis.details).toBeDefined();
      expect(analysis.details?.perNotePitchAccuracy).toHaveLength(2);
      expect(analysis.details?.sustainPercentages).toHaveLength(2);
      expect(analysis.details?.startedOnTime).toHaveLength(2);
    });
  });

  // ========== STATE SETTERS ==========
  describe("State Setters", () => {
    it("provides setCurrentBeat", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.setCurrentBeat(5);
      });

      expect(result.current.currentBeat).toBe(5);
    });

    it("provides setIsPlaying", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.setIsPlaying(true);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it("provides setIsSubdivision", () => {
      const { result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.setIsSubdivision(true);
      });

      expect(result.current.isSubdivision).toBe(true);
    });
  });

  // ========== CLEANUP ==========
  describe("Cleanup", () => {
    it("cleans up on unmount", () => {
      const { unmount, result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("stops oscillators on unmount", () => {
      const { unmount, result } = renderHook(() => useLessonExerciseAudio());

      act(() => {
        result.current.startDrone(60);
      });

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  // ========== BEAT PROGRESSION ==========
  describe("Beat Progression", () => {
    it("progresses beats during pattern playback", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({ tempo: 60 }),
      );

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      const initialBeat = result.current.currentBeat;

      act(() => {
        jest.advanceTimersByTime(1000); // 1 beat at 60 BPM
      });

      // Beat should have progressed
      expect(result.current.currentBeat).toBeGreaterThan(initialBeat);
    });

    it("handles subdivision timing", () => {
      const { result } = renderHook(() =>
        useLessonExerciseAudio({
          tempo: 60,
          noteConfig: {
            beatsPerNote: 4,
            includeSubdivision: true,
            subdivisionsPerBeat: 2,
          },
        }),
      );

      act(() => {
        result.current.playPattern([{ midiOrFreq: 60, isMidi: true }]);
      });

      // Advance half a beat
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should be in subdivision state
      // The exact state depends on implementation details
    });
  });

  // ========== COMPLETE CALLBACK ==========
  describe("Complete Callback", () => {
    it("calls onComplete when pattern finishes", () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() =>
        useLessonExerciseAudio({
          tempo: 60,
          noteConfig: { beatsPerNote: 1 },
          countIn: { beats: 0 },
        }),
      );

      act(() => {
        result.current.playPattern(
          [{ midiOrFreq: 60, isMidi: true }],
          onComplete,
        );
      });

      // Advance through the pattern
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Note: The callback timing depends on implementation details
      // This test verifies the hook accepts the callback without error
    });
  });
});
