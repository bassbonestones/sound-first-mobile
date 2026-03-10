import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Platform, LogBox } from "react-native";

// Suppress warnings from dependencies we can't fix
LogBox.ignoreLogs(["props.pointerEvents is deprecated"]);

// For web: filter console warnings that come from dependencies we can't fix
if (Platform.OS === "web") {
  const originalWarn = console.warn;
  const suppressedWarnings = [
    "props.pointerEvents is deprecated", // from react-native-webview
    '"shadow*" style props are deprecated', // from RN dependencies using shadow* instead of boxShadow
  ];
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      suppressedWarnings.some((w) => message.includes(w))
    ) {
      return; // Suppress this warning
    }
    originalWarn.apply(console, args);
  };
}

// Centralized API client
import { getBackendUrl } from "./src/api/client";

// ============= STARTUP TIMING =============
const TIMING = {
  bundleLoaded: Date.now(), // When JS bundle finished loading (Expo startup complete)
};

// Log to both console and server
function logTiming(event, data) {
  const message = `[TIMING] ${event}`;
  const fullData = { ...data, platform: Platform.OS };

  // Console log (shows in browser dev tools)
  console.log(message, fullData);

  // Server log (shows in uvicorn/Metro terminal)
  fetch(`${getBackendUrl()}/log/client`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: `TIMING: ${event}`,
      data: fullData,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {}); // Ignore errors - logging shouldn't break the app
}

logTiming("Bundle loaded", {
  timestamp: new Date(TIMING.bundleLoaded).toISOString(),
});
console.log("[App.js] File loaded");
// Simple error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.log("[ErrorBoundary] Caught error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "red" }}>
            [ErrorBoundary] {String(this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserProvider } from "./src/context/UserContext";
import HomeScreen from "./src/screens/HomeScreen";
import StartPracticeScreen from "./src/screens/StartPracticeScreen";
import SessionScreen from "./src/screens/Session";
import SessionEndScreen from "./src/screens/SessionEndScreen";
import FocusCardScreen from "./src/screens/FocusCardScreen";
import RatingScreen from "./src/screens/RatingScreen";
import OnboardingScreen from "./src/screens/Onboarding";
import SelfDirectedScreen from "./src/screens/SelfDirectedScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import AdminScreen from "./src/screens/Admin";
import FirstNoteScreen from "./src/screens/FirstNote";
import ExerciseTestScreen from "./src/screens/ExerciseTestScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState("Home");

  useEffect(() => {
    // ============= APP STARTUP TIMING =============
    const appMountTime = Date.now();
    const expoStartupMs = appMountTime - TIMING.bundleLoaded;

    logTiming("App mounted", {
      expoStartupMs,
      timestamp: new Date(appMountTime).toISOString(),
    });

    // Home screen now handles instrument selection and Day 0 routing
    logTiming("Startup complete - Home screen", {
      expoStartupMs,
      breakdown: `Expo=${expoStartupMs}ms`,
    });
  }, []);

  return (
    <ErrorBoundary>
      <UserProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Sound First", headerShown: false }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ title: "Welcome" }}
            />
            <Stack.Screen
              name="FirstNote"
              component={FirstNoteScreen}
              options={{ title: "Your First Note", headerShown: false }}
            />
            <Stack.Screen
              name="StartPractice"
              component={StartPracticeScreen}
              options={{ title: "Practice Setup" }}
            />
            <Stack.Screen
              name="SelfDirected"
              component={SelfDirectedScreen}
              options={{ title: "Self-Directed Mode" }}
            />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{ title: "Practice Session", headerShown: false }}
            />
            <Stack.Screen
              name="SessionEnd"
              component={SessionEndScreen}
              options={{ title: "Session Complete", headerShown: false }}
            />
            <Stack.Screen
              name="FocusCard"
              component={FocusCardScreen}
              options={{ title: "Focus Card" }}
            />
            <Stack.Screen
              name="Rating"
              component={RatingScreen}
              options={{ title: "Rate Practice" }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: "Practice History" }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{ title: "Admin Console", headerShown: false }}
            />
            <Stack.Screen
              name="ExerciseTest"
              component={ExerciseTestScreen}
              options={{ title: "Exercise Tester", headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </ErrorBoundary>
  );
}
