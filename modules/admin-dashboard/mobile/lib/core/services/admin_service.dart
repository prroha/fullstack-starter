import 'dart:async';
import 'package:flutter/foundation.dart';

// =============================================================================
// Types
// =============================================================================

/// User role enum
enum UserRole {
  user,
  admin,
}

/// Dashboard statistics
class DashboardStats {
  final int totalUsers;
  final int activeUsers;
  final int newUsersToday;
  final int newUsersThisWeek;
  final int newUsersThisMonth;

  const DashboardStats({
    required this.totalUsers,
    required this.activeUsers,
    required this.newUsersToday,
    required this.newUsersThisWeek,
    required this.newUsersThisMonth,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalUsers: json['totalUsers'] as int? ?? 0,
      activeUsers: json['activeUsers'] as int? ?? 0,
      newUsersToday: json['newUsersToday'] as int? ?? 0,
      newUsersThisWeek: json['newUsersThisWeek'] as int? ?? 0,
      newUsersThisMonth: json['newUsersThisMonth'] as int? ?? 0,
    );
  }

  factory DashboardStats.empty() {
    return const DashboardStats(
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
    );
  }
}

/// Admin user model
class AdminUser {
  final String id;
  final String email;
  final String? name;
  final UserRole role;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AdminUser({
    required this.id,
    required this.email,
    this.name,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    return AdminUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String?,
      role: json['role'] == 'ADMIN' ? UserRole.admin : UserRole.user,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  String get displayName => name ?? email;
  String get initials {
    if (name != null && name!.isNotEmpty) {
      final parts = name!.split(' ');
      if (parts.length >= 2) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      }
      return name![0].toUpperCase();
    }
    return email[0].toUpperCase();
  }
}

/// Activity log entry
class ActivityLog {
  final String id;
  final String type;
  final AdminUser user;
  final DateTime timestamp;

  const ActivityLog({
    required this.id,
    required this.type,
    required this.user,
    required this.timestamp,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> json) {
    return ActivityLog(
      id: json['id'] as String,
      type: json['type'] as String,
      user: AdminUser.fromJson(json['user'] as Map<String, dynamic>),
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  String get description {
    switch (type) {
      case 'user_created':
        return 'New user registered';
      case 'user_updated':
        return 'User profile updated';
      case 'user_deleted':
        return 'User deleted';
      default:
        return type;
    }
  }
}

/// Pagination info
class PaginationInfo {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const PaginationInfo({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) {
    return PaginationInfo(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
    );
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPreviousPage => page > 1;
}

/// User list query parameters
class UserListQuery {
  final int page;
  final int limit;
  final String? search;
  final String sortBy;
  final String sortOrder;
  final UserRole? role;

  const UserListQuery({
    this.page = 1,
    this.limit = 20,
    this.search,
    this.sortBy = 'createdAt',
    this.sortOrder = 'desc',
    this.role,
  });

  UserListQuery copyWith({
    int? page,
    int? limit,
    String? search,
    String? sortBy,
    String? sortOrder,
    UserRole? role,
    bool clearSearch = false,
    bool clearRole = false,
  }) {
    return UserListQuery(
      page: page ?? this.page,
      limit: limit ?? this.limit,
      search: clearSearch ? null : (search ?? this.search),
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
      role: clearRole ? null : (role ?? this.role),
    );
  }

  Map<String, String> toQueryParams() {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };

    if (search != null && search!.isNotEmpty) {
      params['search'] = search!;
    }

    if (role != null) {
      params['role'] = role == UserRole.admin ? 'ADMIN' : 'USER';
    }

    return params;
  }
}

// =============================================================================
// Admin Service
// =============================================================================

/// Service for admin operations
class AdminService {
  static final AdminService _instance = AdminService._internal();

  factory AdminService() => _instance;

  AdminService._internal();

  String _apiBaseUrl = '/api/v1';

  /// Set API base URL
  void setApiBaseUrl(String url) {
    _apiBaseUrl = url;
  }

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  /// Get dashboard statistics
  Future<DashboardStats> getStats() async {
    try {
      // In production:
      // final response = await http.get(
      //   Uri.parse('$_apiBaseUrl/admin/stats'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return DashboardStats.fromJson(data['stats']);
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return const DashboardStats(
        totalUsers: 1234,
        activeUsers: 892,
        newUsersToday: 45,
        newUsersThisWeek: 187,
        newUsersThisMonth: 523,
      );
    } catch (e) {
      _log('Get stats error: $e');
      rethrow;
    }
  }

  /// Get recent activity
  Future<List<ActivityLog>> getRecentActivity({int limit = 10}) async {
    try {
      // In production:
      // final response = await http.get(
      //   Uri.parse('$_apiBaseUrl/admin/activity?limit=$limit'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return (data['activity'] as List)
      //       .map((a) => ActivityLog.fromJson(a))
      //       .toList();
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 300));
      return List.generate(
        limit,
        (i) => ActivityLog(
          id: 'activity-$i',
          type: i % 3 == 0 ? 'user_created' : 'user_updated',
          user: AdminUser(
            id: 'user-$i',
            email: 'user$i@example.com',
            name: 'User $i',
            role: UserRole.user,
            createdAt: DateTime.now().subtract(Duration(hours: i)),
            updatedAt: DateTime.now().subtract(Duration(minutes: i * 10)),
          ),
          timestamp: DateTime.now().subtract(Duration(minutes: i * 15)),
        ),
      );
    } catch (e) {
      _log('Get activity error: $e');
      rethrow;
    }
  }

  // ===========================================================================
  // User Management
  // ===========================================================================

  /// List users with pagination and filtering
  Future<({List<AdminUser> users, PaginationInfo pagination})> listUsers(
      UserListQuery query) async {
    try {
      // In production:
      // final uri = Uri.parse('$_apiBaseUrl/admin/users')
      //     .replace(queryParameters: query.toQueryParams());
      //
      // final response = await http.get(
      //   uri,
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return (
      //     users: (data['users'] as List)
      //         .map((u) => AdminUser.fromJson(u))
      //         .toList(),
      //     pagination: PaginationInfo.fromJson(data['pagination']),
      //   );
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));

      final total = 100;
      final start = (query.page - 1) * query.limit;

      return (
        users: List.generate(
          query.limit,
          (i) {
            final index = start + i;
            return AdminUser(
              id: 'user-$index',
              email: 'user$index@example.com',
              name: query.search != null
                  ? '${query.search} User $index'
                  : 'User $index',
              role: index % 10 == 0 ? UserRole.admin : UserRole.user,
              createdAt: DateTime.now().subtract(Duration(days: index)),
              updatedAt: DateTime.now().subtract(Duration(hours: index)),
            );
          },
        ),
        pagination: PaginationInfo(
          page: query.page,
          limit: query.limit,
          total: total,
          totalPages: (total / query.limit).ceil(),
        ),
      );
    } catch (e) {
      _log('List users error: $e');
      rethrow;
    }
  }

  /// Get single user by ID
  Future<AdminUser> getUser(String userId) async {
    try {
      // In production:
      // final response = await http.get(
      //   Uri.parse('$_apiBaseUrl/admin/users/$userId'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return AdminUser.fromJson(data['user']);
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 300));
      return AdminUser(
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        role: UserRole.user,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now(),
      );
    } catch (e) {
      _log('Get user error: $e');
      rethrow;
    }
  }

