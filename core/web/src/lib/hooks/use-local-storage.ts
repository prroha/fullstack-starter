"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// =====================================================
// Types
// =====================================================

export interface UseLocalStorageOptions<T> {
  /** Serializer function (default: JSON.stringify) */
  serializer?: (value: T) => string;
  /** Deserializer function (default: JSON.parse) */
  deserializer?: (value: string) => T;
  /** Callback when storage changes from another tab */
  onStorageChange?: (newValue: T | null) => void;
  /** Whether to sync across tabs */
  syncTabs?: boolean;
}

export interface UseLocalStorageReturn<T> {
  /** Current value */
  value: T;
  /** Set a new value */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Remove the value from storage */
  remove: () => void;
  /** Check if value exists in storage */
  isStored: boolean;
}

// =====================================================
// Hook Implementation
// =====================================================

/**
 * useLocalStorage - Persist state in localStorage with type safety
 *
 * @param key - localStorage key
 * @param initialValue - Initial/default value
 * @param options - Configuration options
 * @returns Object with value, setValue, remove, and isStored
 *
 * @example
 * ```tsx
 * const { value: theme, setValue: setTheme } = useLocalStorage("theme", "light");
 *
 * return (
 *   <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
 *     Current: {theme}
 *   </button>
 * );
 * ```
 *
 * @example With custom serializer
 * ```tsx
 * const { value: date, setValue: setDate } = useLocalStorage("lastVisit", new Date(), {
 *   serializer: (date) => date.toISOString(),
 *   deserializer: (str) => new Date(str),
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onStorageChange,
    syncTabs = true,
  } = options;

  // Track if value exists in storage
  const [isStored, setIsStored] = useState(false);

  // Initialize state from localStorage or initial value
  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setIsStored(true);
        return deserializer(item);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }

    return initialValue;
  });

  // Store refs for callbacks to avoid stale closures
  const keyRef = useRef(key);
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);
  const onStorageChangeRef = useRef(onStorageChange);

  // Update refs on each render
  keyRef.current = key;
  serializerRef.current = serializer;
  deserializerRef.current = deserializer;
  onStorageChangeRef.current = onStorageChange;

  // Set value function
  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for convenience
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(keyRef.current, serializerRef.current(valueToStore));
          setIsStored(true);
        }

        // Update state
        setValueState(valueToStore);
      } catch (error) {
        console.warn(`Error setting localStorage key "${keyRef.current}":`, error);
      }
    },
    [value]
  );

  // Remove function
  const remove = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(keyRef.current);
        setIsStored(false);
      }
      setValueState(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, [initialValue]);

  // Listen for changes from other tabs
  useEffect(() => {
    if (typeof window === "undefined" || !syncTabs) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== keyRef.current) return;

      if (event.newValue === null) {
        // Key was removed
        setValueState(initialValue);
        setIsStored(false);
        onStorageChangeRef.current?.(null);
      } else {
        try {
          const newValue = deserializerRef.current(event.newValue);
          setValueState(newValue);
          setIsStored(true);
          onStorageChangeRef.current?.(newValue);
        } catch (error) {
          console.warn(`Error parsing storage event for key "${keyRef.current}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [initialValue, syncTabs]);

  // Handle key changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializerRef.current(item);
        setValueState(parsed);
        setIsStored(true);
      } else {
        setValueState(initialValue);
        setIsStored(false);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setValueState(initialValue);
      setIsStored(false);
    }
  }, [key, initialValue]);

  return {
    value,
    setValue,
    remove,
    isStored,
  };
}

// =====================================================
// useSessionStorage - Same as useLocalStorage but for sessionStorage
// =====================================================

/**
 * useSessionStorage - Persist state in sessionStorage with type safety
 *
 * @param key - sessionStorage key
 * @param initialValue - Initial/default value
 * @param options - Configuration options (syncTabs is ignored)
 * @returns Object with value, setValue, remove, and isStored
 *
 * @example
 * ```tsx
 * const { value: step, setValue: setStep } = useSessionStorage("wizardStep", 1);
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, "syncTabs"> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options;

  const [isStored, setIsStored] = useState(false);

  const [value, setValueState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        setIsStored(true);
        return deserializer(item);
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }

    return initialValue;
  });

  const keyRef = useRef(key);
  const serializerRef = useRef(serializer);
  const deserializerRef = useRef(deserializer);

  keyRef.current = key;
  serializerRef.current = serializer;
  deserializerRef.current = deserializer;

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(value) : newValue;

        if (typeof window !== "undefined") {
          sessionStorage.setItem(keyRef.current, serializerRef.current(valueToStore));
          setIsStored(true);
        }

        setValueState(valueToStore);
      } catch (error) {
        console.warn(`Error setting sessionStorage key "${keyRef.current}":`, error);
      }
    },
    [value]
  );

  const remove = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(keyRef.current);
        setIsStored(false);
      }
      setValueState(initialValue);
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${keyRef.current}":`, error);
    }
  }, [initialValue]);

  // Handle key changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        const parsed = deserializerRef.current(item);
        setValueState(parsed);
        setIsStored(true);
      } else {
        setValueState(initialValue);
        setIsStored(false);
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      setValueState(initialValue);
      setIsStored(false);
    }
  }, [key, initialValue]);

  return {
    value,
    setValue,
    remove,
    isStored,
  };
}
