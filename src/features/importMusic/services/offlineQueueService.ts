/**
 * Offline Import Queue Service
 *
 * Queues import operations when offline and processes them
 * when connectivity is restored.
 *
 * Features:
 * - Persists queue to AsyncStorage
 * - Automatic retry on connectivity restore
 * - Priority-based processing
 * - Expiration of stale queue items
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog, devError } from "../../../utils/devLogger";
import { isNetworkAvailable, subscribeToNetworkChanges } from "../utils/networkUtils";
import { trackEvent } from "./importAnalyticsService";

// ============================================================================
// Types
// ============================================================================

export type QueueItemStatus = "pending" | "processing" | "completed" | "failed";

export type QueueItemType = "omr_submission" | "score_save" | "capability_analysis";

export interface QueueItem {
  id: string;
  type: QueueItemType;
  status: QueueItemStatus;
  priority: number; // Lower = higher priority
  createdAt: number;
  expiresAt: number;
  retryCount: number;
  maxRetries: number;
  payload: unknown;
  lastError?: string;
}

export interface QueueConfig {
  /** Storage key for the queue */
  storageKey: string;
  /** Maximum items to store */
  maxItems: number;
  /** Default expiration time in ms */
  defaultExpirationMs: number;
  /** Maximum retry attempts per item */
  maxRetries: number;
  /** Delay between retries (exponential backoff base) */
  retryDelayMs: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: QueueConfig = {
  storageKey: "@soundfirst/import_queue",
  maxItems: 50,
  defaultExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3,
  retryDelayMs: 1000,
};

// ============================================================================
// Queue State
// ============================================================================

let queue: QueueItem[] = [];
let isProcessing = false;
let networkUnsubscribe: (() => void) | null = null;
let config = DEFAULT_CONFIG;

// Handler registry for different queue item types
const handlers: Map<QueueItemType, (payload: unknown) => Promise<void>> = new Map();

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the offline queue
 */
export async function initializeQueue(customConfig?: Partial<QueueConfig>): Promise<void> {
  config = { ...DEFAULT_CONFIG, ...customConfig };

  // Load persisted queue
  await loadQueue();

  // Clean up expired items
  cleanupExpiredItems();

  // Subscribe to network changes
  networkUnsubscribe = subscribeToNetworkChanges(handleNetworkChange);

  devLog("[OfflineQueue] Initialized with", queue.length, "pending items");
}

/**
 * Cleanup and shutdown
 */
export function shutdownQueue(): void {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
  }
}

// ============================================================================
// Queue Operations
// ============================================================================

/**
 * Add an item to the queue
 */
export async function enqueue(
  type: QueueItemType,
  payload: unknown,
  options?: {
    priority?: number;
    expirationMs?: number;
    maxRetries?: number;
  },
): Promise<string> {
  const id = generateId();
  const now = Date.now();

  const item: QueueItem = {
    id,
    type,
    status: "pending",
    priority: options?.priority ?? 5,
    createdAt: now,
    expiresAt: now + (options?.expirationMs ?? config.defaultExpirationMs),
    retryCount: 0,
    maxRetries: options?.maxRetries ?? config.maxRetries,
    payload,
  };

  queue.push(item);
  sortQueue();

  // Trim if too large
  while (queue.length > config.maxItems) {
    const removed = queue.pop();
    if (removed) {
      devLog("[OfflineQueue] Trimmed item:", removed.id);
    }
  }

  await saveQueue();

  devLog("[OfflineQueue] Enqueued:", type, id);
  trackEvent("import_started", { offline: true, queueId: id });

  // Try to process immediately if online
  processQueue();

  return id;
}

/**
 * Remove an item from the queue
 */
export async function dequeue(id: string): Promise<boolean> {
  const index = queue.findIndex((item) => item.id === id);
  if (index === -1) return false;

  queue.splice(index, 1);
  await saveQueue();

  devLog("[OfflineQueue] Dequeued:", id);
  return true;
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  isOnline: boolean;
} {
  return {
    total: queue.length,
    pending: queue.filter((i) => i.status === "pending").length,
    processing: queue.filter((i) => i.status === "processing").length,
    failed: queue.filter((i) => i.status === "failed").length,
    isOnline: isNetworkAvailable(),
  };
}

/**
 * Get all queue items
 */
export function getQueueItems(): readonly QueueItem[] {
  return [...queue];
}

/**
 * Clear all items from queue
 */
