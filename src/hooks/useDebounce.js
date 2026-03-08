/**
 * useDebounce - Debounce a value or callback
 *
 * Useful for search inputs, API calls on user input, etc.
 *
 * @example
 * // Debounced value
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearch = useDebounce(searchText, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 *
 * @example
 * // Debounced callback
 * const debouncedFetch = useDebouncedCallback(fetchResults, 300);
 * <TextInput onChangeText={debouncedFetch} />
 */

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Debounce a value - returns the value after delay
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  return debouncedCallback;
}

export default useDebounce;
