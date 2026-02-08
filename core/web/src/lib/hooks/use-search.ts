"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { useDebounce } from "./use-debounce";
import { useLocalStorage } from "./use-local-storage";

// =====================================================
// Types
// =====================================================

export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
}

export interface SearchResults {
  users?: UserSearchResult[];
  query: string;
  totalResults: number;
}

export type SearchType = "all" | "users";

interface UseSearchOptions {
  debounceMs?: number;
  type?: SearchType;
  limit?: number;
  maxRecentSearches?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResults | null;
  isLoading: boolean;
  error: string | null;
  recentSearches: string[];
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (search: string) => void;
}

// =====================================================
// Constants
// =====================================================

const RECENT_SEARCHES_KEY = "recent_searches";
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MAX_RECENT_SEARCHES = 5;
const MIN_QUERY_LENGTH = 2;

// =====================================================
// Hook
// =====================================================

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    type = "all",
    limit = 5,
    maxRecentSearches = DEFAULT_MAX_RECENT_SEARCHES,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the reusable debounce hook
  const debouncedQuery = useDebounce(query, debounceMs);

  // Use localStorage hook for recent searches
  const {
    value: recentSearches,
    setValue: setRecentSearches,
    remove: clearRecentSearchesStorage,
  } = useLocalStorage<string[]>(RECENT_SEARCHES_KEY, []);

  // Track abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add a search to recent searches
  const addRecentSearch = useCallback(
    (search: string) => {
      const trimmed = search.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) return;

      setRecentSearches((prev) => {
        // Remove if already exists, add to front
        const filtered = prev.filter(
          (s) => s.toLowerCase() !== trimmed.toLowerCase()
        );
        return [trimmed, ...filtered].slice(0, maxRecentSearches);
      });
    },
    [maxRecentSearches, setRecentSearches]
  );

  // Remove a search from recent searches
  const removeRecentSearch = useCallback(
    (search: string) => {
      setRecentSearches((prev) =>
        prev.filter((s) => s.toLowerCase() !== search.toLowerCase())
      );
    },
    [setRecentSearches]
  );

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    clearRecentSearchesStorage();
  }, [clearRecentSearchesStorage]);

  // Perform search when debounced query changes
  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Clear results if query is too short
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.search({
          q: trimmedQuery,
          type,
          limit,
        });

        if (response.success && response.data) {
          setResults(response.data.results);
        } else {
          setResults(null);
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(err instanceof Error ? err.message : "Search failed");
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, type, limit]);

  // Set loading state when query changes (before debounce)
  useEffect(() => {
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsLoading(true);
    }
  }, [query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}
