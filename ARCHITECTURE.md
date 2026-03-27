# Sound First Mobile - Architecture Guide

## Overview

Sound First is a React Native music education app focused on ear-first learning. This document describes the codebase architecture, patterns, and conventions for new developers.

**Tech Stack:**

- React Native with Expo (managed workflow with dev client)
- TypeScript (100% coverage)
- Jest for testing (72.5% line coverage, 7,700+ tests)
- FastAPI backend at `localhost:8000`

---

## Directory Structure

```
src/
├── api/              # Centralized API client & domain modules
├── components/       # Shared/reusable UI components
├── constants/        # App-wide constants (colors, notes, timing)
├── context/          # Global state (UserContext, SessionContext)
├── features/         # Feature modules (composer, tune-composer, etc.)
├── hooks/            # Shared custom React hooks
├── navigation/       # React Navigation configuration
├── screens/          # Screen components by feature
├── services/         # Business logic services
├── styles/           # Global styles
├── types/            # Shared TypeScript types
└── utils/            # Utility functions
```

### Feature Module Structure

Large features follow this pattern (e.g., `features/tune-composer/`):

```
features/tune-composer/
├── components/       # Feature-specific UI components
├── constants/        # Feature constants
├── hooks/           # Feature-specific hooks
├── reducers/        # State reducers
├── screens/         # Feature screens
├── services/        # Business logic
├── types/           # Feature types
├── utils/           # Feature utilities
└── index.ts         # Barrel export
```

---

## State Management Patterns

### Pattern 1: useReducer for Complex Components

Components with 5+ related state values use `useReducer` with co-located types and reducer files:

```typescript
// practicePanelTypes.ts - State and action types
export interface PracticePanelState {
  toolExpansion: ToolExpansionState;
  toolActivation: ToolActivationState;
  playback: PlaybackState;
  audio: AudioState;
  ui: UIState;
}

export type PracticePanelAction =
  | { type: "EXPAND_TUNER" }
  | { type: "SET_RATING"; payload: number }
  | { type: "TOGGLE_MUTE" };

// practicePanelReducer.ts - Pure reducer function
export function practicePanelReducer(
  state: PracticePanelState,
  action: PracticePanelAction,
): PracticePanelState {
  switch (action.type) {
    case "EXPAND_TUNER":
      return {
        ...state,
        toolExpansion: { ...state.toolExpansion, tunerExpanded: true },
      };
    // ...
  }
}

// PracticePanel.tsx - Component uses reducer
const [state, dispatch] = useReducer(
  practicePanelReducer,
  { currentScore, settings },
  createInitialPracticePanelState,
);
```

**Files follow naming convention:**

- Types: `{feature}Types.ts`
- Reducer: `{feature}Reducer.ts`
- Component: `{Feature}.tsx`

### Pattern 2: Context for Global State

Contexts provide app-wide state with memoized actions:

```typescript
// UserContext.tsx
export interface UserContextValue {
  userId: number;
  instruments: Instrument[];
  selectedInstrument: Instrument | null;
  loading: boolean;
  error: string | null;
  loadInstruments: () => Promise<void>;
  selectInstrument: (instrument: Instrument) => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const loadInstruments = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    // ...
  }, []);

  return (
    <UserContext.Provider value={{ ...state, loadInstruments }}>
      {children}
    </UserContext.Provider>
  );
}
```

### Pattern 3: Custom Hooks for Reusable Logic

Domain logic extracted into hooks with clear responsibilities:

```typescript
// useTuneComposerState.ts - Main feature hook
export function useTuneComposerState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Expose state + memoized action creators
  return { ...state, addNote, removeNote, transpose };
}

// useTuneComposerChords.ts - Sub-feature hook
export function useTuneComposerChords(score: TuneComposerScore) {
  // Chord-specific logic
}
```

---

## Component Patterns

### Barrel Exports

Every directory has an `index.ts` that re-exports public API:

```typescript
// src/components/admin/index.ts
export { FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";
export { DetailRow } from "./DetailRow";
export type { DetailRowProps } from "./DetailRow";
```

**Usage:** `import { FormField, DetailRow } from '../components/admin'`

