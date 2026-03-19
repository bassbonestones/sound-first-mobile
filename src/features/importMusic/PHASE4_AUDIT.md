# Phase 4: Production-Readiness Audit

**Date:** 2026-03-18  
**Reviewer:** Principal Engineer Review

---

## Summary

This audit identified 25 issues across 8 categories. Priority fixes have been implemented for the most critical items.

| Category                 | Issues Found | Fixed |
| ------------------------ | ------------ | ----- |
| Architecture Smells      | 4            | 4     |
| Weak Type Boundaries     | 3            | 3     |
| Hidden Coupling          | 3            | 2     |
| Poor Naming              | 3            | 2     |
| Missing Failure Handling | 4            | 3     |
| Mobile-Specific Issues   | 4            | 2     |
| State Management Risks   | 3            | 2     |
| OMR Integration Blockers | 4            | 3     |

---

## 1. Architecture Smells

### 1.1 Global Module State in Services ✅ FIXED

**Problem:** `DEFAULT_CONFIG` objects in `omrService.ts` and `uploadService.ts` contain hardcoded placeholder URLs and are treated as module-level constants.

**Fix:** Created `importConfig.ts` with environment-aware configuration and getters.

### 1.2 Console.log in Production Code ✅ FIXED

**Problem:** `importOrchestrator.ts` uses `console.log/console.error` instead of `devLog/devError`.

**Fix:** Replaced all console.\* calls with devLog/devError utilities.

### 1.3 Dev Sample Data Embedded in Screen ✅ FIXED

**Problem:** `ImportMusicScreen.tsx` contains 80+ lines of sample MusicXML that bloats the production bundle.

**Fix:** Moved to `__fixtures__/sampleMusicXml.ts` and conditionally import in dev mode.

### 1.4 Mixed Async/Sync in Validation ✅ FIXED

**Problem:** `validateMusicXmlContent` is sync while `parseMusicXml` is async, causing inconsistent patterns.

**Fix:** Made content validation async-compatible with Promise wrapper.

---

## 2. Weak Type Boundaries

### 2.1 `any` Type in Navigation Props ✅ FIXED

**Problem:**

```typescript
type ImportMusicScreenNavigationProp = NativeStackNavigationProp<
  any,
  "ImportMusic"
>;
```

**Fix:** Created `importNavigationTypes.ts` with proper param typing for all import screens.

### 2.2 Unknown Type for rawOutput ✅ FIXED

**Problem:** `OmrJobResult.rawOutput: unknown` provides no type information.

**Fix:** Added discriminated union based on OMR provider:

```typescript
type OmrRawOutput =
  | { provider: "audiveris"; data: AudiverisOutput }
  | { provider: "mock"; data: MockOmrOutput }
  | { provider: "unknown"; data: unknown };
```

### 2.3 Route Params Casting ✅ FIXED

**Problem:** Screens cast `route?.params` bypassing React Navigation types.

**Fix:** Screens now use typed props from navigation types.

---

## 3. Hidden Coupling

### 3.1 Direct Import of Constants Deep in Tree ✅ FIXED

**Problem:** Services use `../../../constants/import` creating tight coupling.

**Fix:** Re-export needed constants from feature's `constants/` directory.

### 3.2 Deep Import Paths ✅ FIXED

**Problem:** `../../../types/import` paths throughout the feature.

**Fix:** Added feature-local re-exports in `types/index.ts`.

### 3.3 Dual-Path Score Loading ⚠️ DEFERRED

**Problem:** `ScoreViewerScreen` loads scores from params OR by ID.

**Reason Deferred:** Would require navigation refactor. Added clear documentation instead.

---

## 4. Poor Naming

### 4.1 `looksLikeMusicXml` vs `mightBeMusicXml` ✅ FIXED

**Problem:** Two similar functions with unclear distinction.

**Fix:** Renamed to:

- `hasValidMusicXmlMimeType()` - checks MIME type
- `containsMusicXmlRootElement()` - checks content

### 4.2 Overlapping Orchestrator Functions ✅ FIXED

**Problem:** `runImportPipeline`, `importMusicXmlFile`, `importImageForOmr` overlap.

**Fix:** Added JSDoc clarifying when to use each. Made internal helpers private.

### 4.3 Duplicate State Types ⚠️ DEFERRED

**Problem:** `OrchestratorState` and `ImportMusicState` duplicate fields.

**Reason Deferred:** Would be a breaking API change. Documented as tech debt.

---

## 5. Missing Failure Handling

### 5.1 No Retry Logic for Network Operations ✅ FIXED

**Problem:** Network failures are immediate and permanent.

**Fix:** Created `retryWithBackoff()` utility with exponential backoff.

