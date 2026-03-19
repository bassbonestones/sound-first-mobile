/**
 * Rate Limit Hook
 *
 * Tracks rate limit information from API responses and provides
 * UI-friendly state for displaying rate limit warnings.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { RateLimitInfo, OmrQuotaInfo } from "../services/backendContracts";

// ============================================================================
// Types
// ============================================================================

export interface RateLimitState {
  /** Whether we're currently rate limited */
  isLimited: boolean;
  /** Requests remaining in current window */
  requestsRemaining: number | null;
  /** Total requests allowed */
  requestsLimit: number | null;
  /** Seconds until limit resets */
  resetInSeconds: number | null;
  /** Human-readable reset time */
  resetTimeDisplay: string | null;
  /** Warning level: none, low, critical */
  warningLevel: "none" | "low" | "critical";
}

export interface OmrQuotaState {
  /** Pages remaining this month */
  pagesRemaining: number | null;
  /** Total pages allowed per month */
  monthlyLimit: number | null;
  /** Days until quota resets */
  resetInDays: number | null;
  /** Warning level based on remaining pages */
  warningLevel: "none" | "low" | "critical";
}

export interface UseRateLimitReturn {
  /** Current rate limit state */
  rateLimit: RateLimitState;
  /** OMR quota state */
  omrQuota: OmrQuotaState;
  /** Update rate limit from API response headers */
  updateFromHeaders: (headers: Headers) => void;
  /** Update rate limit from RateLimitInfo object */
  updateRateLimit: (info: RateLimitInfo) => void;
  /** Update OMR quota from OmrQuotaInfo object */
  updateOmrQuota: (info: OmrQuotaInfo) => void;
  /** Check if we should show a warning */
  shouldShowWarning: boolean;
  /** Get warning message for display */
  getWarningMessage: () => string | null;
}

// ============================================================================
// Constants
// ============================================================================

const LOW_REQUESTS_THRESHOLD = 10;
const CRITICAL_REQUESTS_THRESHOLD = 3;
const LOW_PAGES_THRESHOLD = 50;
const CRITICAL_PAGES_THRESHOLD = 10;

// ============================================================================
// Hook
// ============================================================================

export function useRateLimit(): UseRateLimitReturn {
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    isLimited: false,
    requestsRemaining: null,
    requestsLimit: null,
    resetInSeconds: null,
    resetTimeDisplay: null,
    warningLevel: "none",
  });

  const [omrQuota, setOmrQuota] = useState<OmrQuotaState>({
    pagesRemaining: null,
    monthlyLimit: null,
    resetInDays: null,
    warningLevel: "none",
  });

  // Countdown timer for rate limit reset
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  /**
   * Calculate warning level for rate limit
   */
  const calculateRateLimitWarning = (remaining: number): "none" | "low" | "critical" => {
    if (remaining <= CRITICAL_REQUESTS_THRESHOLD) return "critical";
    if (remaining <= LOW_REQUESTS_THRESHOLD) return "low";
    return "none";
  };

  /**
   * Calculate warning level for OMR quota
   */
  const calculateQuotaWarning = (remaining: number): "none" | "low" | "critical" => {
    if (remaining <= CRITICAL_PAGES_THRESHOLD) return "critical";
    if (remaining <= LOW_PAGES_THRESHOLD) return "low";
    return "none";
  };

  /**
   * Format seconds as human-readable time
   */
  const formatResetTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h`;
  };

  /**
   * Update rate limit from API response headers
   */
  const updateFromHeaders = useCallback((headers: Headers) => {
    const remaining = headers.get("X-RateLimit-Remaining");
    const limit = headers.get("X-RateLimit-Limit");
    const reset = headers.get("X-RateLimit-Reset");

    if (remaining !== null || limit !== null || reset !== null) {
      const remainingNum = remaining ? parseInt(remaining, 10) : null;
      const limitNum = limit ? parseInt(limit, 10) : null;
      const resetSec = reset ? parseInt(reset, 10) : null;

      updateRateLimit({
        remaining: remainingNum ?? 0,
        limit: limitNum ?? 100,
        resetInSeconds: resetSec ?? 60,
      });
    }
  }, []);

  /**
   * Update rate limit state
   */
  const updateRateLimit = useCallback((info: RateLimitInfo) => {
    const warningLevel = calculateRateLimitWarning(info.remaining);

    setRateLimit({
      isLimited: info.remaining === 0,
      requestsRemaining: info.remaining,
      requestsLimit: info.limit,
      resetInSeconds: info.resetInSeconds,
      resetTimeDisplay: formatResetTime(info.resetInSeconds),
      warningLevel,
    });

    // Start countdown if rate limited
    if (info.remaining === 0 && info.resetInSeconds > 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      let remaining = info.resetInSeconds;
      countdownRef.current = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          setRateLimit((prev) => ({
            ...prev,
            isLimited: false,
            resetInSeconds: 0,
            resetTimeDisplay: null,
          }));
        } else {
          setRateLimit((prev) => ({
            ...prev,
            resetInSeconds: remaining,
            resetTimeDisplay: formatResetTime(remaining),
          }));
        }
      }, 1000);
    }
  }, []);

  /**
   * Update OMR quota state
   */
  const updateOmrQuota = useCallback((info: OmrQuotaInfo) => {
    const warningLevel = calculateQuotaWarning(info.pagesRemaining);

    setOmrQuota({
      pagesRemaining: info.pagesRemaining,
      monthlyLimit: info.monthlyLimit,
      resetInDays: info.resetInDays,
      warningLevel,
    });
  }, []);

  /**
   * Check if we should show a warning
   */
  const shouldShowWarning =
    rateLimit.warningLevel !== "none" || omrQuota.warningLevel !== "none";

  /**
   * Get appropriate warning message
   */
  const getWarningMessage = useCallback((): string | null => {
    if (rateLimit.isLimited) {
      return `Rate limited. Try again in ${rateLimit.resetTimeDisplay}.`;
    }

    if (rateLimit.warningLevel === "critical") {
      return `Only ${rateLimit.requestsRemaining} requests remaining.`;
    }

    if (omrQuota.warningLevel === "critical") {
      return `Only ${omrQuota.pagesRemaining} OMR pages remaining this month.`;
    }

    if (rateLimit.warningLevel === "low") {
      return `${rateLimit.requestsRemaining} requests remaining until reset.`;
    }

    if (omrQuota.warningLevel === "low") {
      return `${omrQuota.pagesRemaining} OMR pages remaining this month.`;
    }

    return null;
  }, [rateLimit, omrQuota]);

  return {
    rateLimit,
    omrQuota,
    updateFromHeaders,
    updateRateLimit,
    updateOmrQuota,
    shouldShowWarning,
    getWarningMessage,
  };
}

export default useRateLimit;
