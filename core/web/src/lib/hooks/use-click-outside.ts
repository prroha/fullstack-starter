"use client";

import { useEffect, useRef, useCallback, RefObject } from "react";

// =====================================================
// Types
// =====================================================

export interface UseClickOutsideOptions {
  /** Whether the handler is enabled */
  enabled?: boolean;
  /** Event type to listen for */
  eventType?: "mousedown" | "mouseup" | "click";
}

// =====================================================
// Hook Implementation
// =====================================================

/**
 * useClickOutside - Detect clicks outside of an element
 *
 * @param handler - Callback when click outside is detected
 * @param options - Configuration options
 * @returns Ref to attach to the element
 *
 * @example
 * ```tsx
 * const dropdownRef = useClickOutside(() => setIsOpen(false));
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <DropdownContent />}
 *   </div>
 * );
 * ```
 *
 * @example With enabled control
 * ```tsx
 * const dropdownRef = useClickOutside(
 *   () => setIsOpen(false),
 *   { enabled: isOpen }
 * );
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
): RefObject<T | null> {
  const { enabled = true, eventType = "mousedown" } = options;
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);

  // Update handler ref to always have the latest callback
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current(event);
      }
    }

    document.addEventListener(eventType, handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener(eventType, handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [enabled, eventType]);

  return ref;
}

// =====================================================
// useClickOutsideMultiple - For multiple refs
// =====================================================

/**
 * useClickOutsideMultiple - Detect clicks outside of multiple elements
 *
 * @param refs - Array of refs to check
 * @param handler - Callback when click outside is detected
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const buttonRef = useRef(null);
 * const menuRef = useRef(null);
 *
 * useClickOutsideMultiple(
 *   [buttonRef, menuRef],
 *   () => setIsOpen(false),
 *   { enabled: isOpen }
 * );
 * ```
 */
export function useClickOutsideMultiple(
  refs: RefObject<HTMLElement | null>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true, eventType = "mousedown" } = options;
  const handlerRef = useRef(handler);

  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const isOutside = refs.every(
        (ref) => ref.current && !ref.current.contains(event.target as Node)
      );

      if (isOutside) {
        handlerRef.current(event);
      }
    }

    document.addEventListener(eventType, handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener(eventType, handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [refs, enabled, eventType]);
}

// =====================================================
// useEscapeKey - Detect escape key press
// =====================================================

/**
 * useEscapeKey - Detect escape key press
 *
 * @param handler - Callback when escape is pressed
 * @param enabled - Whether the handler is enabled
 *
 * @example
 * ```tsx
 * useEscapeKey(() => setIsOpen(false), isOpen);
 * ```
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handlerRef.current(event);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
}

// =====================================================
// useClickOutsideWithEscape - Combined hook
// =====================================================

export interface UseClickOutsideWithEscapeOptions extends UseClickOutsideOptions {
  /** Whether escape key should trigger the handler */
  enableEscape?: boolean;
}

/**
 * useClickOutsideWithEscape - Detect clicks outside or escape key press
 *
 * @param handler - Callback when click outside or escape is detected
 * @param options - Configuration options
 * @returns Ref to attach to the element
 *
 * @example
 * ```tsx
 * const dropdownRef = useClickOutsideWithEscape(
 *   () => setIsOpen(false),
 *   { enabled: isOpen }
 * );
 *
 * return <div ref={dropdownRef}>{...}</div>;
 * ```
 */
export function useClickOutsideWithEscape<T extends HTMLElement = HTMLDivElement>(
  handler: () => void,
  options: UseClickOutsideWithEscapeOptions = {}
): RefObject<T | null> {
  const { enableEscape = true, ...clickOutsideOptions } = options;

  const ref = useClickOutside<T>(handler, clickOutsideOptions);
  useEscapeKey(handler, clickOutsideOptions.enabled !== false && enableEscape);

  return ref;
}
