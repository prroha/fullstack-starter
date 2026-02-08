"use client";

import { useState, useCallback, useMemo } from "react";

// =====================================================
// Types
// =====================================================

export interface UseToggleReturn {
  /** Current value */
  value: boolean;
  /** Set value to true */
  on: () => void;
  /** Set value to false */
  off: () => void;
  /** Toggle between true and false */
  toggle: () => void;
  /** Set to a specific value */
  set: (value: boolean) => void;
}

// =====================================================
// Hook Implementation
// =====================================================

/**
 * useToggle - Simple boolean toggle hook
 *
 * @example
 * ```tsx
 * const { value: isOpen, toggle, on: open, off: close } = useToggle(false);
 *
 * return (
 *   <>
 *     <Button onClick={open}>Open</Button>
 *     <Modal isOpen={isOpen} onClose={close} />
 *   </>
 * );
 * ```
 *
 * @example With destructured rename
 * ```tsx
 * const { value: showPassword, toggle: togglePassword } = useToggle(false);
 *
 * return (
 *   <Input
 *     type={showPassword ? "text" : "password"}
 *     suffix={
 *       <button onClick={togglePassword}>
 *         {showPassword ? <EyeOff /> : <Eye />}
 *       </button>
 *     }
 *   />
 * );
 * ```
 */
export function useToggle(initialValue: boolean = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue);

  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);
  const set = useCallback((newValue: boolean) => setValue(newValue), []);

  return useMemo(
    () => ({
      value,
      on,
      off,
      toggle,
      set,
    }),
    [value, on, off, toggle, set]
  );
}

// =====================================================
// Extended Toggle Hook
// =====================================================

export interface UseToggleWithCallbackOptions {
  /** Callback when value changes to true */
  onOn?: () => void;
  /** Callback when value changes to false */
  onOff?: () => void;
  /** Callback when value changes (either direction) */
  onChange?: (value: boolean) => void;
}

export interface UseToggleWithCallbackReturn extends UseToggleReturn {
  /** Reset to initial value */
  reset: () => void;
}

/**
 * useToggleWithCallback - Toggle with callbacks for state changes
 *
 * @example
 * ```tsx
 * const { value: isSubscribed, toggle } = useToggleWithCallback(false, {
 *   onOn: () => toast.success("Subscribed!"),
 *   onOff: () => toast.info("Unsubscribed"),
 * });
 * ```
 */
export function useToggleWithCallback(
  initialValue: boolean = false,
  options: UseToggleWithCallbackOptions = {}
): UseToggleWithCallbackReturn {
  const { onOn, onOff, onChange } = options;
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
      onChange?.(newValue);
      if (newValue) {
        onOn?.();
      } else {
        onOff?.();
      }
    },
    [onChange, onOn, onOff]
  );

  const on = useCallback(() => updateValue(true), [updateValue]);
  const off = useCallback(() => updateValue(false), [updateValue]);
  const toggle = useCallback(() => {
    setValue((prev) => {
      const newValue = !prev;
      onChange?.(newValue);
      if (newValue) {
        onOn?.();
      } else {
        onOff?.();
      }
      return newValue;
    });
  }, [onChange, onOn, onOff]);
  const set = useCallback(
    (newValue: boolean) => updateValue(newValue),
    [updateValue]
  );
  const reset = useCallback(() => setValue(initialValue), [initialValue]);

  return useMemo(
    () => ({
      value,
      on,
      off,
      toggle,
      set,
      reset,
    }),
    [value, on, off, toggle, set, reset]
  );
}
