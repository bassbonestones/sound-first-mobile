import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Platform } from "react-native";

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
import StartPracticeScreen from "./screens/StartPracticeScreen";
import SessionScreen from "./screens/SessionScreen";
import FocusCardScreen from "./screens/FocusCardScreen";
import RatingScreen from "./screens/RatingScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import SelfDirectedScreen from "./screens/SelfDirectedScreen";
import HistoryScreen from "./screens/HistoryScreen";
import AdminScreen from "./screens/AdminScreen";
import FirstNoteScreen from "./screens/FirstNoteScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [firstNoteParams, setFirstNoteParams] = useState(null);

  useEffect(() => {
    // ============= APP STARTUP TIMING =============
    const appMountTime = Date.now();
    const expoStartupMs = appMountTime - TIMING.bundleLoaded;

    logTiming("App mounted", {
      expoStartupMs,
      timestamp: new Date(appMountTime).toISOString(),
    });

    // Fetch onboarding status
    const url = `${getBackendUrl()}/onboarding/1`;
    console.log("[Onboarding] Fetching onboarding info from:", url);

    const fetchStartTime = Date.now();

    fetch(url)
      .then((res) => {
        console.log("[Onboarding] Response status:", res.status);
        if (!res.ok) throw new Error("No onboarding");
        return res.json();
      })
      .then((data) => {
        const fetchEndTime = Date.now();
        const fetchDurationMs = fetchEndTime - fetchStartTime;
        const appStartupMs = fetchEndTime - appMountTime;
        const totalMs = fetchEndTime - TIMING.bundleLoaded;

        console.log("[Onboarding] Response data:", data);

        if (data.instrument && data.resonant_note) {
          // User has completed basic onboarding
          if (data.day0_completed === false) {
            // ============= NEED DAY 0 =============
            logTiming("USER NEEDS DAY 0", {
              expoStartupMs,
              fetchMs: fetchDurationMs,
              appStartupMs,
              totalMs,
              breakdown: `Expo=${expoStartupMs}ms + App=${appStartupMs}ms`,
            });
            // Store params so FirstNote gets the correct note
            setFirstNoteParams({
              userId: 1,
              resonantNote: data.resonant_note,
              instrument: data.instrument,
            });
            setInitialRoute("FirstNote");
          } else {
            // ============= RETURNING USER SCENARIO =============
            logTiming("RETURNING USER (day0 complete)", {
              expoStartupMs,
              fetchMs: fetchDurationMs,
              appStartupMs,
              totalMs,
              breakdown: `Expo=${expoStartupMs}ms + App=${appStartupMs}ms`,
            });
            setInitialRoute("StartPractice");
          }
        } else {
          // ============= NEW USER SCENARIO =============
          logTiming("NEW USER (no instrument)", {
            expoStartupMs,
            fetchMs: fetchDurationMs,
            appStartupMs,
            totalMs,
            breakdown: `Expo=${expoStartupMs}ms + App=${appStartupMs}ms`,
          });
          setInitialRoute("Onboarding");
        }
      })
      .catch((err) => {
        const fetchEndTime = Date.now();
        const fetchDurationMs = fetchEndTime - fetchStartTime;
        const appStartupMs = fetchEndTime - appMountTime;
        const totalMs = fetchEndTime - TIMING.bundleLoaded;

        console.log("[Onboarding] Fetch error:", err);
        logTiming("NEW USER (fetch failed)", {
          expoStartupMs,
          fetchMs: fetchDurationMs,
          appStartupMs,
          totalMs,
          error: String(err),
          breakdown: `Expo=${expoStartupMs}ms + App=${appStartupMs}ms`,
        });
        setInitialRoute("Onboarding");
      });
  }, []);

  if (!initialRoute) {
    return (
      <ErrorBoundary>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#000" />
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ title: "Welcome" }}
          />
          <Stack.Screen
            name="FirstNote"
            component={FirstNoteScreen}
            options={{ title: "Your First Note", headerShown: false }}
            initialParams={firstNoteParams}
          />
          <Stack.Screen
            name="StartPractice"
            component={StartPracticeScreen}
            options={{ title: "Sound First Mobile" }}
          />
          <Stack.Screen
            name="SelfDirected"
            component={SelfDirectedScreen}
            options={{ title: "Self-Directed Mode" }}
          />
          <Stack.Screen
            name="Session"
            component={SessionScreen}
            options={{ title: "Practice Session" }}
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
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
