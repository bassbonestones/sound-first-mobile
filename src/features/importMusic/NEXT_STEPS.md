# Music Import Feature - Next Implementation Steps

**Created:** 2026-03-17

---

## Immediate Setup Required

Before using the import feature, install the required Expo packages:

```bash
npx expo install expo-image-picker expo-document-picker
```

> **Note:** `expo-file-system` is already included with Expo SDK 55. The code uses the legacy API via `expo-file-system/legacy` imports.

After installation, if you see TypeScript errors about `backendContracts` not being found, restart the TypeScript server:

- In VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

---

## What Was Built

### Architecture Overview

The import subsystem follows a clean feature-based architecture:

```
src/
├── features/
│   └── importMusic/
│       ├── index.ts              # Main public API
│       ├── components/           # UI components
│       │   ├── ImportActionList.tsx
│       │   ├── ImportProgressIndicator.tsx
│       │   ├── ImportPreview.tsx
│       │   └── ImportErrorDisplay.tsx
│       ├── hooks/
│       │   └── useImportMusic.ts # Main hook
│       ├── screens/
│       │   └── ImportMusicScreen.tsx
│       ├── services/
│       │   ├── fileAcquisition.ts    # Camera/library/document picker
│       │   ├── musicXmlParser.ts     # MusicXML parsing
│       │   ├── mxlHandler.ts         # Compressed MXL handling
│       │   ├── uploadService.ts      # Backend upload
│       │   ├── omrService.ts         # OMR job management
│       │   ├── importOrchestrator.ts # Pipeline coordinator
│       │   └── backendContracts.ts   # API type definitions
│       └── utils/
│           ├── validation.ts         # File validation
│           └── errors.ts             # Error handling
├── types/
│   └── import.ts                 # Domain models
└── constants/
    └── import.ts                 # Configuration
```

### What Works Now

1. **File Acquisition**
   - ✅ Camera capture (with permissions)
   - ✅ Image library selection (with permissions)
   - ✅ PDF document picking
   - ✅ MusicXML/MXL file picking

2. **Validation**
   - ✅ File extension validation
   - ✅ MIME type checking
   - ✅ File size limits
   - ✅ Empty file detection
   - ✅ MusicXML content validation

3. **MusicXML Parsing**
   - ✅ Basic MusicXML parsing (score-partwise)
   - ✅ Metadata extraction (title, composer, key, time, tempo)
   - ✅ Part and measure structure
   - ✅ Note/rest events with pitch

4. **UI Components**
   - ✅ Import action list with icons
   - ✅ Progress indicator with cancel
   - ✅ Import preview with stats
   - ✅ Error display with retry

5. **State Management**
   - ✅ useImportMusic hook with full state
   - ✅ Pipeline status tracking
   - ✅ Error handling

---

## Next Implementation Steps

### Phase 1: Backend Integration (Priority: High)

#### 1.1 Upload Service Backend Connection

```typescript
// In uploadService.ts, replace placeholder with actual API calls
// Need to implement:
- requestSignedUrl() → actual fetch to backend
- confirmUpload() → actual fetch to backend
```

**Backend Requirements:**

- `POST /api/v1/import/signed-url` - Request upload URL
- `POST /api/v1/import/confirm` - Confirm upload completion
- S3/GCS bucket for file storage

#### 1.2 OMR Service Backend Connection

```typescript
// In omrService.ts, replace placeholder with actual API calls
// Need to implement:
- submitOmrJobToBackend() → actual fetch
- fetchJobStatus() → actual fetch
```

**Backend Requirements:**

- `POST /api/v1/omr/submit` - Submit OMR job
- `GET /api/v1/omr/status/:jobId` - Poll job status
- OMR processing service (Audiveris, commercial API, or custom model)

### Phase 2: MXL Support — ✅ COMPLETE (2026-03-17)

JSZip installed and full MXL extraction implemented in `mxlHandler.ts`.

- ✅ JSZip dependency added
- ✅ Extraction reads META-INF/container.xml to find root file
- ✅ Extracts and parses MusicXML from ZIP archive
- ✅ 12 tests added and passing

### Phase 3: OMR Pipeline (Priority: Medium)

#### 3.1 Image Preprocessing

- Add perspective correction for camera photos
- Implement contrast/brightness normalization
- Consider using `expo-image-manipulator`

