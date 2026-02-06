import 'dart:async';
import 'package:flutter/foundation.dart';

// Note: Uncomment these imports when packages are installed:
// import 'package:flutter_stripe/flutter_stripe.dart';
// import 'package:in_app_purchase/in_app_purchase.dart';

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

// =============================================================================
// Payment Service
// =============================================================================

/// Service for handling payments
class PaymentService {
  static final PaymentService _instance = PaymentService._internal();

  factory PaymentService() => _instance;

  PaymentService._internal();

  bool _initialized = false;
  String? _publishableKey;
  String? _merchantId;
  String _apiBaseUrl = '/api/v1';

  // Stream controllers
  final StreamController<PaymentStatus> _statusController =
      StreamController<PaymentStatus>.broadcast();

  /// Stream of payment status changes
  Stream<PaymentStatus> get statusStream => _statusController.stream;

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /// Initialize payment service
  Future<void> init({
    required String publishableKey,
    String? merchantId,
    String? apiBaseUrl,
  }) async {
    if (_initialized) return;

    _publishableKey = publishableKey;
    _merchantId = merchantId;
    if (apiBaseUrl != null) _apiBaseUrl = apiBaseUrl;

    try {
      // Initialize Stripe
      // Uncomment when flutter_stripe is installed:
      // Stripe.publishableKey = publishableKey;
      // if (merchantId != null) {
      //   Stripe.merchantIdentifier = merchantId;
      // }
      // await Stripe.instance.applySettings();

      _initialized = true;
      _log('Payment service initialized');
    } catch (e) {
      _log('Payment service initialization error: $e');
      rethrow;
    }
  }

  // ===========================================================================
  // Prices
  // ===========================================================================

  /// Fetch available prices from backend
  Future<List<PriceInfo>> fetchPrices() async {
    try {
      // In production, call your API:
      // final response = await http.get(Uri.parse('$_apiBaseUrl/payment/prices'));
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return (data['prices'] as List)
      //       .map((p) => PriceInfo.fromJson(p))
      //       .toList();
      // }

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return [
        const PriceInfo(
          id: 'price_monthly',
          productName: 'Pro Monthly',
          productDescription: 'Full access to all features',
          unitAmount: 999,
          currency: 'usd',
          interval: 'month',
        ),
        const PriceInfo(
          id: 'price_yearly',
          productName: 'Pro Yearly',
          productDescription: 'Save 20% with annual billing',
          unitAmount: 9588,
          currency: 'usd',
          interval: 'year',
        ),
      ];
    } catch (e) {
      _log('Fetch prices error: $e');
      return [];
    }
  }

  // ===========================================================================
  // Checkout
  // ===========================================================================

  /// Start checkout flow for a subscription
  Future<PaymentResult> startCheckout({
    required String priceId,
    String? customerEmail,
  }) async {
    _statusController.add(PaymentStatus.processing);

    try {
      // Create checkout session on backend
      // final response = await http.post(
      //   Uri.parse('$_apiBaseUrl/payment/checkout'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({
      //     'priceId': priceId,
      //     'customerEmail': customerEmail,
      //   }),
      // );
      //
      // final data = jsonDecode(response.body);
      // if (!data['success']) {
      //   throw Exception(data['error']);
      // }
      //
      // final sessionUrl = data['url'];
      // // Open checkout URL in browser or webview
      // // For full mobile experience, use Payment Sheet instead

      // Stub implementation
      await Future.delayed(const Duration(seconds: 2));
      _statusController.add(PaymentStatus.success);

      return PaymentResult.success(subscriptionId: 'sub_stub_123');
    } catch (e) {
      _log('Checkout error: $e');
      _statusController.add(PaymentStatus.failed);
      return PaymentResult.failure(e.toString());
    }
  }

  /// Present Stripe Payment Sheet
  Future<PaymentResult> presentPaymentSheet({
    required String priceId,
    String? customerEmail,
  }) async {
    if (!_initialized) {
      return PaymentResult.failure('Payment service not initialized');
    }

    _statusController.add(PaymentStatus.processing);

    try {
      // 1. Create payment intent on backend
      // final response = await http.post(
      //   Uri.parse('$_apiBaseUrl/payment/create-payment-intent'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode({
      //     'priceId': priceId,
      //     'customerEmail': customerEmail,
      //   }),
      // );
      //
      // final data = jsonDecode(response.body);
      // final clientSecret = data['clientSecret'];
      // final customerId = data['customerId'];
      // final ephemeralKey = data['ephemeralKey'];

      // 2. Initialize payment sheet
      // await Stripe.instance.initPaymentSheet(
      //   paymentSheetParameters: SetupPaymentSheetParameters(
      //     paymentIntentClientSecret: clientSecret,
      //     customerEphemeralKeySecret: ephemeralKey,
      //     customerId: customerId,
      //     merchantDisplayName: 'Your App Name',
      //     applePay: PaymentSheetApplePay(
      //       merchantCountryCode: 'US',
      //     ),
      //     googlePay: PaymentSheetGooglePay(
      //       merchantCountryCode: 'US',
      //       testEnv: kDebugMode,
      //     ),
      //   ),
      // );

      // 3. Present payment sheet
      // await Stripe.instance.presentPaymentSheet();

      // Stub implementation
      await Future.delayed(const Duration(seconds: 2));
      _statusController.add(PaymentStatus.success);

      return PaymentResult.success(paymentIntentId: 'pi_stub_123');
    } on Exception catch (e) {
      // Handle specific Stripe exceptions
      // if (e is StripeException) {
      //   if (e.error.code == FailureCode.Canceled) {
      //     _statusController.add(PaymentStatus.cancelled);
      //     return PaymentResult.cancelled();
      //   }
      // }

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
      // In production:
      // final response = await http.get(
      //   Uri.parse('$_apiBaseUrl/payment/subscription'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success'] && data['subscription'] != null) {
      //   return SubscriptionInfo.fromJson(data['subscription']);
      // }

      // Stub implementation
      return null;
    } catch (e) {
      _log('Get subscription error: $e');
      return null;
    }
  }

  /// Cancel subscription at period end
  Future<bool> cancelSubscription(String subscriptionId) async {
    try {
      // In production:
      // final response = await http.post(
      //   Uri.parse('$_apiBaseUrl/payment/subscription/$subscriptionId/cancel'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // return data['success'] == true;

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      _log('Cancel subscription error: $e');
      return false;
    }
  }

  /// Resume a canceled subscription
  Future<bool> resumeSubscription(String subscriptionId) async {
    try {
      // In production:
      // final response = await http.post(
      //   Uri.parse('$_apiBaseUrl/payment/subscription/$subscriptionId/resume'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // return data['success'] == true;

      // Stub implementation
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      _log('Resume subscription error: $e');
      return false;
    }
  }

  // ===========================================================================
  // Customer Portal
  // ===========================================================================

  /// Open Stripe customer portal for subscription management
  Future<String?> getCustomerPortalUrl() async {
    try {
      // In production:
      // final response = await http.post(
      //   Uri.parse('$_apiBaseUrl/payment/portal'),
      //   headers: {'Authorization': 'Bearer $token'},
      // );
      //
      // final data = jsonDecode(response.body);
      // if (data['success']) {
      //   return data['url'];
      // }

      // Stub implementation
      return 'https://billing.stripe.com/portal';
    } catch (e) {
      _log('Get portal URL error: $e');
      return null;
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

  /// Dispose resources
  void dispose() {
    _statusController.close();
  }
}

// =============================================================================
// Global Instance
// =============================================================================

/// Global payment service instance
final paymentService = PaymentService();
