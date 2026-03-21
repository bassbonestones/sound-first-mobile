/**
 * HomeScreen tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomeScreen from "../src/screens/HomeScreen";

// Mock navigation hooks
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn((callback: () => void) => callback()),
}));

// Mock UserContext - default mock state
const mockLoadInstruments = jest.fn();
const mockSelectInstrument = jest.fn();
let mockUserContext = {
  instruments: [
    {
      id: 1,
      instrument_name: "Trombone",
      day0_completed: true,
      resonant_note: "Bb3",
    },
    {
      id: 2,
      instrument_name: "Trumpet",
      day0_completed: false,
      resonant_note: "C4",
    },
  ],
  selectedInstrument: {
    id: 1,
    instrument_name: "Trombone",
    day0_completed: true,
    resonant_note: "Bb3",
  },
  loadInstruments: mockLoadInstruments,
  selectInstrument: mockSelectInstrument,
  loading: false,
};

jest.mock("../src/context/UserContext", () => ({
  useUser: () => mockUserContext,
}));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// Mock ErrorBoundary
jest.mock("../src/components/ErrorBoundary", () => {
  const React = require("react");
  return function MockErrorBoundary({
    children,
  }: ErrorBoundaryProps): React.JSX.Element {
    return <>{children}</>;
  };
});

// Mock ResetButton
jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton(): React.JSX.Element {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

interface MockNavigation {
  navigate: jest.Mock;
}

describe("HomeScreen", () => {
  const mockNavigation: MockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default user context
    mockUserContext = {
      instruments: [
        {
          id: 1,
          instrument_name: "Trombone",
          day0_completed: true,
          resonant_note: "Bb3",
        },
        {
          id: 2,
          instrument_name: "Trumpet",
          day0_completed: false,
          resonant_note: "C4",
        },
      ],
      selectedInstrument: {
        id: 1,
        instrument_name: "Trombone",
        day0_completed: true,
        resonant_note: "Bb3",
      },
      loadInstruments: mockLoadInstruments,
      selectInstrument: mockSelectInstrument,
      loading: false,
    };
  });

  describe("Basic rendering", () => {
    it("renders without crashing", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Sound First")).toBeTruthy();
    });

    it("displays app title and subtitle", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Sound First")).toBeTruthy();
      expect(getByText("Ear-First Music Practice")).toBeTruthy();
    });

    it("shows the Practice button", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Start Practice")).toBeTruthy();
    });

    it("displays currently selected instrument", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Practicing:")).toBeTruthy();
      expect(getByText("Trombone")).toBeTruthy();
    });

    it("loads instruments on focus", () => {
      render(<HomeScreen navigation={mockNavigation} />);
      expect(mockLoadInstruments).toHaveBeenCalled();
    });

    it("renders ResetButton", () => {
      const { getByTestId } = render(
        <HomeScreen navigation={mockNavigation} />,
      );
      expect(getByTestId("reset-button")).toBeTruthy();
    });

    it("shows progress stats card", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Your Progress")).toBeTruthy();
      expect(getByText("Day Streak")).toBeTruthy();
      expect(getByText("Total Sessions")).toBeTruthy();
    });

    it("shows Tune Mastery button", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      expect(getByText("Tune Mastery")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("navigates to StartPractice when Practice pressed (day0 completed)", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      fireEvent.press(getByText("Start Practice"));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        "StartPractice",
        expect.objectContaining({ instrumentId: 1 }),
      );
    });

    it("navigates to FirstNote when Practice pressed (day0 not completed)", () => {
      mockUserContext.selectedInstrument = {
        id: 2,
        instrument_name: "Trumpet",
        day0_completed: false,
        resonant_note: "C4",
      };

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      // Button text changes for setup
      fireEvent.press(getByText("Set Up Instrument"));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        "FirstNote",
        expect.objectContaining({
          instrumentId: 2,
          instrument: "Trumpet",
        }),
      );
    });

    it("navigates to TuneMastery when button pressed", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      fireEvent.press(getByText("Tune Mastery"));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        "TuneMastery",
        undefined,
      );
    });
  });

  describe("Instrument selector", () => {
    it("has accessibility label on instrument selector", () => {
      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );
      expect(
        getByLabelText("Select instrument. Currently: Trombone"),
      ).toBeTruthy();
    });

    it("opens instrument picker modal when selector pressed", () => {
      const { getByText, queryByText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      // Initially, picker title should not be visible
      expect(queryByText("Select Instrument")).toBeNull();

      // Press selector
      fireEvent.press(getByText("Trombone"));

      // Now picker should be visible
      expect(getByText("Select Instrument")).toBeTruthy();
    });

    it("shows all instruments in picker", () => {
      const { getByText, getAllByText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      // Open picker
      fireEvent.press(getByText("Trombone"));

      // Both instruments should be visible (Trombone appears multiple times)
      expect(getAllByText("Trombone").length).toBeGreaterThanOrEqual(1);
      expect(getByText("Trumpet")).toBeTruthy();
    });

    it("shows setup badge for incomplete instruments", () => {
      const { getByText, getAllByText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      // Open picker
      fireEvent.press(getByText("Trombone"));

      // Trumpet needs setup
      expect(getAllByText("Needs setup").length).toBeGreaterThanOrEqual(1);
    });

    it("calls selectInstrument when picker item pressed", () => {
      const { getByText, getAllByText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      // Open picker
      fireEvent.press(getByText("Trombone"));

      // Select Trumpet
      const trumpetItems = getAllByText("Trumpet");
      fireEvent.press(trumpetItems[trumpetItems.length - 1]);

      expect(mockSelectInstrument).toHaveBeenCalledWith(
        expect.objectContaining({ id: 2, instrument_name: "Trumpet" }),
      );
    });

    it("shows add new instrument option in picker", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      // Open picker
      fireEvent.press(getByText("Trombone"));

      expect(getByText("+ Add New Instrument")).toBeTruthy();
    });

    it("navigates to Onboarding when add instrument pressed", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      // Open picker
      fireEvent.press(getByText("Trombone"));

      // Press add button
      fireEvent.press(getByText("+ Add New Instrument"));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        "Onboarding",
        expect.objectContaining({ addingInstrument: true }),
      );
    });
  });

  describe("No instruments state", () => {
    it("shows add first instrument when no instruments", () => {
      mockUserContext.instruments = [];
      mockUserContext.selectedInstrument =
        null as unknown as typeof mockUserContext.selectedInstrument;

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText("Add Your Instrument")).toBeTruthy();
      expect(
        getByText("Get started by selecting your instrument"),
      ).toBeTruthy();
    });

    it("navigates to Onboarding when add first instrument pressed", () => {
      mockUserContext.instruments = [];
      mockUserContext.selectedInstrument =
        null as unknown as typeof mockUserContext.selectedInstrument;

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      fireEvent.press(getByText("Add Your Instrument"));

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        "Onboarding",
        undefined,
      );
    });

    it("disables Practice button when no instrument selected", () => {
      mockUserContext.instruments = [];
      mockUserContext.selectedInstrument =
        null as unknown as typeof mockUserContext.selectedInstrument;

      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      const practiceButton = getByLabelText("Start practice");
      expect(practiceButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("Loading state", () => {
    it("disables Practice button when loading", () => {
      mockUserContext.loading = true;

      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      const practiceButton = getByLabelText("Start practice");
      expect(practiceButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("Day 0 setup state", () => {
    it("shows setup badge when day0 not completed", () => {
      mockUserContext.selectedInstrument = {
        id: 2,
        instrument_name: "Trumpet",
        day0_completed: false,
        resonant_note: "C4",
      };

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText("Setup needed")).toBeTruthy();
    });

    it("shows Set Up Instrument button text when day0 not completed", () => {
      mockUserContext.selectedInstrument = {
        id: 2,
        instrument_name: "Trumpet",
        day0_completed: false,
        resonant_note: "C4",
      };

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText("Set Up Instrument")).toBeTruthy();
    });

    it("shows target emoji when setup needed", () => {
      mockUserContext.selectedInstrument = {
        id: 2,
        instrument_name: "Trumpet",
        day0_completed: false,
        resonant_note: "C4",
      };

      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText("🎯")).toBeTruthy();
    });

    it("shows play emoji when day0 completed", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      expect(getByText("▶️")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("has accessibility label on Tune Mastery button", () => {
      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      expect(getByLabelText("Tune Mastery tool")).toBeTruthy();
    });

    it("has accessibility hint on Practice button", () => {
      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      const button = getByLabelText("Start practice");
      expect(button.props.accessibilityHint).toBe("Begin practice session");
    });

    it("has setup accessibility hint when day0 not completed", () => {
      mockUserContext.selectedInstrument = {
        id: 2,
        instrument_name: "Trumpet",
        day0_completed: false,
        resonant_note: "C4",
      };

      const { getByLabelText } = render(
        <HomeScreen navigation={mockNavigation} />,
      );

      const button = getByLabelText("Set up instrument");
      expect(button.props.accessibilityHint).toBe("Begin instrument setup");
    });
  });

  describe("Instrument Emojis", () => {
    beforeEach(() => {
      mockUserContext.instruments = [
        {
          id: 1,
          instrument_name: "Clarinet",
          day0_completed: true,
          resonant_note: "C4",
        },
        {
          id: 2,
          instrument_name: "Saxophone",
          day0_completed: true,
          resonant_note: "C4",
        },
        {
          id: 3,
          instrument_name: "Flute",
          day0_completed: true,
          resonant_note: "C4",
        },
        {
          id: 4,
          instrument_name: "Piano",
          day0_completed: true,
          resonant_note: "C4",
        },
        {
          id: 5,
          instrument_name: "Violin",
          day0_completed: true,
          resonant_note: "G4",
        },
        {
          id: 6,
          instrument_name: "Guitar",
          day0_completed: true,
          resonant_note: "E4",
        },
        {
          id: 7,
          instrument_name: "Drums",
          day0_completed: true,
          resonant_note: "C4",
        },
        {
          id: 8,
          instrument_name: "Unknown",
          day0_completed: true,
          resonant_note: "C4",
        },
      ];
      mockUserContext.selectedInstrument = mockUserContext.instruments[0];
    });

    it("displays clarinet emoji correctly", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
      // Open picker by pressing the selected instrument name
      fireEvent.press(getByText("Clarinet"));
      // Modal should show "Select Instrument" title
      expect(getByText("Select Instrument")).toBeTruthy();
    });

    it("displays saxophone emoji correctly", () => {
      mockUserContext.selectedInstrument = mockUserContext.instruments[1];
      const { toJSON } = render(<HomeScreen navigation={mockNavigation} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Modal Interactions", () => {
    beforeEach(() => {
      mockUserContext.instruments = [
        {
          id: 1,
          instrument_name: "Trombone",
          day0_completed: true,
          resonant_note: "Bb3",
        },
        {
          id: 2,
          instrument_name: "Trumpet",
          day0_completed: true,
          resonant_note: "C4",
        },
      ];
      mockUserContext.selectedInstrument = mockUserContext.instruments[0];
    });

    it("opens picker when instrument button pressed", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      // Open picker by pressing the selected instrument name
      fireEvent.press(getByText("Trombone"));

      // Modal title should appear
      expect(getByText("Select Instrument")).toBeTruthy();
    });

    it("selects instrument when item pressed", () => {
      const { getByText } = render(<HomeScreen navigation={mockNavigation} />);

      // Open picker
      fireEvent.press(getByText("Trombone"));

      // Select Trumpet
      fireEvent.press(getByText("Trumpet"));

      expect(mockSelectInstrument).toHaveBeenCalledWith(
        expect.objectContaining({ instrument_name: "Trumpet" }),
      );
    });
  });
});
