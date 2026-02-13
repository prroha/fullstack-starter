import 'dart:convert';
import 'package:http/http.dart' as http;

/// E-Commerce API service for Flutter mobile app.
/// Handles communication with the ecommerce backend endpoints.
class EcommerceService {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  EcommerceService({
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
  // Products
  // =========================================================================

  /// List active products with optional filters
  Future<Map<String, dynamic>> getProducts({
    String? search,
    String? category,
    String? sort,
    int page = 1,
    int limit = 20,
  }) async {
    final params = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (search != null) 'search': search,
      if (category != null) 'category': category,
      if (sort != null) 'sort': sort,
    };

    final uri = Uri.parse('$baseUrl/ecommerce/products').replace(queryParameters: params);
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get product details by slug
  Future<Map<String, dynamic>> getProductBySlug(String slug) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/ecommerce/products/$slug'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  /// Get product categories
  Future<List<dynamic>> getCategories() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/ecommerce/products/categories'),
      headers: _headers,
    );
    final data = _handleResponse(response);
    return data['data'] ?? [];
  }

  // =========================================================================
  // Cart
  // =========================================================================

  /// Get current cart
  Future<Map<String, dynamic>> getCart() async {
    final response = await _client.get(
      Uri.parse('$baseUrl/ecommerce/cart'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  /// Add item to cart
  Future<Map<String, dynamic>> addToCart({
    required String productId,
    String? variantId,
    int quantity = 1,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/ecommerce/cart/items'),
      headers: _headers,
      body: jsonEncode({
        'productId': productId,
        if (variantId != null) 'variantId': variantId,
        'quantity': quantity,
      }),
    );
    return _handleResponse(response);
  }

  /// Update cart item quantity
  Future<Map<String, dynamic>> updateCartItem(
    String itemId,
    int quantity,
  ) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/ecommerce/cart/items/$itemId'),
      headers: _headers,
      body: jsonEncode({'quantity': quantity}),
    );
    return _handleResponse(response);
  }

  /// Remove item from cart
  Future<Map<String, dynamic>> removeCartItem(String itemId) async {
    final response = await _client.delete(
      Uri.parse('$baseUrl/ecommerce/cart/items/$itemId'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Orders
  // =========================================================================

  /// Create order from cart
  Future<Map<String, dynamic>> createOrder({
    required Map<String, dynamic> shippingAddress,
    Map<String, dynamic>? billingAddress,
    String? notes,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/ecommerce/orders'),
      headers: _headers,
      body: jsonEncode({
        'shippingAddress': shippingAddress,
        if (billingAddress != null) 'billingAddress': billingAddress,
        if (notes != null) 'notes': notes,
      }),
    );
    return _handleResponse(response);
  }

  /// Get user's orders
  Future<Map<String, dynamic>> getOrders({int page = 1, int limit = 20}) async {
    final uri = Uri.parse('$baseUrl/ecommerce/customer/orders')
        .replace(queryParameters: {'page': '$page', 'limit': '$limit'});
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Get order by ID
  Future<Map<String, dynamic>> getOrderById(String id) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/ecommerce/customer/orders/$id'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  // =========================================================================
  // Reviews
  // =========================================================================

  /// Get reviews for a product
  Future<Map<String, dynamic>> getProductReviews(
    String productId, {
    int page = 1,
    int limit = 20,
  }) async {
    final uri = Uri.parse('$baseUrl/ecommerce/reviews/product/$productId')
        .replace(queryParameters: {'page': '$page', 'limit': '$limit'});
    final response = await _client.get(uri, headers: _headers);
    return _handleResponse(response);
  }

  /// Submit a product review
  Future<Map<String, dynamic>> submitReview({
    required String productId,
    required int rating,
    String? comment,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/ecommerce/reviews'),
      headers: _headers,
      body: jsonEncode({
        'productId': productId,
        'rating': rating,
        if (comment != null) 'comment': comment,
      }),
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

    throw EcommerceException(
      message: body['error']?.toString() ?? 'Request failed',
      statusCode: response.statusCode,
    );
  }
}

class EcommerceException implements Exception {
  final String message;
  final int statusCode;

  EcommerceException({required this.message, required this.statusCode});

  @override
  String toString() => 'EcommerceException($statusCode): $message';
}
