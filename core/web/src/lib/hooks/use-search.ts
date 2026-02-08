"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Refs for debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, maxRecentSearches));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [maxRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches: string[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

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
        const newSearches = [trimmed, ...filtered].slice(0, maxRecentSearches);
        saveRecentSearches(newSearches);
        return newSearches;
      });
    },
    [maxRecentSearches, saveRecentSearches]
  );

  // Remove a search from recent searches
  const removeRecentSearch = useCallback(
    (search: string) => {
      setRecentSearches((prev) => {
        const newSearches = prev.filter(
          (s) => s.toLowerCase() !== search.toLowerCase()
        );
        saveRecentSearches(newSearches);
        return newSearches;
      });
    },
    [saveRecentSearches]
  );

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Perform search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const trimmedQuery = searchQuery.trim();

      // Clear results if query is too short
      if (trimmedQuery.length < MIN_QUERY_LENGTH) {
        setResults(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

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
    },
    [type, limit]
  );

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if query is too short
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Set loading immediately for UX feedback
    setIsLoading(true);

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
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
