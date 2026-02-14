// =============================================================================
// Task Detail Screen (Flutter)
// =============================================================================
// Placeholder detail screen for a single task.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class TaskDetailScreen extends StatefulWidget {
  final String taskId;

  const TaskDetailScreen({super.key, required this.taskId});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _task = {};
  List<Map<String, dynamic>> _comments = [];
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTask();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadTask() async {
    // TODO: Replace with actual API call
    // final service = TasksApiService(authToken: currentToken);
    // final task = await service.getTaskById(widget.taskId);
    // setState(() { _task = task; _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _task = {
        'id': widget.taskId,
        'title': 'Design landing page',
        'description': 'Create a modern landing page with hero section, features grid, testimonials, and CTA. Follow the brand guidelines.',
        'status': 'IN_PROGRESS',
        'priority': 'HIGH',
        'dueDate': '2026-02-20T00:00:00Z',
        'createdAt': '2026-02-14T10:00:00Z',
      };
      _comments = [
        {
          'id': '1',
          'content': 'Started working on the wireframes',
          'createdAt': '2026-02-14T11:00:00Z',
        },
        {
          'id': '2',
          'content': 'First draft is ready for review',
          'createdAt': '2026-02-14T14:00:00Z',
        },
      ];
    });
  }

  Future<void> _addComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    // TODO: Replace with actual API call
    // final service = TasksApiService(authToken: currentToken);
    // await service.addComment(widget.taskId, content);

    setState(() {
      _comments.add({
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'content': content,
        'createdAt': DateTime.now().toIso8601String(),
      });
    });
    _commentController.clear();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Task')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_task['title'] ?? 'Task'),
      ),
      body: Column(
        children: [
          // Task Info Banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _task['title'] ?? '',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                if (_task['description'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _task['description'],
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Chip(label: Text(_task['status'] ?? '')),
                    const SizedBox(width: 8),
                    Chip(label: Text(_task['priority'] ?? '')),
                  ],
                ),
              ],
            ),
          ),

          // Comments
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _comments.length,
              itemBuilder: (context, index) {
                final comment = _comments[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(comment['content'] ?? ''),
                      const SizedBox(height: 4),
                      Text(
                        comment['createdAt'] ?? '',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // Comment Input
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
                    controller: _commentController,
                    decoration: const InputDecoration(
                      hintText: 'Add a comment...',
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
                  onPressed: _addComment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
