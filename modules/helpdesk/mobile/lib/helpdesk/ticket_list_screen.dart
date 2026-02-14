// =============================================================================
// Ticket List Screen (Flutter)
// =============================================================================
// Placeholder list screen for helpdesk tickets.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class TicketListScreen extends StatefulWidget {
  const TicketListScreen({super.key});

  @override
  State<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends State<TicketListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _tickets = [];

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    // TODO: Replace with actual API call
    // final service = HelpdeskApiService(authToken: currentToken);
    // final result = await service.getTickets();
    // setState(() { _tickets = List<Map<String, dynamic>>.from(result['items']); _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _tickets = [
        {
          'id': '1',
          'ticketNumber': 'TKT-1001',
          'subject': 'Cannot login to dashboard',
          'status': 'OPEN',
          'priority': 'HIGH',
        },
        {
          'id': '2',
          'ticketNumber': 'TKT-1002',
          'subject': 'Feature request: Dark mode',
          'status': 'IN_PROGRESS',
          'priority': 'LOW',
        },
      ];
    });
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'URGENT':
        return Colors.red;
      case 'HIGH':
        return Colors.orange;
      case 'MEDIUM':
        return Colors.blue;
      case 'LOW':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support Tickets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to create ticket screen
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tickets.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.support_agent, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No tickets yet',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Create a ticket to get support',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadTickets,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tickets.length,
                    itemBuilder: (context, index) {
                      final ticket = _tickets[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(ticket['subject'] ?? ''),
                          subtitle: Text(ticket['ticketNumber'] ?? ''),
                          leading: CircleAvatar(
                            backgroundColor: _getPriorityColor(ticket['priority'] ?? 'MEDIUM'),
                            child: Text(
                              (ticket['priority'] ?? 'M')[0],
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                          trailing: Chip(
                            label: Text(
                              ticket['status'] ?? '',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                          onTap: () {
                            // TODO: Navigate to ticket detail
                            // Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: ticket['id'])));
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
