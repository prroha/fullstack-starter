import 'package:flutter/foundation.dart';
import '../../core/services/admin_service.dart';

// =============================================================================
// Admin Dashboard State
// =============================================================================

/// State for admin dashboard
class AdminDashboardState {
  final DashboardStats? stats;
  final List<ActivityLog> activity;
  final bool isLoading;
  final String? error;

  const AdminDashboardState({
    this.stats,
    this.activity = const [],
    this.isLoading = false,
    this.error,
  });

  AdminDashboardState copyWith({
    DashboardStats? stats,
    List<ActivityLog>? activity,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return AdminDashboardState(
      stats: stats ?? this.stats,
      activity: activity ?? this.activity,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasError => error != null;
}

// =============================================================================
// User List State
// =============================================================================

/// State for user list
class UserListState {
  final List<AdminUser> users;
  final PaginationInfo? pagination;
  final UserListQuery query;
  final bool isLoading;
  final String? error;

  const UserListState({
    this.users = const [],
    this.pagination,
    this.query = const UserListQuery(),
    this.isLoading = false,
    this.error,
  });

  UserListState copyWith({
    List<AdminUser>? users,
    PaginationInfo? pagination,
    UserListQuery? query,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return UserListState(
      users: users ?? this.users,
      pagination: pagination ?? this.pagination,
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasError => error != null;
  bool get hasNextPage => pagination?.hasNextPage ?? false;
  bool get hasPreviousPage => pagination?.hasPreviousPage ?? false;
}

// =============================================================================
// Admin Dashboard Provider
// =============================================================================

/// Provider for admin dashboard state
class AdminDashboardProvider extends ChangeNotifier {
  final AdminService _adminService;

  AdminDashboardState _state = const AdminDashboardState();
  AdminDashboardState get state => _state;

  // Convenience getters
  DashboardStats? get stats => _state.stats;
  List<ActivityLog> get activity => _state.activity;
  bool get isLoading => _state.isLoading;
  String? get error => _state.error;

  AdminDashboardProvider({AdminService? adminService})
      : _adminService = adminService ?? AdminService();

  /// Load dashboard data
  Future<void> loadData() async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      final results = await Future.wait([
        _adminService.getStats(),
        _adminService.getRecentActivity(limit: 10),
      ]);

      _setState(_state.copyWith(
        stats: results[0] as DashboardStats,
        activity: results[1] as List<ActivityLog>,
        isLoading: false,
      ));
    } catch (e) {
      _setState(_state.copyWith(
        error: 'Failed to load dashboard: $e',
        isLoading: false,
      ));
    }
  }

  /// Refresh activity only
  Future<void> refreshActivity() async {
    try {
      final activity = await _adminService.getRecentActivity(limit: 10);
      _setState(_state.copyWith(activity: activity));
    } catch (e) {
      debugPrint('Refresh activity error: $e');
    }
  }

  void clearError() {
    _setState(_state.copyWith(clearError: true));
  }

  void _setState(AdminDashboardState newState) {
    _state = newState;
    notifyListeners();
  }
}

// =============================================================================
// User List Provider
// =============================================================================

/// Provider for user list state
class UserListProvider extends ChangeNotifier {
  final AdminService _adminService;

  UserListState _state = const UserListState();
  UserListState get state => _state;

  // Convenience getters
  List<AdminUser> get users => _state.users;
  PaginationInfo? get pagination => _state.pagination;
  UserListQuery get query => _state.query;
  bool get isLoading => _state.isLoading;
  String? get error => _state.error;

  UserListProvider({AdminService? adminService})
      : _adminService = adminService ?? AdminService();

  /// Load users with current query
  Future<void> loadUsers() async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      final result = await _adminService.listUsers(_state.query);
      _setState(_state.copyWith(
        users: result.users,
        pagination: result.pagination,
        isLoading: false,
      ));
    } catch (e) {
      _setState(_state.copyWith(
        error: 'Failed to load users: $e',
        isLoading: false,
      ));
    }
  }

  /// Search users
  void search(String searchTerm) {
    final newQuery = _state.query.copyWith(
      search: searchTerm.isEmpty ? null : searchTerm,
      page: 1,
      clearSearch: searchTerm.isEmpty,
    );
    _setState(_state.copyWith(query: newQuery));
    loadUsers();
  }

  /// Go to next page
  void nextPage() {
    if (_state.hasNextPage) {
      final newQuery = _state.query.copyWith(page: _state.query.page + 1);
      _setState(_state.copyWith(query: newQuery));
      loadUsers();
    }
  }

  /// Go to previous page
  void previousPage() {
    if (_state.hasPreviousPage) {
      final newQuery = _state.query.copyWith(page: _state.query.page - 1);
      _setState(_state.copyWith(query: newQuery));
      loadUsers();
    }
  }

  /// Filter by role
  void filterByRole(UserRole? role) {
    final newQuery = _state.query.copyWith(
      role: role,
      page: 1,
      clearRole: role == null,
    );
    _setState(_state.copyWith(query: newQuery));
    loadUsers();
  }

  /// Change sort
  void sort(String sortBy, {String sortOrder = 'desc'}) {
    final newQuery = _state.query.copyWith(
      sortBy: sortBy,
      sortOrder: sortOrder,
      page: 1,
    );
    _setState(_state.copyWith(query: newQuery));
    loadUsers();
  }

  /// Delete user
  Future<bool> deleteUser(String userId) async {
    try {
      final success = await _adminService.deleteUser(userId);
      if (success) {
        await loadUsers();
      }
      return success;
    } catch (e) {
      debugPrint('Delete user error: $e');
      return false;
    }
  }

  /// Update user
  Future<AdminUser?> updateUser(
    String userId, {
    String? name,
    UserRole? role,
  }) async {
    try {
      final user = await _adminService.updateUser(
        userId,
        name: name,
        role: role,
      );
      await loadUsers();
      return user;
    } catch (e) {
      debugPrint('Update user error: $e');
      return null;
    }
  }

  void clearError() {
    _setState(_state.copyWith(clearError: true));
  }

  void _setState(UserListState newState) {
    _state = newState;
    notifyListeners();
  }
}

// =============================================================================
// Riverpod Providers (commented - uncomment when using Riverpod)
// =============================================================================

// import 'package:flutter_riverpod/flutter_riverpod.dart';
//
// /// Admin service provider
// final adminServiceProvider = Provider<AdminService>((ref) {
//   return AdminService();
// });
//
// /// Dashboard state notifier
// class DashboardNotifier extends StateNotifier<AdminDashboardState> {
//   final AdminService _service;
//
//   DashboardNotifier(this._service) : super(const AdminDashboardState());
//
//   Future<void> loadData() async {
//     state = state.copyWith(isLoading: true, clearError: true);
//
//     try {
//       final results = await Future.wait([
//         _service.getStats(),
//         _service.getRecentActivity(limit: 10),
//       ]);
//
//       state = state.copyWith(
//         stats: results[0] as DashboardStats,
//         activity: results[1] as List<ActivityLog>,
//         isLoading: false,
//       );
//     } catch (e) {
//       state = state.copyWith(
//         error: 'Failed to load dashboard: $e',
//         isLoading: false,
//       );
//     }
//   }
// }
//
// /// Dashboard provider
// final dashboardProvider =
//     StateNotifierProvider<DashboardNotifier, AdminDashboardState>((ref) {
//   final service = ref.watch(adminServiceProvider);
//   return DashboardNotifier(service);
// });
//
// /// Dashboard stats provider
// final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
//   final service = ref.watch(adminServiceProvider);
//   return service.getStats();
// });
//
// /// Recent activity provider
// final recentActivityProvider = FutureProvider<List<ActivityLog>>((ref) async {
//   final service = ref.watch(adminServiceProvider);
//   return service.getRecentActivity(limit: 10);
// });
//
// /// User list state notifier
// class UserListNotifier extends StateNotifier<UserListState> {
//   final AdminService _service;
//
//   UserListNotifier(this._service) : super(const UserListState());
//
//   // ... implement methods similar to UserListProvider above
// }
//
// /// User list provider
// final userListProvider =
//     StateNotifierProvider<UserListNotifier, UserListState>((ref) {
//   final service = ref.watch(adminServiceProvider);
//   return UserListNotifier(service);
// });
