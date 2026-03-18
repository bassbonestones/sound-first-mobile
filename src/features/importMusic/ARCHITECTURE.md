# Import Music Feature - Architecture

**Updated:** 2026-03-17

---

## Module Dependency Graph

The import music feature follows a strict layered architecture with clear boundaries:

```
┌─────────────────────────────────────────────────────────────────┐
│                          SCREENS                                 │
│  ImportMusicScreen.tsx    ScoreCorrectionScreen.tsx              │
│                                                                  │
│  Rule: May import from hooks, components, types, constants       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                          HOOKS                                   │
│  useImportMusic.ts    useCorrection.ts    useShareExtension.ts   │
│                                                                  │
│  Rule: May import from services, types, constants, utils         │
│  Rule: May NOT import from components or screens                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENTS                                │
│  CorrectionPanel.tsx    ScorePreview.tsx    MeasureEditModal.tsx │
│  ImportActionList.tsx   ImportPreview.tsx   etc.                 │
│                                                                  │
│  Rule: May import from types, constants, utils                   │
│  Rule: May import other components (same level)                  │
│  Rule: May NOT import from hooks, screens, or services           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                  │
│  importOrchestrator.ts    musicXmlParser.ts    mxlHandler.ts     │
│  uploadService.ts         omrService.ts        fileAcquisition.ts│
│  shareExtensionService.ts                                        │
│                                                                  │
│  Rule: May import from types, constants, utils, adapters         │
│  Rule: May call other services (orchestrator pattern)            │
│  Rule: May NOT import React or UI components                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ADAPTERS                                  │
│  fileAcquisitionAdapter.ts    expoFileAcquisitionAdapter.ts      │
│                                                                  │
│  Rule: Platform-specific implementations                         │
│  Rule: May import from types, constants only                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TYPES & UTILS                               │
│  types/correctionTypes.ts    utils/validation.ts                 │
│  types/index.ts              utils/errors.ts                     │
│                                                                  │
│  Rule: Pure TypeScript, no dependencies on other feature layers  │
│  Rule: May import from app-wide types (../../../types/import.ts) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Rules Summary

| Layer      | Can Import From                           | Cannot Import From          |
| ---------- | ----------------------------------------- | --------------------------- |
| Screens    | hooks, components, types, constants       | services directly           |
| Hooks      | services, types, constants, utils         | components, screens         |
| Components | types, constants, utils, other components | hooks, screens, services    |
| Services   | types, constants, utils, adapters         | React, components, hooks    |
| Adapters   | types, constants                          | services, components, hooks |
| Types      | app-wide types only                       | anything in feature         |

---

## Import Validation

### Services Layer (No React Allowed)

The services layer must remain pure TypeScript with no React dependencies:

✅ **Allowed in services:**

- `expo-file-system` (for file operations)
- `expo-linking` (for URL handling)
- `Platform` from `react-native` (runtime checks only)
- App-wide types from `src/types/`
- Feature-local types from `./types/`
- Utility functions

❌ **Not allowed in services:**

- `import React from 'react'`
- `import { View, Text, ... } from 'react-native'`
- Any component imports
- Any hook imports

### Example: Correct Service Import

```typescript
// ✅ Correct - services/uploadService.ts
import * as FileSystem from "expo-file-system/legacy";
import { createImportError } from "../../../types/import";
import { IMPORT_TIMEOUTS } from "../../../constants/import";
import { mapNativeError } from "../utils/errors";
```

### Example: Incorrect Service Import

```typescript
// ❌ Incorrect - services should never do this
import React, { useCallback } from "react"; // NO!
import { View, Text } from "react-native"; // NO!
import { SomeComponent } from "../components"; // NO!
```

---

## Folder Structure

```
src/features/importMusic/
├── index.ts                       # Public barrel export
├── NEXT_STEPS.md                  # Implementation roadmap
├── ARCHITECTURE.md                # This file
├── adapters/
│   ├── index.ts                   # Adapter barrel export
│   ├── fileAcquisitionAdapter.ts  # Interface definition
│   └── expoFileAcquisitionAdapter.ts # Expo implementation
├── components/
│   ├── index.ts                   # Components barrel (re-exports types)
│   ├── ImportActionList.tsx
│   ├── ImportProgressIndicator.tsx
│   ├── ImportPreview.tsx
│   ├── ImportResultPreview.tsx
│   ├── ImportErrorDisplay.tsx
│   ├── ScorePreview.tsx
│   ├── scorePreviewHtml.ts        # Html generation (no React)
│   ├── scorePreviewTypes.ts       # Preview-specific types
│   ├── MeasureCorrectionCard.tsx
│   ├── CorrectionPanel.tsx
│   └── MeasureEditModal.tsx
├── hooks/
│   ├── index.ts                   # Hooks barrel export
│   ├── useImportMusic.ts          # Main import orchestration
│   ├── useCorrection.ts           # Correction workflow state
│   └── useShareExtension.ts       # Share extension handling
├── screens/
│   ├── index.ts                   # Screens barrel export
│   ├── ImportMusicScreen.tsx      # Main import UI
│   └── ScoreCorrectionScreen.tsx  # Correction workflow UI
├── services/
│   ├── index.ts                   # Services barrel export
│   ├── backendContracts.ts        # API type definitions
│   ├── fileAcquisition.ts         # File picker facade
│   ├── importOrchestrator.ts      # Pipeline coordinator
│   ├── musicXmlParser.ts          # MusicXML parsing
│   ├── mxlHandler.ts              # Compressed MXL extraction
│   ├── omrService.ts              # OMR job management
│   ├── uploadService.ts           # Backend upload
│   ├── shareExtensionService.ts   # Share URL handling
│   └── shareExtensionConfig.ts    # iOS/Android config guide
├── types/
│   ├── index.ts                   # Types barrel export
│   └── correctionTypes.ts         # Correction workflow types
└── utils/
    ├── index.ts                   # Utils barrel export
    ├── validation.ts              # File validation
    └── errors.ts                  # Error handling
