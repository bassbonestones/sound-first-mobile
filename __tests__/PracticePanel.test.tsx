import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PracticePanel from "../src/screens/TuneMastery/components/PracticePanel";

// Mock the audio components
jest.mock("../src/components/Metronome", () => {
  const { View, Text } = require("react-native");
  return function MockMetronome(props: any) {
    return (
      <View testID="mock-metronome">
        <Text>Metronome BPM: {props.initialBpm}</Text>
        <Text>Muted: {props.muted ? "Yes" : "No"}</Text>
      </View>
    );
  };
});

jest.mock("../src/components/PitchDrone", () => {
  const { View, Text } = require("react-native");
  return function MockPitchDrone(props: any) {
    return (
      <View testID="mock-drone">
        <Text>Drone Note: {props.initialNote}</Text>
        <Text>Muted: {props.muted ? "Yes" : "No"}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/TuneMastery/components/Tuner", () => {
  const { View, Text } = require("react-native");
  return function MockTuner(props: any) {
    return (
      <View testID="mock-tuner">
        <Text>Tuner Mode: {props.mode}</Text>
        <Text>Temperament: {props.temperament}</Text>
      </View>
    );
  };
});

// Mock Slider
jest.mock("@react-native-community/slider", () => {
  const { View, Text } = require("react-native");
  return function MockSlider(props: any) {
    return (
      <View testID="rating-slider">
        <Text>Value: {props.value}</Text>
      </View>
    );
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

describe("PracticePanel", () => {
  const defaultProps = {
    tuneName: "Autumn Leaves",
    tuneKey: "C",
    currentScore: 75,
    onSubmitRating: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Header", () => {
    it("renders tune name and key", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);

      expect(getByText("Autumn Leaves")).toBeTruthy();
      expect(getByText("in C")).toBeTruthy();
    });

    it("renders cancel button", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      expect(getByRole("button", { name: /cancel practice/i })).toBeTruthy();
    });

    it("calls onCancel when cancel button is pressed", () => {
      const onCancel = jest.fn();
      const { getByRole } = render(
        <PracticePanel {...defaultProps} onCancel={onCancel} />,
      );

      fireEvent.press(getByRole("button", { name: /cancel practice/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Focus Card", () => {
    it("renders a focus card with category and name", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);

      // The focus card is randomly selected, so we check for the container structure
      // by looking for common category names
      const categories = [
        "Ear & Pitch",
        "Resonance & Tone",
        "Rhythm & Time",
        "Articulation & Communication",
        "Ease & Efficiency",
        "Musical Shape",
      ];

      const hasCategory = categories.some((cat) => {
        try {
          getByText(cat);
          return true;
        } catch {
          return false;
        }
      });

      expect(hasCategory).toBe(true);
    });
  });

  describe("Tool Buttons", () => {
    it("renders tuner button", () => {
      const { getByText, getByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      expect(getByText("🎯")).toBeTruthy();
      expect(getByRole("button", { name: /expand tuner/i })).toBeTruthy();
    });

    it("renders metronome button", () => {
      const { getByText, getByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      expect(getByText("🥁")).toBeTruthy();
      expect(getByRole("button", { name: /expand metronome/i })).toBeTruthy();
    });

    it("renders drone button", () => {
      const { getByText, getByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      expect(getByText("🎵")).toBeTruthy();
      expect(getByRole("button", { name: /expand drone/i })).toBeTruthy();
    });

    it("expands tuner when tuner circle is pressed", () => {
      const { getByRole, getByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      fireEvent.press(getByRole("button", { name: /expand tuner/i }));
      expect(getByTestId("mock-tuner")).toBeTruthy();
    });

    it("collapses tuner when pressed again", () => {
      const { getByRole, queryByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Expand
      fireEvent.press(getByRole("button", { name: /expand tuner/i }));
      expect(queryByTestId("mock-tuner")).toBeTruthy();

      // Collapse
      fireEvent.press(getByRole("button", { name: /collapse tuner/i }));
      expect(queryByTestId("mock-tuner")).toBeNull();
    });

    it("mutes audio when tuner opens", () => {
      const { getByRole, getByText } = render(
        <PracticePanel {...defaultProps} settings={{ autoMetronome: true }} />,
      );

      // Start metronome
      fireEvent.press(getByRole("button", { name: /expand metronome/i }));

      // Open tuner - should mute audio
      fireEvent.press(getByRole("button", { name: /expand tuner/i }));

      // Verify muted state (by checking mute button shows unmute label)
      expect(getByRole("button", { name: /unmute/i })).toBeTruthy();
    });

    it("expands metronome and activates it when pressed", () => {
      const { getByRole, getByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      fireEvent.press(getByRole("button", { name: /expand metronome/i }));
      expect(getByTestId("mock-metronome")).toBeTruthy();
    });

    it("stops metronome on long press", () => {
      const { getByRole, queryByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Start metronome
      fireEvent.press(getByRole("button", { name: /expand metronome/i }));
      expect(queryByTestId("mock-metronome")).toBeTruthy();

      // Long press to stop
      fireEvent(
        getByRole("button", { name: /collapse metronome/i }),
        "longPress",
      );
      expect(queryByTestId("mock-metronome")).toBeNull();
    });

    it("expands drone and activates it when pressed", () => {
      const { getByRole, getByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      fireEvent.press(getByRole("button", { name: /expand drone/i }));
      expect(getByTestId("mock-drone")).toBeTruthy();
    });

    it("stops drone on long press", () => {
      const { getByRole, queryByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Start drone
      fireEvent.press(getByRole("button", { name: /expand drone/i }));
      expect(queryByTestId("mock-drone")).toBeTruthy();

      // Long press to stop
      fireEvent(getByRole("button", { name: /collapse drone/i }), "longPress");
      expect(queryByTestId("mock-drone")).toBeNull();
    });

    it("closes other tools when one tool opens", () => {
      const { getByRole, queryByTestId, getByTestId } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Open tuner
      fireEvent.press(getByRole("button", { name: /expand tuner/i }));
      expect(getByTestId("mock-tuner")).toBeTruthy();

      // Open metronome - should close tuner
      fireEvent.press(getByRole("button", { name: /expand metronome/i }));
      expect(queryByTestId("mock-tuner")).toBeNull();
      expect(getByTestId("mock-metronome")).toBeTruthy();

      // Open drone - should keep metronome running but collapse panel
      fireEvent.press(getByRole("button", { name: /expand drone/i }));
      expect(getByTestId("mock-drone")).toBeTruthy();
    });
  });

  describe("Audio Controls", () => {
    it("shows mute button when tools are active", () => {
      const { getByRole, queryByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Initially no mute button
      expect(queryByRole("button", { name: /mute/i })).toBeNull();

      // Start metronome
      fireEvent.press(getByRole("button", { name: /expand metronome/i }));

      // Now mute button should be visible
      expect(getByRole("button", { name: /mute/i })).toBeTruthy();
    });

    it("toggles mute state when mute button is pressed", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      // Start metronome
      fireEvent.press(getByRole("button", { name: /expand metronome/i }));

      // Press mute
      fireEvent.press(getByRole("button", { name: /mute/i }));
      expect(getByRole("button", { name: /unmute/i })).toBeTruthy();

      // Press unmute
      fireEvent.press(getByRole("button", { name: /unmute/i }));
      expect(getByRole("button", { name: /mute/i })).toBeTruthy();
    });

    it("shows volume button when tools are active", () => {
      const { getByRole, queryByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Initially no volume button
      expect(queryByRole("button", { name: /adjust volume/i })).toBeNull();

      // Start drone
      fireEvent.press(getByRole("button", { name: /expand drone/i }));

      // Now volume button should be visible
      expect(getByRole("button", { name: /adjust volume/i })).toBeTruthy();
    });
  });

  describe("Rating Section", () => {
    it("renders rating section when tools are collapsed", () => {
      const { getByText } = render(<PracticePanel {...defaultProps} />);

      expect(getByText("How did it go?")).toBeTruthy();
      expect(getByText("75%")).toBeTruthy();
      expect(getByText("(prev: 75%)")).toBeTruthy();
    });

    it("hides rating section when a tool is expanded", () => {
      const { getByRole, queryByText } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Expand tuner
      fireEvent.press(getByRole("button", { name: /expand tuner/i }));

      expect(queryByText("How did it go?")).toBeNull();
    });

    it("shows rating section again when tool is collapsed", () => {
      const { getByRole, queryByText, getByText } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Expand tuner
      fireEvent.press(getByRole("button", { name: /expand tuner/i }));
      expect(queryByText("How did it go?")).toBeNull();

      // Collapse tuner
      fireEvent.press(getByRole("button", { name: /collapse tuner/i }));
      expect(getByText("How did it go?")).toBeTruthy();
    });

    it("renders fine tune buttons", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      expect(
        getByRole("button", { name: /decrease rating by 5/i }),
      ).toBeTruthy();
      expect(
        getByRole("button", { name: /increase rating by 5/i }),
      ).toBeTruthy();
    });

    it("adjusts rating when fine tune buttons are pressed", () => {
      const { getByRole, getByText } = render(
        <PracticePanel {...defaultProps} />,
      );

      // Initial rating is 75
      expect(getByText("75%")).toBeTruthy();

      // Press +5
      fireEvent.press(getByRole("button", { name: /increase rating by 5/i }));
      expect(getByText("80%")).toBeTruthy();

      // Press -5
      fireEvent.press(getByRole("button", { name: /decrease rating by 5/i }));
      expect(getByText("75%")).toBeTruthy();
    });

    it("clamps rating to 0-100 range", () => {
      const lowScoreProps = { ...defaultProps, currentScore: 3 };
      const { getByRole, getByText } = render(
        <PracticePanel {...lowScoreProps} />,
      );

      // Initial rating is 3
      expect(getByText("3%")).toBeTruthy();

      // Press -5 should clamp to 0
      fireEvent.press(getByRole("button", { name: /decrease rating by 5/i }));
      expect(getByText("0%")).toBeTruthy();
    });

    it("clamps rating to max 100", () => {
      const highScoreProps = { ...defaultProps, currentScore: 98 };
      const { getByRole, getByText } = render(
        <PracticePanel {...highScoreProps} />,
      );

      // Initial rating is 98
      expect(getByText("98%")).toBeTruthy();

      // Press +5 should clamp to 100
      fireEvent.press(getByRole("button", { name: /increase rating by 5/i }));
      expect(getByText("100%")).toBeTruthy();
    });
  });

  describe("Submit Rating", () => {
    it("renders submit button", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      expect(getByRole("button", { name: /submit rating/i })).toBeTruthy();
    });

    it("calls onSubmitRating with current rating when submit is pressed", () => {
      const onSubmitRating = jest.fn();
      const { getByRole } = render(
        <PracticePanel {...defaultProps} onSubmitRating={onSubmitRating} />,
      );

      fireEvent.press(getByRole("button", { name: /submit rating/i }));
      expect(onSubmitRating).toHaveBeenCalledWith(75);
    });

    it("submits adjusted rating after fine-tuning", () => {
      const onSubmitRating = jest.fn();
      const { getByRole } = render(
        <PracticePanel {...defaultProps} onSubmitRating={onSubmitRating} />,
      );

      // Adjust rating
      fireEvent.press(getByRole("button", { name: /increase rating by 5/i }));
      fireEvent.press(getByRole("button", { name: /increase rating by 5/i }));

      // Submit
      fireEvent.press(getByRole("button", { name: /submit rating/i }));
      expect(onSubmitRating).toHaveBeenCalledWith(85);
    });
  });

  describe("Tune Settings Integration", () => {
    it("passes BPM to metronome from tune settings", () => {
      const { getByRole, getByText } = render(
        <PracticePanel {...defaultProps} tuneSettings={{ bpm: 140 }} />,
      );

      fireEvent.press(getByRole("button", { name: /expand metronome/i }));
      expect(getByText("Metronome BPM: 140")).toBeTruthy();
    });

    it("passes note to drone from tune key", () => {
      const { getByRole, getByText } = render(
        <PracticePanel {...defaultProps} tuneKey="G" />,
      );

      fireEvent.press(getByRole("button", { name: /expand drone/i }));
      expect(getByText("Drone Note: G")).toBeTruthy();
    });

    it("passes temperament to tuner from pitch system", () => {
      const { getByRole, getByText } = render(
        <PracticePanel
          {...defaultProps}
          tuneSettings={{ pitchSystem: "equal" }}
        />,
      );

      fireEvent.press(getByRole("button", { name: /expand tuner/i }));
      expect(getByText("Temperament: equal")).toBeTruthy();
    });

    it("uses default values when tune settings not provided", () => {
      const { getByRole, getByText } = render(
        <PracticePanel {...defaultProps} />,
      );

      fireEvent.press(getByRole("button", { name: /expand metronome/i }));
      expect(getByText("Metronome BPM: 120")).toBeTruthy();
    });
  });

  describe("Initial Settings", () => {
    it("auto-activates metronome when autoMetronome is true", () => {
      const { getByRole } = render(
        <PracticePanel {...defaultProps} settings={{ autoMetronome: true }} />,
      );

      // Metronome should be active (mute button visible)
      expect(getByRole("button", { name: /mute/i })).toBeTruthy();
    });

    it("auto-activates drone when autoDrone is true", () => {
      const { getByRole } = render(
        <PracticePanel {...defaultProps} settings={{ autoDrone: true }} />,
      );

      // Drone should be active (mute button visible)
      expect(getByRole("button", { name: /mute/i })).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessible cancel button", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      const cancelButton = getByRole("button", { name: /cancel practice/i });
      expect(cancelButton).toBeTruthy();
    });

    it("has accessible tool circles", () => {
      const { getByRole } = render(<PracticePanel {...defaultProps} />);

      expect(getByRole("button", { name: /expand tuner/i })).toBeTruthy();
      expect(getByRole("button", { name: /expand metronome/i })).toBeTruthy();
      expect(getByRole("button", { name: /expand drone/i })).toBeTruthy();
    });

    it("has accessible rating controls", () => {
      const { getAllByRole, getByRole } = render(
        <PracticePanel {...defaultProps} />,
      );

      // There are multiple decrease/increase buttons (-1, -5, +1, +5)
      expect(
        getAllByRole("button", { name: /decrease rating/i }).length,
      ).toBeGreaterThan(0);
      expect(
        getAllByRole("button", { name: /increase rating/i }).length,
      ).toBeGreaterThan(0);
      expect(getByRole("button", { name: /submit rating/i })).toBeTruthy();
    });
  });

  describe("Different Keys", () => {
    it("renders with flat key", () => {
      const { getByText } = render(
        <PracticePanel {...defaultProps} tuneKey="Bb" />,
      );

      expect(getByText("in Bb")).toBeTruthy();
    });

    it("renders with sharp key", () => {
      const { getByText } = render(
        <PracticePanel {...defaultProps} tuneKey="F#" />,
      );

      expect(getByText("in F#")).toBeTruthy();
    });
  });
});
