// =============================================================================
// Event Detail Screen (Flutter)
// =============================================================================
// Placeholder detail screen for a single event.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _event = {};
  List<Map<String, dynamic>> _speakers = [];
  List<Map<String, dynamic>> _registrations = [];

  @override
  void initState() {
    super.initState();
    _loadEvent();
  }

  Future<void> _loadEvent() async {
    // TODO: Replace with actual API call
    // final service = EventsApiService(authToken: currentToken);
    // final event = await service.getEventById(widget.eventId);
    // setState(() { _event = event; _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _event = {
        'id': widget.eventId,
        'title': 'Tech Conference 2026',
        'description': 'Join us for the annual tech conference featuring industry leaders, hands-on workshops, and networking opportunities.',
        'status': 'PUBLISHED',
        'type': 'IN_PERSON',
        'startDate': '2026-03-15T09:00:00Z',
        'endDate': '2026-03-15T17:00:00Z',
        'capacity': 200,
        'price': 4900,
        'createdAt': '2026-02-14T10:00:00Z',
      };
      _speakers = [
        {
          'id': '1',
          'name': 'Jane Smith',
          'title': 'CTO',
          'company': 'TechCorp',
        },
        {
          'id': '2',
          'name': 'John Doe',
          'title': 'Lead Engineer',
          'company': 'DevStudio',
        },
      ];
      _registrations = [
        {
          'id': '1',
          'attendeeName': 'Alice Johnson',
          'status': 'CONFIRMED',
        },
        {
          'id': '2',
          'attendeeName': 'Bob Wilson',
          'status': 'PENDING',
        },
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Event')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_event['title'] ?? 'Event'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event Info Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _event['title'] ?? '',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  if (_event['description'] != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _event['description'],
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Chip(label: Text(_event['status'] ?? '')),
                      const SizedBox(width: 8),
                      Chip(label: Text(_event['type'] ?? '')),
                    ],
                  ),
                ],
              ),
            ),

            // Speakers
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Speakers (${_speakers.length})',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  ..._speakers.map((speaker) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            child: Text(speaker['name']?[0] ?? ''),
                          ),
                          title: Text(speaker['name'] ?? ''),
                          subtitle: Text('${speaker['title'] ?? ''} at ${speaker['company'] ?? ''}'),
                        ),
                      )),
                ],
              ),
            ),

            // Registrations
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Registrations (${_registrations.length})',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  ..._registrations.map((reg) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(reg['attendeeName'] ?? ''),
                          trailing: Chip(
                            label: Text(
                              reg['status'] ?? '',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                      )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
