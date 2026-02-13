import 'package:flutter/material.dart';

/// Service detail screen - shows service info, providers, and booking button.
///
/// This is a placeholder screen. Wire up to BookingApiService for actual data.
class ServiceDetailScreen extends StatefulWidget {
  final String serviceSlug;

  const ServiceDetailScreen({super.key, required this.serviceSlug});

  @override
  State<ServiceDetailScreen> createState() => _ServiceDetailScreenState();
}

class _ServiceDetailScreenState extends State<ServiceDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _service;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadService();
  }

  Future<void> _loadService() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual BookingApiService call
      // final service = BookingApiService(baseUrl: apiBaseUrl);
      // final result = await service.getServiceBySlug(widget.serviceSlug);
      // setState(() { _service = result['data']; });

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _service = null;
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
        title: Text(_service?['name'] ?? 'Service Details'),
      ),
      body: _buildContent(),
      bottomNavigationBar: _service != null
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Navigate to booking flow
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Booking flow not yet implemented')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: Text(
                    _service?['price'] == 0
                        ? 'Book for Free'
                        : 'Book - \$${((_service?['price'] ?? 0) / 100).toStringAsFixed(2)}',
                  ),
                ),
              ),
            )
          : null,
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
              onPressed: _loadService,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_service == null) {
      return const Center(child: Text('Service not found'));
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail
          if (_service!['thumbnailUrl'] != null)
            Image.network(
              _service!['thumbnailUrl'],
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
            )
          else
            Container(
              width: double.infinity,
              height: 200,
              color: Colors.cyan[50],
              child: const Icon(Icons.spa, size: 64, color: Colors.cyan),
            ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name
                Text(
                  _service!['name'] ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),

                // Duration & Price
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text('${_service!['duration'] ?? 60} min'),
                    const SizedBox(width: 16),
                    Text(
                      _service!['price'] == 0
                          ? 'Free'
                          : '\$${((_service!['price'] ?? 0) / 100).toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Description
                Text(
                  _service!['description'] ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),

                // Providers placeholder
                Text(
                  'Available Providers',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                const Text('Providers will be loaded from the API.'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
