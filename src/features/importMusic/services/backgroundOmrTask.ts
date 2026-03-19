/**
 * Background OMR Task Service
 *
 * Enables OMR polling to continue when the app is backgrounded.
 * Uses expo-task-manager when available, gracefully degrades otherwise.
 *
 * INSTALLATION REQUIRED:
 * npx expo install expo-task-manager expo-background-fetch
 *
 * After installation, update app.json with:
 * {
 *   "expo": {
 *     "ios": {
 *       "infoPlist": {
 *         "UIBackgroundModes": ["fetch", "processing"]
 *       }
 *     },
 *     "android": {
 *       "permissions": ["RECEIVE_BOOT_COMPLETED", "FOREGROUND_SERVICE"]
 *     }
 *   }
 * }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog } from "../../../utils/devLogger";
import { IMPORT_TIMEOUTS } from "../../../constants/import";

// ============================================================================
// Types
// ============================================================================

export interface BackgroundOmrTaskState {
  /** Unique job ID for this OMR task */
  jobId: string;
  /** Base URL for the OMR API */
  baseUrl: string;
  /** Auth token for API requests */
  authToken?: string;
  /** Time when polling started */
  startedAt: number;
  /** Time when polling should timeout */
  expiresAt: number;
  /** Number of poll attempts made */
  pollCount: number;
  /** Current job status */
  lastStatus: "pending" | "processing" | "completed" | "failed";
  /** Last poll timestamp */
  lastPollAt: number;
}

export interface BackgroundOmrTaskResult {
  /** Whether the task completed successfully */
  success: boolean;
  /** The final job status */
  status: "completed" | "failed" | "timeout" | "cancelled";
  /** MusicXML result if successful */
  musicXml?: string;
  /** Error message if failed */
  error?: string;
}

type TaskStateCallback = (state: BackgroundOmrTaskState) => void;
type TaskResultCallback = (result: BackgroundOmrTaskResult) => void;

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "@background_omr_task_state";
const TASK_NAME = "BACKGROUND_OMR_POLL";

// Check if expo-task-manager is available
let TaskManager: typeof import("expo-task-manager") | null = null;
let isTaskManagerAvailable = false;

// Attempt to load expo-task-manager dynamically
const loadTaskManager = async (): Promise<boolean> => {
  if (isTaskManagerAvailable) return true;

  try {
    // Dynamic import - will fail if not installed
    TaskManager = await import("expo-task-manager");
    isTaskManagerAvailable = true;
    devLog("background-task", "expo-task-manager loaded successfully");
    return true;
  } catch {
    devLog(
      "background-task",
      "expo-task-manager not available - background polling disabled",
    );
    return false;
  }
};

// ============================================================================
// State Persistence
// ============================================================================

/**
 * Save task state to AsyncStorage for persistence across app restarts
 */
async function saveTaskState(
  state: BackgroundOmrTaskState | null,
): Promise<void> {
  try {
    if (state === null) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (error) {
    devLog("background-task", "Failed to save task state", error);
  }
}

/**
 * Load task state from AsyncStorage
 */
async function loadTaskState(): Promise<BackgroundOmrTaskState | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as BackgroundOmrTaskState;

    // Check if task has expired
    if (Date.now() > state.expiresAt) {
      await saveTaskState(null);
      return null;
    }

    return state;
  } catch (error) {
    devLog("background-task", "Failed to load task state", error);
    return null;
  }
}

// ============================================================================
// Background Task Registration
// ============================================================================

let onStateChange: TaskStateCallback | null = null;
let onResult: TaskResultCallback | null = null;

/**
 * Define the background task handler (called by expo-task-manager)
 * This must be called at app startup, outside of any component
 */
export async function defineBackgroundOmrTask(): Promise<void> {
  const available = await loadTaskManager();
  if (!available || !TaskManager) return;

  // Only define if task manager APIs exist
  if (typeof TaskManager.defineTask !== "function") {
    devLog("background-task", "defineTask not available");
    return;
  }

  TaskManager.defineTask(TASK_NAME, async () => {
    devLog("background-task", "Background task executing");

    const state = await loadTaskState();
    if (!state) {
      devLog("background-task", "No active task found");
      return;
    }

    try {
      const result = await pollOmrJobOnce(state);

      if (result.completed) {
        await saveTaskState(null);
        onResult?.(result.taskResult!);
        return;
      }

      // Update state for next poll
      const updatedState: BackgroundOmrTaskState = {
        ...state,
        pollCount: state.pollCount + 1,
        lastPollAt: Date.now(),
        lastStatus: result.status,
      };

      await saveTaskState(updatedState);
      onStateChange?.(updatedState);
    } catch (error) {
      devLog("background-task", "Background poll failed", error);
    }
  });

  devLog("background-task", "Background task defined");
}

