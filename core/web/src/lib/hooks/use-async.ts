"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// =====================================================
// Types
// =====================================================

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  /** Current status of the async operation */
  status: AsyncStatus;
  /** Data returned from successful execution */
  data: T | null;
  /** Error from failed execution */
  error: Error | null;
  /** Whether the operation is currently loading */
  isLoading: boolean;
  /** Whether the operation completed successfully */
  isSuccess: boolean;
  /** Whether the operation failed */
  isError: boolean;
  /** Whether the operation is idle (hasn't run yet) */
  isIdle: boolean;
}

export interface UseAsyncOptions<T> {
  /** Initial data value */
  initialData?: T | null;
  /** Callback when operation succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when operation fails */
  onError?: (error: Error) => void;
  /** Whether to run immediately on mount */
  immediate?: boolean;
}

export interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  /** Execute the async function */
  execute: (...args: Args) => Promise<T | null>;
  /** Reset state to initial values */
  reset: () => void;
  /** Set data manually */
  setData: (data: T | null) => void;
}

// =====================================================
// Hook Implementation
// =====================================================

/**
 * useAsync - Generic hook for handling async operations with loading/error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(async (id: string) => {
 *   const response = await api.getUser(id);
 *   return response.data;
 * });
 *
 * // Later
 * await execute("user-123");
 * ```
 *
 * @example With immediate execution
 * ```tsx
 * const { data, isLoading } = useAsync(
 *   async () => api.getProfile(),
 *   { immediate: true }
 * );
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, Args> {
  const { initialData = null, onSuccess, onError, immediate = false } = options;

  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  // Store the latest callbacks to avoid stale closures
  const callbacksRef = useRef({ onSuccess, onError });
  callbacksRef.current = { onSuccess, onError };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setStatus("loading");
      setError(null);

      try {
        const result = await asyncFunction(...args);

        if (mountedRef.current) {
          setData(result);
          setStatus("success");
          callbacksRef.current.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (mountedRef.current) {
          setError(error);
          setStatus("error");
          callbacksRef.current.onError?.(error);
        }

        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setData(initialData);
    setError(null);
  }, [initialData]);

  // Run immediately if specified
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    data,
    error,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
    execute,
    reset,
    setData,
  };
}

// =====================================================
// Convenience Hooks
// =====================================================

/**
 * useAsyncCallback - Similar to useAsync but designed for event handlers
 * Does not support immediate execution
 *
 * @example
 * ```tsx
 * const { execute, isLoading } = useAsyncCallback(async (data: FormData) => {
 *   await api.submitForm(data);
 * });
 *
 * return (
 *   <Button onClick={() => execute(formData)} isLoading={isLoading}>
 *     Submit
 *   </Button>
 * );
 * ```
 */
export function useAsyncCallback<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: Omit<UseAsyncOptions<T>, "immediate"> = {}
): UseAsyncReturn<T, Args> {
  return useAsync(asyncFunction, { ...options, immediate: false });
}

// =====================================================
// Types Export
// =====================================================

export type { AsyncStatus as UseAsyncStatus };
