import 'dart:convert';
import 'package:http/http.dart' as http;

/// Booking API service for Flutter mobile app.
/// Handles communication with the Booking backend endpoints.
class BookingApiService {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  BookingApiService({
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
  // Services
  // =========================================================================

  /// List active services with optional filters
  Future<Map<String, dynamic>> getServices({
    String? search,
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
      if (category != null) 'category': category,
    };

    final uri = Uri.parse('$baseUrl/booking/services').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get service details by slug
  Future<Map<String, dynamic>> getServiceBySlug(String slug) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/booking/services/$slug'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  /// Get service categories
  Future<List<dynamic>> getCategories() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/booking/services/categories'),
      headers: _headers,
    );
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  // =========================================================================
  // Providers
  // =========================================================================

  /// List active providers
  Future<Map<String, dynamic>> getProviders({
    String? search,
    String? serviceId,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
      if (serviceId != null) 'serviceId': serviceId,
    };

    final uri = Uri.parse('$baseUrl/booking/providers').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get provider availability for a date
  Future<List<dynamic>> getAvailability(
    String providerId,
    String serviceId,
    String date,
  ) async {
    final params = <String, String>{
      'serviceId': serviceId,
      'date': date,
    };

    final uri = Uri.parse('$baseUrl/booking/providers/$providerId/availability')
        .replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  // =========================================================================
  // Bookings
  // =========================================================================

  /// Create a new booking
  Future<Map<String, dynamic>> createBooking({
    required String serviceId,
    required String providerId,
    required String date,
    required String startTime,
    String? notes,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/booking/bookings'),
      headers: _headers,
      body: jsonEncode({
        'serviceId': serviceId,
        'providerId': providerId,
        'date': date,
        'startTime': startTime,
        if (notes != null) 'notes': notes,
      }),
    );
    return _handleResponse(response);
  }

  /// Get user's bookings
  Future<Map<String, dynamic>> getBookings({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (status != null) 'status': status,
    };

    final uri = Uri.parse('$baseUrl/booking/bookings').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Cancel a booking
  Future<Map<String, dynamic>> cancelBooking(String id, {String? reason}) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/booking/bookings/$id/cancel'),
      headers: _headers,
      body: jsonEncode({if (reason != null) 'reason': reason}),
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

    throw BookingException(
      message: body['error']?.toString() ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }
}

class BookingException implements Exception {
  final String message;
  final int statusCode;

  BookingException({required this.message, required this.statusCode});

  @override
  String toString() => 'BookingException($statusCode): $message';
}