### 5.2 No Offline Detection ✅ FIXED

**Problem:** App doesn't check network before uploads.

**Fix:** Added `checkNetworkBeforeOperation()` guard using `NetInfo`.

### 5.3 AsyncStorage Quota Not Handled ✅ FIXED

**Problem:** Storage quota exceeded errors not caught.

**Fix:** Added quota error detection with graceful message.

### 5.4 Missing AbortController ⚠️ DEFERRED

**Problem:** Placeholder fetch calls don't show cancellation.

**Reason Deferred:** Backend integration not yet complete. Added TODO markers.

---

## 6. Mobile-Specific Issues

### 6.1 Memory Pressure for Large Files ✅ FIXED

**Problem:** Loading 50MB files into memory risks OOM.

**Fix:** Added `validateFileSizeForMemory()` check with 20MB threshold warning.

### 6.2 No Background Task Registration ⚠️ DEFERRED

**Problem:** OMR polling dies when app backgrounded.

**Reason Deferred:** Requires `expo-task-manager` integration. Created issue.

### 6.3 WebView Height Issues ✅ FIXED

**Problem:** Manual height calculation breaks on rotation.

**Fix:** Used flex layout instead of explicit heights where possible.

### 6.4 Missing Cancellation Cleanup ⚠️ DEFERRED

**Problem:** Setting `cancelled: true` doesn't abort in-flight requests.

**Reason Deferred:** Requires AbortController integration with backend fetch.

---

## 7. State Management Risks

### 7.1 Race Conditions in useImportMusic ✅ FIXED

**Problem:** Rapid import switching can run concurrent imports.

**Fix:** Added `importLockRef` to prevent concurrent imports.

### 7.2 State Not Persisted ⚠️ DEFERRED

**Problem:** Crash during import loses progress.

**Reason Deferred:** Would require checkpoint system. Low priority for alpha.

### 7.3 `rawMusicXml` Can Be Null After Success ✅ FIXED

**Problem:** OMR path might not produce MusicXML even on success.

**Fix:** Made this a discriminated union: either `rawMusicXml` or `renderFromOmrOutput`.

---

## 8. OMR Integration Blockers

### 8.1 Hard-Coded Mock Responses ✅ FIXED

**Problem:** Services always return mock failures.

**Fix:** Added `OmrServiceMode` config: `'mock' | 'real'` with feature flag.

### 8.2 No Provider Abstraction ✅ FIXED

**Problem:** Can't swap between OMR providers.

**Fix:** Created `OmrProvider` interface with `MockOmrProvider` and `BackendOmrProvider`.

### 8.3 Missing Progress Normalization ✅ FIXED

**Problem:** Different providers report progress differently.

**Fix:** Added `normalizeProgress()` in provider interface contract.

### 8.4 No Batch Processing Support ⚠️ DEFERRED

**Problem:** Single-file OMR only.

**Reason Deferred:** Requires backend support. Added to backlog.

---

## Files Changed

### New Files Created

- `src/features/importMusic/config/importConfig.ts` - Centralized configuration
- `src/features/importMusic/config/index.ts` - Config barrel export
- `src/features/importMusic/types/importNavigationTypes.ts` - Navigation param types
- `src/features/importMusic/types/omrProviderTypes.ts` - OMR provider abstraction
- `src/features/importMusic/services/providers/` - OMR provider implementations
- `src/features/importMusic/utils/networkUtils.ts` - Network helpers
- `src/features/importMusic/utils/retryUtils.ts` - Retry logic
- `src/features/importMusic/__fixtures__/sampleMusicXml.ts` - Dev fixtures

### Files Modified

- `services/importOrchestrator.ts` - Replace console.\*, use config
- `services/omrService.ts` - Provider pattern, config injection
- `services/uploadService.ts` - Config injection, retry logic
- `services/scoreStorageService.ts` - Quota error handling
- `hooks/useImportMusic.ts` - Import lock, better error handling
- `screens/ImportMusicScreen.tsx` - Extract sample data
- `screens/ScoreViewerScreen.tsx` - Fix WebView sizing
- `utils/validation.ts` - Rename functions, add memory check
- `types/import.ts` - Better result union types

---

## Testing Recommendations

1. **Add integration tests** for the OMR provider abstraction
2. **Add memory pressure tests** using large file fixtures
3. **Add network failure simulation tests** for retry logic
4. **Add concurrent import tests** for the import lock

---

## Next Steps (Phase 5 Candidates)

1. Background task registration for OMR polling
2. Checkpoint/resume for long imports
3. AbortController integration with real backend
4. Batch PDF page processing
5. Navigation type unification across app
