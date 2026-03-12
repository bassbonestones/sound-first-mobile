module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: [
    "src/components/**/*.{js,jsx,ts,tsx}",
    "src/screens/**/*.{js,jsx,ts,tsx}",
    "src/hooks/**/*.{js,jsx,ts,tsx}",
    "src/types/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  // Use node environment to avoid jsdom issues with expo
  testEnvironment: "node",
};
