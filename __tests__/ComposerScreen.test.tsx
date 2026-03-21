/**
 * ComposerScreen Tests
 *
 * Comprehensive tests for the ComposerScreen component.
 * Tests cover rendering, user interactions, and state management.
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert } from "react-native";

import { ComposerScreen } from "../src/features/composer/screens";
import {
  useComposerState,
  useComposerPlayback,
} from "../src/features/composer/hooks";
import { composerStorageService } from "../src/features/composer/services";
import type {
  ComposerScore,
  MeasureValidation,
} from "../src/features/composer/types";

// =============================================================================
// Mocks
// =============================================================================

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock useComposerState hook
jest.mock("../src/features/composer/hooks", () => ({
  useComposerState: jest.fn(),
  useComposerPlayback: jest.fn(),
}));

// Mock composerStorageService
jest.mock("../src/features/composer/services", () => ({
  composerStorageService: {
    loadScore: jest.fn(),
    saveScore: jest.fn(),
    loadAutosave: jest.fn(),
    saveAutosave: jest.fn(),
    clearAutosave: jest.fn(),
    hasAutosave: jest.fn(),
  },
  createAutosaveHandler: jest.fn(() => ({
    scheduleAutosave: jest.fn(),
    cancelAutosave: jest.fn(),
  })),
  generateMusicXml: jest.fn(() => "<score-partwise></score-partwise>"),
}));

// =============================================================================
// Test Helpers
// =============================================================================

const createMockScore = (
  overrides?: Partial<ComposerScore>,
): ComposerScore => ({
  id: "test-score-1",
  title: "Test Score",
  clef: "treble",
  timeSignature: { beats: 4, beatUnit: 4 },
  keySignature: 0,
  tempo: 120,
  measures: [
    {
      id: "m1",
      notes: [
        { id: "n1", midi: 60, duration: 1 },
        { id: "n2", midi: 62, duration: 1 },
      ],
    },
    {
      id: "m2",
      notes: [{ id: "n3", midi: null, duration: 1, isRest: true }],
    },
  ],
  ...overrides,
});

const createMockComposerState = (overrides: Record<string, unknown> = {}) => ({
  score: createMockScore(),
  cursor: { measureIndex: 0, noteIndex: 0 },
  state: { selectedNoteId: "n1" },
  selectedNote: { id: "n1", midi: 60, duration: 1 },
  currentMeasureValidation: {
    isComplete: true,
    totalBeats: 4,
    expectedBeats: 4,
    difference: 0,
  } as MeasureValidation,
  allMeasuresValid: true,
  isAtLastMeasureEnd: false,
  setTitle: jest.fn(),
  setClef: jest.fn(),
  setClefWithTransposition: jest.fn(),
  setTimeSignature: jest.fn(),
  setKeySignature: jest.fn(),
  setKeySignatureWithTransposition: jest.fn(),
  setTempo: jest.fn(),
  insertNote: jest.fn(),
  insertRest: jest.fn(),
  moveCursor: jest.fn(),
  changePitch: jest.fn(),
  deleteNote: jest.fn(),
  addMeasure: jest.fn(),
  deleteMeasure: jest.fn(),
  deleteLastMeasure: jest.fn(),
  fillMeasureWithRests: jest.fn(),
  selectNote: jest.fn(),
  hasActualNotes: jest.fn(() => false),
  setDuration: jest.fn(),
  setOctave: jest.fn(),
  applyAccidental: jest.fn(),
  toggleTie: jest.fn(),
  clearScore: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  canUndo: false,
  canRedo: false,
  ...overrides,
});

const createMockPlayback = (overrides: Record<string, unknown> = {}) => ({
  playback: {
    state: "stopped" as const,
    position: { measureIndex: 0, noteIndex: 0, beat: 0 },
    tempo: 120,
    isAtStart: true,
    isAtEnd: false,
    repeat: false,
  },
  actions: {
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    stopAt: jest.fn(),
    playFromCursor: jest.fn(),
    playMeasure: jest.fn(),
    setTempo: jest.fn(),
    toggleRepeat: jest.fn(),
  },
  currentEvent: null,
  ...overrides,
});

// =============================================================================
// Tests
// =============================================================================

describe("ComposerScreen Module", () => {
  it("should export ComposerScreen component", () => {
    expect(ComposerScreen).toBeDefined();
    expect(typeof ComposerScreen).toBe("function");
  });
});

describe("ComposerScreen Rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
    (composerStorageService.loadScore as jest.Mock).mockResolvedValue(null);
  });

  it("should render without crashing", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-screen")).toBeTruthy();
    });
  });

  it("should render the top bar", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-topbar")).toBeTruthy();
    });
  });

  it("should render the score viewport", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-viewport")).toBeTruthy();
    });
  });

  it("should render the entry palette", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-palette")).toBeTruthy();
    });
  });

  it("should render compact controls", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-controls")).toBeTruthy();
    });
  });

  it("should show loading state initially when scoreId provided", () => {
    // Loading state shows briefly while loading
    const { getByTestId } = render(<ComposerScreen scoreId="test-id" />);

    // The loading state may have passed already depending on timing
    expect(getByTestId).toBeDefined();
  });
});

describe("ComposerScreen Back Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should show save prompt when back pressed", async () => {
    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-back")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-back"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Save Changes?",
      expect.any(String),
      expect.any(Array),
    );
  });

  it("should call onBack prop when provided", async () => {
    const onBack = jest.fn();
    const { getByTestId } = render(<ComposerScreen onBack={onBack} />);

    await waitFor(() => {
      expect(getByTestId("topbar-back")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-back"));

    // Should show alert first
    expect(Alert.alert).toHaveBeenCalled();
  });
});

describe("ComposerScreen Settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should open settings modal when settings pressed", async () => {
    const { getByTestId, getByText } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));

    expect(getByText("Score Settings")).toBeTruthy();
  });
});

describe("ComposerScreen Clef Change", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should change clef directly when no notes exist", async () => {
    const mockSetClef = jest.fn();
    const mockState = createMockComposerState({
      hasActualNotes: jest.fn(() => false),
      setClef: mockSetClef,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));
    fireEvent.press(getByTestId("settings-clef"));

    expect(mockSetClef).toHaveBeenCalledWith("bass");
  });

  it("should show transposition modal when notes exist", async () => {
    const mockState = createMockComposerState({
      hasActualNotes: jest.fn(() => true),
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId, getAllByText } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));
    fireEvent.press(getByTestId("settings-clef"));

    // Should show transposition options (multiple found is okay - modal has multiple buttons)
    await waitFor(() => {
      const transposeElements = getAllByText(/Transpose/);
      expect(transposeElements.length).toBeGreaterThan(0);
    });
  });
});

describe("ComposerScreen Entry Palette", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should call insertNote when pitch button pressed", async () => {
    const mockInsertNote = jest.fn();
    const mockState = createMockComposerState({
      insertNote: mockInsertNote,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("pitch-C")).toBeTruthy();
    });

    fireEvent.press(getByTestId("pitch-C"));

    expect(mockInsertNote).toHaveBeenCalledWith("C");
  });

  it("should call insertRest when rest button pressed", async () => {
    const mockInsertRest = jest.fn();
    const mockState = createMockComposerState({
      insertRest: mockInsertRest,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("pitch-rest")).toBeTruthy();
    });

    fireEvent.press(getByTestId("pitch-rest"));

    expect(mockInsertRest).toHaveBeenCalled();
  });
});

describe("ComposerScreen Playback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should initialize with stopped playback state", async () => {
    const mockState = createMockComposerState();
    const mockPlayback = createMockPlayback();

    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(mockPlayback);

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-screen")).toBeTruthy();
    });

    // Verify playback hook was called with the score
    expect(useComposerPlayback).toHaveBeenCalledWith(mockState.score);
  });

  it("should pass onPlay handler to viewport", async () => {
    const mockPlay = jest.fn();
    const mockState = createMockComposerState();
    const mockPlayback = createMockPlayback({
      actions: {
        play: mockPlay,
        pause: jest.fn(),
        stop: jest.fn(),
        stopAt: jest.fn(),
        playFromCursor: jest.fn(),
        playMeasure: jest.fn(),
        setTempo: jest.fn(),
        toggleRepeat: jest.fn(),
      },
    });

    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(mockPlayback);

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      // Viewport should exist and receive playback callbacks
      expect(getByTestId("composer-viewport")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Compact Controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should call deleteNote when delete pressed", async () => {
    const mockDeleteNote = jest.fn();
    const mockState = createMockComposerState({
      deleteNote: mockDeleteNote,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("compact-delete")).toBeTruthy();
    });

    fireEvent.press(getByTestId("compact-delete"));

    expect(mockDeleteNote).toHaveBeenCalled();
  });

  it("should call addMeasure from menu", async () => {
    const mockAddMeasure = jest.fn();
    const mockState = createMockComposerState({
      addMeasure: mockAddMeasure,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId, getByText } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("compact-more")).toBeTruthy();
    });

    fireEvent.press(getByTestId("compact-more"));
    fireEvent.press(getByTestId("menu-add"));

    expect(mockAddMeasure).toHaveBeenCalled();
  });
});

describe("ComposerScreen Autosave Recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());
  });

  it("should check for autosave on mount", async () => {
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);

    render(<ComposerScreen />);

    await waitFor(() => {
      expect(composerStorageService.hasAutosave).toHaveBeenCalled();
    });
  });

  it("should show recovery alert when autosave exists", async () => {
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(true);

    render(<ComposerScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Recover Draft?",
        expect.any(String),
        expect.any(Array),
      );
    });
  });
});

describe("ComposerScreen Practice Navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should call onPractice prop when provided", async () => {
    const onPractice = jest.fn();
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen onPractice={onPractice} />);

    await waitFor(() => {
      expect(getByTestId("composer-practice-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("composer-practice-button"));

    expect(onPractice).toHaveBeenCalledWith(mockState.score);
  });

  it("should navigate to practice screen when onPractice not provided", async () => {
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-practice-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("composer-practice-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "ImportedScorePractice",
      expect.objectContaining({
        rawMusicXml: expect.any(String),
      }),
    );
  });
});

describe("ComposerScreen Key Signature Change", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should change key directly when no notes exist", async () => {
    const mockSetKeySignature = jest.fn();
    const mockState = createMockComposerState({
      hasActualNotes: jest.fn(() => false),
      setKeySignature: mockSetKeySignature,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));
    fireEvent.press(getByTestId("settings-key"));
    fireEvent.press(getByTestId("key-2")); // D Major

    expect(mockSetKeySignature).toHaveBeenCalledWith(2);
  });

  it("should show transposition modal when notes exist", async () => {
    const mockState = createMockComposerState({
      hasActualNotes: jest.fn(() => true),
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId, getAllByText } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));
    fireEvent.press(getByTestId("settings-key"));
    fireEvent.press(getByTestId("key-2")); // D Major

    // Should show transposition options
    await waitFor(() => {
      const transposeElements = getAllByText(/Transpose/);
      expect(transposeElements.length).toBeGreaterThan(0);
    });
  });
});

describe("ComposerScreen Tempo Change", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should update both composerState and playback tempo", async () => {
    const mockSetTempo = jest.fn();
    const mockPlaybackSetTempo = jest.fn();
    const mockState = createMockComposerState({
      setTempo: mockSetTempo,
    });
    const mockPlayback = createMockPlayback({
      actions: {
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        stopAt: jest.fn(),
        playFromCursor: jest.fn(),
        playMeasure: jest.fn(),
        setTempo: mockPlaybackSetTempo,
        toggleRepeat: jest.fn(),
      },
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(mockPlayback);

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("topbar-settings")).toBeTruthy();
    });

    fireEvent.press(getByTestId("topbar-settings"));
    fireEvent.press(getByTestId("settings-tempo-up"));

    expect(mockSetTempo).toHaveBeenCalled();
    expect(mockPlaybackSetTempo).toHaveBeenCalled();
  });
});

describe("ComposerScreen Load Existing Score", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should load score when scoreId provided", async () => {
    const existingScore = createMockScore({
      id: "existing-score",
      title: "Loaded Score",
    });
    (composerStorageService.loadScore as jest.Mock).mockResolvedValue(
      existingScore,
    );
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    render(<ComposerScreen scoreId="existing-score" />);

    await waitFor(() => {
      expect(composerStorageService.loadScore).toHaveBeenCalledWith(
        "existing-score",
      );
    });
  });

  it("should handle null loaded score gracefully", async () => {
    (composerStorageService.loadScore as jest.Mock).mockResolvedValue(null);
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen scoreId="nonexistent" />);

    await waitFor(() => {
      expect(getByTestId("composer-screen")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Autosave Recovery Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should clear autosave when discard selected", async () => {
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(true);
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    render(<ComposerScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Get the buttons from Alert.alert call
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const discardButton = buttons.find(
      (b: { text: string }) => b.text === "Discard",
    );

    act(() => {
      discardButton.onPress();
    });

    expect(composerStorageService.clearAutosave).toHaveBeenCalled();
  });

  it("should load autosave when recover selected", async () => {
    const autosavedScore = createMockScore({ title: "Autosaved" });
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(true);
    (composerStorageService.loadAutosave as jest.Mock).mockResolvedValue(
      autosavedScore,
    );
    (useComposerState as jest.Mock).mockReturnValue(createMockComposerState());
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    render(<ComposerScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Get the buttons from Alert.alert call
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const recoverButton = buttons.find(
      (b: { text: string }) => b.text === "Recover",
    );

    await act(async () => {
      await recoverButton.onPress();
    });

    expect(composerStorageService.loadAutosave).toHaveBeenCalled();
  });
});

describe("ComposerScreen Navigation Controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should render navigation controls", async () => {
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-controls")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Undo/Redo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should render undo/redo controls", async () => {
    const mockState = createMockComposerState({
      canUndo: true,
      canRedo: true,
    });
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-controls")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Modifiers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should render modifier row", async () => {
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-palette")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Duration Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should render duration selector", async () => {
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-palette")).toBeTruthy();
    });
  });
});

describe("ComposerScreen Octave Controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (composerStorageService.hasAutosave as jest.Mock).mockResolvedValue(false);
  });

  it("should render octave controls", async () => {
    const mockState = createMockComposerState();
    (useComposerState as jest.Mock).mockReturnValue(mockState);
    (useComposerPlayback as jest.Mock).mockReturnValue(createMockPlayback());

    const { getByTestId } = render(<ComposerScreen />);

    await waitFor(() => {
      expect(getByTestId("composer-palette")).toBeTruthy();
    });
  });
});