  /// Update user
  Future<AdminUser> updateUser(
    String userId, {
    String? name,
    UserRole? role,
  }) async {
    try {
      // In production:
      // final response = await http.patch(
      //   Uri.parse('$_apiBaseUrl/admin/users/$userId'),
      //   headers: {
      //     'Authorization': 'Bearer $token',
      //     'Content-Type': 'application/json',
      //   },
      //   body: jsonEncode({
      //     if (name != null) 'name': name,
      //     if (role != null) 'role': role == UserRole.admin ? 'ADMIN' : 'USER',
      //   }),
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return AdminUser.fromJson(data['user']);
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return AdminUser(
        id: userId,
        email: 'user@example.com',
        name: name ?? 'Updated User',
        role: role ?? UserRole.user,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now(),
      );
    } catch (e) {
      _log('Update user error: $e');
      rethrow;
    }
  }

  /// Delete user
  Future<bool> deleteUser(String userId) async {
    try {
      // In production:
      // final response = await http.delete(
      //   Uri.parse('$_apiBaseUrl/admin/users/$userId'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // return data['success'] == true;

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      _log('Delete user error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Settings
  // ===========================================================================

  /// Get system settings
  Future<Map<String, dynamic>> getSettings() async {
    try {
      // In production:
      // final response = await http.get(
      //   Uri.parse('$_apiBaseUrl/admin/settings'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return data['settings'] as Map<String, dynamic>;
      // }
      // throw Exception(data['error']);

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 300));
      return {
        'appName': 'My App',
        'supportEmail': 'support@example.com',
        'maintenanceMode': false,
        'allowRegistration': true,
        'requireEmailVerification': false,
      };
    } catch (e) {
      _log('Get settings error: $e');
      rethrow;
    }
  }

  /// Update system settings
  Future<bool> updateSettings(Map<String, dynamic> settings) async {
    try {
      // In production:
      // final response = await http.put(
      //   Uri.parse('$_apiBaseUrl/admin/settings'),
      //   headers: {
      //     'Authorization': 'Bearer $token',
      //     'Content-Type': 'application/json',
      //   },
      //   body: jsonEncode({'settings': settings}),
      // );
      //
      // final data = jsonDecode(response.body);
      // return data['success'] == true;

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      _log('Update settings error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[AdminService] $message');
    }
  }
}

// =============================================================================
// Global Instance
// =============================================================================

/// Global admin service instance
final adminService = AdminService();
