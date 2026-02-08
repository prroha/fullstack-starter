/// API endpoint constants
class ApiConstants {
  // Base URL - configure via environment
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1', // Android emulator localhost
  );

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String refresh = '/auth/refresh';
  static const String changePassword = '/auth/change-password';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static String verifyResetToken(String token) => '/auth/verify-reset-token/$token';

  // Email verification endpoints
  static String verifyEmail(String token) => '/auth/verify-email/$token';
  static const String sendVerification = '/auth/send-verification';

  // Session management endpoints
  static const String sessions = '/auth/sessions';
  static String sessionById(String id) => '/auth/sessions/$id';

  // User profile endpoints
  static const String profile = '/users/me';
  static const String avatar = '/users/me/avatar';

  // Admin endpoints
  static const String adminStats = '/admin/stats';
  static const String adminUsers = '/admin/users';
  static String adminUserById(String id) => '/admin/users/$id';
  static const String adminAuditLogs = '/admin/audit-logs';
  static String adminAuditLogById(String id) => '/admin/audit-logs/$id';
  static const String adminAuditLogEntityTypes = '/admin/audit-logs/entity-types';
  static const String adminAuditLogActionTypes = '/admin/audit-logs/action-types';

  // Search endpoints
  static const String search = '/search';

  // Contact endpoints
  static const String contact = '/contact';

  // Notification endpoints
  static const String notifications = '/notifications';
  static const String notificationsUnreadCount = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';
  static String notificationById(String id) => '/notifications/$id';
  static String notificationMarkRead(String id) => '/notifications/$id/read';

  // Export endpoints (part of profile and admin)
  // User export: /users/me/export?format=json|csv
  // Admin users export: /admin/users/export
  // Admin audit logs export: /admin/audit-logs/export

  // Add your endpoints here
  // static const String posts = '/posts';
  // static String postById(String id) => '/posts/$id';
}
