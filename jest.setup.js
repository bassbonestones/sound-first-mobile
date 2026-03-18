/**
 * Jest setup file for Sound First Mobile tests
 */

// Import jest matchers from react-native testing library
require("@testing-library/react-native/matchers");

// Mock console.warn/error for cleaner test output
global.console = {
  ...console,
  // Suppress specific React Native warnings in tests
  warn: jest.fn(),
  error: jest.fn(),
};

// Re-enable for debugging when needed
// global.console = console;

// Mock Expo modules
jest.mock(
  "expo-audio",
  () => ({
    useAudioPlayer: () => ({
      play: jest.fn(),
      pause: jest.fn(),
      status: "idle",
      isPlaying: false,
    }),
    createAudioPlayer: () => ({
      play: jest.fn(),
      pause: jest.fn(),
      release: jest.fn(),
    }),
  }),
  { virtual: true },
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: "http://localhost:8000",
      },
    },
  },
}));

// Mock React Navigation
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock React Native animations
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");

  // Make Animated.timing return a mock with start
  RN.Animated.timing = () => ({
    start: jest.fn(),
    stop: jest.fn(),
  });

  RN.Animated.loop = (animation) => ({
    start: jest.fn(),
    stop: jest.fn(),
  });

  // Mock Platform for web environment in tests
  RN.Platform = {
    ...RN.Platform,
    OS: "web",
    select: (obj) => obj.web || obj.default,
  };

  return RN;
});

// Silence React Native Reanimated warnings
global.__reanimatedWorkletInit = jest.fn();

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
  }),
);

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => {
  let store = {};
  return {
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => {
      return Promise.resolve(store[key] || null);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach((key) => delete store[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(store));
    }),
  };
});
