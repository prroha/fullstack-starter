import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:url_launcher/url_launcher.dart';

// =============================================================================
// Types
// =============================================================================

/// Payment provider type
enum PaymentProvider {
  stripe,
  googlePay,
  applePay,
  inAppPurchase,
}

/// Payment status
enum PaymentStatus {
  idle,
  processing,
  success,
  failed,
  cancelled,
  requiresAction,
}

/// Subscription status
enum SubscriptionStatus {
  none,
  active,
  canceled,
  pastDue,
  expired,
  trialing,
}

/// Price information
class PriceInfo {
  final String id;
  final String productName;
  final String? productDescription;
  final int unitAmount; // in cents
  final String currency;
  final String? interval;
  final int? intervalCount;

  const PriceInfo({
    required this.id,
    required this.productName,
    this.productDescription,
    required this.unitAmount,
    required this.currency,
    this.interval,
    this.intervalCount,
  });

  factory PriceInfo.fromJson(Map<String, dynamic> json) {
    return PriceInfo(
      id: json['id'] as String,
      productName: json['productName'] as String? ?? 'Plan',
      productDescription: json['productDescription'] as String?,
      unitAmount: json['unitAmount'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'usd',
      interval: json['interval'] as String?,
      intervalCount: json['intervalCount'] as int?,
    );
  }

  String get formattedPrice {
    final amount = unitAmount / 100;
    final symbol = _getCurrencySymbol(currency);
    return '$symbol${amount.toStringAsFixed(2)}';
  }

  String get billingPeriod {
    if (interval == null) return 'one-time';
    final prefix = intervalCount != null && intervalCount! > 1
        ? 'every $intervalCount '
        : '';
    final suffix = intervalCount != null && intervalCount! > 1 ? 's' : '';
    return '$prefix$interval$suffix';
  }

  String _getCurrencySymbol(String currency) {
    const symbols = {
      'usd': '\$',
      'eur': '\u20AC',
      'gbp': '\u00A3',
      'jpy': '\u00A5',
      'inr': '\u20B9',
    };
    return symbols[currency.toLowerCase()] ?? currency.toUpperCase();
  }
}

/// Subscription information
class SubscriptionInfo {
  final String id;
  final SubscriptionStatus status;
  final String priceId;
  final String productId;
  final DateTime currentPeriodStart;
  final DateTime currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  const SubscriptionInfo({
    required this.id,
    required this.status,
    required this.priceId,
    required this.productId,
    required this.currentPeriodStart,
    required this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) {
    return SubscriptionInfo(
      id: json['id'] as String,
      status: _parseStatus(json['status'] as String?),
      priceId: json['priceId'] as String,
      productId: json['productId'] as String,
      currentPeriodStart: DateTime.parse(json['currentPeriodStart'] as String),
      currentPeriodEnd: DateTime.parse(json['currentPeriodEnd'] as String),
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] as bool? ?? false,
    );
  }

  static SubscriptionStatus _parseStatus(String? status) {
    switch (status) {
      case 'active':
        return SubscriptionStatus.active;
      case 'canceled':
        return SubscriptionStatus.canceled;
      case 'past_due':
        return SubscriptionStatus.pastDue;
      case 'expired':
        return SubscriptionStatus.expired;
      case 'trialing':
        return SubscriptionStatus.trialing;
      default:
        return SubscriptionStatus.none;
    }
  }

  bool get isActive => status == SubscriptionStatus.active ||
      status == SubscriptionStatus.trialing;

  int get daysRemaining =>
      currentPeriodEnd.difference(DateTime.now()).inDays;
}

/// Payment result
class PaymentResult {
  final bool success;
  final PaymentStatus status;
  final String? paymentIntentId;
  final String? subscriptionId;
  final String? error;

  const PaymentResult({
    required this.success,
    required this.status,
    this.paymentIntentId,
    this.subscriptionId,
    this.error,
  });

  factory PaymentResult.success({
    String? paymentIntentId,
    String? subscriptionId,
  }) {
    return PaymentResult(
      success: true,
      status: PaymentStatus.success,
      paymentIntentId: paymentIntentId,
      subscriptionId: subscriptionId,
    );
  }

  factory PaymentResult.failure(String error) {
    return PaymentResult(
      success: false,
      status: PaymentStatus.failed,
      error: error,
    );
  }

  factory PaymentResult.cancelled() {
    return const PaymentResult(
      success: false,
      status: PaymentStatus.cancelled,
    );
  }
}

/// Checkout session response
class CheckoutSession {
  final String sessionId;
  final String? url;

  const CheckoutSession({
    required this.sessionId,
    this.url,
  });

  factory CheckoutSession.fromJson(Map<String, dynamic> json) {
    return CheckoutSession(
      sessionId: json['sessionId'] as String,
      url: json['url'] as String?,
    );
  }
}

/// Payment sheet parameters from backend
class PaymentSheetParams {
  final String clientSecret;
  final String? customerId;
  final String? ephemeralKey;

