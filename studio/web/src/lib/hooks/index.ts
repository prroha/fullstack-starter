// =====================================================
// Studio Hooks Index
// =====================================================
//
// Central export point for all hooks used in the Studio web app.
// Re-exports core hooks for convenience.
//
// Available hooks from core:
// - useDebounce(value, delay) - Debounce a value
// - useLocalStorage(key, initialValue) - Persist state to localStorage
// - usePrevious(value) - Get the previous value
// - useMediaQuery(query) - Responsive media queries
// - useOnClickOutside(ref, handler) - Detect clicks outside element
// - useToggle(initialValue) - Boolean toggle state
// - useAsync(asyncFn) - Handle async operations
//
// Usage:
//   import { useDebounce, useLocalStorage } from "@/lib/hooks";
// =====================================================

export * from "@core/lib/hooks";
export { useNavigationProgress } from "./use-navigation-progress";
