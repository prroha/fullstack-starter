'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// =============================================================================
// Types
// =============================================================================

export type UserRole = 'USER' | 'ADMIN' | 'MANAGER';

export type Permission =
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'
  | 'settings:read'
  | 'settings:update'
  | 'activity:read'
  | 'stats:read';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole?: Record<string, number>;
}

export interface SystemSettings {
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  [key: string]: string | boolean | number;
}

export interface ActivityEntry {
  id: string;
  type: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// =============================================================================
// Helper Functions
// =============================================================================

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// =============================================================================
// useAdminStats Hook
// =============================================================================

export interface UseAdminStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi<{ success: boolean; stats: DashboardStats }>(
        '/admin/stats'
      );
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// =============================================================================
// useAdminUsers Hook
// =============================================================================

export interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseAdminUsersReturn {
  users: AdminUser[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUser: (userId: string, data: Partial<AdminUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setRole: (role: UserRole | undefined) => void;
}

export function useAdminUsers(
  initialOptions: UseAdminUsersOptions = {}
): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: initialOptions.page || 1,
    limit: initialOptions.limit || 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<UseAdminUsersOptions>(initialOptions);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(options.page || 1));
      params.set('limit', String(options.limit || 20));
      if (options.search) params.set('search', options.search);
      if (options.role) params.set('role', options.role);
      if (options.sortBy) params.set('sortBy', options.sortBy);
      if (options.sortOrder) params.set('sortOrder', options.sortOrder);

      const data = await fetchApi<{
        success: boolean;
        users: AdminUser[];
        pagination: Pagination;
      }>(`/admin/users?${params}`);

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(
    async (userId: string, data: Partial<AdminUser>) => {
      try {
        const response = await fetchApi<{
          success: boolean;
          user: AdminUser;
        }>(`/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });

        if (response.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? response.user : u))
          );
        }
      } catch (err) {
        console.error('Error updating user:', err);
        throw err;
      }
    },
    []
  );

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await fetchApi(`/admin/users/${userId}`, {
        method: 'DELETE',
      });

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }, []);

  const setPage = useCallback((page: number) => {
    setOptions((prev) => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setOptions((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setRole = useCallback((role: UserRole | undefined) => {
    setOptions((prev) => ({ ...prev, role, page: 1 }));
  }, []);

  return {
    users,
    pagination,
    loading,
    error,
    refetch: fetchUsers,
    updateUser,
    deleteUser,
    setPage,
    setSearch,
    setRole,
  };
}

// =============================================================================
// useAdminSettings Hook
// =============================================================================

export interface UseAdminSettingsReturn {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  updateSetting: (key: string, value: string | boolean | number) => Promise<void>;
  resetSetting: (key: string) => Promise<void>;
}

export function useAdminSettings(): UseAdminSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi<{
        success: boolean;
        settings: SystemSettings;
      }>('/admin/settings');
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (newSettings: Partial<SystemSettings>) => {
      try {
        const data = await fetchApi<{
          success: boolean;
          settings: SystemSettings;
        }>('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ settings: newSettings }),
        });

        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Error updating settings:', err);
        throw err;
      }
    },
    []
  );

  const updateSetting = useCallback(
    async (key: string, value: string | boolean | number) => {
      try {
        const data = await fetchApi<{
          success: boolean;
          key: string;
          value: string | boolean | number;
        }>(`/admin/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value }),
        });

        if (data.success) {
          setSettings((prev) =>
            prev ? { ...prev, [key]: data.value } : null
          );
        }
      } catch (err) {
        console.error('Error updating setting:', err);
        throw err;
      }
    },
    []
  );

  const resetSetting = useCallback(async (key: string) => {
    try {
      const data = await fetchApi<{
        success: boolean;
        key: string;
        value: string | boolean | number;
      }>(`/admin/settings/${key}`, {
        method: 'DELETE',
      });

      if (data.success) {
        setSettings((prev) =>
          prev ? { ...prev, [key]: data.value } : null
        );
      }
    } catch (err) {
      console.error('Error resetting setting:', err);
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
    updateSetting,
    resetSetting,
  };
}

// =============================================================================
// useAdminActivity Hook
// =============================================================================

export interface UseAdminActivityOptions {
  limit?: number;
  type?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAdminActivityReturn {
  activity: ActivityEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export function useAdminActivity(
  options: UseAdminActivityOptions = {}
): UseAdminActivityReturn {
  const { limit = 20, type, autoRefresh = false, refreshInterval = 30000 } = options;

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivity = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setOffset(0);
        }
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(reset ? 0 : offset));
        if (type) params.set('type', type);

        const data = await fetchApi<{
          success: boolean;
          activity: ActivityEntry[];
          pagination: { total: number; limit: number; offset: number };
        }>(`/admin/activity?${params}`);

        if (data.success) {
          if (reset) {
            setActivity(data.activity);
          } else {
            setActivity((prev) => [...prev, ...data.activity]);
          }
          setHasMore(data.activity.length === limit);
          setOffset((prev) => (reset ? limit : prev + limit));
        }
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    },
    [limit, offset, type]
  );

  // Initial fetch
  useEffect(() => {
    fetchActivity(true);
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchActivity(true);
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchActivity(false);
  }, [fetchActivity, hasMore, loading]);

  const refetch = useCallback(async () => {
    await fetchActivity(true);
  }, [fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
  };
}

// =============================================================================
// useAdminPermissions Hook
// =============================================================================

export interface UseAdminPermissionsReturn {
  permissions: Permission[];
  role: string | null;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refetch: () => Promise<void>;
}

export function useAdminPermissions(): UseAdminPermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi<{
        success: boolean;
        role: string;
        permissions: Permission[];
      }>('/admin/permissions');

      if (data.success) {
        setPermissions(data.permissions);
        setRole(data.role);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch permissions'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission: Permission) => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: Permission[]) => perms.some((p) => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]) => perms.every((p) => permissions.includes(p)),
    [permissions]
  );

  return {
    permissions,
    role,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}

// =============================================================================
// useAdminUser Hook (Single User)
// =============================================================================

export interface UseAdminUserReturn {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateUser: (data: Partial<AdminUser>) => Promise<void>;
}

export function useAdminUser(userId: string | null): UseAdminUserReturn {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi<{
        success: boolean;
        user: AdminUser;
      }>(`/admin/users/${userId}`);

      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback(
    async (data: Partial<AdminUser>) => {
      if (!userId) return;

      try {
        const response = await fetchApi<{
          success: boolean;
          user: AdminUser;
        }>(`/admin/users/${userId}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });

        if (response.success) {
          setUser(response.user);
        }
      } catch (err) {
        console.error('Error updating user:', err);
        throw err;
      }
    },
    [userId]
  );

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser,
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  useAdminStats,
  useAdminUsers,
  useAdminSettings,
  useAdminActivity,
  useAdminPermissions,
  useAdminUser,
};
