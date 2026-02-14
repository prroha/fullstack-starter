import 'dart:convert';
import 'package:http/http.dart' as http;

/// Invoicing API service for Flutter mobile app.
/// Handles communication with the Invoicing backend endpoints.
class InvoicingApiService {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  InvoicingApiService({
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
  // Invoices
  // =========================================================================

  /// List invoices with optional filters
  Future<Map<String, dynamic>> getInvoices({
    String? search,
    String? status,
    String? clientId,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
      if (status != null) 'status': status,
      if (clientId != null) 'clientId': clientId,
    };

    final uri = Uri.parse('$baseUrl/invoicing/invoices').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get invoice details by ID
  Future<Map<String, dynamic>> getInvoiceById(String id) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/invoicing/invoices/$id'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  /// Create a new invoice
  Future<Map<String, dynamic>> createInvoice({
    required String clientId,
    required String issueDate,
    required String dueDate,
    String currency = 'usd',
    String? notes,
    String? terms,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/invoicing/invoices'),
      headers: _headers,
      body: jsonEncode({
        'clientId': clientId,
        'issueDate': issueDate,
        'dueDate': dueDate,
        'currency': currency,
        if (notes != null) 'notes': notes,
        if (terms != null) 'terms': terms,
      }),
    );
    return _handleResponse(response);
  }

  /// Send an invoice
  Future<Map<String, dynamic>> sendInvoice(String id) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/invoicing/invoices/$id/send'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Clients
  // =========================================================================

  /// List clients
  Future<Map<String, dynamic>> getClients({
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
    };

    final uri = Uri.parse('$baseUrl/invoicing/clients').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get client by ID
  Future<Map<String, dynamic>> getClientById(String id) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/invoicing/clients/$id'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Payments
  // =========================================================================

  /// Record a payment for an invoice
  Future<Map<String, dynamic>> recordPayment({
    required String invoiceId,
    required int amount,
    required String method,
    required String paidAt,
    String? reference,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/invoicing/invoices/$invoiceId/payments'),
      headers: _headers,
      body: jsonEncode({
        'amount': amount,
        'method': method,
        'paidAt': paidAt,
        if (reference != null) 'reference': reference,
      }),
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Dashboard
  // =========================================================================

  /// Get invoicing dashboard stats
  Future<Map<String, dynamic>> getStats() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/invoicing/invoices/stats'),
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

    throw InvoicingException(
      message: body['error']?.toString() ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }
}

class InvoicingException implements Exception {
  final String message;
  final int statusCode;

  InvoicingException({required this.message, required this.statusCode});

  @override
  String toString() => 'InvoicingException($statusCode): $message';
}
