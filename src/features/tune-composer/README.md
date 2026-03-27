# Tune Composer Feature

A full-featured music composition and editing tool for creating and arranging tunes.

## Purpose

The Tune Composer enables users to create, edit, and arrange complete musical pieces with chord progressions, multiple voices, and advanced playback. Unlike the simpler Composer (for practice exercises), this is designed for full tune authoring.

## Architecture

```
tune-composer/
├── components/     # UI components (ChordEditor, VoiceTrack, Toolbar)
├── constants/      # Chord symbols, voicings, key mappings
├── contexts/       # ChordProgressionContext
├── hooks/          # useTuneComposerState, useTuneComposerPlayback
├── reducers/       # tuneComposerReducer (state management)
├── screens/        # TuneComposerScreen (main entry point)
├── services/       # Storage, MusicXML export
├── types/          # TuneScore, Voice, Chord types
└── utils/          # Transposition, layout calculations
```

## Key Components

| Component                 | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `TuneComposerScreen`      | Main screen, orchestrates the feature       |
| `ChordProgressionContext` | Shared chord progression state              |
| `useTuneComposerState`    | Central state management hook (2,034 lines) |
| `useTuneComposerPlayback` | Audio playback with chord accompaniment     |
| `useTuneComposerUndo`     | Undo/redo history management                |

## State Management

Uses `useTuneComposerState` hook with `useReducer` pattern:

- Score data (measures, voices, chords)
- Selection and cursor state
- Playback position
- Undo/redo stack

## Data Flow

```
User Input → ChordEditor/VoiceTrack → useTuneComposerState
                                              ↓
                                    tuneComposerReducer
                                              ↓
                              tuneComposerStorageService (persist)
```

## Features

- **Multi-voice editing** — Melody, bass, harmony
- **Chord progression** — Real-time chord symbol entry
- **Playback** — Full arrangement with synth and samples
- **MusicXML export** — Standard notation interchange
- **Transposition** — Auto-transpose to any key

## Exports

```typescript
import {
  TuneComposerScreen,
  useTuneComposerState,
  ChordProgressionProvider,
  useChordProgression,
} from "../features/tune-composer";
```

## Related

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — App-wide patterns
- [composer](../composer/) — Simpler exercise composer