#### 3.2 PDF Page Extraction

- Add PDF rendering library (e.g., `react-native-pdf`)
- Extract individual pages as images
- Support multi-page uploads

#### 3.3 Result Normalization

- Parse OMR provider output format
- Map to ImportedScore structure
- Handle confidence scores

### Phase 4: Score Review UI (Priority: Medium)

#### 4.1 Uncertain Measure Editor

- Display measures flagged for review
- Allow manual corrections
- Save corrections back to score

#### 4.2 Score Preview Rendering

- Basic notation display
- Highlight uncertain regions
- Page navigation

### Phase 5: Share Extension (Priority: Low)

#### 5.1 iOS Share Extension

- Configure in app.json for iOS
- Handle incoming MusicXML/PDF files
- Route to import pipeline

#### 5.2 Android Intent Filter

- Configure in app.json for Android
- Handle file intents
- Route to import pipeline

---

## Testing Checklist

### Before Production

- [ ] Test all acquisition paths on real devices
- [ ] Verify permissions work on iOS and Android
- [ ] Test large file handling (10MB+ MusicXML)
- [ ] Test poor network conditions
- [ ] Test offline behavior
- [ ] Test cancellation at each stage
- [ ] Verify memory usage with large scores
- [ ] Test accessibility with screen reader

### Test Files Needed

1. Various MusicXML files:
   - Simple (1 part, few measures)
   - Complex (multiple parts, 100+ measures)
   - With metadata (title, composer)
   - Without metadata
   - Different versions (2.0, 3.0, 3.1)

2. Images:
   - High-res photos of sheet music
   - Low-res/blurry images
   - Skewed/rotated photos

3. PDFs:
   - Single page
   - Multi-page
   - Scanned (image-based)
   - Digital (vector-based)

---

## Dependencies to Add

```json
{
  "dependencies": {
    "jszip": "^3.10.1" // For MXL extraction
  }
}
```

---

## Color/Style Dependencies

The components reference these colors that should exist in `constants/colors`:

- `colors.primary`, `colors.primaryLight`
- `colors.success`, `colors.successLight`
- `colors.error`, `colors.errorLight`
- `colors.warning`, `colors.warningLight`, `colors.warningDark`
- `colors.text`, `colors.textSecondary`, `colors.textTertiary`
- `colors.textOnPrimary`
- `colors.surface`, `colors.background`, `colors.backgroundSecondary`
- `colors.border`

And spacing values:

- `spacing.xs`, `spacing.sm`, `spacing.md`, `spacing.lg`, `spacing.xl`

---

## Integration Points

### Navigation

Add ImportMusicScreen to your navigation:

```typescript
// In your navigation setup
<Stack.Screen
  name="ImportMusic"
  component={ImportMusicScreen}
  options={{ title: 'Import Music' }}
/>
```

### Tab/Menu Access

Add import action to your home screen or menu:

```typescript
<Button onPress={() => navigation.navigate('ImportMusic')}>
  Import Music
</Button>
```

---

## Architecture Decisions

### Why Feature-Based Structure?

- Keeps import logic isolated
- Easy to test in isolation
- Clear boundaries for code ownership
- Simple to extend or replace parts

### Why Orchestrator Pattern?

- Single point of control for pipeline
- Easy to add logging/analytics
- Consistent error handling
- Supports future retry/queue mechanisms

### Why Backend for OMR?

- OMR models are 100MB+ (too large for mobile)
- Consistent results across devices
- Easier to update models
- GPU acceleration on server
- Better security for user files

---

## Estimated Effort

| Phase               | Effort   | Dependencies       |
| ------------------- | -------- | ------------------ |
| Backend Integration | 2-3 days | Backend API ready  |
| MXL Support         | 0.5 days | jszip              |
| OMR Pipeline        | 3-5 days | OMR service        |
| Score Review UI     | 3-5 days | Notation rendering |
| Share Extension     | 2-3 days | None               |

---

## Questions to Decide

1. **OMR Provider**: Build custom model, use Audiveris, or commercial API?
2. **Score Storage**: Local-first with sync, or cloud-only?
3. **Notation Rendering**: Build from scratch, use VexFlow, or other library?
4. **Error Reporting**: Add Sentry/Bugsnag integration?
5. **Analytics**: Track import success rates?
