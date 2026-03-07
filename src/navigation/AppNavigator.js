/**
 * App Navigator
 *
 * Centralized navigation configuration for the app.
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screen imports - these will be updated as screens are reorganized
import StartPracticeScreen from "../screens/StartPracticeScreen";
import SessionScreen from "../screens/SessionScreen";
import FocusCardScreen from "../screens/FocusCardScreen";
import RatingScreen from "../screens/RatingScreen";
import OnboardingScreen from "../screens/Onboarding";
import SelfDirectedScreen from "../screens/SelfDirectedScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AdminScreen from "../screens/Admin";
import FirstNoteScreen from "../screens/FirstNote";

const Stack = createNativeStackNavigator();

/**
 * Screen configuration
 */
export const screenConfig = {
  Onboarding: {
    component: OnboardingScreen,
    options: { title: "Welcome" },
  },
  FirstNote: {
    component: FirstNoteScreen,
    options: { title: "Your First Note", headerShown: false },
  },
  StartPractice: {
    component: StartPracticeScreen,
    options: { title: "Sound First Mobile" },
  },
  SelfDirected: {
    component: SelfDirectedScreen,
    options: { title: "Self-Directed Mode" },
  },
  Session: {
    component: SessionScreen,
    options: { title: "Practice Session" },
  },
  FocusCard: {
    component: FocusCardScreen,
    options: { title: "Focus Card" },
  },
  Rating: {
    component: RatingScreen,
    options: { title: "Rate Practice" },
  },
  History: {
    component: HistoryScreen,
    options: { title: "Practice History" },
  },
  Admin: {
    component: AdminScreen,
    options: { title: "Admin Console", headerShown: false },
  },
};

/**
 * Main App Navigator Component
 *
 * @param {string} initialRoute - The initial route to display
 * @param {object} initialParams - Initial params for FirstNote screen
 */
export function AppNavigator({ initialRoute, initialParams }) {
  return (
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
          initialParams={initialParams}
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
  );
}

export default AppNavigator;
