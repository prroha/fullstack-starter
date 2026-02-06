import 'package:flutter/foundation.dart';
import '../../core/services/payment_service.dart';

// Note: This provider can be used with Riverpod or Provider package
// For Riverpod, convert to StateNotifierProvider

// =============================================================================
// Payment State
// =============================================================================

/// State for payment operations
class PaymentState {
  final List<PriceInfo> prices;
  final SubscriptionInfo? subscription;
  final bool isLoading;
  final bool isProcessing;
  final bool isInitialized;
  final String? error;
  final PaymentStatus status;

  const PaymentState({
    this.prices = const [],
    this.subscription,
    this.isLoading = false,
    this.isProcessing = false,
    this.isInitialized = false,
    this.error,
    this.status = PaymentStatus.idle,
  });

  PaymentState copyWith({
    List<PriceInfo>? prices,
    SubscriptionInfo? subscription,
    bool? isLoading,
    bool? isProcessing,
    bool? isInitialized,
    String? error,
    PaymentStatus? status,
    bool clearSubscription = false,
    bool clearError = false,
  }) {
    return PaymentState(
      prices: prices ?? this.prices,
      subscription: clearSubscription ? null : (subscription ?? this.subscription),
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      isInitialized: isInitialized ?? this.isInitialized,
      error: clearError ? null : (error ?? this.error),
      status: status ?? this.status,
    );
  }

  bool get hasSubscription => subscription != null && subscription!.isActive;
  bool get hasError => error != null;
}

// =============================================================================
// Payment Provider (ChangeNotifier)
// =============================================================================

/// Provider for managing payment state
/// Use with Provider package or convert to Riverpod StateNotifier
class PaymentProvider extends ChangeNotifier {
  final PaymentService _paymentService;

  PaymentState _state = const PaymentState();
  PaymentState get state => _state;

  // Convenience getters
  List<PriceInfo> get prices => _state.prices;
  SubscriptionInfo? get subscription => _state.subscription;
  bool get isLoading => _state.isLoading;
  bool get isProcessing => _state.isProcessing;
  String? get error => _state.error;
  PaymentStatus get status => _state.status;
  bool get hasSubscription => _state.hasSubscription;

  PaymentProvider({PaymentService? paymentService})
      : _paymentService = paymentService ?? PaymentService();

  // ===========================================================================
  // Initialization
  // ===========================================================================

  /// Initialize payment service and load data
  Future<void> initialize({
    required String publishableKey,
    required String apiBaseUrl,
    String? merchantId,
    String? authToken,
  }) async {
    _setState(_state.copyWith(isLoading: true));

    try {
      await _paymentService.init(
        publishableKey: publishableKey,
        apiBaseUrl: apiBaseUrl,
        merchantId: merchantId,
        authToken: authToken,
      );
      _setState(_state.copyWith(isInitialized: true));
      await loadData();
    } catch (e) {
      _setState(_state.copyWith(
        error: 'Failed to initialize payments: $e',
        isLoading: false,
        isInitialized: false,
      ));
    }
  }

  /// Update auth token (call after login/logout)
  void setAuthToken(String? token) {
    _paymentService.setAuthToken(token);
  }

  // ===========================================================================
  // Data Loading
  // ===========================================================================

  /// Load prices and subscription status
  Future<void> loadData() async {
    _setState(_state.copyWith(isLoading: true, clearError: true));

    try {
      final results = await Future.wait([
        _paymentService.fetchPrices(),
        _paymentService.getCurrentSubscription(),
      ]);

      _setState(_state.copyWith(
        prices: results[0] as List<PriceInfo>,
        subscription: results[1] as SubscriptionInfo?,
        isLoading: false,
      ));
    } catch (e) {
      _setState(_state.copyWith(
        error: 'Failed to load data: $e',
        isLoading: false,
      ));
    }
  }

  /// Refresh subscription status only
  Future<void> refreshSubscription() async {
    try {
      final subscription = await _paymentService.getCurrentSubscription();
      _setState(_state.copyWith(subscription: subscription));
    } catch (e) {
      debugPrint('Refresh subscription error: $e');
    }
  }

  // ===========================================================================
  // Purchase
  // ===========================================================================

  /// Start checkout using Stripe hosted page (opens browser)
  Future<PaymentResult> startCheckout(
    String priceId, {
    String? email,
    String? successUrl,
    String? cancelUrl,
  }) async {
    _setState(_state.copyWith(
      isProcessing: true,
      status: PaymentStatus.processing,
      clearError: true,
    ));

    try {
      final result = await _paymentService.startCheckout(
        priceId: priceId,
        customerEmail: email,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
      );

      _setState(_state.copyWith(
        isProcessing: false,
        status: result.status,
        error: result.error,
      ));

      return result;
    } catch (e) {
      _setState(_state.copyWith(
        isProcessing: false,
        status: PaymentStatus.failed,
        error: e.toString(),
      ));
      return PaymentResult.failure(e.toString());
    }
  }

