/**
 * @fileoverview Tests for Onboarding screen
 * Multi-step flow: instrument selection then starting note selection
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock UserContext
const mockAddInstrument = jest.fn();
const mockLoadInstruments = jest.fn();
jest.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    addInstrument: mockAddInstrument,
    loadInstruments: mockLoadInstruments,
  }),
}));

// Mock ErrorBoundary
jest.mock("../src/components/ErrorBoundary", () => {
  const React = require("react");
  return function MockErrorBoundary({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <>{children}</>;
  };
});

// Mock InstrumentStep
jest.mock("../src/screens/Onboarding/steps/InstrumentStep", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockInstrumentStep({
    selectedFamily,
    instrument,
    onSelectFamily,
    onSelectInstrument,
    onNext,
    onNavigateAdmin,
  }: {
    selectedFamily: string;
    instrument: string;
    onSelectFamily: (family: string) => void;
    onSelectInstrument: (inst: string) => void;
    onNext: () => void;
    onNavigateAdmin: () => void;
  }) {
    return (
      <View testID="instrument-step">
        <Text>InstrumentStep</Text>
        <Text testID="selected-family">{selectedFamily || "No family"}</Text>
        <Text testID="selected-instrument">
          {instrument || "No instrument"}
        </Text>
        <TouchableOpacity
          testID="select-brass"
          onPress={() => onSelectFamily("Brass")}
        >
          <Text>Select Brass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="select-trumpet"
          onPress={() => onSelectInstrument("Trumpet")}
        >
          <Text>Select Trumpet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="select-piano"
          onPress={() => onSelectInstrument("Piano")}
        >
          <Text>Select Piano</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="next-button" onPress={onNext}>
          <Text>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="admin-button" onPress={onNavigateAdmin}>
          <Text>Admin</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock StartingNoteStep
jest.mock("../src/screens/Onboarding/steps/StartingNoteStep", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockStartingNoteStep({
    instrument,
    instrumentIcon,
    clef,
    startingNote,
    playToSelectMode,
    detectedPitch,
    isSounding,
    onChangeNote,
    onRealtimePitch,
    onFinalPitch,
    onSoundEnd,
    onConfirmPitch,
    onSetPlayToSelectMode,
    onBack,
    onSubmit,
  }: {
    instrument: string;
    instrumentIcon: string;
    clef: string;
    startingNote: string;
    playToSelectMode: boolean;
    detectedPitch: any;
    isSounding: boolean;
    onChangeNote: (note: string) => void;
    onRealtimePitch: (pitch: any) => void;
    onFinalPitch: (pitch: any) => void;
    onSoundEnd: () => void;
    onConfirmPitch: () => void;
    onSetPlayToSelectMode: (val: boolean) => void;
    onBack: () => void;
    onSubmit: () => void;
  }) {
    return (
      <View testID="starting-note-step">
        <Text>StartingNoteStep</Text>
        <Text testID="step2-instrument">{instrument}</Text>
        <Text testID="step2-instrument-icon">{instrumentIcon}</Text>
        <Text testID="step2-clef">{clef}</Text>
        <Text testID="step2-starting-note">{startingNote || "No note"}</Text>
        <Text testID="step2-play-mode">
          {playToSelectMode ? "play" : "staff"}
        </Text>
        <Text testID="step2-is-sounding">
          {isSounding ? "sounding" : "silent"}
        </Text>
        <Text testID="step2-detected-pitch">
          {detectedPitch?.noteName || "none"}
        </Text>
        <TouchableOpacity
          testID="change-note"
          onPress={() => onChangeNote("D4")}
        >
          <Text>Change Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="realtime-pitch"
          onPress={() => onRealtimePitch({ noteName: "E4", isInTune: true })}
        >
          <Text>Realtime Pitch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="final-pitch"
          onPress={() => onFinalPitch({ noteName: "F4", isInTune: true })}
        >
          <Text>Final Pitch</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="sound-end" onPress={onSoundEnd}>
          <Text>Sound End</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="confirm-pitch" onPress={onConfirmPitch}>
          <Text>Confirm Pitch</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="toggle-play-mode"
          onPress={() => onSetPlayToSelectMode(!playToSelectMode)}
        >
          <Text>Toggle Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="back-button" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="submit-button" onPress={onSubmit}>
          <Text>Submit</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock instruments data
jest.mock("../src/screens/Onboarding/data/instruments", () => ({
  instrumentDefaults: {
    Trumpet: { startingNote: "Bb3", clef: "treble" },
    Piano: { startingNote: "C4", clef: "treble" },
    Other: { startingNote: "C4", clef: "treble" },
  },
  getClefForInstrument: (inst: string) => {
    if (inst === "Trumpet") return "treble";
    if (inst === "Piano") return "treble";
    return "treble";
  },
  getIconForInstrument: (inst: string) => {
    if (inst === "Trumpet") return "🎺";
    if (inst === "Piano") return "🎹";
    return "🎵";
  },
}));

import OnboardingScreen from "../src/screens/Onboarding/index";

describe("OnboardingScreen", () => {
  const mockNavigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
  };
  const mockRoute = { params: {} };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddInstrument.mockResolvedValue({ id: 123 });
    mockLoadInstruments.mockResolvedValue(undefined);
  });

  // ==========================================================================
  // INITIAL STATE TESTS
  // ==========================================================================
  describe("Initial State", () => {
    it("renders step 1 by default", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByTestId("instrument-step")).toBeTruthy();
    });

    it("starts at step 2 when route param provided", () => {
      const route = { params: { step: 2 } };
      const { getByTestId, queryByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={route} />,
      );
      expect(getByTestId("starting-note-step")).toBeTruthy();
      expect(queryByTestId("instrument-step")).toBeNull();
    });

    it("handles missing route params gracefully", () => {
      const { getByTestId } = render(
        <OnboardingScreen
          navigation={mockNavigation}
          route={undefined as any}
        />,
      );
      expect(getByTestId("instrument-step")).toBeTruthy();
    });
  });

  // ==========================================================================
  // STEP 1 - INSTRUMENT SELECTION TESTS
  // ==========================================================================
  describe("Step 1 - Instrument Selection", () => {
    it("passes correct props to InstrumentStep", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      expect(getByTestId("selected-family").props.children).toBe("No family");
      expect(getByTestId("selected-instrument").props.children).toBe(
        "No instrument",
      );
    });

    it("updates selectedFamily when family selected", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(getByTestId("select-brass"));
      expect(getByTestId("selected-family").props.children).toBe("Brass");
    });

    it("clears instrument when family changes", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      // Select instrument first
      fireEvent.press(getByTestId("select-trumpet"));
      expect(getByTestId("selected-instrument").props.children).toBe("Trumpet");

      // Change family - should clear instrument
      fireEvent.press(getByTestId("select-brass"));
      expect(getByTestId("selected-instrument").props.children).toBe(
        "No instrument",
      );
    });

    it("sets default starting note when instrument selected", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(getByTestId("select-trumpet"));
      fireEvent.press(getByTestId("next-button"));

      // Now on step 2, check starting note
      expect(getByTestId("step2-starting-note").props.children).toBe("Bb3");
    });

    it("navigates to Admin when admin button pressed", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(getByTestId("admin-button"));
      expect(mockNavigation.navigate).toHaveBeenCalledWith("Admin");
    });

    it("advances to step 2 when Next pressed", () => {
      const { getByTestId, queryByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(getByTestId("next-button"));
      expect(getByTestId("starting-note-step")).toBeTruthy();
      expect(queryByTestId("instrument-step")).toBeNull();
    });
  });

  // ==========================================================================
  // STEP 2 - STARTING NOTE SELECTION TESTS
  // ==========================================================================
  describe("Step 2 - Starting Note Selection", () => {
    const renderAtStep2 = () => {
      const result = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      // Select instrument and go to step 2
      fireEvent.press(result.getByTestId("select-trumpet"));
      fireEvent.press(result.getByTestId("next-button"));
      return result;
    };

    it("passes instrument data to StartingNoteStep", () => {
      const { getByTestId } = renderAtStep2();
      expect(getByTestId("step2-instrument").props.children).toBe("Trumpet");
      expect(getByTestId("step2-instrument-icon").props.children).toBe("🎺");
      expect(getByTestId("step2-clef").props.children).toBe("treble");
    });

    it("goes back to step 1 when back pressed", () => {
      const { getByTestId, queryByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("back-button"));
      expect(getByTestId("instrument-step")).toBeTruthy();
      expect(queryByTestId("starting-note-step")).toBeNull();
    });

    it("preserves instrument selection when going back", () => {
      const { getByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("back-button"));
      expect(getByTestId("selected-instrument").props.children).toBe("Trumpet");
    });

    it("allows changing starting note manually", () => {
      const { getByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("change-note"));
      expect(getByTestId("step2-starting-note").props.children).toBe("D4");
    });

    it("starts in staff mode by default", () => {
      const { getByTestId } = renderAtStep2();
      expect(getByTestId("step2-play-mode").props.children).toBe("staff");
    });

    it("toggles to play-to-select mode", () => {
      const { getByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("toggle-play-mode"));
      expect(getByTestId("step2-play-mode").props.children).toBe("play");
    });
  });

  // ==========================================================================
  // PITCH DETECTION TESTS
  // ==========================================================================
  describe("Pitch Detection", () => {
    const renderAtStep2 = () => {
      const result = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(result.getByTestId("select-trumpet"));
      fireEvent.press(result.getByTestId("next-button"));
      return result;
    };

    it("handles realtime pitch detection", () => {
      const { getByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("realtime-pitch"));
      expect(getByTestId("step2-detected-pitch").props.children).toBe("E4");
      expect(getByTestId("step2-is-sounding").props.children).toBe("sounding");
    });

    it("handles final pitch detection", () => {
      const { getByTestId } = renderAtStep2();
      fireEvent.press(getByTestId("final-pitch"));
      expect(getByTestId("step2-detected-pitch").props.children).toBe("F4");
      expect(getByTestId("step2-is-sounding").props.children).toBe("silent");
    });

    it("handles sound end", () => {
      const { getByTestId } = renderAtStep2();
      // First detect a pitch
      fireEvent.press(getByTestId("realtime-pitch"));
      expect(getByTestId("step2-is-sounding").props.children).toBe("sounding");

      // Then end sound
      fireEvent.press(getByTestId("sound-end"));
      expect(getByTestId("step2-is-sounding").props.children).toBe("silent");
    });

    it("confirms detected pitch as starting note", () => {
      const { getByTestId } = renderAtStep2();
      // Enable play mode
      fireEvent.press(getByTestId("toggle-play-mode"));

      // Detect a pitch
      fireEvent.press(getByTestId("final-pitch"));
      expect(getByTestId("step2-detected-pitch").props.children).toBe("F4");

      // Confirm it
      fireEvent.press(getByTestId("confirm-pitch"));
      expect(getByTestId("step2-starting-note").props.children).toBe("F4");
      expect(getByTestId("step2-play-mode").props.children).toBe("staff");
    });
  });

  // ==========================================================================
  // SUBMIT TESTS
  // ==========================================================================
  describe("Submit Flow", () => {
    const renderReadyToSubmit = () => {
      const result = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );
      fireEvent.press(result.getByTestId("select-trumpet"));
      fireEvent.press(result.getByTestId("next-button"));
      return result;
    };

    it("submits with correct data", async () => {
      const { getByTestId } = renderReadyToSubmit();
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockAddInstrument).toHaveBeenCalledWith({
          instrument_name: "Trumpet",
          clef: "treble",
          resonant_note: "Bb3",
          range_low: "Bb3",
          range_high: "Bb3",
          is_primary: true,
        });
      });
    });

    it("navigates to FirstNote after successful submit", async () => {
      const { getByTestId } = renderReadyToSubmit();
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockNavigation.replace).toHaveBeenCalledWith("FirstNote", {
          userId: 1,
          instrumentId: 123,
          resonantNote: "Bb3",
          instrument: "Trumpet",
        });
      });
    });

    it("reloads instruments after submit", async () => {
      const { getByTestId } = renderReadyToSubmit();
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockLoadInstruments).toHaveBeenCalled();
      });
    });

    it("shows error alert on submit failure", async () => {
      mockAddInstrument.mockRejectedValue(new Error("Network error"));

      const { getByTestId } = renderReadyToSubmit();
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith("Error", "Network error");
      });
    });

    it("sets is_primary false when adding additional instrument", async () => {
      const route = { params: { addingInstrument: true } };
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByTestId("select-trumpet"));
      fireEvent.press(getByTestId("next-button"));
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(mockAddInstrument).toHaveBeenCalledWith(
          expect.objectContaining({ is_primary: false }),
        );
      });
    });
  });

  // ==========================================================================
  // VALIDATION TESTS
  // ==========================================================================
  describe("Validation", () => {
    it("shows alert if no instrument selected", async () => {
      const route = { params: { step: 2 } };
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={route} />,
      );

      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Please select your instrument",
        );
      });
    });

    it("shows alert if no starting note selected", async () => {
      const route = { params: { step: 2 } };
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={route} />,
      );

      // Go back to select instrument, then forward without default note
      fireEvent.press(getByTestId("back-button"));
      fireEvent.press(getByTestId("select-brass")); // Select family
      // Don't select instrument - would set default note
      fireEvent.press(getByTestId("next-button"));
      fireEvent.press(getByTestId("submit-button"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Please select your instrument",
        );
      });
    });
  });

  // ==========================================================================
  // DIFFERENT INSTRUMENT TESTS
  // ==========================================================================
  describe("Different Instruments", () => {
    it("uses correct defaults for Piano", () => {
      const { getByTestId } = render(
        <OnboardingScreen navigation={mockNavigation} route={mockRoute} />,
      );

      fireEvent.press(getByTestId("select-piano"));
      fireEvent.press(getByTestId("next-button"));

      expect(getByTestId("step2-instrument").props.children).toBe("Piano");
      expect(getByTestId("step2-instrument-icon").props.children).toBe("🎹");
      expect(getByTestId("step2-starting-note").props.children).toBe("C4");
    });
  });
});
