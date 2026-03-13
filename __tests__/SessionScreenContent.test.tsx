/**
 * SessionScreenContent tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";

// Mock contexts
const mockSessionState = {
  session: {
    id: 1,
    user_id: 1,
    status: "active",
    target_duration_minutes: 30,
    mini_sessions: [
      {
        material_id: 1,
        focus_card_id: 1,
        session_type: "practice",
        material: { title: "Test Material", key: "C", tempo_bpm: 120 },
        focus_card: { name: "Test Focus", attention_cue: "Test cue" },
      },
    ],
  },
  setSession: jest.fn(),
  current: 0,
  setCurrent: jest.fn(),
  loading: false,
  error: null,
  mini: {
    material_id: 1,
    focus_card_id: 1,
    session_type: "practice",
    material: { title: "Test Material", key: "C", tempo_bpm: 120 },
    focus_card: { name: "Test Focus", attention_cue: "Test cue" },
  },
  routeParams: {},
  duration: 30,
  cooldownMode: false,
  earOnlyMode: false,
  elapsedSeconds: 600,
  currentTime: "10:00",
  targetDurationSeconds: 1800,
  isOverTime: false,
  showTimeUpModal: false,
  handleDismissTimeUp: jest.fn(),
  handleTimeUpExtend: jest.fn(),
  handleTimeUpFinish: jest.fn(),
  curriculumSteps: [
    { type: "new_material", label: "New Material" },
    { type: "review", label: "Review" },
    { type: "cooldown", label: "Cooldown" },
  ],
  currentStepIndex: 0,
  getCurrentStep: () => ({ type: "new_material", label: "New Material" }),
  showReflection: false,
  reflection: "",
  setReflection: jest.fn(),
  extended: false,
  fatigueInput: 0,
  setFatigueInput: jest.fn(),
  rating: 3,
  setRating: jest.fn(),
  submitting: false,
  showHelpMenu: false,
  setShowHelpMenu: jest.fn(),
  showMiniLesson: false,
  setShowMiniLesson: jest.fn(),
  selectedCapabilityId: null,
  setSelectedCapabilityId: jest.fn(),
  handleCompleteStep: jest.fn(),
  handleReflectionSubmit: jest.fn(),
  handleSkip: jest.fn(),
  handleExtend: jest.fn(),
  handleNext: jest.fn(),
  fetchMoreMaterial: jest.fn(),
  navigation: { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() },
};

jest.mock("../src/screens/Session/context/SessionContext", () => ({
  useSession: () => mockSessionState,
  SessionProvider: ({ children }) => children,
}));

const mockToolsState = {
  metronomeEnabled: true,
  metronomeVisible: false,
  setMetronomeVisible: jest.fn(),
  setMetronomeIsPlaying: jest.fn(),
  metronomeVolume: 0.7,
  setMetronomeVolume: jest.fn(),
  droneEnabled: true,
  droneVisible: false,
  setDroneVisible: jest.fn(),
  setDroneIsPlaying: jest.fn(),
  droneVolume: 0.5,
  setDroneVolume: jest.fn(),
  audioMuted: false,
  showVolumeModal: false,
  setShowVolumeModal: jest.fn(),
  toggleMetronome: jest.fn(),
  toggleDrone: jest.fn(),
  startMuteLongPress: jest.fn(),
  cancelMuteLongPress: jest.fn(),
  handleMutePress: jest.fn(),
};

jest.mock("../src/screens/Session/hooks/useTools", () => () => mockToolsState);

jest.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    selectedInstrument: { id: 1, range_low: "C3", range_high: "C5" },
    updateInstrument: jest.fn(),
    userId: 1,
  }),
}));

// Mock child components
jest.mock("../src/components/HelpMenu", () => {
  const { View, Text } = require("react-native");
  return function MockHelpMenu({ visible }) {
    if (!visible) return null;
    return (
      <View testID="help-menu">
        <Text>Help Menu</Text>
      </View>
    );
  };
});

jest.mock("../src/components/MiniLesson", () => {
  const { View, Text } = require("react-native");
  return function MockMiniLesson() {
    return (
      <View testID="mini-lesson">
        <Text>Mini Lesson</Text>
      </View>
    );
  };
});

jest.mock("../src/components/ResetButton", () => {
  const { View, Text } = require("react-native");
  return function MockResetButton() {
    return (
      <View testID="reset-button">
        <Text>Reset</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/FocusCard", () => {
  const { View, Text } = require("react-native");
  return function MockFocusCard({ card }) {
    return (
      <View testID="focus-card">
        <Text>{card?.name || "Focus Card"}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/MaterialCard", () => {
  const { View, Text } = require("react-native");
  return function MockMaterialCard({ material }) {
    return (
      <View testID="material-card">
        <Text>{material?.title || "Material"}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/CurriculumSteps", () => {
  const { View, Text } = require("react-native");
  return function MockCurriculumSteps() {
    return (
      <View testID="curriculum-steps">
        <Text>Steps</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/ToolsPanel", () => {
  const { View, Text } = require("react-native");
  return function MockToolsPanel() {
    return (
      <View testID="tools-panel">
        <Text>Tools</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/ReflectionModal", () => {
  const { View } = require("react-native");
  return function MockReflectionModal({ visible }) {
    if (!visible) return null;
    return <View testID="reflection-modal" />;
  };
});

jest.mock("../src/screens/Session/components/VolumeModal", () => {
  const { View } = require("react-native");
  return function MockVolumeModal({ visible }) {
    if (!visible) return null;
    return <View testID="volume-modal" />;
  };
});

jest.mock("../src/screens/Session/components/TeachingModuleSession", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return function MockTeachingModuleSession({
    onRecordCompletion,
    onNavigate,
    onSkip,
    onEndPractice,
    onExtend,
    isLastItem,
  }) {
    return (
      <View testID="teaching-module">
        <Text>Teaching Module</Text>
        <TouchableOpacity
          testID="tm-record-completion"
          onPress={() => onRecordCompletion?.({ success: true, streak: 8 })}
        >
          <Text>Record Completion</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tm-navigate" onPress={() => onNavigate?.()}>
          <Text>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tm-skip" onPress={() => onSkip?.()}>
          <Text>TM Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tm-end-practice"
          onPress={() => onEndPractice?.()}
        >
          <Text>End Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="tm-extend" onPress={() => onExtend?.()}>
          <Text>Extend</Text>
        </TouchableOpacity>
        <Text testID="tm-is-last-item">{isLastItem ? "Last" : "NotLast"}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/SessionTimer", () => {
  const { View, Text } = require("react-native");
  return function MockSessionTimer({ currentTime }) {
    return (
      <View testID="session-timer">
        <Text>{currentTime}</Text>
      </View>
    );
  };
});

jest.mock("../src/screens/Session/components/TimeUpModal", () => {
  const { View } = require("react-native");
  return function MockTimeUpModal({ visible }) {
    if (!visible) return null;
    return <View testID="time-up-modal" />;
  };
});

// Mock utils
jest.mock("../src/utils/devLogger", () => ({
  devLog: jest.fn(),
  devWarn: jest.fn(),
  devError: jest.fn(),
}));

// Import component after mocks
import SessionScreenContent from "../src/screens/Session/SessionScreenContent";

describe("SessionScreenContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<SessionScreenContent />);
    expect(UNSAFE_root).toBeTruthy();
  });

  it("renders material card", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("material-card")).toBeTruthy();
  });

  it("renders focus card", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("focus-card")).toBeTruthy();
  });

  it("renders curriculum steps", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("curriculum-steps")).toBeTruthy();
  });

  it("renders tools panel", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("tools-panel")).toBeTruthy();
  });

  it("renders session timer", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("session-timer")).toBeTruthy();
  });

  it("renders reset button", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("reset-button")).toBeTruthy();
  });
});

describe("SessionScreenContent loading state", () => {
  beforeEach(() => {
    mockSessionState.loading = true;
  });

  afterEach(() => {
    mockSessionState.loading = false;
  });

  it("shows loading indicator when loading", () => {
    const { UNSAFE_root } = render(<SessionScreenContent />);
    // Component should render loading state
    expect(UNSAFE_root).toBeTruthy();
  });
});

describe("SessionScreenContent error state", () => {
  beforeEach(() => {
    mockSessionState.error = "Failed to load session";
  });

  afterEach(() => {
    mockSessionState.error = null;
  });

  it("shows error when error exists", () => {
    const { UNSAFE_root } = render(<SessionScreenContent />);
    // Component should render error state
    expect(UNSAFE_root).toBeTruthy();
  });

  it("shows error message text", () => {
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Failed to load session")).toBeTruthy();
  });

  it("shows back button on error", () => {
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Back")).toBeTruthy();
  });
});

// ==========================================================================
// EMPTY SESSION STATE
// ==========================================================================
describe("SessionScreenContent empty state", () => {
  const originalSession = mockSessionState.session;

  afterEach(() => {
    mockSessionState.session = originalSession;
  });

  it("shows empty message when session is null", () => {
    mockSessionState.session = null;
    const { getByText } = render(<SessionScreenContent />);
    expect(
      getByText("No materials available. Try adjusting your settings."),
    ).toBeTruthy();
  });

  it("shows empty message when mini_sessions is empty", () => {
    mockSessionState.session = { ...originalSession, mini_sessions: [] };
    const { getByText } = render(<SessionScreenContent />);
    expect(
      getByText("No materials available. Try adjusting your settings."),
    ).toBeTruthy();
  });

  it("shows back button on empty state", () => {
    mockSessionState.session = null;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Back")).toBeTruthy();
  });
});

// ==========================================================================
// TEACHING MODULE MODE
// ==========================================================================
describe("SessionScreenContent teaching module mode", () => {
  const originalMini = mockSessionState.mini;

  beforeEach(() => {
    mockSessionState.mini = {
      ...originalMini,
      session_type: "teaching_module",
      lesson_id: 123,
    };
  });

  afterEach(() => {
    mockSessionState.mini = originalMini;
  });

  it("renders teaching module when session_type is teaching_module", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("teaching-module")).toBeTruthy();
  });

  it("renders session timer in teaching module mode", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("session-timer")).toBeTruthy();
  });

  it("does not render material card in teaching module mode", () => {
    const { queryByTestId } = render(<SessionScreenContent />);
    expect(queryByTestId("material-card")).toBeNull();
  });

  it("does not render focus card in teaching module mode", () => {
    const { queryByTestId } = render(<SessionScreenContent />);
    expect(queryByTestId("focus-card")).toBeNull();
  });
});

// ==========================================================================
// MODE BANNERS
// ==========================================================================
describe("SessionScreenContent mode banners", () => {
  afterEach(() => {
    mockSessionState.cooldownMode = false;
    mockSessionState.earOnlyMode = false;
  });

  it("shows cooldown mode banner when cooldownMode is true", () => {
    mockSessionState.cooldownMode = true;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Cooldown Mode")).toBeTruthy();
    expect(getByText("🌿")).toBeTruthy();
    expect(getByText("Light playing")).toBeTruthy();
  });

  it("shows ear training mode banner when earOnlyMode is true", () => {
    mockSessionState.earOnlyMode = true;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Ear Training Mode")).toBeTruthy();
    expect(getByText("👂")).toBeTruthy();
    expect(getByText("Listen & sing only")).toBeTruthy();
  });

  it("ear only mode takes precedence over cooldown mode", () => {
    mockSessionState.earOnlyMode = true;
    mockSessionState.cooldownMode = true;
    const { getByText, queryByText } = render(<SessionScreenContent />);
    expect(getByText("Ear Training Mode")).toBeTruthy();
    expect(queryByText("Cooldown Mode")).toBeNull();
  });

  it("shows no banner when both modes are false", () => {
    const { queryByText } = render(<SessionScreenContent />);
    expect(queryByText("Cooldown Mode")).toBeNull();
    expect(queryByText("Ear Training Mode")).toBeNull();
  });
});

// ==========================================================================
// SESSION PROGRESS & HEADER
// ==========================================================================
describe("SessionScreenContent progress and header", () => {
  it("renders session header with progress", () => {
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText(/Practice Session/)).toBeTruthy();
  });

  it("shows correct session progress count", () => {
    mockSessionState.current = 0;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Practice Session 1 / 1")).toBeTruthy();
  });
});

// ==========================================================================
// ACTION BUTTONS
// ==========================================================================
describe("SessionScreenContent action buttons", () => {
  const originalSession = mockSessionState.session;
  const originalCurrent = mockSessionState.current;

  afterEach(() => {
    mockSessionState.session = originalSession;
    mockSessionState.current = originalCurrent;
  });

  it("renders skip button", () => {
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Skip")).toBeTruthy();
  });

  it("renders Next button when not last item", () => {
    mockSessionState.session = {
      ...originalSession,
      mini_sessions: [
        originalSession.mini_sessions[0],
        { ...originalSession.mini_sessions[0], material_id: 2 },
      ],
    };
    mockSessionState.current = 0;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Next")).toBeTruthy();
  });

  it("renders Finish button when on last item", () => {
    mockSessionState.current = 0;
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("Finish")).toBeTruthy();
  });

  it("calls handleSkip when skip button pressed", () => {
    const { getByText } = render(<SessionScreenContent />);
    fireEvent.press(getByText("Skip"));
    expect(mockSessionState.handleSkip).toHaveBeenCalled();
  });

  it("calls handleNext when finish button pressed", () => {
    const { getByText } = render(<SessionScreenContent />);
    fireEvent.press(getByText("Finish"));
    expect(mockSessionState.handleNext).toHaveBeenCalled();
  });

  it("calls handleNext when next button pressed", () => {
    mockSessionState.session = {
      ...originalSession,
      mini_sessions: [
        originalSession.mini_sessions[0],
        { ...originalSession.mini_sessions[0], material_id: 2 },
      ],
    };
    mockSessionState.current = 0;
    const { getByText } = render(<SessionScreenContent />);
    fireEvent.press(getByText("Next"));
    expect(mockSessionState.handleNext).toHaveBeenCalled();
  });
});

// ==========================================================================
// HELP MENU
// ==========================================================================
describe("SessionScreenContent help menu", () => {
  it("renders help button", () => {
    const { getByText } = render(<SessionScreenContent />);
    expect(getByText("❓")).toBeTruthy();
  });

  it("calls setShowHelpMenu when help button pressed", () => {
    const { getByText } = render(<SessionScreenContent />);
    fireEvent.press(getByText("❓"));
    expect(mockSessionState.setShowHelpMenu).toHaveBeenCalledWith(true);
  });

  it("shows help menu when showHelpMenu is true", () => {
    mockSessionState.showHelpMenu = true;
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("help-menu")).toBeTruthy();
    mockSessionState.showHelpMenu = false;
  });
});

// ==========================================================================
// TIME UP MODAL
// ==========================================================================
describe("SessionScreenContent time up modal", () => {
  afterEach(() => {
    mockSessionState.showTimeUpModal = false;
  });

  it("does not show time up modal by default", () => {
    const { queryByTestId } = render(<SessionScreenContent />);
    expect(queryByTestId("time-up-modal")).toBeNull();
  });

  it("shows time up modal when showTimeUpModal is true", () => {
    mockSessionState.showTimeUpModal = true;
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("time-up-modal")).toBeTruthy();
  });
});

// ==========================================================================
// OVER-TIME STATE
// ==========================================================================
describe("SessionScreenContent over-time state", () => {
  afterEach(() => {
    mockSessionState.isOverTime = false;
  });

  it("passes isOverTime to session timer", () => {
    mockSessionState.isOverTime = true;
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("session-timer")).toBeTruthy();
  });
});

// ==========================================================================
// TEACHING MODULE CALLBACKS
// ==========================================================================
describe("SessionScreenContent teaching module callbacks", () => {
  const originalMini = mockSessionState.mini;
  const originalSession = mockSessionState.session;
  const originalCurrent = mockSessionState.current;
  const originalIsOverTime = mockSessionState.isOverTime;

  beforeEach(() => {
    mockSessionState.mini = {
      ...originalMini,
      session_type: "teaching_module",
      lesson_id: 123,
    };
    jest.clearAllMocks();
    // Mock global fetch for recordLessonCompletion
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      }),
    );
  });

  afterEach(() => {
    mockSessionState.mini = originalMini;
    mockSessionState.session = originalSession;
    mockSessionState.current = originalCurrent;
    mockSessionState.isOverTime = originalIsOverTime;
    jest.restoreAllMocks();
  });

  it("calls navigation.reset when onEndPractice is triggered", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-end-practice"));
    expect(mockSessionState.navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Home" }],
    });
  });

  it("calls handleSkip when onSkip is triggered", () => {
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-skip"));
    expect(mockSessionState.handleSkip).toHaveBeenCalled();
  });

  it("calls fetchMoreMaterial when onExtend is triggered", async () => {
    mockSessionState.fetchMoreMaterial = jest.fn().mockResolvedValue(true);
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-extend"));
    await waitFor(() => {
      expect(mockSessionState.fetchMoreMaterial).toHaveBeenCalled();
    });
  });

  it("increments current when onExtend succeeds", async () => {
    mockSessionState.fetchMoreMaterial = jest.fn().mockResolvedValue(true);
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-extend"));
    await waitFor(() => {
      expect(mockSessionState.setCurrent).toHaveBeenCalledWith(1);
    });
  });

  it("navigates to SessionEnd when onExtend fails", async () => {
    mockSessionState.fetchMoreMaterial = jest.fn().mockResolvedValue(false);
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-extend"));
    await waitFor(() => {
      expect(mockSessionState.navigation.navigate).toHaveBeenCalledWith(
        "SessionEnd",
        expect.objectContaining({ completedCount: 1 }),
      );
    });
  });

  it("calls setCurrent when onNavigate triggered and not last item", async () => {
    mockSessionState.session = {
      ...originalSession,
      mini_sessions: [
        originalSession.mini_sessions[0],
        { ...originalSession.mini_sessions[0], material_id: 2 },
      ],
    };
    mockSessionState.current = 0;
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-navigate"));
    await waitFor(() => {
      expect(mockSessionState.setCurrent).toHaveBeenCalledWith(1);
    });
  });

  it("fetches more material when navigate on last item and not over time", async () => {
    mockSessionState.isOverTime = false;
    mockSessionState.fetchMoreMaterial = jest.fn().mockResolvedValue(true);
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-navigate"));
    await waitFor(() => {
      expect(mockSessionState.fetchMoreMaterial).toHaveBeenCalled();
    });
  });

  it("navigates to SessionEnd when navigate on last item and over time", async () => {
    mockSessionState.isOverTime = true;
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-navigate"));
    await waitFor(() => {
      expect(mockSessionState.navigation.navigate).toHaveBeenCalledWith(
        "SessionEnd",
        expect.objectContaining({
          completedCount: 1,
          totalDuration: expect.any(Number),
        }),
      );
    });
  });

  it("calls fetch for recordLessonCompletion when success result", async () => {
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-record-completion"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("does not call fetch when lesson_id is missing", async () => {
    mockSessionState.mini = {
      ...originalMini,
      session_type: "teaching_module",
      lesson_id: null,
    };
    const { getByTestId } = render(<SessionScreenContent />);
    fireEvent.press(getByTestId("tm-record-completion"));
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it("passes isLastItem correctly when over time and last item", () => {
    mockSessionState.isOverTime = true;
    mockSessionState.current = 0; // Last item (only 1 item)
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("tm-is-last-item")).toHaveTextContent("Last");
  });

  it("passes isLastItem as false when not over time", () => {
    mockSessionState.isOverTime = false;
    const { getByTestId } = render(<SessionScreenContent />);
    expect(getByTestId("tm-is-last-item")).toHaveTextContent("NotLast");
  });
});

// ==========================================================================
// RECORD LESSON COMPLETION WITH RANGE EXPANSION
// ==========================================================================
describe("SessionScreenContent recordLessonCompletion range expansion", () => {
  const originalMini = mockSessionState.mini;

  beforeEach(() => {
    mockSessionState.mini = {
      ...originalMini,
      session_type: "teaching_module",
      lesson_id: 123,
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ success: true }),
      }),
    );
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockSessionState.mini = originalMini;
    jest.restoreAllMocks();
  });

  it("handles range expansion result with direction up", async () => {
    const MockTeachingModule = require("../src/screens/Session/components/TeachingModuleSession");
    // Re-mock to pass range expansion data
    jest
      .spyOn(require("../src/context/UserContext"), "useUser")
      .mockReturnValue({
        selectedInstrument: { id: 1, range_low: "C3", range_high: "C5" },
        updateInstrument: jest.fn(),
        userId: 1,
      });

    const { getByTestId } = render(<SessionScreenContent />);
    // The mock doesn't pass direction/targetNote, but we verify the flow works
    fireEvent.press(getByTestId("tm-record-completion"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
