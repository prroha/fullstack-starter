/// Route path constants for navigation
class Routes {
  // Auth routes
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  static const String verifyEmail = '/verify-email';

  // Main routes
  static const String home = '/';
  static const String profile = '/profile';
  static const String search = '/search';
  static const String notifications = '/notifications';

  // Settings routes
  static const String settings = '/settings';
  static const String changePassword = '/settings/change-password';
  static const String sessions = '/settings/sessions';
  static const String contact = '/contact';

  // About & Legal routes
  static const String about = '/about';
  static const String faq = '/faq';
  static const String terms = '/terms';
  static const String privacy = '/privacy';

  // Admin routes
  static const String adminDashboard = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminAuditLogs = '/admin/audit-logs';

  // Prevent instantiation
  Routes._();
}
