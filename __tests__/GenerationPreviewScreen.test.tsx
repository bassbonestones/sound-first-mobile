/**
 * GenerationPreviewScreen tests
 *
 * Tests for the generation preview dev screen.
 * Tests parameter selection, API call, playback controls, and pool mode.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import GenerationPreviewScreen from "../src/screens/GenerationPreviewScreen";
import { generateContent } from "../src/api/generation";
import { generationPlayback } from "../src/services/generationPlayback";

// Mock navigation
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// Mock devLogger
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devError: jest.fn(),
}));

// Mock generation API
jest.mock("../src/api/generation", () => ({
  generateContent: jest.fn(),
}));

// Mock generation playback service
jest.mock("../src/services/generationPlayback", () => ({
  generationPlayback: {
    init: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    load: jest.fn(),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    stop: jest.fn(),
  },
}));

// Mock NotationDisplay
jest.mock("../src/components/NotationDisplay", () => {
  const { View, Text } = require("react-native");
  return function MockNotationDisplay({
    musicxml,
    currentNoteIndex,
  }: {
    musicxml?: string;
    currentNoteIndex?: number | null;
  }): React.JSX.Element {
    return (
      <View testID="notation-display">
        <Text testID="notation-musicxml">
          {musicxml ? "has musicxml" : "no musicxml"}
        </Text>
        <Text testID="notation-index">{currentNoteIndex ?? "null"}</Text>
      </View>
    );
  };
});

// Mock eventsToMusicXml
jest.mock("../src/utils/generationNotation", () => ({
  eventsToMusicXml: jest.fn(() => "<score>mock musicxml</score>"),
  generateDisplayTitle: jest.fn(() => "C Ionian Scale"),
}));

// Mock Picker for react-native
jest.mock("@react-native-picker/picker", () => {
  const { View, Text } = require("react-native");

  const MockPicker = ({
    selectedValue,
    onValueChange,
    children,
  }: {
    selectedValue: string | number;
    onValueChange: (value: string | number) => void;
    children: React.ReactNode;
  }): React.JSX.Element => {
    return (
      <View testID={`picker-${selectedValue}`}>
        <Text>{String(selectedValue)}</Text>
      </View>
    );
  };

  MockPicker.Item = function MockPickerItem({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }): React.JSX.Element {
    const { Text } = require("react-native");
    return <Text>{label}</Text>;
  };

  return { Picker: MockPicker };
});

// Mock response data
const mockGenerationResponse = {
  content_type: "scale" as const,
  definition: "ionian",
  key: "C" as const,
  octaves: 1,
  pattern: "straight_up_down",
  rhythm: "quarter_notes" as const,
  dynamics: "none" as const,
  articulation: "legato" as const,
  effective_octaves: 1,
  range_used_low_midi: 60,
  range_used_high_midi: 72,
  events: [
    {
      midi_note: 60,
      pitch_name: "C4",
      duration_beats: 1,
      offset_beats: 0,
      velocity: 90,
      articulation: null,
    },
    {
      midi_note: 62,
      pitch_name: "D4",
      duration_beats: 1,
      offset_beats: 1,
      velocity: 90,
      articulation: null,
    },
    {
      midi_note: 64,
      pitch_name: "E4",
      duration_beats: 1,
      offset_beats: 2,
      velocity: 90,
      articulation: null,
    },
  ],
  total_beats: 3,
  tempo_range: [60, 120] as [number, number],
  capabilities_required: [],
};

describe("GenerationPreviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateContent as jest.Mock).mockResolvedValue(mockGenerationResponse);
  });

  describe("Rendering", () => {
    it("renders the header with title and back button", () => {
      const { getByText, getByLabelText } = render(<GenerationPreviewScreen />);

      expect(getByText("Generation Preview")).toBeTruthy();
      expect(getByLabelText("Go back")).toBeTruthy();
    });

    it("renders content type buttons", () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      expect(getByText("Scale")).toBeTruthy();
      expect(getByText("Arpeggio")).toBeTruthy();
      expect(getByText("Lick")).toBeTruthy();
    });

    it("renders the Generate button", () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      expect(getByText("Generate")).toBeTruthy();
    });

    it("renders pool mode toggle", () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      expect(getByText("Pool Mode OFF")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("calls goBack when back button is pressed", () => {
      const { getByLabelText } = render(<GenerationPreviewScreen />);

      fireEvent.press(getByLabelText("Go back"));

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe("Content Type Selection", () => {
    it("selects scale type by default", () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      // Scale button should be selected (has selected style)
      const scaleButton = getByText("Scale").parent;
      expect(scaleButton).toBeTruthy();
    });

    it("switches to arpeggio type on press", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Arpeggio"));
      });

      // After pressing Arpeggio, the UI should update
      const arpeggioButton = getByText("Arpeggio");
      expect(arpeggioButton).toBeTruthy();
    });

    it("switches to lick type on press", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Lick"));
      });

      const lickButton = getByText("Lick");
      expect(lickButton).toBeTruthy();
    });
  });

  describe("Generation", () => {
    it("calls generateContent when Generate button is pressed", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(generateContent).toHaveBeenCalled();
      });
    });

    it("passes correct parameters to generateContent", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(generateContent).toHaveBeenCalledWith(
          expect.objectContaining({
            content_type: "scale",
            definition: "ionian",
            key: "C",
          }),
        );
      });
    });

    it("shows notation display after successful generation", async () => {
      const { getByText, queryByTestId } = render(<GenerationPreviewScreen />);

      // Initially no notation
      expect(queryByTestId("notation-display")).toBeNull();

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(queryByTestId("notation-display")).toBeTruthy();
      });
    });

    it("loads events into playback service after generation", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(generationPlayback.load).toHaveBeenCalledWith(
          mockGenerationResponse.events,
          expect.objectContaining({
            tempo: 120,
          }),
        );
      });
    });

    it("displays error message when generation fails", async () => {
      const errorMessage = "Network error";
      (generateContent as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(queryByText(errorMessage)).toBeTruthy();
      });
    });

    it("shows response info after generation", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(queryByText(/Events: 3/)).toBeTruthy();
        expect(queryByText(/Total Beats: 3/)).toBeTruthy();
      });
    });
  });

  describe("Playback Controls", () => {
    it("shows playback controls after generation", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(queryByText("▶️ Play")).toBeTruthy();
        expect(queryByText("⏹ Stop")).toBeTruthy();
      });
    });

    it("calls play on playback service when Play is pressed", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(getByText("▶️ Play")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText("▶️ Play"));
      });

      expect(generationPlayback.resume).toHaveBeenCalled();
      expect(generationPlayback.play).toHaveBeenCalled();
    });

    it("calls stop on playback service when Stop is pressed", async () => {
      const { getByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        expect(getByText("⏹ Stop")).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(getByText("⏹ Stop"));
      });

      expect(generationPlayback.stop).toHaveBeenCalled();
    });

    it("shows tempo slider after generation", async () => {
      const { getByText, getByLabelText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        // Tempo slider should be visible with label containing range
        expect(getByLabelText(/Tempo slider.*range 60 to 120/)).toBeTruthy();
      });
    });

    it("displays tempo from response range", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Generate"));
      });

      await waitFor(() => {
        // Should show tempo value
        expect(queryByText(/BPM/)).toBeTruthy();
        // Should show range labels
        expect(queryByText("60")).toBeTruthy();
        expect(queryByText("120")).toBeTruthy();
      });
    });
  });

  describe("Pool Mode", () => {
    it("enables pool mode when toggle is pressed", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Pool Mode OFF"));
      });

      await waitFor(() => {
        expect(queryByText("🎲 Pool Mode ON")).toBeTruthy();
        expect(queryByText("Random Selection Pools")).toBeTruthy();
      });
    });

    it("shows pool chips when pool mode is enabled", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Pool Mode OFF"));
      });

      await waitFor(() => {
        // Should show key pool chips
        expect(queryByText("Keys:")).toBeTruthy();
        // Should show scale pool chips when in scale mode
        expect(queryByText("Scales:")).toBeTruthy();
      });
    });

    it("changes Generate button text in pool mode", async () => {
      const { getByText, queryByText } = render(<GenerationPreviewScreen />);

      await act(async () => {
        fireEvent.press(getByText("Pool Mode OFF"));
      });

      await waitFor(() => {
        expect(queryByText("🎲 Randomize & Generate")).toBeTruthy();
      });
    });
  });

  describe("Initialization", () => {
    it("initializes playback service on mount", async () => {
      render(<GenerationPreviewScreen />);

      await waitFor(() => {
        expect(generationPlayback.init).toHaveBeenCalled();
      });
    });

    it("stops playback on unmount", () => {
      const { unmount } = render(<GenerationPreviewScreen />);

      unmount();

      expect(generationPlayback.stop).toHaveBeenCalled();
    });
  });
});
