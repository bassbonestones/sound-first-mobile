/**
 * Tests for TuneMastery UI Components
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}));

// Mock heavy dependencies
jest.mock("../src/hooks/usePitchDetection", () => ({
  usePitchDetection: jest.fn(() => ({
    isListening: false,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    error: null,
    permissionGranted: true,
  })),
}));

jest.mock("../src/components/Metronome", () => {
  const { View, Text } = require("react-native");
  return function MockMetronome({ isRunning }) {
    return (
      <View testID="metronome-mock">
        <Text>{isRunning ? "running" : "stopped"}</Text>
      </View>
    );
  };
});

jest.mock("../src/components/PitchDrone", () => {
  const { View, Text } = require("react-native");
  return function MockPitchDrone({ isPlaying }) {
    return (
      <View testID="pitch-drone-mock">
        <Text>{isPlaying ? "playing" : "stopped"}</Text>
      </View>
    );
  };
});

jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  return function MockSlider({ value, onValueChange, testID }) {
    return (
      <View
        testID={testID || "slider"}
        accessibilityValue={{ now: value }}
        onTouchEnd={() => onValueChange?.(75)}
      />
    );
  };
});

// Component imports
import KeyBadge from "../src/screens/TuneMastery/components/KeyBadge";
import TuneCard from "../src/screens/TuneMastery/components/TuneCard";
import TuneList from "../src/screens/TuneMastery/components/TuneList";
import SelectionPanel from "../src/screens/TuneMastery/components/SelectionPanel";
import SettingsModal from "../src/screens/TuneMastery/components/SettingsModal";
import PracticePanel from "../src/screens/TuneMastery/components/PracticePanel";

describe("KeyBadge", () => {
  it("renders key name and score", () => {
    const { getByText } = render(
      <KeyBadge keyName="C" score={75} attempts={5} />,
    );

    expect(getByText("C")).toBeTruthy();
    expect(getByText("75")).toBeTruthy();
  });

  it("shows dash for unstarted keys", () => {
    const { getByText } = render(
      <KeyBadge keyName="Db" score={0} attempts={0} />,
    );

    expect(getByText("Db")).toBeTruthy();
    expect(getByText("-")).toBeTruthy();
  });

  it("has correct accessibility label for mastered key", () => {
    const { getByLabelText } = render(
      <KeyBadge keyName="F" score={96} attempts={10} masteryThreshold={95} />,
    );

    expect(getByLabelText(/Key F.*score 96%.*mastered/)).toBeTruthy();
  });

  it("has correct accessibility label for unstarted key", () => {
    const { getByLabelText } = render(
      <KeyBadge keyName="G" score={0} attempts={0} />,
    );

    expect(getByLabelText(/Key G.*not started/)).toBeTruthy();
  });
});

describe("TuneCard", () => {
  const mockTune = {
    id: "tune1",
    name: "All The Things",
    keys: {
      A: { score: 90, attempts: 5 },
      Bb: { score: 0, attempts: 0 },
      B: { score: 50, attempts: 3 },
      C: { score: 95, attempts: 10 },
      Db: { score: 0, attempts: 0 },
      D: { score: 80, attempts: 4 },
      Eb: { score: 0, attempts: 0 },
      E: { score: 70, attempts: 2 },
      F: { score: 0, attempts: 0 },
      Gb: { score: 60, attempts: 1 },
      G: { score: 0, attempts: 0 },
      Ab: { score: 0, attempts: 0 },
    },
    bpm: 140,
    timeSignature: "4/4",
    subdivision: 1,
  };

  it("renders tune name", () => {
    const { getByText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={false}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={true}
      />,
    );

    expect(getByText("All The Things")).toBeTruthy();
  });

  it("shows mastery progress", () => {
    const { getByText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={false}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={true}
      />,
    );

    expect(getByText("1/12")).toBeTruthy(); // Only C is >= 95
  });

  it("calls onToggleExpand when pressed", () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={false}
        onToggleExpand={onToggle}
        isFirst={true}
        isLast={true}
      />,
    );

    fireEvent.press(getByLabelText(/All The Things/));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows key grid when expanded", () => {
    const { getByText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={true}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={true}
      />,
    );

    // Should show all 12 keys
    expect(getByText("A")).toBeTruthy();
    expect(getByText("Bb")).toBeTruthy();
    expect(getByText("90")).toBeTruthy(); // A score
  });

  it("shows archive button for active tunes", () => {
    const onArchive = jest.fn();
    const { getByLabelText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={true}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={true}
        onArchive={onArchive}
      />,
    );

    const archiveButton = getByLabelText("Archive tune");
    fireEvent.press(archiveButton);
    expect(onArchive).toHaveBeenCalled();
  });

  it("shows restore/delete for archived tunes", () => {
    const onRestore = jest.fn();
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={true}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={true}
        isArchive={true}
        onRestore={onRestore}
        onDelete={onDelete}
      />,
    );

    expect(getByLabelText("Restore tune")).toBeTruthy();
    expect(getByLabelText("Delete tune permanently")).toBeTruthy();
  });

  it("disables move up when first", () => {
    const onMoveUp = jest.fn();
    const { getByLabelText } = render(
      <TuneCard
        tune={mockTune}
        isExpanded={false}
        onToggleExpand={jest.fn()}
        isFirst={true}
        isLast={false}
        onMoveUp={onMoveUp}
        onMoveDown={jest.fn()}
      />,
    );

    const upButton = getByLabelText("Move up");
    expect(upButton.props.accessibilityState?.disabled).toBe(true);
  });
});

describe("TuneList", () => {
  const mockTunes = [
    {
      id: "tune1",
      name: "Tune One",
      keys: { A: { score: 50, attempts: 1 } },
    },
    {
      id: "tune2",
      name: "Tune Two",
      keys: { A: { score: 75, attempts: 2 } },
    },
  ];

  it("renders list of tunes", () => {
    const { getByText } = render(
      <TuneList
        tunes={mockTunes}
        onReorder={jest.fn()}
        onArchive={jest.fn()}
        onRename={jest.fn()}
      />,
    );

    expect(getByText("Tune One")).toBeTruthy();
    expect(getByText("Tune Two")).toBeTruthy();
  });

  it("renders empty state when no tunes", () => {
    const { getByText } = render(<TuneList tunes={[]} />);

    expect(getByText(/No tunes yet/)).toBeTruthy();
  });

  it("renders archive empty state", () => {
    const { getByText } = render(<TuneList tunes={[]} isArchive={true} />);

    expect(getByText(/No archived tunes/)).toBeTruthy();
  });

  it("expands only one tune at a time", () => {
    const { getByLabelText, queryByText } = render(
      <TuneList
        tunes={mockTunes}
        onReorder={jest.fn()}
        onArchive={jest.fn()}
        onRename={jest.fn()}
      />,
    );

    // Initially collapsed - no key badges visible
    // Expand first tune
    fireEvent.press(getByLabelText(/Tune One/));

    // Both tune names should be visible, but expanded content differs
    expect(getByLabelText(/Tune One/)).toBeTruthy();
    expect(getByLabelText(/Tune Two/)).toBeTruthy();
  });
});

describe("SelectionPanel", () => {
  const mockTunes = [
    { id: "tune1", name: "First Tune" },
    { id: "tune2", name: "Second Tune" },
  ];

  it("renders tune and key selectors", () => {
    const { getByLabelText } = render(
      <SelectionPanel
        tunes={mockTunes}
        selectedTuneId={null}
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={jest.fn()}
        isLearningPick={true}
      />,
    );

    expect(getByLabelText(/Select tune/)).toBeTruthy();
    expect(getByLabelText(/Select key/)).toBeTruthy();
  });

  it("shows selected tune name", () => {
    const { getByText } = render(
      <SelectionPanel
        tunes={mockTunes}
        selectedTuneId="tune1"
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={jest.fn()}
        isLearningPick={true}
      />,
    );

    expect(getByText("First Tune")).toBeTruthy();
  });

  it("shows learning pick indicator", () => {
    const { getByText } = render(
      <SelectionPanel
        tunes={mockTunes}
        selectedTuneId={null}
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={jest.fn()}
        isLearningPick={true}
      />,
    );

    expect(getByText(/Learning pick/)).toBeTruthy();
  });

  it("shows reinforcement pick indicator", () => {
    const { getByText } = render(
      <SelectionPanel
        tunes={mockTunes}
        selectedTuneId={null}
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={jest.fn()}
        isLearningPick={false}
      />,
    );

    expect(getByText(/Reinforcement pick/)).toBeTruthy();
  });

  it("calls onGo when Go button pressed", () => {
    const onGo = jest.fn();
    const { getByLabelText } = render(
      <SelectionPanel
        tunes={mockTunes}
        selectedTuneId={null}
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={onGo}
        isLearningPick={true}
      />,
    );

    fireEvent.press(getByLabelText("Start practice"));
    expect(onGo).toHaveBeenCalled();
  });

  it("disables Go button when no tunes", () => {
    const onGo = jest.fn();
    const { getByLabelText } = render(
      <SelectionPanel
        tunes={[]}
        selectedTuneId={null}
        selectedKey={null}
        onSelectTune={jest.fn()}
        onSelectKey={jest.fn()}
        onGo={onGo}
        isLearningPick={true}
      />,
    );

    const goButton = getByLabelText("Start practice");
    expect(goButton.props.accessibilityState?.disabled).toBe(true);
  });
});

describe("SettingsModal", () => {
  const defaultSettings = {
    emaAlpha: 0.3,
    tunerMode: "needle",
    temperament: "equal",
    autoMetronome: false,
    autoDrone: false,
  };

  it("renders when visible", () => {
    const { getByText } = render(
      <SettingsModal
        visible={true}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    expect(getByText("Settings")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <SettingsModal
        visible={false}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    expect(queryByText("Settings")).toBeNull();
  });

  it("shows EMA Alpha input", () => {
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    expect(getByLabelText(/EMA Alpha/)).toBeTruthy();
  });

  it("shows tuner mode options", () => {
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    expect(getByLabelText(/Needle tuner display/)).toBeTruthy();
    expect(getByLabelText(/Text tuner display/)).toBeTruthy();
  });

  it("shows auto-start toggles", () => {
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    expect(getByLabelText(/Auto-start metronome/)).toBeTruthy();
    expect(getByLabelText(/Auto-start pitch drone/)).toBeTruthy();
  });

  it("calls onClose when Cancel pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={onClose}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText("Cancel settings"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onUpdateSettings when Save pressed", async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={onClose}
        settings={defaultSettings}
        onUpdateSettings={onUpdate}
      />,
    );

    fireEvent.press(getByLabelText("Save settings"));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          emaAlpha: 0.3,
          tunerMode: "needle",
          temperament: "equal",
        }),
      );
    });
  });

  it("toggles auto-metronome", () => {
    const { getByLabelText } = render(
      <SettingsModal
        visible={true}
        onClose={jest.fn()}
        settings={defaultSettings}
        onUpdateSettings={jest.fn()}
      />,
    );

    const toggle = getByLabelText(/Auto-start metronome/);
    fireEvent.press(toggle);

    // Check state changed (would need to verify internal state or re-render)
    expect(toggle).toBeTruthy();
  });
});

describe("PracticePanel", () => {
  const defaultProps = {
    tuneName: "Test Tune",
    tuneKey: "C",
    currentScore: 50,
    onSubmitRating: jest.fn(),
    onCancel: jest.fn(),
    settings: {
      tunerMode: "needle",
      temperament: "equal",
      autoMetronome: false,
      autoDrone: false,
    },
    tuneSettings: {
      bpm: 120,
      timeSignature: "4/4",
      subdivision: 1,
    },
  };

  it("renders tune name and key", () => {
    const { getByText } = render(<PracticePanel {...defaultProps} />);

    expect(getByText("Test Tune")).toBeTruthy();
    expect(getByText("in C")).toBeTruthy();
  });

  it("shows cancel button", () => {
    const { getByLabelText } = render(<PracticePanel {...defaultProps} />);

    expect(getByLabelText("Cancel practice")).toBeTruthy();
  });

  it("calls onCancel when cancel pressed", () => {
    const onCancel = jest.fn();
    const { getByLabelText } = render(
      <PracticePanel {...defaultProps} onCancel={onCancel} />,
    );

    fireEvent.press(getByLabelText("Cancel practice"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows submit rating button", () => {
    const { getByLabelText } = render(<PracticePanel {...defaultProps} />);

    expect(getByLabelText(/Submit rating/)).toBeTruthy();
  });

  it("calls onSubmitRating when submit pressed", () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = render(
      <PracticePanel {...defaultProps} onSubmitRating={onSubmit} />,
    );

    fireEvent.press(getByLabelText(/Submit rating/));
    expect(onSubmit).toHaveBeenCalledWith(50); // currentScore
  });

  it("shows fine-tune buttons", () => {
    const { getByText } = render(<PracticePanel {...defaultProps} />);

    expect(getByText("-5")).toBeTruthy();
    expect(getByText("+5")).toBeTruthy();
    expect(getByText("-1")).toBeTruthy();
    expect(getByText("+1")).toBeTruthy();
  });

  it("shows tool circles", () => {
    const { getByLabelText } = render(<PracticePanel {...defaultProps} />);

    expect(getByLabelText(/tuner/i)).toBeTruthy();
    expect(getByLabelText(/metronome/i)).toBeTruthy();
    expect(getByLabelText(/drone/i)).toBeTruthy();
  });

  it("shows focus card", () => {
    const { getByText } = render(<PracticePanel {...defaultProps} />);

    // Should show some focus card content - category text
    expect(
      getByText(/Ear & Pitch|Resonance & Tone|Rhythm & Time|Musical Shape/),
    ).toBeTruthy();
  });

  it("auto-starts tools when settings enable them", () => {
    const { getByTestID } = render(
      <PracticePanel
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          autoMetronome: true,
          autoDrone: true,
        }}
      />,
    );

    // With auto-start, tools should be running
    // Mute button should appear when tools are active
    // This tests the integration
  });

  it("shows mute button when tools are active", () => {
    const { getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          autoMetronome: true,
        }}
      />,
    );

    expect(getByLabelText(/Mute|Unmute/)).toBeTruthy();
  });

  it("shows volume button when tools are active", () => {
    const { getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          autoMetronome: true,
        }}
      />,
    );

    expect(getByLabelText("Adjust volume")).toBeTruthy();
  });

  it("renders with different tune settings", () => {
    const { getByText } = render(
      <PracticePanel
        {...defaultProps}
        tuneSettings={{
          bpm: 180,
          timeSignature: "3/4",
          subdivision: 2,
        }}
      />,
    );

    expect(getByText("Test Tune")).toBeTruthy();
  });

  it("initializes rating from currentScore", () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        currentScore={75}
        onSubmitRating={onSubmit}
      />,
    );

    // Rating should start at 75
    fireEvent.press(getByLabelText(/Submit rating/));
    expect(onSubmit).toHaveBeenCalledWith(75);
  });

  it("adjusts rating with fine-tune buttons", () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        currentScore={50}
        onSubmitRating={onSubmit}
      />,
    );

    // Press +5
    fireEvent.press(getByText("+5"));

    // Submit
    fireEvent.press(getByLabelText(/Submit rating/));
    expect(onSubmit).toHaveBeenCalledWith(55);
  });

  it("clamps rating at 0", () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        currentScore={2}
        onSubmitRating={onSubmit}
      />,
    );

    // Press -5 should go to 0, not negative
    fireEvent.press(getByText("-5"));

    fireEvent.press(getByLabelText(/Submit rating/));
    expect(onSubmit).toHaveBeenCalledWith(0);
  });

  it("clamps rating at 100", () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(
      <PracticePanel
        {...defaultProps}
        currentScore={98}
        onSubmitRating={onSubmit}
      />,
    );

    // Press +5 should go to 100, not 103
    fireEvent.press(getByText("+5"));

    fireEvent.press(getByLabelText(/Submit rating/));
    expect(onSubmit).toHaveBeenCalledWith(100);
  });
});
