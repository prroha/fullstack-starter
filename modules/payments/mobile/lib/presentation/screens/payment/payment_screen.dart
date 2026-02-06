import 'package:flutter/material.dart';
import '../../../core/services/payment_service.dart';

// =============================================================================
// Payment Screen
// =============================================================================

/// Screen for displaying pricing plans and handling payments
class PaymentScreen extends StatefulWidget {
  /// Optional callback after successful payment
  final void Function(PaymentResult result)? onPaymentSuccess;

  /// Optional callback on payment failure
  final void Function(String error)? onPaymentError;

  const PaymentScreen({
    super.key,
    this.onPaymentSuccess,
    this.onPaymentError,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _paymentService = PaymentService();

  List<PriceInfo> _prices = [];
  bool _loading = true;
  String? _error;
  String? _selectedPriceId;
  bool _processing = false;
  SubscriptionInfo? _currentSubscription;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        _paymentService.fetchPrices(),
        _paymentService.getCurrentSubscription(),
      ]);

      setState(() {
        _prices = results[0] as List<PriceInfo>;
        _currentSubscription = results[1] as SubscriptionInfo?;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load pricing. Please try again.';
        _loading = false;
      });
    }
  }

  Future<void> _handlePurchase(String priceId) async {
    setState(() {
      _selectedPriceId = priceId;
      _processing = true;
    });

    try {
      final result = await _paymentService.presentPaymentSheet(
        priceId: priceId,
      );

      if (result.success) {
        widget.onPaymentSuccess?.call(result);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment successful!'),
              backgroundColor: Colors.green,
            ),
          );
          // Refresh subscription status
          _loadData();
        }
      } else if (result.status == PaymentStatus.cancelled) {
        // User cancelled, no error message needed
      } else {
        widget.onPaymentError?.call(result.error ?? 'Payment failed');

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.error ?? 'Payment failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      widget.onPaymentError?.call(e.toString());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _selectedPriceId = null;
          _processing = false;
        });
      }
    }
  }

  Future<void> _handleCancelSubscription() async {
    if (_currentSubscription == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Subscription?'),
        content: const Text(
          'Your subscription will remain active until the end of the current billing period.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Subscription'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _processing = true);

    try {
      final success = await _paymentService.cancelSubscription(
        _currentSubscription!.id,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Subscription will be canceled at period end'),
          ),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to cancel: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _processing = false);
      }
    }
  }

  Future<void> _handleManageSubscription() async {
    final url = await _paymentService.getCustomerPortalUrl();
    if (url != null) {
      // Open URL in browser
      // await launchUrl(Uri.parse(url));
      debugPrint('Opening portal: $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Your Plan'),
        elevation: 0,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.shade300,
              ),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loadData,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Current Subscription Banner
            if (_currentSubscription != null) ...[
              _CurrentSubscriptionCard(
                subscription: _currentSubscription!,
                onCancel: _handleCancelSubscription,
                onManage: _handleManageSubscription,
                isProcessing: _processing,
              ),
              const SizedBox(height: 24),
            ],

            // Header
            Text(
              _currentSubscription != null
                  ? 'Change Your Plan'
                  : 'Choose Your Plan',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Select a plan that works best for you',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Price Cards
            ..._prices.map((price) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _PriceCard(
                    price: price,
                    isSelected: _selectedPriceId == price.id,
                    isProcessing: _processing && _selectedPriceId == price.id,
                    isCurrentPlan:
                        _currentSubscription?.priceId == price.id,
                    onSelect: () => _handlePurchase(price.id),
                  ),
                )),

            // Footer
            const SizedBox(height: 16),
            Text(
              'Secure payment powered by Stripe',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text(
                  'Cancel anytime',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Price Card Widget
// =============================================================================

class _PriceCard extends StatelessWidget {
  final PriceInfo price;
  final bool isSelected;
  final bool isProcessing;
  final bool isCurrentPlan;
  final VoidCallback onSelect;

  const _PriceCard({
    required this.price,
    required this.isSelected,
    required this.isProcessing,
    required this.isCurrentPlan,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isYearly = price.interval == 'year';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrentPlan
              ? Colors.green
              : isSelected
                  ? Theme.of(context).primaryColor
                  : Colors.grey.shade200,
          width: isCurrentPlan || isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Best Value Badge
          if (isYearly)
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'SAVE 20%',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade700,
                  ),
                ),
              ),
            ),

          // Current Plan Badge
          if (isCurrentPlan)
            Positioned(
              top: 12,
              left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'CURRENT',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.green.shade700,
                  ),
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  price.productName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (price.productDescription != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    price.productDescription!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      price.formattedPrice,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '/ ${price.billingPeriod}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isCurrentPlan || isProcessing ? null : onSelect,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: isProcessing
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            isCurrentPlan ? 'Current Plan' : 'Get Started',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Current Subscription Card
// =============================================================================

class _CurrentSubscriptionCard extends StatelessWidget {
  final SubscriptionInfo subscription;
  final VoidCallback onCancel;
  final VoidCallback onManage;
  final bool isProcessing;

  const _CurrentSubscriptionCard({
    required this.subscription,
    required this.onCancel,
    required this.onManage,
    required this.isProcessing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle,
                color: Colors.green.shade700,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                'Active Subscription',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            subscription.cancelAtPeriodEnd
                ? 'Cancels on ${_formatDate(subscription.currentPeriodEnd)}'
                : 'Renews on ${_formatDate(subscription.currentPeriodEnd)}',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (!subscription.cancelAtPeriodEnd) ...[
                TextButton(
                  onPressed: isProcessing ? null : onCancel,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red.shade700,
                  ),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
              ],
              TextButton(
                onPressed: onManage,
                child: const Text('Manage Billing'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}
