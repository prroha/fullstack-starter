// =============================================================================
// Ticket Detail Screen (Flutter)
// =============================================================================
// Placeholder detail screen for a single helpdesk ticket.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class TicketDetailScreen extends StatefulWidget {
  final String ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _ticket = {};
  List<Map<String, dynamic>> _messages = [];
  final TextEditingController _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTicket();
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadTicket() async {
    // TODO: Replace with actual API call
    // final service = HelpdeskApiService(authToken: currentToken);
    // final ticket = await service.getTicketById(widget.ticketId);
    // setState(() { _ticket = ticket; _messages = List.from(ticket['messages'] ?? []); _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _ticket = {
        'id': widget.ticketId,
        'ticketNumber': 'TKT-1001',
        'subject': 'Cannot login to dashboard',
        'description': 'I am unable to login to the admin dashboard. The page shows a blank screen after entering credentials.',
        'status': 'OPEN',
        'priority': 'HIGH',
        'createdAt': '2026-02-14T10:00:00Z',
      };
      _messages = [
        {
          'id': '1',
          'senderType': 'customer',
          'body': 'I am unable to login to the admin dashboard. The page shows a blank screen after entering credentials.',
          'createdAt': '2026-02-14T10:00:00Z',
        },
        {
          'id': '2',
          'senderType': 'agent',
          'body': 'Thank you for reporting this. Could you please try clearing your browser cache and try again?',
          'createdAt': '2026-02-14T10:30:00Z',
        },
      ];
    });
  }

  Future<void> _sendMessage() async {
    final body = _messageController.text.trim();
    if (body.isEmpty) return;

    // TODO: Replace with actual API call
    // final service = HelpdeskApiService(authToken: currentToken);
    // await service.addMessage(widget.ticketId, body: body);

    setState(() {
      _messages.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'senderType': 'customer',
        'body': body,
        'createdAt': DateTime.now().toIso8601String(),
      });
    });
    _messageController.clear();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ticket')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_ticket['ticketNumber'] ?? 'Ticket'),
      ),
      body: Column(
        children: [
          // Ticket Info Banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _ticket['subject'] ?? '',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Chip(label: Text(_ticket['status'] ?? '')),
                    const SizedBox(width: 8),
                    Chip(label: Text(_ticket['priority'] ?? '')),
                  ],
                ),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isAgent = message['senderType'] == 'agent';
                return Align(
                  alignment: isAgent ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    decoration: BoxDecoration(
                      color: isAgent
                          ? Theme.of(context).colorScheme.surfaceContainerHighest
                          : Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isAgent ? 'Agent' : 'You',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 4),
                        Text(message['body'] ?? ''),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Message Input
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(color: Theme.of(context).dividerColor),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    maxLines: 3,
                    minLines: 1,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
