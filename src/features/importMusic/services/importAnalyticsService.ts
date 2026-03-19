/**
 * Import Analytics Service
 *
 * Tracks events for the import funnel to understand user behavior
 * and identify friction points in the import flow.
 *
 * Events are batched and sent to the analytics service periodically.
 * In development, events are logged to console.
 */

import { devLog } from "../../../utils/devLogger";

declare const __DEV__: boolean;

// ============================================================================
// Event Types
// ============================================================================

export type ImportEventType =
  // Funnel start
  | "import_started"
  | "import_source_selected"
  // File acquisition
  | "file_acquisition_started"
  | "file_acquisition_completed"
  | "file_acquisition_failed"
  | "file_acquisition_cancelled"
  // Upload
  | "upload_started"
  | "upload_progress"
  | "upload_completed"
  | "upload_failed"
  | "upload_retried"
  // OMR processing
  | "omr_job_submitted"
  | "omr_job_polling"
  | "omr_job_completed"
  | "omr_job_failed"
  | "omr_job_timeout"
  // MusicXML processing
  | "musicxml_parse_started"
  | "musicxml_parse_completed"
  | "musicxml_parse_failed"
  // Score viewing
  | "score_viewer_opened"
  | "score_saved"
  | "score_practice_started"
  // Correction flow
  | "correction_started"
  | "correction_measure_edited"
  | "correction_completed"
  | "correction_cancelled"
  // Learning path
  | "learning_path_generated"
  | "learning_path_started"
  // Errors
  | "error_displayed"
  | "error_dismissed"
  | "error_retry";

export type ImportSourceType =
  | "camera"
  | "photo_library"
  | "file_picker"
  | "drag_drop"
  | "share_extension"
  | "deep_link";

export interface ImportEvent {
  type: ImportEventType;
  timestamp: number;
  sessionId: string;
  properties?: Record<string, unknown>;
}

// ============================================================================
// Event Queue
// ============================================================================

const eventQueue: ImportEvent[] = [];
const MAX_QUEUE_SIZE = 100;
const FLUSH_INTERVAL_MS = 30000; // 30 seconds

let currentSessionId: string | null = null;
let flushIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Generate a unique session ID for tracking
 */
function generateSessionId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start a new import session for analytics tracking
 */
export function startImportSession(): string {
  currentSessionId = generateSessionId();
  trackEvent("import_started");
  return currentSessionId;
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  return currentSessionId;
}

/**
 * End the current import session
 */
export function endImportSession(): void {
  currentSessionId = null;
}

// ============================================================================
// Track Events
// ============================================================================

/**
 * Track an import analytics event
 */
export function trackEvent(
  type: ImportEventType,
  properties?: Record<string, unknown>,
): void {
  const event: ImportEvent = {
    type,
    timestamp: Date.now(),
    sessionId: getCurrentSessionId(),
    properties,
  };

  // Log in development
  if (__DEV__) {
    devLog(`[ImportAnalytics] ${type}`, properties || "");
  }

  // Add to queue
  eventQueue.push(event);

  // Trim queue if too large
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue.shift();
  }
}

/**
 * Track source selection
 */
export function trackSourceSelected(source: ImportSourceType): void {
  trackEvent("import_source_selected", { source });
}

/**
 * Track file acquisition
 */
export function trackFileAcquisition(
  status: "started" | "completed" | "failed" | "cancelled",
  properties?: { source?: ImportSourceType; fileType?: string; fileSizeBytes?: number; error?: string },
): void {
  trackEvent(`file_acquisition_${status}` as ImportEventType, properties);
}

/**
 * Track upload progress
 */
export function trackUpload(
  status: "started" | "progress" | "completed" | "failed" | "retried",
  properties?: { progress?: number; fileSizeBytes?: number; durationMs?: number; error?: string; retryCount?: number },
): void {
  trackEvent(`upload_${status}` as ImportEventType, properties);
}