```

---

## Circular Dependency Prevention

### Issue: Types in Components

Before (problematic):

```
hooks/useCorrection.ts → imports → components/correctionTypes.ts
```

This created a dependency where hooks imported from components, breaking the layer hierarchy.

### Solution: Dedicated Types Directory

After (correct):

```
hooks/useCorrection.ts → imports → types/correctionTypes.ts
components/CorrectionPanel.tsx → imports → types/correctionTypes.ts
```

Both components and hooks now import from the same types directory, which sits at the bottom of the dependency graph.

---

## Testing Architecture

Tests mirror the module structure:

```
__tests__/
├── importValidation.test.tsx      # utils/validation.ts
├── importErrors.test.tsx          # utils/errors.ts
├── correctionTypes.test.tsx       # types/correctionTypes.ts
├── musicXmlParser.test.tsx        # services/musicXmlParser.ts
├── mxlHandler.test.tsx            # services/mxlHandler.ts
├── shareExtensionService.test.tsx # services/shareExtensionService.ts
├── fileAcquisitionAdapter.test.tsx # adapters/*.ts
├── useCorrection.test.tsx         # hooks/useCorrection.ts
├── useShareExtension.test.tsx     # hooks/useShareExtension.ts
├── ImportMusicScreen.test.tsx     # screens/ImportMusicScreen.tsx
├── ScoreCorrectionScreen.test.tsx # screens/ScoreCorrectionScreen.tsx
├── ScorePreview.test.tsx          # components/ScorePreview.tsx
├── ImportResultPreview.test.tsx   # components/ImportResultPreview.tsx
└── MeasureCorrectionCard.test.tsx # components/MeasureCorrectionCard.tsx
```

Each layer can be tested in isolation by mocking its dependencies.