  const PaymentSheetParams({
    required this.clientSecret,
    this.customerId,
    this.ephemeralKey,
  });

  factory PaymentSheetParams.fromJson(Map<String, dynamic> json) {
    return PaymentSheetParams(
      clientSecret: json['clientSecret'] as String,
      customerId: json['customerId'] as String?,
      ephemeralKey: json['ephemeralKey'] as String?,
    );
  }
}

// =============================================================================
// Payment Service
// =============================================================================

/// Service for handling payments with Stripe
class PaymentService {
  static final PaymentService _instance = PaymentService._internal();

  factory PaymentService() => _instance;

  PaymentService._internal();

  bool _initialized = false;
  String? _publishableKey;
  String? _merchantId;
  String _apiBaseUrl = '';
  String? _authToken;

  final http.Client _httpClient = http.Client();

  // Stream controllers
  final StreamController<PaymentStatus> _statusController =
      StreamController<PaymentStatus>.broadcast();

  /// Stream of payment status changes
  Stream<PaymentStatus> get statusStream => _statusController.stream;

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /// Initialize payment service with Stripe
  Future<void> init({
    required String publishableKey,
    required String apiBaseUrl,
    String? merchantId,
    String? authToken,
  }) async {
    if (_initialized) return;

    _publishableKey = publishableKey;
    _merchantId = merchantId;
    _apiBaseUrl = apiBaseUrl;
    _authToken = authToken;

    try {
      // Initialize Stripe SDK
      Stripe.publishableKey = publishableKey;
      if (merchantId != null) {
        Stripe.merchantIdentifier = merchantId;
      }
      await Stripe.instance.applySettings();

      _initialized = true;
      _log('Payment service initialized');
    } catch (e) {
      _log('Payment service initialization error: $e');
      rethrow;
    }
  }

  /// Update auth token (call after login)
  void setAuthToken(String? token) {
    _authToken = token;
  }

  // ===========================================================================
  // HTTP Helpers
  // ===========================================================================

  Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  Future<Map<String, dynamic>> _get(String endpoint) async {
    final response = await _httpClient.get(
      Uri.parse('$_apiBaseUrl$endpoint'),
      headers: _headers,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    final error = _parseError(response);
    throw Exception(error);
  }

  Future<Map<String, dynamic>> _post(
    String endpoint, {
    Map<String, dynamic>? body,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$_apiBaseUrl$endpoint'),
      headers: _headers,
      body: body != null ? jsonEncode(body) : null,
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }

    final error = _parseError(response);
    throw Exception(error);
  }

  String _parseError(http.Response response) {
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['error'] as String? ?? 'Request failed';
    } catch (_) {
      return 'Request failed with status ${response.statusCode}';
    }
  }

  // ===========================================================================
  // Prices
  // ===========================================================================

  /// Fetch available prices from backend
  Future<List<PriceInfo>> fetchPrices() async {
    try {
      final data = await _get('/payment/prices');

      if (data['success'] == true && data['prices'] != null) {
        return (data['prices'] as List)
            .map((p) => PriceInfo.fromJson(p as Map<String, dynamic>))
            .toList();
      }

      return [];
    } catch (e) {
      _log('Fetch prices error: $e');
      return [];
    }
  }

  // ===========================================================================
  // Checkout
  // ===========================================================================

  /// Start checkout flow using Stripe hosted page
  /// Opens the checkout URL in a browser
  Future<PaymentResult> startCheckout({
    required String priceId,
    String? customerEmail,
    String? successUrl,
    String? cancelUrl,
  }) async {
    _statusController.add(PaymentStatus.processing);

    try {
      final data = await _post('/payment/checkout', body: {
        'priceId': priceId,
        if (customerEmail != null) 'customerEmail': customerEmail,
        if (successUrl != null) 'successUrl': successUrl,
        if (cancelUrl != null) 'cancelUrl': cancelUrl,
      });

      if (data['success'] != true || data['url'] == null) {
        throw Exception(data['error'] ?? 'Failed to create checkout session');
      }

      final checkoutUrl = data['url'] as String;

      // Open checkout URL in browser
      final uri = Uri.parse(checkoutUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        _statusController.add(PaymentStatus.requiresAction);

        return PaymentResult(
          success: true,
          status: PaymentStatus.requiresAction,
          subscriptionId: data['sessionId'] as String?,
        );
      } else {
        throw Exception('Could not open checkout URL');
      }
    } catch (e) {
      _log('Checkout error: $e');
      _statusController.add(PaymentStatus.failed);
      return PaymentResult.failure(e.toString());
    }
  }

