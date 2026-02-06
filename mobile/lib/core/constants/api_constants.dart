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

  // Add your endpoints here
  // static const String posts = '/posts';
  // static String postById(String id) => '/posts/$id';
}
