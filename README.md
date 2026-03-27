# Sound First Mobile

A React Native music education app focused on **ear-first learning** — users learn by listening and playing, with notation revealed on demand.

## Key Features

- **Pitch Detection** — Real-time microphone input with pitch analysis
- **Adaptive Curriculum** — 228 capabilities across 28 domains (dynamics, rhythm, intervals, etc.)
- **Content Generation** — Scales, arpeggios, and patterns generated on-demand in any key
- **Session Engine** — Practice sessions with progress tracking and soft-gating
- **Composer** — Create and edit musical scores with MusicXML export

## Tech Stack

| Component | Technology                                             |
| --------- | ------------------------------------------------------ |
| Framework | React Native + Expo (managed workflow with dev client) |
| Language  | TypeScript (100% coverage, 444 files)                  |
| Testing   | Jest (72.5% line coverage, 7,700+ tests)               |
| State     | useReducer patterns + React Context                    |
| Audio     | react-native-live-audio-stream                         |
| Backend   | FastAPI (Python) at `localhost:8000`                   |

## Quick Start

```bash
# Install dependencies
npm install

# Start Metro bundler (requires dev client on device)
npx expo start --dev-client

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

> **Note:** This app uses native audio and cannot run in Expo Go. See [TESTING_GUIDE.md](TESTING_GUIDE.md) for dev client setup.

## Project Structure

```
src/
├── api/              # API client & domain modules
├── components/       # Shared UI components
├── context/          # Global state (User, Session, FirstNote)
├── features/         # Feature modules (composer, tune-composer, importMusic)
├── hooks/            # Shared custom React hooks
├── screens/          # Screen components by feature
├── services/         # Business logic services
└── utils/            # Utility functions
```

## Documentation

| Document                                                                             | Purpose                                                    |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)                                                   | Codebase patterns, state management, component conventions |
| [CHANGELOG.md](CHANGELOG.md)                                                         | Version history and notable changes                        |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                                   | Development standards, code guidelines, quick reference    |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)                                                 | Dev client setup, build instructions, testing workflow     |
| [src/features/importMusic/ARCHITECTURE.md](src/features/importMusic/ARCHITECTURE.md) | Import feature module structure                            |

## Development Patterns

### State Management

Components with complex state use `useReducer` with co-located types:

```typescript
// Example: PracticePanel uses reducer pattern
const [state, dispatch] = useReducer(
  practicePanelReducer,
  initialProps,
  createInitialState,
);
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full patterns.

### Shared Exercise Hooks

Quiz-based exercises use shared hooks for common logic:

| Hook                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `useQuizExerciseState`   | Quiz flow: questions, answers, scoring, pass/fail    |
| `useTimingExerciseState` | Timing exercises: countdowns, cue handling, attempts |
| `useLessonExerciseState` | Lesson flow: phases, progress, audio config          |

### Accessibility

All interactive components include:

- `accessibilityLabel` for screen readers
- `accessibilityRole` for element type
- 868 labels and 807 roles across the app

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="ComponentName.test"

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

Coverage targets: 72.5% lines, 7,700+ tests across components, hooks, and services.

## Code Quality

- **TypeScript strict mode** — No implicit any, full type coverage
- **ESLint** — Consistent code style
- **1,191 memoizations** — Optimized renders with useMemo/useCallback
- **Error boundaries** — 65 ErrorBoundary components for graceful failures

## License

Private — Sound First © 2026
