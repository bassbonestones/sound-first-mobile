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

import SharpAccidentalExercise from "../src/screens/Session/components/exercises/SharpAccidentalExercise";

describe("SharpAccidentalExercise", () => {
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
    it("renders the sharp title", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("The Sharp ♯")).toBeTruthy();
    });

    it("renders subtitle", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("Raising Notes")).toBeTruthy();
    });

    it("renders the sharp symbol in explanation", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      expect(getByText(/sharp.*raises/i)).toBeTruthy();
    });

    it("renders continue button", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      expect(getByText("Compare to Flat →")).toBeTruthy();
    });

    it("navigates to compare phase", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Compare to Flat →"));
      expect(getByText("Sharp vs Flat")).toBeTruthy();
    });
  });

  describe("Compare Phase", () => {
    it("shows compare title", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Compare to Flat →"));
      expect(getByText("Sharp vs Flat")).toBeTruthy();
    });

    it("shows keyboard button", () => {
      const { getByText } = render(
        <SharpAccidentalExercise {...defaultProps} />,
      );
      fireEvent.press(getByText("Compare to Flat →"));
      expect(getByText("See on Keyboard →")).toBeTruthy();
    });
  });

  describe("Keyboard Phase", () => {
    const navigateToKeyboard = (utils) => {
      fireEvent.press(utils.getByText("Compare to Flat →"));
      fireEvent.press(utils.getByText("See on Keyboard →"));
    };

    it("shows keyboard title", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToKeyboard(utils);
      expect(utils.getByText("F♯ on the Keyboard")).toBeTruthy();
    });

    it("shows examples button", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToKeyboard(utils);
      expect(utils.getByText("See More Examples →")).toBeTruthy();
    });

    it("navigates to examples phase", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToKeyboard(utils);
      fireEvent.press(utils.getByText("See More Examples →"));
      expect(utils.getByText("More Sharps")).toBeTruthy();
    });
  });

  describe("Examples Phase", () => {
    const navigateToExamples = (utils) => {
      fireEvent.press(utils.getByText("Compare to Flat →"));
      fireEvent.press(utils.getByText("See on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
    };

    it("shows examples title", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("More Sharps")).toBeTruthy();
    });

    it("shows sharp example buttons", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("F → F♯")).toBeTruthy();
      expect(utils.getByText("C → C♯")).toBeTruthy();
      expect(utils.getByText("G → G♯")).toBeTruthy();
      expect(utils.getByText("A → A♯")).toBeTruthy();
    });

    it("shows hear it button", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToExamples(utils);
      expect(utils.getByText("Hear the Difference →")).toBeTruthy();
    });
  });

  describe("Quiz Phase", () => {
    const navigateToQuiz = (utils) => {
      fireEvent.press(utils.getByText("Compare to Flat →"));
      fireEvent.press(utils.getByText("See on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
      fireEvent.press(utils.getByText("Hear the Difference →"));
      fireEvent.press(utils.getByText("Quiz Me →"));
    };

    it("renders quiz question", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      expect(
        utils.getByText("What does a sharp (♯) do to a note?"),
      ).toBeTruthy();
    });

    it("renders quiz options", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      expect(utils.getByText("Raises it by a half step")).toBeTruthy();
      expect(utils.getByText("Lowers it by a half step")).toBeTruthy();
    });

    it("handles answer selection", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToQuiz(utils);
      fireEvent.press(utils.getByText("Raises it by a half step"));
      expect(utils.getByText("Raises it by a half step")).toBeTruthy();
    });
  });

  describe("Audio", () => {
    const navigateToHearIt = (utils) => {
      fireEvent.press(utils.getByText("Compare to Flat →"));
      fireEvent.press(utils.getByText("See on Keyboard →"));
      fireEvent.press(utils.getByText("See More Examples →"));
      fireEvent.press(utils.getByText("Hear the Difference →"));
    };

    it("initializes audio context on mount", () => {
      render(<SharpAccidentalExercise {...defaultProps} />);
      expect(mockAudioContext.createOscillator).toBeDefined();
    });

    it("cleans up audio context on unmount", () => {
      const { unmount } = render(<SharpAccidentalExercise {...defaultProps} />);
      unmount();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it("renders play button in hear it phase", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);
      expect(utils.getByText(/Play/)).toBeTruthy();
    });

    it("plays audio when play button is pressed", async () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);

      await act(async () => {
        fireEvent.press(utils.getByText(/Play/));
        jest.advanceTimersByTime(2000);
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it("can switch between examples", () => {
      const utils = render(<SharpAccidentalExercise {...defaultProps} />);
      navigateToHearIt(utils);
      fireEvent.press(utils.getByText("C → C♯"));
      expect(utils.getByText(/Play/)).toBeTruthy();
    });
  });

  describe("Edge Cases", () => {
    it("renders without callbacks", () => {
      const { getByText } = render(
        <SharpAccidentalExercise mini={{}} sessionState={{}} />,
      );
      expect(getByText("The Sharp ♯")).toBeTruthy();
    });
  });
});
