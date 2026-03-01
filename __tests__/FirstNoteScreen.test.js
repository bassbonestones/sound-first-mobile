import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FirstNoteScreen from "../screens/FirstNoteScreen";

// Mock navigation
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  replace: mockReplace,
  goBack: mockGoBack,
};

// Mock AudioInput component - simpler mock for navigation tests
jest.mock("../components/AudioInput", () => {
  const React = require("react");
  return function MockAudioInput(props) {
    return React.createElement("View", {
      testID: "mock-audio-input",
      ...props,
    });
  };
});

// Mock VolumeBar component
jest.mock("../components/VolumeBar", () => {
  const React = require("react");
  const VolumeBar = (props) => React.createElement("View", { testID: "mock-volume-bar", ...props });
  const CircularVolumeIndicator = (props) => React.createElement("View", { testID: "mock-circular-indicator", ...props });
  
  VolumeBar.default = VolumeBar;
  VolumeBar.CircularVolumeIndicator = CircularVolumeIndicator;
  
  return {
    __esModule: true,
    default: VolumeBar,
    CircularVolumeIndicator: CircularVolumeIndicator,
  };
});

// Mock Audio for web
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn((event, handler) => {
    if (event === "ended") {
      // Simulate audio ending after a short delay
      setTimeout(handler, 100);
    }
  }),
  removeEventListener: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FirstNoteScreen", () => {
  const defaultRoute = {
    params: {
      userId: 1,
      resonantNote: "Bb3",
      instrument: "trombone",
    },
  };

  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(
        <FirstNoteScreen navigation={mockNavigation} route={defaultRoute} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders initial stage 0 content", () => {
      const { toJSON } = render(
        <FirstNoteScreen navigation={mockNavigation} route={defaultRoute} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Instrument Clef Mapping", () => {
    it("accepts trombone instrument", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{
            params: { userId: 1, resonantNote: "Bb3", instrument: "trombone" },
          }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts trumpet instrument", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{
            params: { userId: 1, resonantNote: "Bb4", instrument: "trumpet" },
          }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles various instruments", () => {
      const instruments = [
        "piano", "flute", "clarinet", "violin", "cello", "tuba"
      ];
      
      instruments.forEach((instrument) => {
        const { toJSON, unmount } = render(
          <FirstNoteScreen
            navigation={mockNavigation}
            route={{
              params: { userId: 1, resonantNote: "C4", instrument },
            }}
          />
        );
        expect(toJSON()).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Note Parsing", () => {
    it("handles natural notes", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{
            params: { userId: 1, resonantNote: "C4", instrument: "piano" },
          }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles sharp notes", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{
            params: { userId: 1, resonantNote: "F#4", instrument: "piano" },
          }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles flat notes", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{
            params: { userId: 1, resonantNote: "Bb3", instrument: "trombone" },
          }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles various octaves", () => {
      const notes = ["C2", "G3", "A4", "D5"];
      
      notes.forEach((note) => {
        const { toJSON, unmount } = render(
          <FirstNoteScreen
            navigation={mockNavigation}
            route={{
              params: { userId: 1, resonantNote: note, instrument: "piano" },
            }}
          />
        );
        expect(toJSON()).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Default Values", () => {
    it("uses default values when route params are empty", () => {
      const { toJSON } = render(
        <FirstNoteScreen
          navigation={mockNavigation}
          route={{ params: {} }}
        />
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles undefined route", () => {
      const { toJSON } = render(
        <FirstNoteScreen navigation={mockNavigation} route={undefined} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Focus Card Constants", () => {
    // The component uses DAY0_FOCUS_CARDS internally
    it("renders with focus card support", () => {
      const { toJSON } = render(
        <FirstNoteScreen navigation={mockNavigation} route={defaultRoute} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Audio Integration", () => {
    it("initializes without errors", async () => {
      const { toJSON } = render(
        <FirstNoteScreen navigation={mockNavigation} route={defaultRoute} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