/**
 * Track OMR job status
 */
export function trackOmrJob(
  status: "submitted" | "polling" | "completed" | "failed" | "timeout",
  properties?: { jobId?: string; durationMs?: number; confidence?: number; error?: string },
): void {
  trackEvent(`omr_job_${status}` as ImportEventType, properties);
}

/**
 * Track MusicXML parsing
 */
export function trackMusicXmlParse(
  status: "started" | "completed" | "failed",
  properties?: { measureCount?: number; partCount?: number; durationMs?: number; error?: string },
): void {
  trackEvent(`musicxml_parse_${status}` as ImportEventType, properties);
}

/**
 * Track error events
 */
export function trackError(
  action: "displayed" | "dismissed" | "retry",
  properties?: { errorType?: string; errorMessage?: string; context?: string },
): void {
  trackEvent(`error_${action}` as ImportEventType, properties);
}

// ============================================================================
// Flush Events
// ============================================================================

/**
 * Send queued events to analytics service
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue.length = 0;

  // In development, just log
  if (__DEV__) {
    devLog(`[ImportAnalytics] Flushing ${eventsToSend.length} events`);
    return;
  }

  // In production, send to analytics service
  try {
    // TODO: Replace with actual analytics endpoint
    // await fetch('https://analytics.soundfirst.app/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events: eventsToSend }),
    // });
  } catch (error) {
    // Re-queue events on failure
    eventQueue.unshift(...eventsToSend);
    devLog("[ImportAnalytics] Failed to flush events, re-queued");
  }
}

/**
 * Start automatic event flushing
 */
export function startAutoFlush(): void {
  if (flushIntervalId) return;
  flushIntervalId = setInterval(flushEvents, FLUSH_INTERVAL_MS);
}

/**
 * Stop automatic event flushing
 */
export function stopAutoFlush(): void {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
}

// ============================================================================
// Funnel Analysis Helpers
// ============================================================================

/**
 * Calculate funnel completion rate from events
 */
export function calculateFunnelMetrics(events: ImportEvent[]): {
  started: number;
  sourceSelected: number;
  fileAcquired: number;
  uploadCompleted: number;
  omrCompleted: number;
  parsedSuccessfully: number;
  savedOrPracticed: number;
} {
  const sessions = new Map<string, Set<ImportEventType>>();

  for (const event of events) {
    if (!sessions.has(event.sessionId)) {
      sessions.set(event.sessionId, new Set());
    }
    sessions.get(event.sessionId)!.add(event.type);
  }

  let started = 0;
  let sourceSelected = 0;
  let fileAcquired = 0;
  let uploadCompleted = 0;
  let omrCompleted = 0;
  let parsedSuccessfully = 0;
  let savedOrPracticed = 0;

  for (const types of sessions.values()) {
    if (types.has("import_started")) started++;
    if (types.has("import_source_selected")) sourceSelected++;
    if (types.has("file_acquisition_completed")) fileAcquired++;
    if (types.has("upload_completed")) uploadCompleted++;
    if (types.has("omr_job_completed")) omrCompleted++;
    if (types.has("musicxml_parse_completed")) parsedSuccessfully++;
    if (types.has("score_saved") || types.has("score_practice_started")) {
      savedOrPracticed++;
    }
  }

  return {
    started,
    sourceSelected,
    fileAcquired,
    uploadCompleted,
    omrCompleted,
    parsedSuccessfully,
    savedOrPracticed,
  };
}

/**
 * Get pending events count (for debugging)
 */
export function getPendingEventsCount(): number {
  return eventQueue.length;
}

export default {
  trackEvent,
  trackSourceSelected,
  trackFileAcquisition,
  trackUpload,
  trackOmrJob,
  trackMusicXmlParse,
  trackError,
  startImportSession,
  endImportSession,
  flushEvents,
  startAutoFlush,
  stopAutoFlush,
};
