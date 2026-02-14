import 'package:flutter/material.dart';

/// Invoice detail screen - shows invoice info, items, payments, and actions.
///
/// This is a placeholder screen. Wire up to InvoicingApiService for actual data.
class InvoiceDetailScreen extends StatefulWidget {
  final String invoiceId;

  const InvoiceDetailScreen({super.key, required this.invoiceId});

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _invoice;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadInvoice();
  }

  Future<void> _loadInvoice() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual InvoicingApiService call
      // final service = InvoicingApiService(baseUrl: apiBaseUrl);
      // final result = await service.getInvoiceById(widget.invoiceId);
      // setState(() { _invoice = result['data']; });

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _invoice = null;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_invoice?['invoiceNumber'] ?? 'Invoice Details'),
        actions: [
          if (_invoice?['status'] == 'DRAFT')
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: () {
                // TODO: Send invoice
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Send invoice not yet implemented')),
                );
              },
              tooltip: 'Send Invoice',
            ),
        ],
      ),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_error', style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadInvoice,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_invoice == null) {
      return const Center(child: Text('Invoice not found'));
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _getStatusColor(_invoice!['status']),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _invoice!['status'] ?? 'DRAFT',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  '\$${((_invoice!['totalAmount'] ?? 0) / 100).toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Client info
                Text(
                  _invoice!['client']?['name'] ?? 'Unknown Client',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                if (_invoice!['client']?['email'] != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    _invoice!['client']['email'],
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
                const SizedBox(height: 16),

                // Dates
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Issue Date', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                          Text(_invoice!['issueDate']?.split('T')[0] ?? ''),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Due Date', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                          Text(_invoice!['dueDate']?.split('T')[0] ?? ''),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Amount summary
                Text(
                  'Summary',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                _buildSummaryRow('Subtotal', _invoice!['subtotal'] ?? 0),
                _buildSummaryRow('Tax', _invoice!['taxTotal'] ?? 0),
                if ((_invoice!['discountAmount'] ?? 0) > 0)
                  _buildSummaryRow('Discount', -(_invoice!['discountAmount'] ?? 0)),
                const Divider(),
                _buildSummaryRow('Total', _invoice!['totalAmount'] ?? 0, bold: true),
                _buildSummaryRow('Paid', _invoice!['amountPaid'] ?? 0),
                _buildSummaryRow('Due', _invoice!['amountDue'] ?? 0, bold: true),

                const SizedBox(height: 24),

                // Line items placeholder
                Text(
                  'Line Items',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                const Text('Line items will be loaded from the API.'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, int amountCents, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          Text(
            '\$${(amountCents / 100).toStringAsFixed(2)}',
            style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'PAID':
        return Colors.green;
      case 'SENT':
      case 'VIEWED':
        return Colors.blue;
      case 'OVERDUE':
        return Colors.red;
      case 'PARTIALLY_PAID':
        return Colors.orange;
      case 'CANCELLED':
      case 'VOID':
        return Colors.grey;
      default:
        return Colors.blueGrey;
    }
  }
}
