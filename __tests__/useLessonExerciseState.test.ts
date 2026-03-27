/**
 * Tests for useLessonExerciseState hook
 *
 * Tests state management extracted from lesson exercises:
 * - Phase management
 * - Playback state
 * - Result tracking
 * - Attestation flow
 * - Progress tracking
 */
import { renderHook, act } from "@testing-library/react-native";
import { useLessonExerciseState } from "../src/screens/Session/components/exercises/shared/useLessonExerciseState";
import { LESSON_PHASES } from "../src/screens/Session/components/exercises/shared/exerciseConstants";

describe("useLessonExerciseState", () => {
  // ---------------------------------------------------------------------------
  // Phase Management
  // ---------------------------------------------------------------------------
  describe("phase management", () => {
    it("initializes with FOCUS_CARD phase by default", () => {
      const { result } = renderHook(() => useLessonExerciseState());
      expect(result.current.phase).toBe(LESSON_PHASES.FOCUS_CARD);
    });

    it("allows custom start phase", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.LISTEN },
        }),
      );
      expect(result.current.phase).toBe(LESSON_PHASES.LISTEN);
    });

    it("navigates to next phase correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.phase).toBe(LESSON_PHASES.FOCUS_CARD);

      act(() => {
        result.current.goToNextPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.LISTEN);

      act(() => {
        result.current.goToNextPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.SING);
    });

    it("navigates to previous phase correctly", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.SING },
        }),
      );

      act(() => {
        result.current.goToPrevPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.LISTEN);
    });

    it("does not go before first phase", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.goToPrevPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.FOCUS_CARD);
    });

    it("does not go after last phase", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.FEEDBACK },
        }),
      );

      act(() => {
        result.current.goToNextPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.FEEDBACK);
    });

    it("resets phase to start", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.goToNextPhase();
        result.current.goToNextPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.SING);

      act(() => {
        result.current.resetPhase();
      });
      expect(result.current.phase).toBe(LESSON_PHASES.FOCUS_CARD);
    });

    it("calls onPhaseChange callback when phase changes", () => {
      const onPhaseChange = jest.fn();
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.FOCUS_CARD },
          onPhaseChange,
        }),
      );

      act(() => {
        result.current.goToNextPhase();
      });

      expect(onPhaseChange).toHaveBeenCalledWith(
        LESSON_PHASES.LISTEN,
        LESSON_PHASES.FOCUS_CARD,
      );
    });

    it("calls onPhaseChange when using setPhase directly", () => {
      const onPhaseChange = jest.fn();
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.FOCUS_CARD },
          onPhaseChange,
        }),
      );

      act(() => {
        result.current.setPhase(LESSON_PHASES.SING);
      });

      expect(onPhaseChange).toHaveBeenCalledWith(
        LESSON_PHASES.SING,
        LESSON_PHASES.FOCUS_CARD,
      );
    });

    it("calls onPhaseChange when going to previous phase", () => {
      const onPhaseChange = jest.fn();
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.SING },
          onPhaseChange,
        }),
      );

      act(() => {
        result.current.goToPrevPhase();
      });

      expect(onPhaseChange).toHaveBeenCalledWith(
        LESSON_PHASES.LISTEN,
        LESSON_PHASES.SING,
      );
    });

    it("does not call onPhaseChange when setting same phase", () => {
      const onPhaseChange = jest.fn();
      const { result } = renderHook(() =>
        useLessonExerciseState({
          phases: { startPhase: LESSON_PHASES.FOCUS_CARD },
          onPhaseChange,
        }),
      );

      act(() => {
        result.current.setPhase(LESSON_PHASES.FOCUS_CARD);
      });

      expect(onPhaseChange).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Playback State
  // ---------------------------------------------------------------------------
  describe("playback state", () => {
    it("initializes playback state correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentBeat).toBe(0);
      expect(result.current.isSubdivision).toBe(false);
    });

    it("updates playback state", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.setIsPlaying(true);
        result.current.setCurrentBeat(-4);
        result.current.setIsSubdivision(true);
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentBeat).toBe(-4);
      expect(result.current.isSubdivision).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // UI State
  // ---------------------------------------------------------------------------
  describe("UI state", () => {
    it("initializes UI state correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.showNotation).toBe(false);
      expect(result.current.showCursor).toBe(false);
      expect(result.current.hasHeardPattern).toBe(false);
    });

    it("resets showNotation when phase changes", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.setShowNotation(true);
      });
      expect(result.current.showNotation).toBe(true);

      act(() => {
        result.current.goToNextPhase();
      });
      expect(result.current.showNotation).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Sing Phase State
  // ---------------------------------------------------------------------------
  describe("sing phase state", () => {
    it("initializes sing state correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.singResult).toBeNull();
      expect(result.current.singAttempts).toBe(0);
    });

    it("tracks sing attempts", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.incrementSingAttempts();
        result.current.incrementSingAttempts();
      });
      expect(result.current.singAttempts).toBe(2);

      act(() => {
        result.current.resetSingAttempts();
      });
      expect(result.current.singAttempts).toBe(0);
    });

    it("stores sing result", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      const testResult = { success: true, pitchOk: true, rhythmOk: true };
      act(() => {
        result.current.setSingResult(testResult);
      });
      expect(result.current.singResult).toEqual(testResult);
    });
  });

  // ---------------------------------------------------------------------------
  // Play Phase State
  // ---------------------------------------------------------------------------
  describe("play phase state", () => {
    it("initializes play state correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.playResult).toBeNull();
      expect(result.current.playAttempts).toBe(0);
    });

    it("tracks play attempts", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.incrementPlayAttempts();
        result.current.incrementPlayAttempts();
        result.current.incrementPlayAttempts();
      });
      expect(result.current.playAttempts).toBe(3);

      act(() => {
        result.current.resetPlayAttempts();
      });
      expect(result.current.playAttempts).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Attestation State
  // ---------------------------------------------------------------------------
  describe("attestation state", () => {
    it("initializes attestation state correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.showAttestModal).toBe(false);
      expect(result.current.attestPhase).toBeNull();
    });

    it("opens attestation modal for sing phase", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.openAttestModal("sing");
      });

      expect(result.current.showAttestModal).toBe(true);
      expect(result.current.attestPhase).toBe("sing");
    });

    it("opens attestation modal for play phase", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.openAttestModal("play");
      });

      expect(result.current.showAttestModal).toBe(true);
      expect(result.current.attestPhase).toBe("play");
    });

    it("confirms sing attestation correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      // Set up some attempts first
      act(() => {
        result.current.incrementSingAttempts();
        result.current.incrementSingAttempts();
        result.current.incrementSingAttempts();
        result.current.openAttestModal("sing");
      });

      expect(result.current.singAttempts).toBe(3);

      act(() => {
        result.current.confirmAttestation();
      });

      expect(result.current.showAttestModal).toBe(false);
      expect(result.current.attestPhase).toBeNull();
      expect(result.current.singResult).toEqual({
        success: true,
        attested: true,
      });
      expect(result.current.singAttempts).toBe(0);
    });

    it("confirms play attestation correctly", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.incrementPlayAttempts();
      });

      act(() => {
        result.current.openAttestModal("play");
      });

      act(() => {
        result.current.confirmAttestation();
      });

      expect(result.current.playResult).toEqual({
        success: true,
        attested: true,
      });
      expect(result.current.playAttempts).toBe(0);
    });

    it("closes attestation modal without confirming", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.openAttestModal("sing");
      });
      expect(result.current.showAttestModal).toBe(true);

      act(() => {
        result.current.closeAttestModal();
      });

      expect(result.current.showAttestModal).toBe(false);
      expect(result.current.attestPhase).toBeNull();
      expect(result.current.singResult).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Success State
  // ---------------------------------------------------------------------------
  describe("success state", () => {
    it("tracks successful rounds", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.incrementSuccessfulRounds();
        result.current.incrementSuccessfulRounds();
      });
      expect(result.current.successfulRounds).toBe(2);

      act(() => {
        result.current.resetSuccessfulRounds();
      });
      expect(result.current.successfulRounds).toBe(0);
    });

    it("manages showSuccess state", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.showSuccess).toBe(false);

      act(() => {
        result.current.setShowSuccess(true);
      });
      expect(result.current.showSuccess).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Progress State (Multi-Pattern)
  // ---------------------------------------------------------------------------
  describe("progress state", () => {
    const testPatterns = [
      { id: "linear_up", name: "Linear Up", description: "1 → 2" },
      { id: "linear_down", name: "Linear Down", description: "2 → 1" },
      { id: "arc_up", name: "Arc Up", description: "1 → 2 → 1" },
      { id: "arc_down", name: "Arc Down", description: "2 → 1 → 2" },
    ];

    it("initializes progress state correctly", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      expect(result.current.progress.currentIndex).toBe(0);
      expect(result.current.progress.completedItems).toEqual({});
      expect(result.current.progress.totalItems).toBe(4);
      expect(result.current.progress.isComplete).toBe(false);
    });

    it("marks items as complete", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.markItemComplete("linear_up");
      });

      expect(result.current.progress.completedItems).toEqual({
        linear_up: true,
      });
    });

    it("goes to next item", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.markItemComplete("linear_up");
        result.current.goToNextItem();
      });

      expect(result.current.progress.currentIndex).toBe(1);
    });

    it("wraps around to first incomplete item when at end", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      // Complete items 1 and 3, leave 0 and 2 incomplete
      // Currently at index 0
      act(() => {
        result.current.goToItem(1);
        result.current.markItemComplete("linear_down");
        result.current.goToItem(3);
        result.current.markItemComplete("arc_down");
      });

      // Now at index 3 (last item, which is complete)
      // Go to next should wrap to first incomplete (index 0)
      act(() => {
        result.current.goToNextItem();
      });

      expect(result.current.progress.currentIndex).toBe(0);
    });

    it("finds next incomplete after current position first", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      // Complete first and last items
      act(() => {
        result.current.markItemComplete("linear_up");
        result.current.markItemComplete("arc_down");
      });

      // Start at index 0 (complete), go to next should find index 1 (incomplete)
      act(() => {
        result.current.goToNextItem();
      });

      expect(result.current.progress.currentIndex).toBe(1);
    });

    it("goes to specific item", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.goToItem(2);
      });

      expect(result.current.progress.currentIndex).toBe(2);
    });

    it("detects completion when all patterns done", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.markItemComplete("linear_up");
        result.current.markItemComplete("linear_down");
        result.current.markItemComplete("arc_up");
        result.current.markItemComplete("arc_down");
      });

      expect(result.current.progress.isComplete).toBe(true);
    });

    it("resets progress", () => {
      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.markItemComplete("linear_up");
        result.current.goToItem(2);
        result.current.resetProgress();
      });

      expect(result.current.progress.currentIndex).toBe(0);
      expect(result.current.progress.completedItems).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // Focus Card State
  // ---------------------------------------------------------------------------
  describe("focus card state", () => {
    it("provides default focus cards", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      expect(result.current.currentFocusCard).not.toBeNull();
      expect(result.current.currentFocusCard?.category).toBe("pitch");
    });

    it("rotates through focus cards", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      const firstCard = result.current.currentFocusCard;

      act(() => {
        result.current.rotateFocusCard();
      });

      const secondCard = result.current.currentFocusCard;
      expect(secondCard).not.toEqual(firstCard);
    });

    it("accepts custom focus cards", () => {
      const customCards = [
        {
          category: "custom",
          name: "Custom Focus",
          description: "Test",
          cue: "Test cue",
        },
      ];
      const { result } = renderHook(() =>
        useLessonExerciseState({ focusCards: customCards }),
      );

      expect(result.current.currentFocusCard?.category).toBe("custom");
    });
  });

  // ---------------------------------------------------------------------------
  // Combined Reset Functions
  // ---------------------------------------------------------------------------
  describe("reset functions", () => {
    it("resetForNewRound clears round-specific state", () => {
      const { result } = renderHook(() => useLessonExerciseState());

      act(() => {
        result.current.setSingResult({ success: true });
        result.current.setPlayResult({ success: true });
        result.current.setHasHeardPattern(true);
        result.current.setShowNotation(true);
        result.current.setShowCursor(true);
      });

      act(() => {
        result.current.resetForNewRound();
      });

      expect(result.current.singResult).toBeNull();
      expect(result.current.playResult).toBeNull();
      expect(result.current.hasHeardPattern).toBe(false);
      expect(result.current.showNotation).toBe(false);
      expect(result.current.showCursor).toBe(false);
    });

    it("resetAll clears everything", () => {
      const testPatterns = [
        { id: "test1", name: "Test 1", description: "Test" },
        { id: "test2", name: "Test 2", description: "Test" },
      ];

      const { result } = renderHook(() =>
        useLessonExerciseState({ patterns: testPatterns }),
      );

      act(() => {
        result.current.goToNextPhase();
        result.current.setSingResult({ success: true });
        result.current.incrementSingAttempts();
        result.current.incrementPlayAttempts();
        result.current.incrementSuccessfulRounds();
        result.current.markItemComplete("test1");
        result.current.goToItem(1);
        result.current.setShowSuccess(true);
        result.current.setIsPlaying(true);
      });

      act(() => {
        result.current.resetAll();
      });

      expect(result.current.phase).toBe(LESSON_PHASES.FOCUS_CARD);
      expect(result.current.singResult).toBeNull();
      expect(result.current.singAttempts).toBe(0);
      expect(result.current.playAttempts).toBe(0);
      expect(result.current.successfulRounds).toBe(0);
      expect(result.current.progress.currentIndex).toBe(0);
      expect(result.current.progress.completedItems).toEqual({});
      expect(result.current.showSuccess).toBe(false);
      expect(result.current.isPlaying).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  describe("refs", () => {
    it("provides scrollViewRef", () => {
      const { result } = renderHook(() => useLessonExerciseState());
      expect(result.current.scrollViewRef).toBeDefined();
      expect(result.current.scrollViewRef.current).toBeNull();
    });

    it("provides unmountedRef", () => {
      const { result } = renderHook(() => useLessonExerciseState());
      expect(result.current.unmountedRef).toBeDefined();
      expect(result.current.unmountedRef.current).toBe(false);
    });
  });
});
