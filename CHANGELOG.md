# Changelog

All notable changes to Sound First Mobile are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **README.md** — Project overview, tech stack, quick start guide
- **CONTRIBUTING.md** — Development standards, state management patterns, testing guidelines
- **ARCHITECTURE.md** — Expanded with shared exercise hooks documentation
- **useQuizExerciseState** — Shared hook for quiz-based theory exercises (19 tests)
- **useTimingExerciseState** — Shared hook for timing-based exercises
- **Soft gate metrics** — Predicted difficulty scores for generated content

### Changed

- **GenerationPreviewScreen** — Refactored to use custom hooks (41 useState → 1)
- **FirstNoteContext** — Migrated to useReducer pattern (15 useState → 0)
- **SessionContext** — Migrated to useReducer pattern (23 useState → 0)
- **TuneComposerScreen** — Migrated to useReducer pattern (17 useState → 0)
- **PracticePanel** — Migrated to useReducer pattern (14 useState → 0)
- **Admin/styles.ts** — Split into modular style files (2,060 → 1,597 lines)
- **TimeSignature44Exercise** — Migrated to useQuizExerciseState hook

### Improved

- **Code Maintainability** — Score improved from 6.2 to 8.0
- **State Management** — 110+ useState calls migrated to useReducer
- **Documentation** — From 0 to 8 markdown documentation files
- **Type Safety** — All contexts and reducers fully typed

### Infrastructure

- **firstNoteContextReducer.ts** — Centralized FirstNote state management (235 lines)
- **firstNoteContextTypes.ts** — FirstNote type definitions (156 lines)
- **sessionContextReducer.ts** — Session state management (~150 lines)
- **practicePanelReducer.ts** — Practice panel state (287 lines)
- **rhythmNotation.ts** — Extracted from generationNotation (338 lines)

---

## Development Metrics

| Metric               | Value            |
| -------------------- | ---------------- |
| TypeScript Coverage  | 100% (444 files) |
| Test Coverage        | 72.52% lines     |
| Tests                | 7,715 total      |
| Accessibility Labels | 868              |
| Custom Hooks         | 46+              |
| Shared Reducers      | 6                |
