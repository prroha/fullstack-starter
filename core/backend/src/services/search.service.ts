import { db } from "../lib/db.js";
import { UserRole } from "@prisma/client";

/**
 * Search result types
 */
export type SearchType = "all" | "users";

/**
 * User search result
 */
interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Grouped search results
 */
export interface SearchResults {
  users?: UserSearchResult[];
  query: string;
  totalResults: number;
}

/**
 * Search options
 */
interface SearchOptions {
  query: string;
  types: SearchType;
  userId: string;
  isAdmin: boolean;
  limit?: number;
}

class SearchService {
  private readonly DEFAULT_LIMIT = 5;

  /**
   * Perform global search across multiple entities
   */
  async search(options: SearchOptions): Promise<SearchResults> {
    const { query, types, isAdmin, limit = this.DEFAULT_LIMIT } = options;

    // Sanitize and prepare query
    const searchQuery = query.trim();

    if (!searchQuery || searchQuery.length < 2) {
      return {
        query: searchQuery,
        totalResults: 0,
      };
    }

    const results: SearchResults = {
      query: searchQuery,
      totalResults: 0,
    };

    // Determine which types to search
    const searchUsers = types === "all" || types === "users";

    // Execute searches in parallel
    const searchPromises: Promise<void>[] = [];

    // Search users (admin only)
    if (searchUsers && isAdmin) {
      searchPromises.push(
        this.searchUsers(searchQuery, limit).then((users) => {
          results.users = users;
          results.totalResults += users.length;
        })
      );
    }

    // Wait for all searches to complete
    await Promise.all(searchPromises);

    return results;
  }

  /**
   * Search users by email or name (admin only)
   */
  private async searchUsers(
    query: string,
    limit: number
  ): Promise<UserSearchResult[]> {
    const users = await db.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return users;
  }

  /**
   * Get search suggestions based on recent/popular searches
   * This could be extended to use Redis for caching popular searches
   */
  async getSuggestions(_userId: string, _limit: number = 5): Promise<string[]> {
    // For now, return empty array - can be extended with Redis caching
    // or database table for storing search history
    return [];
  }
}

export const searchService = new SearchService();
