/**
 * Tests for useTimingExerciseState hook
 *
 * Tests state management for timing-based exercises:
 * - Phase management (ready, counting, listening, feedback)
 * - Correct entry handling (perfect, good)
 * - Incorrect timing handling (early, late, missed)
 * - Wrong note handling
 * - Streak and progress tracking
 * - Reset functionality
 * - Mastery calculation
 * - Configuration defaults
 */
import { renderHook, act } from "@testing-library/react-native";
import { useTimingExerciseState } from "../src/screens/Session/components/exercises/shared/useTimingExerciseState";

describe("useTimingExerciseState", () => {
  // ---------------------------------------------------------------------------
  // Configuration Defaults
  // ---------------------------------------------------------------------------
  describe("configuration defaults", () => {
    it("initializes with default BPM of 60", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.bpm).toBe(60);
    });

    it("initializes with default beatsPerMeasure of 4", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.beatsPerMeasure).toBe(4);
    });

    it("initializes with default prepBeats of 4", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.prepBeats).toBe(4);
    });

    it("initializes with default masteryStreak of 8", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.masteryStreak).toBe(8);
    });

    it("initializes with default timingToleranceMs of 450", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.timingToleranceMs).toBe(450);
    });

    it("initializes with default targetBeat of 1", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.targetBeat).toBe(1);
    });

    it("calculates beatIntervalMs correctly", () => {
      const { result } = renderHook(() => useTimingExerciseState({ bpm: 60 }));
      expect(result.current.beatIntervalMs).toBe(1000);
    });

    it("calculates beatIntervalMs for different BPM", () => {
      const { result } = renderHook(() => useTimingExerciseState({ bpm: 120 }));
      expect(result.current.beatIntervalMs).toBe(500);
    });

    it("accepts custom configuration values", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({
          bpm: 80,
          beatsPerMeasure: 3,
          prepBeats: 2,
          masteryStreak: 5,
          timingToleranceMs: 300,
          targetBeat: 2,
        }),
      );

      expect(result.current.bpm).toBe(80);
      expect(result.current.beatsPerMeasure).toBe(3);
      expect(result.current.prepBeats).toBe(2);
      expect(result.current.masteryStreak).toBe(5);
      expect(result.current.timingToleranceMs).toBe(300);
      expect(result.current.targetBeat).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Phase Management
  // ---------------------------------------------------------------------------
  describe("phase management", () => {
    it("initializes with ready phase", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.phase).toBe("ready");
    });

    it("allows setting phase directly", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("counting");
      });
      expect(result.current.phase).toBe("counting");

      act(() => {
        result.current.setPhase("listening");
      });
      expect(result.current.phase).toBe("listening");

      act(() => {
        result.current.setPhase("feedback");
      });
      expect(result.current.phase).toBe("feedback");
    });
  });

  // ---------------------------------------------------------------------------
  // Metronome State
  // ---------------------------------------------------------------------------
  describe("metronome state", () => {
    it("initializes with isPlaying false", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.isPlaying).toBe(false);
    });

    it("initializes with currentBeat 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.currentBeat).toBe(0);
    });

    it("initializes prepCount from prepBeats config", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ prepBeats: 3 }),
      );
      expect(result.current.prepCount).toBe(3);
    });

    it("allows updating metronome state", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setIsPlaying(true);
        result.current.setCurrentBeat(2);
        result.current.setPrepCount(1);
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentBeat).toBe(2);
      expect(result.current.prepCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Progress State
  // ---------------------------------------------------------------------------
  describe("progress state", () => {
    it("initializes with streak 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.streak).toBe(0);
    });

    it("initializes with totalAttempts 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.totalAttempts).toBe(0);
    });

    it("initializes with masteryReached false", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.masteryReached).toBe(false);
    });

    it("calculates masteryReached correctly when streak meets requirement", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ masteryStreak: 3 }),
      );

      // Build up streak
      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.masteryReached).toBe(false);

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.masteryReached).toBe(false);

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.masteryReached).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Entry State
  // ---------------------------------------------------------------------------
  describe("entry state", () => {
    it("initializes waitingForEntry as false", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.waitingForEntry).toBe(false);
    });

    it("initializes isPlayingNote as false", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.isPlayingNote).toBe(false);
    });

    it("allows updating entry state", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
        result.current.setIsPlayingNote(true);
      });

      expect(result.current.waitingForEntry).toBe(true);
      expect(result.current.isPlayingNote).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // handleCorrectEntry
  // ---------------------------------------------------------------------------
  describe("handleCorrectEntry", () => {
    it("increments streak on correct entry", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(1);

      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.streak).toBe(2);
    });

    it("increments totalAttempts on correct entry", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.totalAttempts).toBe(1);

      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.totalAttempts).toBe(2);
    });

    it("sets lastFeedback to quality", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.lastFeedback).toBe("perfect");

      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.lastFeedback).toBe("good");
    });

    it("clears wrongNoteInfo on correct entry", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // First set wrong note
      act(() => {
        result.current.handleWrongNote("C4", "higher");
      });
      expect(result.current.wrongNoteInfo).not.toBeNull();

      // Then correct entry should clear it
      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.wrongNoteInfo).toBeNull();
    });

    it("sets phase to feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("listening");
      });

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.phase).toBe("feedback");
    });

    it("sets waitingForEntry to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
      });

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.waitingForEntry).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // handleIncorrectTiming
  // ---------------------------------------------------------------------------
  describe("handleIncorrectTiming", () => {
    it("resets streak to 0 on early timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // Build up streak first
      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(2);

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.streak).toBe(0);
    });

    it("resets streak to 0 on late timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.streak).toBe(0);
    });

    it("resets streak to 0 on missed timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.streak).toBe(0);
    });

    it("increments totalAttempts on incorrect timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.totalAttempts).toBe(1);

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.totalAttempts).toBe(2);

      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.totalAttempts).toBe(3);
    });

    it("sets lastFeedback to timing type", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.lastFeedback).toBe("early");

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.lastFeedback).toBe("late");

      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.lastFeedback).toBe("missed");
    });

    it("clears wrongNoteInfo on incorrect timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // First set wrong note
      act(() => {
        result.current.handleWrongNote("C4", "higher");
      });

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.wrongNoteInfo).toBeNull();
    });

    it("sets phase to feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("listening");
      });

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.phase).toBe("feedback");
    });

    it("sets waitingForEntry to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
      });

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.waitingForEntry).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // handleWrongNote
  // ---------------------------------------------------------------------------
  describe("handleWrongNote", () => {
    it("resets streak to 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.handleWrongNote("D4", "higher");
      });
      expect(result.current.streak).toBe(0);
    });

    it("increments totalAttempts", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("C#4", "lower");
      });
      expect(result.current.totalAttempts).toBe(1);
    });

    it("sets wrongNoteInfo with detected note and direction (higher)", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("E4", "higher");
      });

      expect(result.current.wrongNoteInfo).toEqual({
        detectedNote: "E4",
        direction: "higher",
      });
    });

    it("sets wrongNoteInfo with detected note and direction (lower)", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("B3", "lower");
      });

      expect(result.current.wrongNoteInfo).toEqual({
        detectedNote: "B3",
        direction: "lower",
      });
    });

    it("sets lastFeedback to wrong_note", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("F4", "higher");
      });
      expect(result.current.lastFeedback).toBe("wrong_note");
    });

    it("sets phase to feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("listening");
      });

      act(() => {
        result.current.handleWrongNote("G4", "lower");
      });
      expect(result.current.phase).toBe("feedback");
    });

    it("sets waitingForEntry to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
      });

      act(() => {
        result.current.handleWrongNote("A4", "higher");
      });
      expect(result.current.waitingForEntry).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // startExercise
  // ---------------------------------------------------------------------------
  describe("startExercise", () => {
    it("sets isPlaying to true", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.startExercise();
      });
      expect(result.current.isPlaying).toBe(true);
    });

    it("sets phase to counting", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.startExercise();
      });
      expect(result.current.phase).toBe("counting");
    });

    it("resets prepCount to prepBeats", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ prepBeats: 3 }),
      );

      // Change prepCount
      act(() => {
        result.current.setPrepCount(1);
      });

      act(() => {
        result.current.startExercise();
      });
      expect(result.current.prepCount).toBe(3);
    });

    it("resets hasEnteredRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      result.current.hasEnteredRef.current = true;

      act(() => {
        result.current.startExercise();
      });
      expect(result.current.hasEnteredRef.current).toBe(false);
    });

    it("resets measureCountRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      result.current.measureCountRef.current = 5;

      act(() => {
        result.current.startExercise();
      });
      expect(result.current.measureCountRef.current).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // resetForNewRound
  // ---------------------------------------------------------------------------
  describe("resetForNewRound", () => {
    it("sets phase to counting", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("feedback");
      });

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.phase).toBe("counting");
    });

    it("resets prepCount to prepBeats", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ prepBeats: 2 }),
      );

      act(() => {
        result.current.setPrepCount(0);
      });

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.prepCount).toBe(2);
    });

    it("resets currentBeat to 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setCurrentBeat(3);
      });

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.currentBeat).toBe(0);
    });

    it("sets waitingForEntry to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
      });

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.waitingForEntry).toBe(false);
    });

    it("resets hasEnteredRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      result.current.hasEnteredRef.current = true;

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.hasEnteredRef.current).toBe(false);
    });

    it("resets measureCountRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      result.current.measureCountRef.current = 3;

      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.measureCountRef.current).toBe(0);
    });

    it("preserves streak and totalAttempts", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.resetForNewRound();
      });

      expect(result.current.streak).toBe(2);
      expect(result.current.totalAttempts).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // resetAll
  // ---------------------------------------------------------------------------
  describe("resetAll", () => {
    it("resets phase to ready", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setPhase("feedback");
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.phase).toBe("ready");
    });

    it("resets isPlaying to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setIsPlaying(true);
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it("resets currentBeat to 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setCurrentBeat(4);
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.currentBeat).toBe(0);
    });

    it("resets prepCount to prepBeats", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ prepBeats: 4 }),
      );

      act(() => {
        result.current.setPrepCount(1);
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.prepCount).toBe(4);
    });

    it("resets streak to 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.streak).toBe(0);
    });

    it("resets totalAttempts to 0", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleIncorrectTiming("early");
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.totalAttempts).toBe(0);
    });

    it("resets lastFeedback to null", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.lastFeedback).toBeNull();
    });

    it("resets wrongNoteInfo to null", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("C4", "higher");
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.wrongNoteInfo).toBeNull();
    });

    it("resets waitingForEntry to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setWaitingForEntry(true);
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.waitingForEntry).toBe(false);
    });

    it("resets isPlayingNote to false", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.setIsPlayingNote(true);
      });

      act(() => {
        result.current.resetAll();
      });
      expect(result.current.isPlayingNote).toBe(false);
    });

    it("resets all refs", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      result.current.hasEnteredRef.current = true;
      result.current.measureCountRef.current = 5;
      result.current.currentBeatRef.current = 3;
      result.current.lastBeatOneTimeRef.current = 1000;

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.hasEnteredRef.current).toBe(false);
      expect(result.current.measureCountRef.current).toBe(0);
      expect(result.current.currentBeatRef.current).toBe(0);
      expect(result.current.lastBeatOneTimeRef.current).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Feedback Text
  // ---------------------------------------------------------------------------
  describe("feedbackText", () => {
    it("returns 'Perfect! 🎯' for perfect feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.feedbackText).toBe("Perfect! 🎯");
    });

    it("returns 'Good!' for good feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.feedbackText).toBe("Good!");
    });

    it("returns 'Too early!' for early feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.feedbackText).toBe("Too early!");
    });

    it("returns 'Too late!' for late feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.feedbackText).toBe("Too late!");
    });

    it("returns 'Missed!' for missed feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.feedbackText).toBe("Missed!");
    });

    it("returns detailed message for wrong_note with info", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("D4", "higher");
      });
      expect(result.current.feedbackText).toBe(
        "Wrong note! Heard D4 - play higher",
      );
    });

    it("returns empty string for null feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.feedbackText).toBe("");
    });

    it("returns 'Wrong note!' when wrong_note feedback has no info (defensive fallback)", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // Directly set wrong_note feedback without wrongNoteInfo (edge case)
      act(() => {
        result.current.showFeedback("wrong_note");
      });
      expect(result.current.feedbackText).toBe("Wrong note!");
    });
  });

  // ---------------------------------------------------------------------------
  // Feedback Color
  // ---------------------------------------------------------------------------
  describe("feedbackColor", () => {
    it("returns green for perfect feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.feedbackColor).toBe("#4CAF50");
    });

    it("returns light green for good feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.feedbackColor).toBe("#8BC34A");
    });

    it("returns orange for early feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("early");
      });
      expect(result.current.feedbackColor).toBe("#FF9800");
    });

    it("returns deep orange for late feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("late");
      });
      expect(result.current.feedbackColor).toBe("#FF5722");
    });

    it("returns red for missed feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.feedbackColor).toBe("#f44336");
    });

    it("returns purple for wrong_note feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("C4", "higher");
      });
      expect(result.current.feedbackColor).toBe("#9C27B0");
    });

    it("returns gray for null feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.feedbackColor).toBe("#888");
    });
  });

  // ---------------------------------------------------------------------------
  // Animation Values
  // ---------------------------------------------------------------------------
  describe("animation values", () => {
    it("provides pulseAnim Animated.Value", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.pulseAnim).toBeDefined();
    });

    it("provides feedbackOpacity Animated.Value", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.feedbackOpacity).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Animation Helpers
  // ---------------------------------------------------------------------------
  describe("animatePulse", () => {
    it("animatePulse function is callable", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      expect(() => {
        act(() => {
          result.current.animatePulse();
        });
      }).not.toThrow();
    });

    it("animatePulse with isBeatOne=true is callable", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      expect(() => {
        act(() => {
          result.current.animatePulse(true);
        });
      }).not.toThrow();
    });
  });

  describe("showFeedback", () => {
    it("showFeedback function sets lastFeedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.showFeedback("perfect");
      });
      expect(result.current.lastFeedback).toBe("perfect");
    });

    it("showFeedback clears wrongNoteInfo for non wrong_note feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // Set wrong note first
      act(() => {
        result.current.handleWrongNote("C4", "higher");
      });
      expect(result.current.wrongNoteInfo).not.toBeNull();

      // Show different feedback should clear it
      act(() => {
        result.current.showFeedback("perfect");
      });
      expect(result.current.wrongNoteInfo).toBeNull();
    });

    it("showFeedback preserves wrongNoteInfo for wrong_note feedback", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleWrongNote("D4", "lower");
      });

      // Calling showFeedback again with wrong_note should preserve info
      act(() => {
        result.current.showFeedback("wrong_note");
      });
      expect(result.current.wrongNoteInfo).toEqual({
        detectedNote: "D4",
        direction: "lower",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  describe("refs", () => {
    it("provides unmountedRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.unmountedRef).toBeDefined();
      expect(result.current.unmountedRef.current).toBe(false);
    });

    it("provides hasEnteredRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.hasEnteredRef).toBeDefined();
    });

    it("provides lastBeatOneTimeRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.lastBeatOneTimeRef).toBeDefined();
    });

    it("provides measureCountRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.measureCountRef).toBeDefined();
    });

    it("provides currentBeatRef", () => {
      const { result } = renderHook(() => useTimingExerciseState());
      expect(result.current.currentBeatRef).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Integration Scenarios
  // ---------------------------------------------------------------------------
  describe("integration scenarios", () => {
    it("typical exercise flow: start -> correct entries -> mastery", () => {
      const { result } = renderHook(() =>
        useTimingExerciseState({ masteryStreak: 3 }),
      );

      // Start exercise
      act(() => {
        result.current.startExercise();
      });
      expect(result.current.phase).toBe("counting");
      expect(result.current.isPlaying).toBe(true);

      // First correct entry
      act(() => {
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(1);
      expect(result.current.phase).toBe("feedback");
      expect(result.current.masteryReached).toBe(false);

      // Reset for new round
      act(() => {
        result.current.resetForNewRound();
      });
      expect(result.current.phase).toBe("counting");

      // Second correct entry
      act(() => {
        result.current.handleCorrectEntry("good");
      });
      expect(result.current.streak).toBe(2);
      expect(result.current.masteryReached).toBe(false);

      // Third correct entry - mastery!
      act(() => {
        result.current.resetForNewRound();
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(3);
      expect(result.current.masteryReached).toBe(true);
    });

    it("streak broken by incorrect timing", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // Build up streak
      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(3);

      // Miss breaks streak
      act(() => {
        result.current.handleIncorrectTiming("missed");
      });
      expect(result.current.streak).toBe(0);
      expect(result.current.totalAttempts).toBe(4);
    });

    it("streak broken by wrong note", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      act(() => {
        result.current.handleCorrectEntry("perfect");
        result.current.handleCorrectEntry("perfect");
      });
      expect(result.current.streak).toBe(2);

      act(() => {
        result.current.handleWrongNote("F#4", "lower");
      });
      expect(result.current.streak).toBe(0);
      expect(result.current.wrongNoteInfo?.detectedNote).toBe("F#4");
      expect(result.current.wrongNoteInfo?.direction).toBe("lower");
    });

    it("full reset clears everything", () => {
      const { result } = renderHook(() => useTimingExerciseState());

      // Set up various state
      act(() => {
        result.current.startExercise();
        result.current.handleCorrectEntry("perfect");
        result.current.handleWrongNote("C4", "higher");
        result.current.setCurrentBeat(3);
        result.current.setWaitingForEntry(true);
        result.current.setIsPlayingNote(true);
      });

      // Reset all
      act(() => {
        result.current.resetAll();
      });

      expect(result.current.phase).toBe("ready");
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentBeat).toBe(0);
      expect(result.current.streak).toBe(0);
      expect(result.current.totalAttempts).toBe(0);
      expect(result.current.lastFeedback).toBeNull();
      expect(result.current.wrongNoteInfo).toBeNull();
      expect(result.current.waitingForEntry).toBe(false);
      expect(result.current.isPlayingNote).toBe(false);
    });
  });
});
