/**
 * Pattern Constraints Cache Service
 *
 * Cross-platform caching service for scale/arpeggio pattern constraints.
 * Fetches from backend API and caches locally for offline support.
 *
 * Supported platforms:
 * - iOS/Android: Uses AsyncStorage
 * - Web: Uses localStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { api } from "../api/client";
import { devWarn } from "../utils/devLogger";

// =============================================================================
// Types
// =============================================================================

/** Pattern constraints - mirrors backend PatternConstraints schema */
export interface PatternConstraints {
  // Octave constraints
  maxOctaves?: number;
  chromaticMaxOctaves?: number;

  // Scale compatibility
  requiresSymmetric?: boolean;
  blockedScaleTypes?: string[];
  onlyForScaleTypes?: string[];
  minScaleNotes?: number;

  // Scale-family display names
  chromaticDisplayName?: string;
  pentatonicDisplayName?: string;
  hexatonicDisplayName?: string;
  octatonicDisplayName?: string;
}

/** Cached data structure with version metadata */
interface CachedConstraints {
  version: number;
  timestamp: number;
  scalePatternConstraints: Record<string, PatternConstraints>;
}

// =============================================================================
// Constants
// =============================================================================

const CACHE_KEY = "pattern_constraints_cache";
const CACHE_VERSION = 1; // Increment when schema changes
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// =============================================================================
// Storage Abstraction (cross-platform)
// =============================================================================

/**
 * Cross-platform storage interface
 * Uses AsyncStorage for React Native, localStorage for web
 */
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(key)
        : null;
    }
    return AsyncStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// =============================================================================
// Cache State
// =============================================================================

let cachedConstraints: Record<string, PatternConstraints> | null = null;
let cacheLoadPromise: Promise<Record<string, PatternConstraints>> | null = null;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Backend response uses snake_case, convert to camelCase for TypeScript
 */
function transformConstraints(
  backendData: Record<string, Record<string, unknown>>,
): Record<string, PatternConstraints> {
  const result: Record<string, PatternConstraints> = {};

  for (const [pattern, constraints] of Object.entries(backendData)) {
    result[pattern] = {
      maxOctaves: constraints.max_octaves as number | undefined,
      chromaticMaxOctaves: constraints.chromatic_max_octaves as
        | number
        | undefined,
      requiresSymmetric: constraints.requires_symmetric as boolean | undefined,
      blockedScaleTypes: constraints.blocked_scale_types as
        | string[]
        | undefined,
      onlyForScaleTypes: constraints.only_for_scale_types as
        | string[]
        | undefined,
      minScaleNotes: constraints.min_scale_notes as number | undefined,
      chromaticDisplayName: constraints.chromatic_display_name as
        | string
        | undefined,
      pentatonicDisplayName: constraints.pentatonic_display_name as
        | string
        | undefined,
      hexatonicDisplayName: constraints.hexatonic_display_name as
        | string
        | undefined,
      octatonicDisplayName: constraints.octatonic_display_name as
        | string
        | undefined,
    };

    // Clean up undefined values
    for (const key of Object.keys(result[pattern])) {
      if (
        result[pattern][key as keyof PatternConstraints] === undefined ||
        result[pattern][key as keyof PatternConstraints] === null
      ) {
        delete result[pattern][key as keyof PatternConstraints];
      }
    }
  }

  return result;
}

/**
 * Fetch constraints from backend API
 */
async function fetchFromApi(): Promise<Record<string, PatternConstraints>> {
  const backendData = await api.get<Record<string, Record<string, unknown>>>(
    "/scale-patterns-with-constraints",
  );
  return transformConstraints(backendData);
}

/**
 * Load constraints from cache
 */
async function loadFromCache(): Promise<CachedConstraints | null> {
  try {
    const cached = await storage.get(CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedConstraints = JSON.parse(cached);

    // Version mismatch - invalidate
    if (parsed.version !== CACHE_VERSION) {
      await storage.remove(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    // Corrupted cache - clear it
    await storage.remove(CACHE_KEY);
    return null;
  }
}

/**
 * Save constraints to cache
 */
async function saveToCache(
  constraints: Record<string, PatternConstraints>,
): Promise<void> {
  const cacheEntry: CachedConstraints = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    scalePatternConstraints: constraints,
  };
  await storage.set(CACHE_KEY, JSON.stringify(cacheEntry));
}

/**
 * Check if cache is expired (older than TTL)
 */
function isCacheExpired(cached: CachedConstraints): boolean {
  return Date.now() - cached.timestamp > CACHE_TTL_MS;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get scale pattern constraints.
 *
 * Loading strategy:
 * 1. Return in-memory cache if available (fastest)
 * 2. Return cached data from storage while refreshing in background
 * 3. If cache expired or missing, fetch from API
 * 4. If offline and no cache, return empty object (graceful degradation)
 *
 * @returns Record of pattern name to constraints
 */
export async function getScalePatternConstraints(): Promise<
  Record<string, PatternConstraints>
> {
  // Return in-memory cache immediately
  if (cachedConstraints) {
    return cachedConstraints;
  }

  // Dedupe concurrent calls
  if (cacheLoadPromise) {
    return cacheLoadPromise;
  }

  cacheLoadPromise = (async () => {
    try {
      // Try loading from storage first
      const cached = await loadFromCache();

      if (cached) {
        cachedConstraints = cached.scalePatternConstraints;

        // If cache is fresh, use it directly
        if (!isCacheExpired(cached)) {
          return cachedConstraints;
        }

        // Cache is stale - refresh in background, return stale data immediately
        refreshConstraintsInBackground();
        return cachedConstraints;
      }

      // No cache - must fetch
      cachedConstraints = await fetchFromApi();
      await saveToCache(cachedConstraints);
      return cachedConstraints;
    } catch (error) {
      // Offline or API error - return cached or empty
      const cached = await loadFromCache();
      if (cached) {
        cachedConstraints = cached.scalePatternConstraints;
        return cachedConstraints;
      }

      // No cache available - return empty (graceful degradation)
      devWarn(
        "[PatternConstraintsCache] Failed to load constraints, using empty fallback:",
        error,
      );
      return {};
    } finally {
      cacheLoadPromise = null;
    }
  })();

  return cacheLoadPromise;
}

/**
 * Refresh constraints from API in background.
 * Used when cache is stale but available.
 */
function refreshConstraintsInBackground(): void {
  fetchFromApi()
    .then(async (fresh) => {
      cachedConstraints = fresh;
      await saveToCache(fresh);
    })
    .catch((error) => {
      devWarn("[PatternConstraintsCache] Background refresh failed:", error);
    });
}

/**
 * Force refresh constraints from API.
 * Clears cache and fetches fresh data.
 */
export async function refreshScalePatternConstraints(): Promise<
  Record<string, PatternConstraints>
> {
  cachedConstraints = null;
  await storage.remove(CACHE_KEY);
  return getScalePatternConstraints();
}

/**
 * Clear cached constraints.
 * Useful for testing or when user logs out.
 */
export async function clearPatternConstraintsCache(): Promise<void> {
  cachedConstraints = null;
  cacheLoadPromise = null;
  await storage.remove(CACHE_KEY);
}

/**
 * Preload constraints into cache.
 * Call this on app startup for best performance.
 */
export async function preloadPatternConstraints(): Promise<void> {
  await getScalePatternConstraints();
}
