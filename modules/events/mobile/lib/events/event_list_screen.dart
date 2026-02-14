// =============================================================================
// Event List Screen (Flutter)
// =============================================================================
// Placeholder list screen for events.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _events = [];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    // TODO: Replace with actual API call
    // final service = EventsApiService(authToken: currentToken);
    // final result = await service.getEvents();
    // setState(() { _events = List<Map<String, dynamic>>.from(result['items']); _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _events = [
        {
          'id': '1',
          'title': 'Tech Conference 2026',
          'status': 'PUBLISHED',
          'type': 'IN_PERSON',
          'startDate': '2026-03-15T09:00:00Z',
        },
        {
          'id': '2',
          'title': 'Virtual Workshop: Flutter',
          'status': 'DRAFT',
          'type': 'VIRTUAL',
          'startDate': '2026-03-20T14:00:00Z',
        },
        {
          'id': '3',
          'title': 'Community Meetup',
          'status': 'COMPLETED',
          'type': 'HYBRID',
          'startDate': '2026-02-10T18:00:00Z',
        },
      ];
    });
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PUBLISHED':
        return Colors.green;
      case 'DRAFT':
        return Colors.orange;
      case 'CANCELLED':
        return Colors.red;
      case 'COMPLETED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to create event screen
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _events.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.event, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No events yet',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Create an event to get started',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadEvents,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _events.length,
                    itemBuilder: (context, index) {
                      final event = _events[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(
                            event['title'] ?? '',
                            style: event['status'] == 'CANCELLED'
                                ? const TextStyle(decoration: TextDecoration.lineThrough, color: Colors.grey)
                                : null,
                          ),
                          subtitle: Text('${event['type'] ?? ''} • ${event['startDate']?.substring(0, 10) ?? ''}'),
                          leading: CircleAvatar(
                            backgroundColor: _getStatusColor(event['status'] ?? ''),
                            child: const Icon(Icons.event, color: Colors.white),
                          ),
                          trailing: Chip(
                            label: Text(
                              event['status'] ?? '',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                          onTap: () {
                            // TODO: Navigate to event detail
                            // Navigator.push(context, MaterialPageRoute(builder: (_) => EventDetailScreen(eventId: event['id'])));
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
