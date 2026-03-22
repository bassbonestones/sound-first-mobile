/**
 * Dev navigation items - shared between ResetButton and HomeScreen
 */

export interface DevNavItem {
  screen: string;
  label: string;
  icon: string;
}

export const DEV_NAV_ITEMS: DevNavItem[] = [
  { screen: "Home", label: "Home", icon: "🏠" },
  { screen: "Composer", label: "Practice Composer", icon: "✏️" },
  { screen: "StartPractice", label: "Practice Setup", icon: "🎯" },
  { screen: "FirstNote", label: "First Note (Day 0)", icon: "🎵" },
  { screen: "SelfDirected", label: "Self-Directed Mode", icon: "🎹" },
  { screen: "TuneMastery", label: "Tune Mastery", icon: "🎸" },
  { screen: "ImportMusic", label: "Import Music", icon: "📥" },
  { screen: "MyScores", label: "My Scores", icon: "📚" },
  { screen: "History", label: "Practice History", icon: "📊" },
  { screen: "ExerciseTest", label: "Exercise Tester", icon: "🧪" },
  { screen: "GenerationPreview", label: "Generation Preview", icon: "🎹" },
  { screen: "Admin", label: "Admin Console", icon: "⚙️" },
  { screen: "Onboarding", label: "Onboarding", icon: "👋" },
];
