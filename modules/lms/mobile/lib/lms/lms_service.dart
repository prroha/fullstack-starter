import 'dart:convert';
import 'package:http/http.dart' as http;

/// LMS API service for Flutter mobile app.
/// Handles communication with the LMS backend endpoints.
class LmsService {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  LmsService({
    required this.baseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  // =========================================================================
  // Courses
  // =========================================================================

  /// List published courses with optional filters
  Future<Map<String, dynamic>> getCourses({
    String? search,
    String? category,
    String? level,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
      if (category != null) 'category': category,
      if (level != null) 'level': level,
    };

    final uri = Uri.parse('$baseUrl/lms/courses').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get course details by slug
  Future<Map<String, dynamic>> getCourseBySlug(String slug) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/lms/courses/$slug'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  /// Get course categories
  Future<List<dynamic>> getCategories() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/lms/courses/categories'),
      headers: _headers,
    );
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  // =========================================================================
  // Enrollments
  // =========================================================================

  /// Enroll in a course
  Future<Map<String, dynamic>> enroll(String courseId) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/lms/enrollments'),
      headers: _headers,
      body: jsonEncode({'courseId': courseId}),
    );
    return _handleResponse(response);
  }

  /// Get user's enrollments
  Future<List<dynamic>> getEnrollments() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/lms/enrollments'),
      headers: _headers,
    );
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  /// Mark a lesson as completed
  Future<Map<String, dynamic>> completeLesson(
    String enrollmentId,
    String lessonId,
  ) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/lms/enrollments/$enrollmentId/complete/$lessonId'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Certificates
  // =========================================================================

  /// Get user's certificates
  Future<List<dynamic>> getCertificates() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/lms/certificates'),
      headers: _headers,
    );
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  /// Verify a certificate
  Future<Map<String, dynamic>> verifyCertificate(String code) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/lms/certificates/verify/$code'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    throw LmsException(
      message: body['error']?.toString() ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }
}

class LmsException implements Exception {
  final String message;
  final int statusCode;

  LmsException({required this.message, required this.statusCode});

  @override
  String toString() => 'LmsException($statusCode): $message';
}
