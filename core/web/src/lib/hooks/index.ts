// =====================================================
// Hooks Library
// =====================================================
// Reusable React hooks for common patterns

// -----------------------------------------------------
// Async Operations
// -----------------------------------------------------
// Generic hook for handling async operations with loading/error states
export {
  useAsync,
  useAsyncCallback,
  type AsyncState,
  type AsyncStatus,
  type UseAsyncOptions,
  type UseAsyncReturn,
  type UseAsyncStatus,
} from "./use-async";

// -----------------------------------------------------
// Boolean Toggle
// -----------------------------------------------------
// Simple boolean toggle with on/off/toggle methods
export {
  useToggle,
  useToggleWithCallback,
  type UseToggleReturn,
  type UseToggleWithCallbackOptions,
  type UseToggleWithCallbackReturn,
} from "./use-toggle";

// -----------------------------------------------------
// Debounce & Throttle
// -----------------------------------------------------
// Debounced values and callbacks for rate limiting
export {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
} from "./use-debounce";

// -----------------------------------------------------
// Clipboard
// -----------------------------------------------------
// Copy to clipboard with feedback
export {
  useCopyToClipboard,
  useClipboardRead,
  type UseCopyToClipboardOptions,
  type UseCopyToClipboardReturn,
  type UseClipboardReadReturn,
} from "./use-clipboard";

// -----------------------------------------------------
// Click Outside & Escape Key
// -----------------------------------------------------
// Detect clicks outside elements and escape key presses
export {
  useClickOutside,
  useClickOutsideMultiple,
  useEscapeKey,
  useClickOutsideWithEscape,
  type UseClickOutsideOptions,
  type UseClickOutsideWithEscapeOptions,
} from "./use-click-outside";

// -----------------------------------------------------
// Local Storage
// -----------------------------------------------------
// Persist state in browser storage
export {
  useLocalStorage,
  useSessionStorage,
  type UseLocalStorageOptions,
  type UseLocalStorageReturn,
} from "./use-local-storage";

// -----------------------------------------------------
// Theme
// -----------------------------------------------------
// Theme hook with extended utilities
export { useTheme } from "./use-theme";
export type {
  ColorMode,
  ResolvedColorMode,
  ThemeInfo,
  UseThemeReturn,
} from "./use-theme";

// -----------------------------------------------------
// Search
// -----------------------------------------------------
// Search hook with debouncing and recent searches
export { useSearch } from "./use-search";
export type {
  UserSearchResult,
  SearchResults,
  SearchType,
} from "./use-search";

// -----------------------------------------------------
// Admin List
// -----------------------------------------------------
// Hook for admin list pages with pagination, search, and filters
export { useAdminList } from "./use-admin-list";
export type {
  UseAdminListOptions,
  UseAdminListReturn,
} from "./use-admin-list";
