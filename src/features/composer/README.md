# Composer Feature

A step-entry music composition tool for creating practice exercises.

## Purpose

The Composer enables users to create custom musical exercises by entering notes step-by-step. Unlike a full notation editor, it's optimized for fast entry of simple melodic patterns.

## Architecture

```
composer/
├── components/     # UI components (ScoreViewport, EntryPalette, Toolbar)
├── constants/      # Note values, time signatures, key mappings
├── hooks/          # useComposerState (main state), useComposerSynth (audio)
├── screens/        # ComposerScreen (main entry point)
├── services/       # composerStorageService (persistence)
├── types/          # ComposerScore, Note, Measure types
└── utils/          # musicXmlExport, noteLayout calculations
```

## Key Components

| Component          | Purpose                               |
| ------------------ | ------------------------------------- |
| `ComposerScreen`   | Main screen, orchestrates the feature |
| `ScoreViewport`    | Renders the musical score             |
| `EntryPalette`     | Note/rest selection UI                |
| `useComposerState` | Central state management hook         |
| `useComposerSynth` | Audio playback for entered notes      |

## State Management

Uses `useComposerState` hook (2,309 lines) which manages:

- Score data (measures, notes, time signature, key)
- Cursor position and selection
- Playback state
- Undo/redo history

## Data Flow

```
User Input → EntryPalette → useComposerState → ScoreViewport
                                    ↓
                          composerStorageService (persist)
```

## Exports

```typescript
import {
  ComposerScreen,
  useComposerState,
  ComposerScore,
  exportToMusicXML,
} from "../features/composer";
```

## Related

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — App-wide patterns
- [tune-composer](../tune-composer/) — Similar feature for tunes