### Component Organization

| Type              | Location                                    | Example                                        |
| ----------------- | ------------------------------------------- | ---------------------------------------------- |
| Simple component  | `ComponentName.tsx`                         | `KeyBadge.tsx`                                 |
| Complex component | `ComponentName/index.tsx`                   | `Tuner/index.tsx`                              |
| With styles       | `Component.tsx` + `styles.ts`               | `PracticePanel.tsx` + `practicePanelStyles.ts` |
| With reducer      | `Component.tsx` + `Types.ts` + `Reducer.ts` | See Pattern 1 above                            |

### Styles Pattern

Styles co-located with components:

```typescript
// practicePanelStyles.ts
import { StyleSheet } from "react-native";
import { colors, spacing } from "../../../constants";

export const practicePanelStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ...
});
```

---

## API Layer

### Structure

```
src/api/
├── client.ts         # HTTP client with platform-aware URLs
├── index.ts          # Barrel exports
├── users.ts          # User endpoints
├── sessions.ts       # Session endpoints
├── materials.ts      # Materials endpoints
├── capabilities.ts   # Capabilities endpoints
└── generation.ts     # Generation endpoints
```

### Client Pattern

```typescript
// client.ts
export const api = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(`${baseUrl}${url}`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  },
  post: async <T>(url: string, data: unknown): Promise<T> => {
    /* ... */
  },
};
```

### Domain Module Pattern

```typescript
// users.ts
import { api } from "./client";
import type { User, InstrumentCreateData } from "../types";

export async function getCurrentUser(): Promise<User> {
  return api.get("/api/users/me");
}

export async function createInstrument(
  data: InstrumentCreateData,
): Promise<Instrument> {
  return api.post("/api/users/instruments", data);
}
```

### Barrel Export with Convenience

```typescript
// index.ts
export { api, baseUrl } from "./client";
export * as sessions from "./sessions";
export * as users from "./users";

// Convenience top-level exports for common functions
export { getCurrentUser } from "./users";
export { generateSession } from "./sessions";
```

---

## Shared Hooks

Located in `src/hooks/`:

| Hook                        | Purpose                            |
| --------------------------- | ---------------------------------- |
| `useApi<T>()`               | API calls with loading/error state |
| `useAsyncState<T>()`        | Generic async state management     |
| `useDebounce(value, delay)` | Debounced values                   |
| `usePitchDetection()`       | Real-time pitch detection          |
| `useExerciseAudio()`        | Exercise audio generation          |
| `useSelectionEngine()`      | Practice content selection         |
| `useTuneMasteryData()`      | Tune mastery progression           |

### Exercise Shared Hooks

Located in `src/screens/Session/components/exercises/shared/`:

| Hook                     | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `useQuizExerciseState`   | Quiz flow: questions, answers, scoring, pass/fail |
| `useTimingExerciseState` | Timing exercises: countdowns, cues, attempts      |
| `useLessonExerciseState` | Lesson flow: phases, progress, audio config       |

**useQuizExerciseState** — Used by theory quiz exercises (TimeSignature44, KeySignatureBasics, etc.):

```typescript
const {
  quiz, // { currentIndex, score, selectedAnswer, showFeedback, passed }
  currentQuestion, // Current QuizQuestion object
  totalQuestions, // Total question count
  handleQuizAnswer, // (answer: string | number) => void
  resetQuiz, // () => void
  isCorrectAnswer, // (answer) => boolean
} = useQuizExerciseState({
  questions: QUIZ_QUESTIONS,
  passingScore: questions.length, // Default: all correct to pass
  onProgress,
  onQuizComplete,
});
```

**useTimingExerciseState** — Used by timing-based exercises (StartOnCue, etc.):

```typescript
const { phase, countdown, attempts, handleCue, startAttempt, endAttempt } =
  useTimingExerciseState({
    cueDelay: 3000,
    maxAttempts: 3,
    onProgress,
  });
```

---

## Constants

Located in `src/constants/`:

