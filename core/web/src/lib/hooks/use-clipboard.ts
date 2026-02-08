"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// =====================================================
// Types
// =====================================================

export interface UseCopyToClipboardOptions {
  /** Duration to show success state (ms) */
  successDuration?: number;
  /** Callback on successful copy */
  onSuccess?: (text: string) => void;
  /** Callback on copy error */
  onError?: (error: Error) => void;
}

export interface UseCopyToClipboardReturn {
  /** Whether the copy was successful (resets after successDuration) */
  copied: boolean;
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Any error that occurred */
  error: Error | null;
  /** Reset the copied state */
  reset: () => void;
}

// =====================================================
// Hook Implementation
// =====================================================

/**
 * useCopyToClipboard - Copy text to clipboard with feedback
 *
 * @example
 * ```tsx
 * const { copy, copied, error } = useCopyToClipboard();
 *
 * return (
 *   <button onClick={() => copy("Hello, World!")}>
 *     {copied ? "Copied!" : "Copy to clipboard"}
 *   </button>
 * );
 * ```
 *
 * @example With callbacks
 * ```tsx
 * const { copy, copied } = useCopyToClipboard({
 *   onSuccess: () => toast.success("Copied to clipboard!"),
 *   onError: (err) => toast.error("Failed to copy"),
 *   successDuration: 3000,
 * });
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Check for clipboard API support
      if (!navigator?.clipboard) {
        const err = new Error("Clipboard API not supported");
        setError(err);
        onError?.(err);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);

        if (mountedRef.current) {
          setCopied(true);
          setError(null);
          onSuccess?.(text);

          // Reset copied state after duration
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setCopied(false);
            }
          }, successDuration);
        }

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to copy");

        if (mountedRef.current) {
          setError(error);
          setCopied(false);
          onError?.(error);
        }

        return false;
      }
    },
    [successDuration, onSuccess, onError]
  );

  return {
    copied,
    copy,
    error,
    reset,
  };
}

// =====================================================
// useClipboardRead - Read from clipboard
// =====================================================

export interface UseClipboardReadReturn {
  /** Read text from clipboard */
  read: () => Promise<string | null>;
  /** Whether reading is in progress */
  isReading: boolean;
  /** Last read value */
  value: string | null;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * useClipboardRead - Read text from clipboard
 *
 * @example
 * ```tsx
 * const { read, value, isReading } = useClipboardRead();
 *
 * return (
 *   <button onClick={read} disabled={isReading}>
 *     {isReading ? "Reading..." : "Paste from clipboard"}
 *   </button>
 * );
 * ```
 */
export function useClipboardRead(): UseClipboardReadReturn {
  const [isReading, setIsReading] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const read = useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard) {
      const err = new Error("Clipboard API not supported");
      setError(err);
      return null;
    }

    setIsReading(true);
    setError(null);

    try {
      const text = await navigator.clipboard.readText();

      if (mountedRef.current) {
        setValue(text);
        setIsReading(false);
      }

      return text;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to read clipboard");

      if (mountedRef.current) {
        setError(error);
        setIsReading(false);
      }

      return null;
    }
  }, []);

  return {
    read,
    isReading,
    value,
    error,
  };
}