// ============================================================================
// Polling Logic
// ============================================================================

interface PollResult {
  completed: boolean;
  status: "pending" | "processing" | "completed" | "failed";
  taskResult?: BackgroundOmrTaskResult;
}

/**
 * Poll the OMR job status once
 */
async function pollOmrJobOnce(
  state: BackgroundOmrTaskState,
): Promise<PollResult> {
  // Check if expired
  if (Date.now() > state.expiresAt) {
    return {
      completed: true,
      status: "failed",
      taskResult: {
        success: false,
        status: "timeout",
        error: "OMR job timed out in background",
      },
    };
  }

  try {
    const response = await fetch(
      `${state.baseUrl}/api/omr/${state.jobId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(state.authToken
            ? { Authorization: `Bearer ${state.authToken}` }
            : {}),
        },
      },
    );

    if (!response.ok) {
      devLog("background-task", `Poll failed with status ${response.status}`);
      return { completed: false, status: state.lastStatus };
    }

    const data = await response.json();

    if (data.status === "completed") {
      // Fetch full result
      const resultResponse = await fetch(
        `${state.baseUrl}/api/omr/${state.jobId}/result`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(state.authToken
              ? { Authorization: `Bearer ${state.authToken}` }
              : {}),
          },
        },
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        return {
          completed: true,
          status: "completed",
          taskResult: {
            success: true,
            status: "completed",
            musicXml: resultData.musicXml,
          },
        };
      }
    }

    if (data.status === "failed") {
      return {
        completed: true,
        status: "failed",
        taskResult: {
          success: false,
          status: "failed",
          error: data.error || "OMR processing failed",
        },
      };
    }

    return { completed: false, status: data.status };
  } catch (error) {
    devLog("background-task", "Poll request failed", error);
    return { completed: false, status: state.lastStatus };
  }
}

// ============================================================================
// Public API
// ============================================================================

export interface BackgroundOmrTaskOptions {
  jobId: string;
  baseUrl: string;
  authToken?: string;
  onStateChange?: TaskStateCallback;
  onResult?: TaskResultCallback;
}

/**
 * Start background polling for an OMR job
 *
 * @returns true if background task was registered, false if falling back to foreground polling
 */
export async function startBackgroundOmrTask(
  options: BackgroundOmrTaskOptions,
): Promise<boolean> {
  const available = await loadTaskManager();

  const state: BackgroundOmrTaskState = {
    jobId: options.jobId,
    baseUrl: options.baseUrl,
    authToken: options.authToken,
    startedAt: Date.now(),
    expiresAt: Date.now() + IMPORT_TIMEOUTS.OMR_MAX_WAIT,
    pollCount: 0,
    lastStatus: "pending",
    lastPollAt: Date.now(),
  };

  // Save state for persistence
  await saveTaskState(state);

  // Store callbacks
  onStateChange = options.onStateChange || null;
  onResult = options.onResult || null;

  if (!available || !TaskManager) {
    devLog(
      "background-task",
      "expo-task-manager not available - using foreground polling",
    );
    return false;
  }

  // Register the background fetch task
  try {
    // Use BackgroundFetch API if available
    const BackgroundFetch = await import("expo-background-fetch").catch(
      () => null,
    );

    if (
      BackgroundFetch &&
      typeof BackgroundFetch.registerTaskAsync === "function"
    ) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: Math.floor(IMPORT_TIMEOUTS.OMR_POLL_INTERVAL / 1000),
        stopOnTerminate: false,
        startOnBoot: true,
      });

      devLog(
        "background-task",
        "Background task registered for job",
        options.jobId,
      );
      return true;
    }
  } catch (error) {
    devLog("background-task", "Failed to register background task", error);
  }

  return false;
}

/**
 * Stop background polling for an OMR job
 */
export async function stopBackgroundOmrTask(): Promise<void> {
  await saveTaskState(null);

  if (!TaskManager || !isTaskManagerAvailable) return;

  try {
    const BackgroundFetch = await import("expo-background-fetch").catch(
      () => null,
    );

    if (
      BackgroundFetch &&
      typeof BackgroundFetch.unregisterTaskAsync === "function"
    ) {
      await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
      devLog("background-task", "Background task unregistered");
    }
  } catch (error) {
    devLog("background-task", "Failed to unregister background task", error);
  }

  onStateChange = null;
  onResult = null;
}

/**
 * Check if there's a pending background task from a previous session
 *
 * Call this on app startup to resume polling if needed
 */
export async function checkPendingBackgroundOmrTask(): Promise<BackgroundOmrTaskState | null> {
  return loadTaskState();
}

/**
 * Check if background tasks are supported on this device
 */
export async function isBackgroundTaskSupported(): Promise<boolean> {
  return loadTaskManager();
}
