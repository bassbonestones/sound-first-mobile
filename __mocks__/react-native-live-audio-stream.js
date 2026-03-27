/**
 * Manual mock for react-native-live-audio-stream
 * Jest automatically uses this when the module is required
 */

// Store callbacks for event simulation in tests
const callbacks = {
  data: null,
};

const mockLiveAudioStream = {
  init: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  on: jest.fn((event, callback) => {
    if (event === "data") {
      callbacks.data = callback;
    }
  }),
  // Helper for tests to simulate audio data
  __simulateData: (data) => {
    if (callbacks.data) {
      callbacks.data(data);
    }
  },
  // Helper to reset state between tests
  __reset: () => {
    callbacks.data = null;
    mockLiveAudioStream.init.mockClear();
    mockLiveAudioStream.start.mockClear();
    mockLiveAudioStream.stop.mockClear();
    mockLiveAudioStream.on.mockClear();
  },
};

module.exports = {
  default: mockLiveAudioStream,
};
