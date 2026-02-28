/**
 * Jest setup file for Sound First Mobile tests
 */

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
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    status: 'idle',
    isPlaying: false,
  }),
  createAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    release: jest.fn(),
  }),
}), { virtual: true });

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://localhost:8000',
      },
    },
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
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
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Make Animated.timing return a mock with start
  RN.Animated.timing = () => ({
    start: jest.fn(),
    stop: jest.fn(),
  });
  
  RN.Animated.loop = (animation) => ({
    start: jest.fn(),
    stop: jest.fn(),
  });
  
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
  })
);
