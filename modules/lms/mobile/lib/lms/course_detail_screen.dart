import 'package:flutter/material.dart';

/// Course detail screen - shows course info, curriculum, and enrollment button.
///
/// This is a placeholder screen. Wire up to LmsService for actual data.
class CourseDetailScreen extends StatefulWidget {
  final String courseSlug;

  const CourseDetailScreen({super.key, required this.courseSlug});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _course;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCourse();
  }

  Future<void> _loadCourse() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // TODO: Replace with actual LmsService call
      // final service = LmsService(baseUrl: apiBaseUrl);
      // final result = await service.getCourseBySlug(widget.courseSlug);
      // setState(() { _course = result['data']; });

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _course = null;
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
        title: Text(_course?['title'] ?? 'Course Details'),
      ),
      body: _buildContent(),
      bottomNavigationBar: _course != null
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Implement enrollment
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Enrollment not yet implemented')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: Text(
                    _course?['price'] == 0
                        ? 'Enroll for Free'
                        : 'Enroll - \$${((_course?['price'] ?? 0) / 100).toStringAsFixed(2)}',
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
              onPressed: _loadCourse,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_course == null) {
      return const Center(child: Text('Course not found'));
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail
          if (_course!['thumbnailUrl'] != null)
            Image.network(
              _course!['thumbnailUrl'],
              width: double.infinity,
              height: 200,
              fit: BoxFit.cover,
            )
          else
            Container(
              width: double.infinity,
              height: 200,
              color: Colors.grey[200],
              child: const Icon(Icons.school, size: 64, color: Colors.grey),
            ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  _course!['title'] ?? '',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),

                // Level & Duration
                Row(
                  children: [
                    if (_course!['level'] != null) ...[
                      Chip(label: Text(_course!['level'])),
                      const SizedBox(width: 8),
                    ],
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text('${_course!['duration'] ?? 0} min'),
                  ],
                ),
                const SizedBox(height: 16),

                // Description
                Text(
                  _course!['description'] ?? '',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),

                // Curriculum placeholder
                Text(
                  'Curriculum',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                const Text('Curriculum will be loaded from sections/lessons API.'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
