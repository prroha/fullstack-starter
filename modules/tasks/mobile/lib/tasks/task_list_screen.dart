// =============================================================================
// Task List Screen (Flutter)
// =============================================================================
// Placeholder list screen for tasks.
// TODO: Replace with actual API integration and state management.

import 'package:flutter/material.dart';

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _tasks = [];

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    // TODO: Replace with actual API call
    // final service = TasksApiService(authToken: currentToken);
    // final result = await service.getTasks();
    // setState(() { _tasks = List<Map<String, dynamic>>.from(result['items']); _isLoading = false; });

    await Future.delayed(const Duration(seconds: 1));
    setState(() {
      _isLoading = false;
      _tasks = [
        {
          'id': '1',
          'title': 'Design landing page',
          'status': 'IN_PROGRESS',
          'priority': 'HIGH',
        },
        {
          'id': '2',
          'title': 'Set up CI/CD pipeline',
          'status': 'TODO',
          'priority': 'MEDIUM',
        },
        {
          'id': '3',
          'title': 'Write unit tests',
          'status': 'DONE',
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
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tasks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to create task screen
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tasks.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.task_alt, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        'No tasks yet',
                        style: TextStyle(fontSize: 18, color: Colors.grey),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Create a task to get started',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadTasks,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _tasks.length,
                    itemBuilder: (context, index) {
                      final task = _tasks[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(
                            task['title'] ?? '',
                            style: task['status'] == 'DONE'
                                ? const TextStyle(decoration: TextDecoration.lineThrough, color: Colors.grey)
                                : null,
                          ),
                          subtitle: Text(task['status'] ?? ''),
                          leading: CircleAvatar(
                            backgroundColor: _getPriorityColor(task['priority'] ?? 'NONE'),
                            child: Text(
                              (task['priority'] ?? 'N')[0],
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                          trailing: Chip(
                            label: Text(
                              task['status'] ?? '',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                          onTap: () {
                            // TODO: Navigate to task detail
                            // Navigator.push(context, MaterialPageRoute(builder: (_) => TaskDetailScreen(taskId: task['id'])));
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
