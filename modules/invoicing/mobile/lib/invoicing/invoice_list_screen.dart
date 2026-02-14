import 'package:flutter/material.dart';

/// Invoice listing screen - displays user's invoices with status filter.
///
/// This is a placeholder screen. Wire up to InvoicingApiService for actual data.
class InvoiceListScreen extends StatefulWidget {
  const InvoiceListScreen({super.key});

  @override
  State<InvoiceListScreen> createState() => _InvoiceListScreenState();
}

class _InvoiceListScreenState extends State<InvoiceListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _invoices = [];
  String? _error;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadInvoices();
  }

  Future<void> _loadInvoices() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual InvoicingApiService call
      // final service = InvoicingApiService(baseUrl: apiBaseUrl);
      // final result = await service.getInvoices(
      //   status: _statusFilter == 'all' ? null : _statusFilter,
      // );
      // setState(() { _invoices = List<Map<String, dynamic>>.from(result['data']['items']); });

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _invoices = [];
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
        title: const Text('Invoices'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() => _statusFilter = value);
              _loadInvoices();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'DRAFT', child: Text('Draft')),
              const PopupMenuItem(value: 'SENT', child: Text('Sent')),
              const PopupMenuItem(value: 'PAID', child: Text('Paid')),
              const PopupMenuItem(value: 'OVERDUE', child: Text('Overdue')),
              const PopupMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
            ],
            icon: const Icon(Icons.filter_list),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Navigate to create invoice screen
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Create invoice not yet implemented')),
          );
        },
        child: const Icon(Icons.add),
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
              onPressed: _loadInvoices,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_invoices.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No invoices found'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInvoices,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _invoices.length,
        itemBuilder: (context, index) {
          final invoice = _invoices[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.receipt, color: Colors.blue),
              ),
              title: Text(invoice['invoiceNumber'] ?? 'Invoice'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(invoice['client']?['name'] ?? 'Unknown Client'),
                  Text(
                    '\$${((invoice['totalAmount'] ?? 0) / 100).toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ],
              ),
              trailing: Chip(
                label: Text(
                  invoice['status'] ?? 'DRAFT',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
              onTap: () {
                // Navigate to invoice detail
              },
            ),
          );
        },
      ),
    );
  }
}
