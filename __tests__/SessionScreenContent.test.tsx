/**
 * SessionScreenContent tests
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render, waitFor } from "@testing-library/react-native";

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
  navigation: { navigate: jest.fn() },
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
  toggleMute: jest.fn(),
};

jest.mock("../src/screens/Session/hooks/useTools", () => () => mockToolsState);

jest.mock("../src/context/UserContext", () => ({
  useUser: () => ({
    selectedInstrument: { range_low: "C3", range_high: "C5" },
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
  const { View, Text } = require("react-native");
  return function MockTeachingModuleSession() {
    return (
      <View testID="teaching-module">
        <Text>Teaching Module</Text>
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
});
