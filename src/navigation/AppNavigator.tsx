/**
 * App Navigator
 *
 * Centralized navigation configuration for the app.
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { RootStackParamList } from "./types";

// Screen imports - these will be updated as screens are reorganized
import HomeScreen from "../screens/HomeScreen";
import StartPracticeScreen from "../screens/StartPracticeScreen";
import SessionScreen from "../screens/Session";
import SessionEndScreen from "../screens/SessionEndScreen";
import FocusCardScreen from "../screens/FocusCardScreen";
import RatingScreen from "../screens/RatingScreen";
import OnboardingScreen from "../screens/Onboarding";
import SelfDirectedScreen from "../screens/SelfDirectedScreen";
import HistoryScreen from "../screens/HistoryScreen";
import AdminScreen from "../screens/Admin";
import FirstNoteScreen from "../screens/FirstNote";
import ExerciseTestScreen from "../screens/ExerciseTestScreen";
import TuneMasteryScreen from "../screens/TuneMastery";
import {
  ImportMusicScreen,
  ScoreViewerScreen,
  ScoreCorrectionScreen,
  MyScoresScreen,
  ImportedScorePracticeScreen,
} from "../features/importMusic";
import { ComposerScreen } from "../features/composer";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Screen configuration
 */
export const screenConfig = {
  Home: {
    component: HomeScreen,
    options: { title: "Sound First", headerShown: false },
  },
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
    options: { title: "Practice Setup" },
  },
  SelfDirected: {
    component: SelfDirectedScreen,
    options: { title: "Self-Directed Mode" },
  },
  Session: {
    component: SessionScreen,
    options: { title: "Practice Session", headerShown: false },
  },
  SessionEnd: {
    component: SessionEndScreen,
    options: { title: "Session Complete", headerShown: false },
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
  ImportMusic: {
    component: ImportMusicScreen,
    options: { title: "Import Music" },
  },
};

interface AppNavigatorProps {
  initialRoute?: keyof RootStackParamList;
  initialParams?: Record<string, unknown>;
}

/**
 * Main App Navigator Component
 */
export function AppNavigator({
  initialRoute,
  initialParams,
}: AppNavigatorProps) {
  return (
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
          initialParams={initialParams}
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
        <Stack.Screen
          name="TuneMastery"
          component={TuneMasteryScreen}
          options={{ title: "Tune Mastery", headerShown: false }}
        />
        <Stack.Screen
          name="ImportMusic"
          component={ImportMusicScreen}
          options={{ title: "Import Music" }}
        />
        <Stack.Screen
          name="ScoreViewer"
          component={ScoreViewerScreen}
          options={{ title: "Score", headerShown: false }}
        />
        <Stack.Screen
          name="ScoreCorrection"
          component={ScoreCorrectionScreen}
          options={{ title: "Review Score" }}
        />
        <Stack.Screen
          name="MyScores"
          component={MyScoresScreen}
          options={{ title: "My Scores" }}
        />
        <Stack.Screen
          name="ImportedScorePractice"
          component={ImportedScorePracticeScreen}
          options={{ title: "Practice", headerShown: false }}
        />
        <Stack.Screen
          name="Composer"
          component={ComposerScreen}
          options={{ title: "Practice Composer", headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