  /// Present payment sheet for in-app payment
  Future<PaymentResult> checkout(String priceId, {String? email}) async {
    _setState(_state.copyWith(
      isProcessing: true,
      status: PaymentStatus.processing,
      clearError: true,
    ));

    try {
      final result = await _paymentService.presentPaymentSheet(
        priceId: priceId,
        customerEmail: email,
      );

      if (result.success) {
        _setState(_state.copyWith(
          isProcessing: false,
          status: PaymentStatus.success,
        ));
        // Refresh subscription after successful payment
        await refreshSubscription();
      } else if (result.status == PaymentStatus.cancelled) {
        _setState(_state.copyWith(
          isProcessing: false,
          status: PaymentStatus.cancelled,
        ));
      } else {
        _setState(_state.copyWith(
          isProcessing: false,
          status: PaymentStatus.failed,
          error: result.error,
        ));
      }

      return result;
    } catch (e) {
      _setState(_state.copyWith(
        isProcessing: false,
        status: PaymentStatus.failed,
        error: e.toString(),
      ));
      return PaymentResult.failure(e.toString());
    }
  }

  // ===========================================================================
  // Subscription Management
  // ===========================================================================

  /// Cancel current subscription
  Future<bool> cancelSubscription() async {
    if (_state.subscription == null) return false;

    _setState(_state.copyWith(isProcessing: true, clearError: true));

    try {
      final success = await _paymentService.cancelSubscription(
        _state.subscription!.id,
      );

      if (success) {
        await refreshSubscription();
      } else {
        _setState(_state.copyWith(
          error: 'Failed to cancel subscription',
        ));
      }

      _setState(_state.copyWith(isProcessing: false));
      return success;
    } catch (e) {
      _setState(_state.copyWith(
        isProcessing: false,
        error: e.toString(),
      ));
      return false;
    }
  }

  /// Resume canceled subscription
  Future<bool> resumeSubscription() async {
    if (_state.subscription == null) return false;

    _setState(_state.copyWith(isProcessing: true, clearError: true));

    try {
      final success = await _paymentService.resumeSubscription(
        _state.subscription!.id,
      );

      if (success) {
        await refreshSubscription();
      } else {
        _setState(_state.copyWith(
          error: 'Failed to resume subscription',
        ));
      }

      _setState(_state.copyWith(isProcessing: false));
      return success;
    } catch (e) {
      _setState(_state.copyWith(
        isProcessing: false,
        error: e.toString(),
      ));
      return false;
    }
  }

  /// Get customer portal URL
  Future<String?> getPortalUrl() async {
    return _paymentService.getCustomerPortalUrl();
  }

  /// Open customer portal in browser
  Future<bool> openPortal() async {
    return _paymentService.openCustomerPortal();
  }

  /// Change subscription plan
  Future<bool> changePlan(String newPriceId) async {
    if (_state.subscription == null) return false;

    _setState(_state.copyWith(isProcessing: true, clearError: true));

    try {
      final success = await _paymentService.changePlan(
        _state.subscription!.id,
        newPriceId,
      );

      if (success) {
        await refreshSubscription();
      } else {
        _setState(_state.copyWith(
          error: 'Failed to change plan',
        ));
      }

      _setState(_state.copyWith(isProcessing: false));
      return success;
    } catch (e) {
      _setState(_state.copyWith(
        isProcessing: false,
        error: e.toString(),
      ));
      return false;
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /// Clear error state
  void clearError() {
    _setState(_state.copyWith(clearError: true));
  }

  /// Reset status to idle
  void resetStatus() {
    _setState(_state.copyWith(status: PaymentStatus.idle));
  }

  void _setState(PaymentState newState) {
    _state = newState;
    notifyListeners();
  }

  @override
  void dispose() {
    _paymentService.dispose();
    super.dispose();
  }
}

// =============================================================================
// Riverpod Providers (commented - uncomment when using Riverpod)
// =============================================================================

// import 'package:flutter_riverpod/flutter_riverpod.dart';
//
// /// Payment service provider
// final paymentServiceProvider = Provider<PaymentService>((ref) {
//   return PaymentService();
// });
//
// /// Payment state notifier
// class PaymentNotifier extends StateNotifier<PaymentState> {
//   final PaymentService _service;
//
//   PaymentNotifier(this._service) : super(const PaymentState());
//
//   // ... implement methods similar to PaymentProvider above
// }
//
// /// Payment state provider
// final paymentProvider =
//     StateNotifierProvider<PaymentNotifier, PaymentState>((ref) {
//   final service = ref.watch(paymentServiceProvider);
//   return PaymentNotifier(service);
// });
//
// /// Prices provider
// final pricesProvider = FutureProvider<List<PriceInfo>>((ref) async {
//   final service = ref.watch(paymentServiceProvider);
//   return service.fetchPrices();
// });
//
// /// Current subscription provider
// final subscriptionProvider = FutureProvider<SubscriptionInfo?>((ref) async {
//   final service = ref.watch(paymentServiceProvider);
//   return service.getCurrentSubscription();
// });