export async function clearQueue(): Promise<void> {
  queue = [];
  await saveQueue();
  devLog("[OfflineQueue] Cleared");
}

// ============================================================================
// Handler Registration
// ============================================================================

/**
 * Register a handler for a queue item type
 */
export function registerHandler(
  type: QueueItemType,
  handler: (payload: unknown) => Promise<void>,
): void {
  handlers.set(type, handler);
  devLog("[OfflineQueue] Registered handler for:", type);
}

/**
 * Unregister a handler
 */
export function unregisterHandler(type: QueueItemType): void {
  handlers.delete(type);
}

// ============================================================================
// Processing
// ============================================================================

/**
 * Process the queue
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  if (!isNetworkAvailable()) {
    devLog("[OfflineQueue] Skipping processing - offline");
    return;
  }

  isProcessing = true;

  try {
    // Get next pending item
    const item = queue.find((i) => i.status === "pending");
    if (!item) {
      isProcessing = false;
      return;
    }

    // Check expiration
    if (Date.now() > item.expiresAt) {
      item.status = "failed";
      item.lastError = "Expired";
      await saveQueue();
      isProcessing = false;
      processQueue(); // Continue with next
      return;
    }

    // Get handler
    const handler = handlers.get(item.type);
    if (!handler) {
      devError("[OfflineQueue] No handler for type:", item.type);
      item.status = "failed";
      item.lastError = "No handler registered";
      await saveQueue();
      isProcessing = false;
      processQueue();
      return;
    }

    // Process
    item.status = "processing";
    await saveQueue();

    devLog("[OfflineQueue] Processing:", item.id, item.type);

    try {
      await handler(item.payload);
      item.status = "completed";
      devLog("[OfflineQueue] Completed:", item.id);
      trackEvent("upload_completed", { offline: true, queueId: item.id });
    } catch (error) {
      item.retryCount++;
      item.lastError = error instanceof Error ? error.message : String(error);

      if (item.retryCount >= item.maxRetries) {
        item.status = "failed";
        devError("[OfflineQueue] Failed after retries:", item.id, item.lastError);
        trackEvent("upload_failed", {
          offline: true,
          queueId: item.id,
          error: item.lastError,
        });
      } else {
        item.status = "pending";
        devLog(
          "[OfflineQueue] Will retry:",
          item.id,
          `(${item.retryCount}/${item.maxRetries})`,
        );

        // Exponential backoff
        const delay = config.retryDelayMs * Math.pow(2, item.retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    await saveQueue();
  } finally {
    isProcessing = false;
  }

  // Continue processing remaining items
  const hasPending = queue.some((i) => i.status === "pending");
  if (hasPending) {
    processQueue();
  }
}

// ============================================================================
// Network Handling
// ============================================================================

/**
 * Handle network state changes
 */
function handleNetworkChange(isConnected: boolean): void {
  devLog("[OfflineQueue] Network changed:", isConnected ? "online" : "offline");

  if (isConnected) {
    // Process queue when coming online
    processQueue();
  }
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Load queue from storage
 */
async function loadQueue(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(config.storageKey);
    if (stored) {
      queue = JSON.parse(stored);
      // Reset any processing items to pending (app may have crashed)
      for (const item of queue) {
        if (item.status === "processing") {
          item.status = "pending";
        }
      }
      sortQueue();
    }
  } catch (error) {
    devError("[OfflineQueue] Failed to load:", error);
    queue = [];
  }
}

/**
 * Save queue to storage
 */
async function saveQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(config.storageKey, JSON.stringify(queue));
  } catch (error) {
    devError("[OfflineQueue] Failed to save:", error);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sort queue by priority (lower = higher priority)
 */
function sortQueue(): void {
  queue.sort((a, b) => a.priority - b.priority);
}

/**
 * Remove expired items
 */
function cleanupExpiredItems(): void {
  const now = Date.now();
  const beforeCount = queue.length;
  queue = queue.filter((item) => item.expiresAt > now || item.status === "processing");
  const removed = beforeCount - queue.length;
  if (removed > 0) {
    devLog("[OfflineQueue] Cleaned up", removed, "expired items");
  }
}

export default {
  initializeQueue,
  shutdownQueue,
  enqueue,
  dequeue,
  getQueueStatus,
  getQueueItems,
  clearQueue,
  registerHandler,
  unregisterHandler,
  processQueue,
};