| File             | Contents                              |
| ---------------- | ------------------------------------- |
| `colors.ts`      | Theme colors, semantic colors         |
| `instruments.ts` | Instrument families, defaults         |
| `notes.ts`       | Note names, A4_FREQUENCY, conversions |
| `timing.ts`      | Animation delays, audio timing        |

---

## Testing

### Location

Tests in `__tests__/` at project root, mirroring source structure:

```
__tests__/
├── admin/              # Tests for screens/Admin/
├── components/         # Tests for components/
├── hooks/              # Tests for hooks/
├── exercises/          # Tests for exercise modules
├── PracticePanel.test.tsx
├── useApi.test.tsx
└── ...
```

### Naming Convention

- `ComponentName.test.tsx` → Tests `ComponentName.tsx`
- `hookName.test.ts` → Tests `hookName.ts`
- `featureModule.test.ts` → Tests `featureModule.ts`

### Test Pattern

```typescript
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PracticePanel from "../src/screens/TuneMastery/components/PracticePanel";

describe("PracticePanel", () => {
  it("submits rating when button pressed", async () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <PracticePanel tuneName="Test" tuneKey="C" currentScore={50} onSubmitRating={onSubmit} onCancel={jest.fn()} />
    );

    fireEvent.press(getByText("Submit Rating"));
    expect(onSubmit).toHaveBeenCalledWith(50);
  });
});
```

---

## Naming Conventions

### Files

| Type      | Convention                   | Example                   |
| --------- | ---------------------------- | ------------------------- |
| Component | PascalCase                   | `PracticePanel.tsx`       |
| Hook      | camelCase with `use` prefix  | `useTuneComposerState.ts` |
| Types     | camelCase + `Types` suffix   | `practicePanelTypes.ts`   |
| Reducer   | camelCase + `Reducer` suffix | `practicePanelReducer.ts` |
| Styles    | camelCase + `Styles` suffix  | `practicePanelStyles.ts`  |
| Utility   | camelCase                    | `pitchUtils.ts`           |
| Constants | camelCase                    | `colors.ts`               |
| Test      | source name + `.test`        | `PracticePanel.test.tsx`  |

### Types and Interfaces

```typescript
// State types: Feature + State
interface PracticePanelState {}
interface TuneComposerScreenState {}

// Action types: Feature + Action
type PracticePanelAction = { type: "..." };

// Props types: Component + Props
interface PracticePanelProps {}

// Context value: Feature + ContextValue
interface UserContextValue {}
```

---

## Adding New Features

### 1. New Shared Hook

```bash
# 1. Create hook
src/hooks/useNewFeature.ts

# 2. Add to barrel export
# In src/hooks/index.ts:
export { useNewFeature } from "./useNewFeature";

# 3. Create test
__tests__/hooks/useNewFeature.test.ts
```

### 2. New Feature Module

```bash
# 1. Create feature structure
src/features/my-feature/
├── components/
├── hooks/
├── types/
├── index.ts

# 2. Create barrel export
# In src/features/my-feature/index.ts:
export * from "./components";
export * from "./hooks";
export type * from "./types";
```

### 3. New API Endpoint

```bash
# 1. Add function to domain module
# In src/api/users.ts:
export async function newEndpoint(): Promise<Response> { }

# 2. Export in barrel
# In src/api/index.ts:
export { newEndpoint } from "./users";

# 3. Create test
__tests__/apiUsers.test.tsx
```

### 4. New Context

```bash
# 1. Create context file
src/context/NewContext.tsx

# 2. Export in barrel
# In src/context/index.ts:
export { NewContext, NewProvider, useNew } from "./NewContext";
```

---

## Quick Reference

```
Need to...                    → Location
───────────────────────────────────────────
Add shared UI component       → src/components/
Add feature-specific component → src/features/*/components/
Add global state              → src/context/
Add feature state             → useReducer in screen/hook
Add API call                  → src/api/*.ts
Add utility function          → src/utils/
Add type definition           → src/types/ or feature types/
Add constant                  → src/constants/
Add test                      → __tests__/ (mirror source path)
```

---

## Related Documentation

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Setup and testing workflow
- [current_next_steps.md](../new_stuff/current_next_steps.md) - Roadmap and refactoring plan
