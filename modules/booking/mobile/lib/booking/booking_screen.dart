import 'package:flutter/material.dart';

/// Booking listing screen - displays user's bookings with status filter.
///
/// This is a placeholder screen. Wire up to BookingApiService for actual data.
class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _bookings = [];
  String? _error;
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual BookingApiService call
      // final service = BookingApiService(baseUrl: apiBaseUrl);
      // final result = await service.getBookings(
      //   status: _statusFilter == 'all' ? null : _statusFilter,
      // );
      // setState(() { _bookings = List<Map<String, dynamic>>.from(result['data']['items']); });

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _bookings = [];
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
        title: const Text('My Bookings'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() => _statusFilter = value);
              _loadBookings();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'PENDING', child: Text('Pending')),
              const PopupMenuItem(value: 'CONFIRMED', child: Text('Confirmed')),
              const PopupMenuItem(value: 'COMPLETED', child: Text('Completed')),
              const PopupMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
            ],
            icon: const Icon(Icons.filter_list),
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
              onPressed: _loadBookings,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_bookings.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_today, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No bookings found'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBookings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _bookings.length,
        itemBuilder: (context, index) {
          final booking = _bookings[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.cyan[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.event, color: Colors.cyan),
              ),
              title: Text(booking['service']?['name'] ?? 'Service'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking['date'] ?? ''),
                  Text(
                    '${booking['startTime'] ?? ''} - ${booking['endTime'] ?? ''}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
              ),
              trailing: Chip(
                label: Text(
                  booking['status'] ?? 'PENDING',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
              onTap: () {
                // Navigate to booking detail
              },
            ),
          );
        },
      ),
    );
  }
}
