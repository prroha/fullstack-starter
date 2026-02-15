'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Alert } from '@/components/feedback/alert';
import { toast } from '@/lib/toast';

// =============================================================================
// Types
// =============================================================================

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
];

// =============================================================================
// Admin Users Page
// =============================================================================

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.limit]);

  useEffect(() => {
    fetchUsers(1, '');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage);
  };

  const handleDelete = async (userId: string) => {
    setDeleteLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        toast.success('User deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        toast.success('Role updated successfully');
      } else {
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Update role error:', err);
      toast.error('Failed to update role');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  User Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {pagination.total} total users
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
              />
            </div>
            <Button type="submit">
              Search
            </Button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              {error}
              <Button
                variant="link"
                size="sm"
                onClick={() => fetchUsers(1, search)}
                className="ml-4 text-destructive underline"
              >
                Retry
              </Button>
            </Alert>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12">
              <EmptyState title="No users found" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Select
                        value={user.role}
                        onChange={(value) => handleRoleChange(user.id, value)}
                        options={roleOptions}
                        size="sm"
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm">
                      <ConfirmButton
                        confirmMode="dialog"
                        confirmTitle="Delete User"
                        confirmMessage="Are you sure you want to delete this user?"
                        variant="ghost"
                        size="sm"
                        onConfirm={() => handleDelete(user.id)}
                        disabled={deleteLoading === user.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {deleteLoading === user.id ? 'Deleting...' : 'Delete'}
                      </ConfirmButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              showItemCount
            />
          </div>
        )}
      </main>
    </div>
  );
}
