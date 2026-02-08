"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// =====================================================
// useDebounce - Debounced value hook
// =====================================================

/**
 * useDebounce - Returns a debounced version of the value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     fetchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

// =====================================================
// useDebouncedCallback - Debounced callback hook
// =====================================================

/**
 * useDebouncedCallback - Returns a debounced version of a callback
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds
 * @returns Object with the debounced callback and controls
 *
 * @example
 * ```tsx
 * const { callback: debouncedSearch, cancel, flush } = useDebouncedCallback(
 *   (query: string) => fetchResults(query),
 *   300
 * );
 *
 * return (
 *   <input
 *     onChange={(e) => debouncedSearch(e.target.value)}
 *     onBlur={flush} // Immediately execute pending callback on blur
 *   />
 * );
 * ```
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number = 300
): {
  callback: (...args: Args) => void;
  cancel: () => void;
  flush: () => void;
  isPending: boolean;
} {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const argsRef = useRef<Args | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Update callback ref on each render to get the latest closure
  callbackRef.current = callback;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    argsRef.current = null;
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      callbackRef.current(...argsRef.current);
      argsRef.current = null;
      setIsPending(false);
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Args) => {
      argsRef.current = args;
      setIsPending(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        argsRef.current = null;
        timeoutRef.current = null;
        setIsPending(false);
      }, delay);
    },
    [delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    callback: debouncedCallback,
    cancel,
    flush,
    isPending,
  };
}

// =====================================================
// useThrottle - Throttled value hook
// =====================================================

/**
 * useThrottle - Returns a throttled version of the value
 * Unlike debounce, throttle ensures the value updates at most once per delay
 *
 * @param value - The value to throttle
 * @param delay - Minimum delay between updates in milliseconds
 * @returns The throttled value
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 100);
 *
 * // throttledScrollY updates at most every 100ms
 * ```
 */
export function useThrottle<T>(value: T, delay: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdatedRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdatedRef.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdatedRef.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastUpdatedRef.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}
