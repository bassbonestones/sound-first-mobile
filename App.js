import React, { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, Text } from "react-native";
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: 'red' }}>[ErrorBoundary] {String(this.state.error)}</Text>
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

const Stack = createNativeStackNavigator();


export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
      // Use a hardcoded backend URL for React Native
      // For Android emulator: 10.0.2.2, for iOS simulator: localhost
      const backendHost = Platform.OS === "android" ? "10.0.2.2" : "localhost";
      const url = `http://${backendHost}:8000/onboarding/1`;
      console.log("[Onboarding] Fetching onboarding info from:", url);
      fetch(url)
        .then((res) => {
          console.log("[Onboarding] Response status:", res.status);
          if (!res.ok) throw new Error("No onboarding");
          return res.json();
        })
        .then((data) => {
          console.log("[Onboarding] Response data:", data);
          if (data.instrument && data.resonant_note) {
            console.log("[Onboarding] Found onboarding info, navigating to StartPractice");
            setInitialRoute("StartPractice");
          } else {
            console.log("[Onboarding] Missing onboarding info, navigating to Onboarding");
            setInitialRoute("Onboarding");
          }
        })
        .catch((err) => {
          console.log("[Onboarding] Fetch error:", err);
          setInitialRoute("Onboarding");
        });
  }, []);

    if (!initialRoute) {
      return (
        <ErrorBoundary>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
