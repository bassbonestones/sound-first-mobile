/**
 * Formatters - Common formatting utilities
 *
 * Pure functions for formatting values for display.
 * All functions are side-effect free.
 */

/**
 * Format a duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @param options - Formatting options
 * @returns Formatted duration string (e.g., "2:30", "1:05:30", "45s")
 */
export function formatDuration(
  ms: number,
  options: { includeMs?: boolean; compact?: boolean } = {},
): string {
  const { includeMs = false, compact = false } = options;

  if (ms < 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  if (compact && totalSeconds < 60) {
    return includeMs
      ? `${seconds}.${String(milliseconds).padStart(3, "0")}s`
      : `${seconds}s`;
  }

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(String(hours));
    parts.push(String(minutes).padStart(2, "0"));
    parts.push(String(seconds).padStart(2, "0"));
  } else {
    parts.push(String(minutes));
    parts.push(String(seconds).padStart(2, "0"));
  }

  let result = parts.join(":");

  if (includeMs) {
    result += `.${String(milliseconds).padStart(3, "0")}`;
  }

  return result;
}

/**
 * Format a decimal as a percentage string
 * @param value - Decimal value (0-1 or 0-100)
 * @param options - Formatting options
 * @returns Formatted percentage (e.g., "85%", "85.5%")
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number; normalized?: boolean } = {},
): string {
  const { decimals = 0, normalized = true } = options;

  // If normalized (0-1), multiply by 100
  const percentage = normalized && value <= 1 ? value * 100 : value;

  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format cents deviation for tuner display
 * @param cents - Cents deviation from target pitch
 * @returns Formatted cents string (e.g., "+5¢", "-3¢", "0¢")
 */
export function formatCents(cents: number): string {
  const rounded = Math.round(cents);

  if (rounded === 0) {
    return "0¢";
  }

  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}¢`;
}

/**
 * Format frequency in Hz for display
 * @param hz - Frequency in hertz
 * @param options - Formatting options
 * @returns Formatted frequency (e.g., "440.0 Hz", "440 Hz")
 */
export function formatFrequency(
  hz: number,
  options: { decimals?: number; includeUnit?: boolean } = {},
): string {
  const { decimals = 1, includeUnit = true } = options;

  const formatted = hz.toFixed(decimals);
  return includeUnit ? `${formatted} Hz` : formatted;
}

/**
 * Pluralize a word based on count
 * @param count - Number of items
 * @param singular - Singular form
 * @param plural - Plural form (defaults to singular + 's')
 * @returns Pluralized string with count (e.g., "1 test", "5 tests")
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

export default {
  formatDuration,
  formatPercentage,
  formatCents,
  formatFrequency,
  pluralize,
};
