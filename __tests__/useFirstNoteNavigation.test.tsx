/**
 * Tests for FirstNote navigation hook
 */
import { renderHook, act } from "@testing-library/react-native";
import useFirstNoteNavigation from "../src/screens/FirstNote/hooks/useFirstNoteNavigation";

// Mock API client
jest.mock("../src/api/client", () => ({
  getBackendUrl: () => "http://test-backend.com",
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

describe("useFirstNoteNavigation", () => {
  const mockSetStage = jest.fn();
  const mockSetSubStep = jest.fn();
  const mockSetFocusCardIndex = jest.fn();
  const mockSetFocusCardRatings = jest.fn();
  const mockSetFocusStepsDone = jest.fn();
  const mockSetPitchAccuracy = jest.fn();
  const mockNavigation = {
    replace: jest.fn(),
  };

  const defaultProps = {
    userId: "user-123",
    instrumentId: "instr-456",
    skippableStages: [],
    stage: 0,
    setStage: mockSetStage,
    setSubStep: mockSetSubStep,
    setFocusCardIndex: mockSetFocusCardIndex,
    setFocusCardRatings: mockSetFocusCardRatings,
    setFocusStepsDone: mockSetFocusStepsDone,
    setPitchAccuracy: mockSetPitchAccuracy,
    navigation: mockNavigation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  describe("saveProgress", () => {
    it("saves progress with instrument endpoint", async () => {
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      await act(async () => {
        await result.current.saveProgress(3);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-backend.com/users/user-123/instruments/instr-456",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_stage: 3 }),
        },
      );
    });

    it("saves progress without instrument endpoint", async () => {
      const propsNoInstrument = { ...defaultProps, instrumentId: null };
      const { result } = renderHook(() =>
        useFirstNoteNavigation(propsNoInstrument),
      );

      await act(async () => {
        await result.current.saveProgress(3);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-backend.com/users/user-123",
        expect.any(Object),
      );
    });

    it("handles save error gracefully", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      await act(async () => {
        await result.current.saveProgress(3);
      });

      // Should not throw
    });
  });

  describe("completeDay0", () => {
    it("completes day 0 and navigates to Home by default", async () => {
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      await act(async () => {
        await result.current.completeDay0();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-backend.com/users/user-123/instruments/instr-456",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day0_completed: true, day0_stage: 7 }),
        },
      );
      expect(mockNavigation.replace).toHaveBeenCalledWith("Home");
    });

    it("navigates to custom destination", async () => {
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      await act(async () => {
        await result.current.completeDay0("Practice");
      });

      expect(mockNavigation.replace).toHaveBeenCalledWith("Practice");
    });

    it("navigates on error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      await act(async () => {
        await result.current.completeDay0("Home");
      });

      expect(mockNavigation.replace).toHaveBeenCalledWith("Home");
    });

    it("uses user endpoint without instrumentId", async () => {
      const propsNoInstrument = { ...defaultProps, instrumentId: null };
      const { result } = renderHook(() =>
        useFirstNoteNavigation(propsNoInstrument),
      );

      await act(async () => {
        await result.current.completeDay0();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://test-backend.com/users/user-123",
        expect.any(Object),
      );
    });
  });

  describe("nextStage", () => {
    it("advances to next stage", () => {
      const { result } = renderHook(() =>
        useFirstNoteNavigation({ ...defaultProps, stage: 2 }),
      );

      act(() => {
        result.current.nextStage();
      });

      expect(mockSetStage).toHaveBeenCalledWith(3);
      expect(mockSetSubStep).toHaveBeenCalledWith(0);
      expect(mockSetFocusCardIndex).toHaveBeenCalledWith(0);
      expect(mockSetFocusCardRatings).toHaveBeenCalledWith([]);
      expect(mockSetFocusStepsDone).toHaveBeenCalledWith({
        listen: false,
        sing: false,
        imagine: false,
        play: false,
      });
      expect(mockSetPitchAccuracy).toHaveBeenCalledWith(null);
    });

    it("skips stages in skippableStages", () => {
      const { result } = renderHook(() =>
        useFirstNoteNavigation({
          ...defaultProps,
          stage: 2,
          skippableStages: [3, 4],
        }),
      );

      act(() => {
        result.current.nextStage();
      });

      expect(mockSetStage).toHaveBeenCalledWith(5);
    });

    it("sets subStep to 2 for stage 1", () => {
      const { result } = renderHook(() =>
        useFirstNoteNavigation({ ...defaultProps, stage: 0 }),
      );

      act(() => {
        result.current.nextStage();
      });

      expect(mockSetStage).toHaveBeenCalledWith(1);
      expect(mockSetSubStep).toHaveBeenCalledWith(2);
    });

    it("stops at stage 7", () => {
      const { result } = renderHook(() =>
        useFirstNoteNavigation({
          ...defaultProps,
          stage: 6,
          skippableStages: [7, 8, 9], // try to skip past 7
        }),
      );

      act(() => {
        result.current.nextStage();
      });

      expect(mockSetStage).toHaveBeenCalledWith(7);
    });
  });

  describe("goBackTeaching", () => {
    it("navigates to target stage and substep", () => {
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      act(() => {
        result.current.goBackTeaching(3, 1);
      });

      expect(mockSetStage).toHaveBeenCalledWith(3);
      expect(mockSetSubStep).toHaveBeenCalledWith(1);
    });
  });

  describe("return values", () => {
    it("returns all expected functions", () => {
      const { result } = renderHook(() => useFirstNoteNavigation(defaultProps));

      expect(result.current.saveProgress).toBeInstanceOf(Function);
      expect(result.current.completeDay0).toBeInstanceOf(Function);
      expect(result.current.nextStage).toBeInstanceOf(Function);
      expect(result.current.goBackTeaching).toBeInstanceOf(Function);
    });
  });
});