  /// Present Stripe Payment Sheet for in-app payment
  /// Requires a payment intent from the backend
  Future<PaymentResult> presentPaymentSheet({
    required String priceId,
    String? customerEmail,
  }) async {
    if (!_initialized) {
      return PaymentResult.failure('Payment service not initialized');
    }

    _statusController.add(PaymentStatus.processing);

    try {
      // 1. Create payment sheet parameters on backend
      final data = await _post('/payment/create-payment-sheet', body: {
        'priceId': priceId,
        if (customerEmail != null) 'customerEmail': customerEmail,
      });

      if (data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to create payment sheet');
      }

      final params = PaymentSheetParams.fromJson(data);

      // 2. Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: params.clientSecret,
          customerEphemeralKeySecret: params.ephemeralKey,
          customerId: params.customerId,
          merchantDisplayName: 'Your App Name',
          applePay: const PaymentSheetApplePay(
            merchantCountryCode: 'US',
          ),
          googlePay: PaymentSheetGooglePay(
            merchantCountryCode: 'US',
            testEnv: kDebugMode,
          ),
          style: ThemeMode.system,
        ),
      );

      // 3. Present payment sheet
      await Stripe.instance.presentPaymentSheet();

      _statusController.add(PaymentStatus.success);

      return PaymentResult.success(
        paymentIntentId: params.clientSecret.split('_secret_').first,
      );
    } on StripeException catch (e) {
      if (e.error.code == FailureCode.Canceled) {
        _statusController.add(PaymentStatus.cancelled);
        return PaymentResult.cancelled();
      }

      _log('Payment sheet error: ${e.error.message}');
      _statusController.add(PaymentStatus.failed);
      return PaymentResult.failure(e.error.message ?? 'Payment failed');
    } catch (e) {
      _log('Payment sheet error: $e');
      _statusController.add(PaymentStatus.failed);
      return PaymentResult.failure(e.toString());
    }
  }

  // ===========================================================================
  // Subscriptions
  // ===========================================================================

  /// Get current user's subscription
  Future<SubscriptionInfo?> getCurrentSubscription() async {
    try {
      final data = await _get('/payment/subscription/current');

      if (data['success'] == true && data['subscription'] != null) {
        return SubscriptionInfo.fromJson(
          data['subscription'] as Map<String, dynamic>,
        );
      }

      return null;
    } catch (e) {
      _log('Get subscription error: $e');
      return null;
    }
  }

  /// Get subscription by ID
  Future<SubscriptionInfo?> getSubscription(String subscriptionId) async {
    try {
      final data = await _get('/payment/subscription/$subscriptionId');

      if (data['success'] == true && data['subscription'] != null) {
        return SubscriptionInfo.fromJson(
          data['subscription'] as Map<String, dynamic>,
        );
      }

      return null;
    } catch (e) {
      _log('Get subscription error: $e');
      return null;
    }
  }

  /// Cancel subscription at period end
  Future<bool> cancelSubscription(String subscriptionId) async {
    try {
      final data = await _post(
        '/payment/subscription/$subscriptionId/cancel',
      );

      return data['success'] == true;
    } catch (e) {
      _log('Cancel subscription error: $e');
      return false;
    }
  }

  /// Cancel subscription immediately
  Future<bool> cancelSubscriptionImmediately(String subscriptionId) async {
    try {
      final data = await _post(
        '/payment/subscription/$subscriptionId/cancel',
        body: {'immediate': true},
      );

      return data['success'] == true;
    } catch (e) {
      _log('Cancel subscription immediately error: $e');
      return false;
    }
  }

  /// Resume a canceled subscription
  Future<bool> resumeSubscription(String subscriptionId) async {
    try {
      final data = await _post(
        '/payment/subscription/$subscriptionId/resume',
      );

      return data['success'] == true;
    } catch (e) {
      _log('Resume subscription error: $e');
      return false;
    }
  }

  /// Change subscription plan
  Future<bool> changePlan(String subscriptionId, String newPriceId) async {
    try {
      final data = await _post(
        '/payment/subscription/$subscriptionId/change-plan',
        body: {'priceId': newPriceId},
      );

      return data['success'] == true;
    } catch (e) {
      _log('Change plan error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Customer Portal
  // ===========================================================================

  /// Get Stripe customer portal URL and open it
  Future<String?> getCustomerPortalUrl() async {
    try {
      final data = await _post('/payment/portal');

      if (data['success'] == true && data['url'] != null) {
        return data['url'] as String;
      }

      return null;
    } catch (e) {
      _log('Get portal URL error: $e');
      return null;
    }
  }

  /// Open Stripe customer portal in browser
  Future<bool> openCustomerPortal() async {
    try {
      final url = await getCustomerPortalUrl();
      if (url == null) return false;

      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return true;
      }

      return false;
    } catch (e) {
      _log('Open portal error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[PaymentService] $message');
    }
  }

  /// Check if service is initialized
  bool get isInitialized => _initialized;

  /// Dispose resources
  void dispose() {
    _statusController.close();
    _httpClient.close();
  }
}

// =============================================================================
// Global Instance
// =============================================================================

/// Global payment service instance
final paymentService = PaymentService();
