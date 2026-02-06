"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * User types
 */
export type UserRole = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * API Client
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Send cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.error?.message || "Request failed",
          data.error?.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, "Network error");
    }
  }

  // =====================================================
  // AUTH
  // =====================================================

  async login(email: string, password: string) {
    return this.request<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{ user: User }>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async logout() {
    return this.request("/v1/auth/logout", {
      method: "POST",
    });
  }

  async getMe() {
    return this.request<{ user: User }>("/v1/auth/me");
  }

  async refresh() {
    return this.request<{
      accessToken: string;
      refreshToken: string;
    }>("/v1/auth/refresh", {
      method: "POST",
    });
  }

  // =====================================================
  // ADD YOUR API METHODS HERE
  // =====================================================

  // Example:
  // async getPosts(page = 1, limit = 10) {
  //   return this.request<PaginatedResponse<Post>>(`/v1/posts?page=${page}&limit=${limit}`);
  // }
}

export const api = new ApiClient();
