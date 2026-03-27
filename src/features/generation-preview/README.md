# Generation Preview Feature

Extracted state management and hooks for the GenerationPreviewScreen.

## Purpose

This feature module contains the business logic for previewing generated musical content (scales, arpeggios, patterns). The UI components remain in `screens/Generator/`, while this module handles state, reducers, and hooks.

## Architecture

```
generation-preview/
├── constants/      # Preview mode settings, defaults
├── hooks/          # useGenerationPreview (main state hook)
├── reducers/       # generationPreviewReducer
├── types/          # PreviewState, PreviewAction types
└── index.ts        # Barrel export
```

## Key Components

| Component                  | Purpose                               |
| -------------------------- | ------------------------------------- |
| `useGenerationPreview`     | Main hook combining all preview state |
| `useGeneratorMode`         | Generator tab state (useReducer)      |
| `useTunesMode`             | Tunes tab state (useReducer)          |
| `generationPreviewReducer` | Central state management              |

## State Management

Migrated from 41 `useState` calls to structured `useReducer`:

- Generator mode state
- Tunes mode state
- Playback state
- UI state (tabs, modals)

## Data Flow

```
GenerationPreviewScreen → useGenerationPreview
                                  ↓
              useGeneratorMode / useTunesMode
                                  ↓
                      generationPreviewReducer
```

## Exports

```typescript
import {
  useGenerationPreview,
  useGeneratorMode,
  useTunesMode,
  PreviewState,
} from "../features/generation-preview";
```

## Related

- [GenerationPreviewScreen](../../screens/Generator/) — UI component
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — App-wide patterns
