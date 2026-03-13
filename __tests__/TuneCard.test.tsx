import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TuneCard, {
  TuneData,
} from "../src/screens/TuneMastery/components/TuneCard";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("TuneCard", () => {
  const mockTune: TuneData = {
    id: "tune-1",
    name: "Autumn Leaves",
    keys: {
      A: { score: 0, attempts: 0 },
      Bb: { score: 0, attempts: 0 },
      B: { score: 0, attempts: 0 },
      C: { score: 100, attempts: 5 },
      Db: { score: 0, attempts: 0 },
      D: { score: 80, attempts: 4 },
      Eb: { score: 0, attempts: 0 },
      E: { score: 0, attempts: 0 },
      F: { score: 0, attempts: 0 },
      Gb: { score: 0, attempts: 0 },
      G: { score: 95, attempts: 3 },
      Ab: { score: 0, attempts: 0 },
    },
    bpm: 120,
    timeSignature: "4/4",
    subdivision: 2,
  };

  const defaultProps = {
    tune: mockTune,
    isExpanded: false,
    onToggleExpand: jest.fn(),
    isFirst: false,
    isLast: false,
    onMoveUp: jest.fn(),
    onMoveDown: jest.fn(),
    onArchive: jest.fn(),
    onRename: jest.fn(),
    onUpdateSettings: jest.fn(),
    masteryThreshold: 95,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Collapsed State", () => {
    it("renders tune name", () => {
      const { getByText } = render(<TuneCard {...defaultProps} />);
      expect(getByText("Autumn Leaves")).toBeTruthy();
    });

    it("shows progress badge with mastered keys count", () => {
      const { getByText } = render(<TuneCard {...defaultProps} />);
      // 2 keys mastered (C=100, G=95)
      expect(getByText("2/12")).toBeTruthy();
    });

    it("shows collapsed icon when not expanded", () => {
      const { getByText } = render(<TuneCard {...defaultProps} />);
      expect(getByText("▶")).toBeTruthy();
    });

    it("shows expanded icon when expanded", () => {
      const { getByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );
      expect(getByText("▼")).toBeTruthy();
    });

    it("calls onToggleExpand when header is pressed", () => {
      const onToggleExpand = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} onToggleExpand={onToggleExpand} />,
      );

      const expandButton = getByRole("button", { name: /Autumn Leaves/i });
      fireEvent.press(expandButton);

      expect(onToggleExpand).toHaveBeenCalledTimes(1);
    });
  });

  describe("Reorder Buttons", () => {
    it("renders move up and move down buttons for non-archive tunes", () => {
      const { getByRole } = render(<TuneCard {...defaultProps} />);

      expect(getByRole("button", { name: /move up/i })).toBeTruthy();
      expect(getByRole("button", { name: /move down/i })).toBeTruthy();
    });

    it("calls onMoveUp when move up button is pressed", () => {
      const onMoveUp = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} onMoveUp={onMoveUp} />,
      );

      fireEvent.press(getByRole("button", { name: /move up/i }));
      expect(onMoveUp).toHaveBeenCalledTimes(1);
    });

    it("calls onMoveDown when move down button is pressed", () => {
      const onMoveDown = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} onMoveDown={onMoveDown} />,
      );

      fireEvent.press(getByRole("button", { name: /move down/i }));
      expect(onMoveDown).toHaveBeenCalledTimes(1);
    });

    it("disables move up button when isFirst is true", () => {
      const onMoveUp = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} isFirst={true} onMoveUp={onMoveUp} />,
      );

      const moveUpButton = getByRole("button", { name: /move up/i });
      fireEvent.press(moveUpButton);

      // Button should be disabled, so callback should not be called
      expect(onMoveUp).not.toHaveBeenCalled();
    });

    it("disables move down button when isLast is true", () => {
      const onMoveDown = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} isLast={true} onMoveDown={onMoveDown} />,
      );

      const moveDownButton = getByRole("button", { name: /move down/i });
      fireEvent.press(moveDownButton);

      // Button should be disabled, so callback should not be called
      expect(onMoveDown).not.toHaveBeenCalled();
    });

    it("hides reorder buttons for archive tunes", () => {
      const { queryByRole } = render(
        <TuneCard {...defaultProps} isArchive={true} />,
      );

      // Reorder buttons should not be present for archived tunes
      expect(queryByRole("button", { name: /move up/i })).toBeNull();
      expect(queryByRole("button", { name: /move down/i })).toBeNull();
    });
  });

  describe("Expanded State", () => {
    it("shows key badges when expanded", () => {
      const { getByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      // Should render KeyBadge showing key names
      expect(getByText("C")).toBeTruthy();
      expect(getByText("G")).toBeTruthy();
    });

    it("shows archive button when expanded for active tunes", () => {
      const { getByRole } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      expect(getByRole("button", { name: /archive tune/i })).toBeTruthy();
    });

    it("calls onArchive when archive button is pressed", () => {
      const onArchive = jest.fn();
      const { getByRole } = render(
        <TuneCard {...defaultProps} isExpanded={true} onArchive={onArchive} />,
      );

      fireEvent.press(getByRole("button", { name: /archive tune/i }));
      expect(onArchive).toHaveBeenCalledTimes(1);
    });
  });

  describe("Archive Mode", () => {
    it("shows restore and delete buttons for archived tunes", () => {
      const { getByRole } = render(
        <TuneCard {...defaultProps} isExpanded={true} isArchive={true} />,
      );

      expect(getByRole("button", { name: /restore tune/i })).toBeTruthy();
      expect(
        getByRole("button", { name: /delete tune permanently/i }),
      ).toBeTruthy();
    });

    it("calls onRestore when restore button is pressed", () => {
      const onRestore = jest.fn();
      const { getByRole } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          isArchive={true}
          onRestore={onRestore}
        />,
      );

      fireEvent.press(getByRole("button", { name: /restore tune/i }));
      expect(onRestore).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete when delete button is pressed", () => {
      const onDelete = jest.fn();
      const { getByRole } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          isArchive={true}
          onDelete={onDelete}
        />,
      );

      fireEvent.press(
        getByRole("button", { name: /delete tune permanently/i }),
      );
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("has accessible header with tune info", () => {
      const { getByRole } = render(<TuneCard {...defaultProps} />);

      const header = getByRole("button", {
        name: /Autumn Leaves, 2 of 12 keys mastered/i,
      });
      expect(header).toBeTruthy();
    });

    it("provides expand hint when collapsed", () => {
      const { getByRole } = render(
        <TuneCard {...defaultProps} isExpanded={false} />,
      );

      const header = getByRole("button", { name: /Autumn Leaves/i });
      expect(header.props.accessibilityHint).toBe("Expand to see key scores");
    });

    it("provides collapse hint when expanded", () => {
      const { getByRole } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      const header = getByRole("button", { name: /Autumn Leaves/i });
      expect(header.props.accessibilityHint).toBe("Collapse");
    });
  });

  describe("Progress Calculation", () => {
    it("calculates correct mastered count with custom threshold", () => {
      const { getByText } = render(
        <TuneCard {...defaultProps} masteryThreshold={80} />,
      );
      // With threshold 80: C=100, G=95, D=80 are mastered
      expect(getByText("3/12")).toBeTruthy();
    });

    it("shows 0/12 when no keys are mastered", () => {
      const emptyTune: TuneData = {
        id: "tune-2",
        name: "Empty Tune",
        keys: {},
      };
      const { getByText } = render(
        <TuneCard {...defaultProps} tune={emptyTune} />,
      );
      expect(getByText("0/12")).toBeTruthy();
    });

    it("shows 12/12 when all keys are mastered", () => {
      const masteredTune: TuneData = {
        id: "tune-3",
        name: "Mastered Tune",
        keys: {
          A: { score: 100, attempts: 5 },
          Bb: { score: 100, attempts: 5 },
          B: { score: 100, attempts: 5 },
          C: { score: 100, attempts: 5 },
          Db: { score: 100, attempts: 5 },
          D: { score: 100, attempts: 5 },
          Eb: { score: 100, attempts: 5 },
          E: { score: 100, attempts: 5 },
          F: { score: 100, attempts: 5 },
          Gb: { score: 100, attempts: 5 },
          G: { score: 100, attempts: 5 },
          Ab: { score: 100, attempts: 5 },
        },
      };
      const { getByText } = render(
        <TuneCard {...defaultProps} tune={masteredTune} />,
      );
      expect(getByText("12/12")).toBeTruthy();
    });
  });

  describe("Settings Section", () => {
    it("shows tempo settings when expanded", () => {
      const { getByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      expect(getByText("BPM")).toBeTruthy();
      expect(getByText("Time")).toBeTruthy();
      expect(getByText("Sub")).toBeTruthy();
    });

    it("hides tempo settings for archived tunes", () => {
      const { queryByText, getByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} isArchive={true} />,
      );

      // Key grid should still show (key name is shown in KeyBadge)
      expect(getByText("C")).toBeTruthy();
      // But tempo section should not
      expect(queryByText("BPM")).toBeNull();
    });
  });

  describe("BPM Settings", () => {
    it("calls onUpdateSettings when BPM is changed", () => {
      const onUpdateSettings = jest.fn();
      const { getByDisplayValue } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      const bpmInput = getByDisplayValue("120");
      fireEvent.changeText(bpmInput, "140");
      fireEvent(bpmInput, "blur");

      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 140 });
    });

    it("handles empty BPM value", () => {
      const onUpdateSettings = jest.fn();
      const { getByDisplayValue } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      const bpmInput = getByDisplayValue("120");
      fireEvent.changeText(bpmInput, "");
      fireEvent(bpmInput, "blur");

      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: null });
    });

    it("does not call onUpdateSettings when BPM unchanged", () => {
      const onUpdateSettings = jest.fn();
      const { getByDisplayValue } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      const bpmInput = getByDisplayValue("120");
      fireEvent.changeText(bpmInput, "120");
      fireEvent(bpmInput, "blur");

      expect(onUpdateSettings).not.toHaveBeenCalled();
    });

    it("decreases BPM by 5 when -5 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease BPM by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 115 });
    });

    it("decreases BPM by 1 when -1 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease BPM by 1"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 119 });
    });

    it("increases BPM by 1 when +1 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase BPM by 1"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 121 });
    });

    it("increases BPM by 5 when +5 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase BPM by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 125 });
    });

    it("clamps BPM to minimum of 20", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithLowBpm = { ...mockTune, bpm: 22 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithLowBpm}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease BPM by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 20 });
    });

    it("clamps BPM to maximum of 350", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHighBpm = { ...mockTune, bpm: 348 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHighBpm}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase BPM by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 350 });
    });
  });

  describe("Tap Tempo", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("renders tap tempo button", () => {
      const { getByLabelText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      expect(getByLabelText("Tap tempo")).toBeTruthy();
    });

    it("calculates BPM from multiple taps", () => {
      const onUpdateSettings = jest.fn();
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      const tapButton = getByLabelText("Tap tempo");

      // Tap at 120 BPM (500ms intervals)
      jest.setSystemTime(0);
      fireEvent.press(tapButton);

      jest.setSystemTime(500);
      fireEvent.press(tapButton);

      // After 2 taps, should calculate BPM
      expect(onUpdateSettings).toHaveBeenCalledWith({ bpm: 120 });
    });

    it("has correct accessibility hint for tap tempo", () => {
      const { getByLabelText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      const tapButton = getByLabelText("Tap tempo");
      expect(tapButton.props.accessibilityHint).toBe(
        "Tap repeatedly to set tempo",
      );
    });
  });

  describe("Concert A (Hz) Settings", () => {
    it("shows aHertz input when expanded", () => {
      const tuneWithHz = { ...mockTune, aHertz: 442 };
      const { getByDisplayValue, getByText } = render(
        <TuneCard {...defaultProps} tune={tuneWithHz} isExpanded={true} />,
      );

      expect(getByText("A=")).toBeTruthy();
      expect(getByDisplayValue("442")).toBeTruthy();
      expect(getByText("Hz")).toBeTruthy();
    });

    it("calls onUpdateSettings when Hz is changed via input", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHz = { ...mockTune, aHertz: 440 };
      const { getByDisplayValue } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      const hzInput = getByDisplayValue("440");
      fireEvent.changeText(hzInput, "442");
      fireEvent(hzInput, "blur");

      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 442 });
    });

    it("decreases Hz by 5 when -5 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHz = { ...mockTune, aHertz: 440 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease Hz by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 435 });
    });

    it("decreases Hz by 1 when -1 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHz = { ...mockTune, aHertz: 440 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease Hz by 1"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 439 });
    });

    it("increases Hz by 1 when +1 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHz = { ...mockTune, aHertz: 440 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase Hz by 1"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 441 });
    });

    it("increases Hz by 5 when +5 button is pressed", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHz = { ...mockTune, aHertz: 440 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase Hz by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 445 });
    });

    it("clamps Hz to minimum of 400", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithLowHz = { ...mockTune, aHertz: 402 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithLowHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Decrease Hz by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 400 });
    });

    it("clamps Hz to maximum of 480", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithHighHz = { ...mockTune, aHertz: 478 };
      const { getByLabelText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithHighHz}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByLabelText("Increase Hz by 5"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ aHertz: 480 });
    });

    it("defaults to 440 Hz when aHertz is not set", () => {
      const { getByDisplayValue } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      expect(getByDisplayValue("440")).toBeTruthy();
    });
  });

  describe("Pitch System Settings", () => {
    it("shows pitch system options when expanded", () => {
      const { getByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      expect(getByText("Pitch")).toBeTruthy();
      expect(getByText("Equal")).toBeTruthy();
      expect(getByText("Just")).toBeTruthy();
    });

    it("calls onUpdateSettings when pitch system is changed to equal", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithJust = { ...mockTune, pitchSystem: "just" as const };
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithJust}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByText("Equal"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ pitchSystem: "equal" });
    });

    it("calls onUpdateSettings when pitch system is changed to just", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithEqual = { ...mockTune, pitchSystem: "equal" as const };
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithEqual}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByText("Just"));
      expect(onUpdateSettings).toHaveBeenCalledWith({ pitchSystem: "just" });
    });

    it("does not call onUpdateSettings when same pitch system selected", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithJust = { ...mockTune, pitchSystem: "just" as const };
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithJust}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      fireEvent.press(getByText("Just"));
      expect(onUpdateSettings).not.toHaveBeenCalled();
    });

    it("defaults to just temperament when pitchSystem not set", () => {
      const { getByText, getAllByText } = render(
        <TuneCard {...defaultProps} isExpanded={true} />,
      );

      // Just should be the active option (styled differently)
      const justButtons = getAllByText("Just");
      expect(justButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Time Signature Settings", () => {
    it("calls onUpdateSettings when time signature is changed", () => {
      const onUpdateSettings = jest.fn();
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      // Default is 4/4, tap 3/4
      fireEvent.press(getByText("3/4"));

      expect(onUpdateSettings).toHaveBeenCalledWith({ timeSignature: "3/4" });
    });

    it("does not call onUpdateSettings when same time signature selected", () => {
      const onUpdateSettings = jest.fn();
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      // Tap current time signature (4/4)
      fireEvent.press(getByText("4/4"));

      expect(onUpdateSettings).not.toHaveBeenCalled();
    });
  });

  describe("Subdivision Settings", () => {
    it("calls onUpdateSettings when subdivision is changed", () => {
      const onUpdateSettings = jest.fn();
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      // Default is 2, tap 4
      fireEvent.press(getByText("4"));

      expect(onUpdateSettings).toHaveBeenCalledWith({ subdivision: 4 });
    });

    it("does not call onUpdateSettings when same subdivision selected", () => {
      const onUpdateSettings = jest.fn();
      const tuneWithSub = { ...mockTune, subdivision: 4 };
      const { getByText } = render(
        <TuneCard
          {...defaultProps}
          tune={tuneWithSub}
          isExpanded={true}
          onUpdateSettings={onUpdateSettings}
        />,
      );

      // Tap current subdivision (4)
      fireEvent.press(getByText("4"));

      expect(onUpdateSettings).not.toHaveBeenCalled();
    });
  });

  describe("Rename Flow", () => {
    it("enters edit mode on long press", () => {
      const { getByLabelText, getByDisplayValue } = render(
        <TuneCard {...defaultProps} />,
      );

      const expandButton = getByLabelText(/Autumn Leaves/);
      fireEvent(expandButton, "longPress");

      // Should show text input with tune name as value
      expect(getByDisplayValue("Autumn Leaves")).toBeTruthy();
    });

    it("does not enter edit mode for archived tunes", () => {
      const { getByLabelText, getByText } = render(
        <TuneCard {...defaultProps} isArchive={true} />,
      );

      const expandButton = getByLabelText(/Autumn Leaves/);
      fireEvent(expandButton, "longPress");

      // Should still show text (not input)
      expect(getByText("Autumn Leaves")).toBeTruthy();
    });

    it("does not enter edit mode when onRename not provided", () => {
      const { getByLabelText, getByText } = render(
        <TuneCard {...defaultProps} onRename={undefined} />,
      );

      const expandButton = getByLabelText(/Autumn Leaves/);
      fireEvent(expandButton, "longPress");

      // Should still show text (not input)
      expect(getByText("Autumn Leaves")).toBeTruthy();
    });

    it("calls onRename with new name when changed", () => {
      const onRename = jest.fn();
      const { getByLabelText, getByDisplayValue } = render(
        <TuneCard {...defaultProps} onRename={onRename} />,
      );

      // Enter edit mode
      fireEvent(getByLabelText(/Autumn Leaves/), "longPress");

      // Change name and submit
      const input = getByDisplayValue("Autumn Leaves");
      fireEvent.changeText(input, "New Name");
      fireEvent(input, "submitEditing");

      expect(onRename).toHaveBeenCalledWith("New Name");
    });

    it("does not call onRename when name unchanged", () => {
      const onRename = jest.fn();
      const { getByLabelText, getByDisplayValue } = render(
        <TuneCard {...defaultProps} onRename={onRename} />,
      );

      // Enter edit mode
      fireEvent(getByLabelText(/Autumn Leaves/), "longPress");

      // Submit without changing
      const input = getByDisplayValue("Autumn Leaves");
      fireEvent(input, "submitEditing");

      expect(onRename).not.toHaveBeenCalled();
    });

    it("does not call onRename when name is empty", () => {
      const onRename = jest.fn();
      const { getByLabelText, getByDisplayValue } = render(
        <TuneCard {...defaultProps} onRename={onRename} />,
      );

      // Enter edit mode
      fireEvent(getByLabelText(/Autumn Leaves/), "longPress");

      // Clear name and submit
      const input = getByDisplayValue("Autumn Leaves");
      fireEvent.changeText(input, "   ");
      fireEvent(input, "submitEditing");

      expect(onRename).not.toHaveBeenCalled();
    });
  });
});
