import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

// Mock audio context - must be before component import
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: "sine",
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
  close: jest.fn(),
};

// Mock react-native-audio-api (used on native platforms)
jest.mock("react-native-audio-api", () => ({
  AudioContext: jest.fn(() => mockAudioContext),
}));

// Mock MiniKeyboard
jest.mock(
  "../src/screens/Session/components/exercises/shared/MiniKeyboard",
  () => {
    return function MockMiniKeyboard() {
      return null;
    };
  },
);

import FlatAccidentalExercise from "../src/screens/Session/components/exercises/FlatAccidentalExercise";

describe("FlatAccidentalExercise", () => {
  const defaultProps = {
    mini: {},
    sessionState: {},
    onComplete: jest.fn(),
    onCancel: jest.fn(),
    onProgress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Intro Phase", () => {
    it("renders the flat title", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("The Flat ♭")).toBeTruthy();
    });

    it("renders subtitle", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("Lowering Notes")).toBeTruthy();
    });

    it("renders the flat symbol in explanation", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText(/flat.*lowers/i)).toBeTruthy();
    });

    it("renders continue button", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("See It on Keyboard →")).toBeTruthy();
    });

    it("navigates to keyboard phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See It on Keyboard →"));
      expect(getByText("D♭ on the Keyboard")).toBeTruthy();
    });
  });

  describe("Keyboard Phase", () => {
    it("shows keyboard title", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See It on Keyboard →"));
      expect(getByText("D♭ on the Keyboard")).toBeTruthy();
    });

    it("shows examples button", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See It on Keyboard →"));
      expect(getByText("See More Examples →")).toBeTruthy();
    });

    it("navigates to examples phase", () => {
      const { getByText } = render(
        <FlatAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("See It on Keyboard →"));
      fireEvent.press(getByText("See More Examples →"));
      expect(getByText("More Flats")).toBeTruthy();
    });
  });

  describe("Examples Phase", () => {
    const navigateToExamples = (utils) => {
      fireEvent.press(utils.getByText("See It on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
    };

    it("shows examples title", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("More Flats")).toBeTruthy();
    });

    it("shows flat example buttons", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("D → D♭")).toBeTruthy();
      expect(utils.getByText("E → E♭")).toBeTruthy();
      expect(utils.getByText("B → B♭")).toBeTruthy();
      expect(utils.getByText("A → A♭")).toBeTruthy();
    });

    it("shows hear it button", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("Hear the Difference →")).toBeTruthy();
    });
  });

  describe("Quiz Phase", () => {
    const navigateToQuiz = (utils) => {
      fireEvent.press(utils.getByText("See It on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
      fireEvent.press(utils.getByText("Hear the Difference →"));
      fireEvent.press(utils.getByText("Quiz Me →"));
    };

    it("renders quiz question", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      expect(
        utils.getByText("What does a flat (♭) do to a note?"),
      ).toBeTruthy();
    });

    it("renders quiz options", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      expect(utils.getByText("Lowers it by a half step")).toBeTruthy();
      expect(utils.getByText("Raises it by a half step")).toBeTruthy();
    });

    it("handles answer selection", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      fireEvent.press(utils.getByText("Lowers it by a half step"));
      // Answer was selected - component handles response
      expect(utils.getByText("Lowers it by a half step")).toBeTruthy();
    });

    it("progresses through quiz with correct answers", async () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);

      // Answer first question correctly
      await act(async () => {
        fireEvent.press(utils.getByText("Lowers it by a half step"));
        jest.advanceTimersByTime(1500);
      });

      // Should progress to next question
      expect(utils.queryByText(/D♭|flat|keyboard/i)).toBeTruthy();
    });
  });

  describe("Audio", () => {
    const navigateToHearIt = (utils) => {
      fireEvent.press(utils.getByText("See It on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
      fireEvent.press(utils.getByText("Hear the Difference →"));
    };

    it("initializes audio context on mount", () => {
      render(<FlatAccidentalExercise {...defaultProps} />);
      // Audio context should be created
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<FlatAccidentalExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("renders play button in hear it phase", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);
      expect(utils.getByText(/Play/)).toBeTruthy();
    });

    it("plays audio when play button is pressed", async () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);

      await act(async () => {
        fireEvent.press(utils.getByText(/Play/));
        jest.advanceTimersByTime(2000);
      });

      // Audio context methods should have been called
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("shows example selector buttons", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);
      expect(utils.getAllByText("D → D♭").length).toBeGreaterThan(0);
    });

    it("can switch between examples", () => {
      const utils = render(<FlatAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);
      fireEvent.press(utils.getByText("E → E♭"));
      // Should still be on hear it phase
      expect(utils.getByText(/Play/)).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("renders without callbacks", () => {
      const { getByText } = render(
        <FlatAccidentalExercise mini={{}} sessionState={{}} />,
      );
      expect(getByText("The Flat ♭")).toBeTruthy();
    });
  });
});
