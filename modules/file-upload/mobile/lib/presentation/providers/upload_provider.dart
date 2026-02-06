import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/upload_service.dart';

// =============================================================================
// Types
// =============================================================================

/// Status of an individual file upload
enum UploadFileStatus {
  pending,
  uploading,
  success,
  error,
  cancelled,
}

/// State of an individual file being uploaded
class UploadFileState {
  final String id;
  final File file;
  final String name;
  final int size;
  final UploadFileStatus status;
  final double progress;
  final String? error;
  final UploadedFile? result;
  final CancelToken? cancelToken;

  const UploadFileState({
    required this.id,
    required this.file,
    required this.name,
    required this.size,
    this.status = UploadFileStatus.pending,
    this.progress = 0,
    this.error,
    this.result,
    this.cancelToken,
  });

  UploadFileState copyWith({
    UploadFileStatus? status,
    double? progress,
    String? error,
    UploadedFile? result,
    CancelToken? cancelToken,
  }) {
    return UploadFileState(
      id: id,
      file: file,
      name: name,
      size: size,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      error: error,
      result: result ?? this.result,
      cancelToken: cancelToken ?? this.cancelToken,
    );
  }
}

/// Overall upload state
class UploadState {
  final List<UploadFileState> files;
  final bool isUploading;
  final String? error;

  const UploadState({
    this.files = const [],
    this.isUploading = false,
    this.error,
  });

  UploadState copyWith({
    List<UploadFileState>? files,
    bool? isUploading,
    String? error,
  }) {
    return UploadState(
      files: files ?? this.files,
      isUploading: isUploading ?? this.isUploading,
      error: error,
    );
  }

  /// Get count of files by status
  int countByStatus(UploadFileStatus status) {
    return files.where((f) => f.status == status).count;
  }

  /// Check if any files are pending
  bool get hasPendingFiles => files.any((f) => f.status == UploadFileStatus.pending);

  /// Check if all files are uploaded
  bool get allFilesUploaded =>
      files.isNotEmpty &&
      files.every((f) =>
          f.status == UploadFileStatus.success ||
          f.status == UploadFileStatus.error ||
          f.status == UploadFileStatus.cancelled);

  /// Get all successful uploads
  List<UploadedFile> get uploadedFiles =>
      files.where((f) => f.result != null).map((f) => f.result!).toList();

  /// Get total progress (0-100)
  double get totalProgress {
    if (files.isEmpty) return 0;
    final total = files.fold<double>(0, (sum, f) => sum + f.progress);
    return total / files.length;
  }
}

// =============================================================================
// Upload Notifier
// =============================================================================

/// State notifier for managing file uploads
class UploadNotifier extends StateNotifier<UploadState> {
  final UploadService _uploadService;
  final String? _folder;
  final bool _isPublic;

  UploadNotifier({
    required UploadService uploadService,
    String? folder,
    bool isPublic = false,
  })  : _uploadService = uploadService,
        _folder = folder,
        _isPublic = isPublic,
        super(const UploadState());

  /// Add files to the upload queue
  void addFiles(List<File> files) {
    final newFiles = files.map((file) {
      final name = file.path.split('/').last;
      return UploadFileState(
        id: '${DateTime.now().millisecondsSinceEpoch}_${files.indexOf(file)}',
        file: file,
        name: name,
        size: file.lengthSync(),
      );
    }).toList();

    state = state.copyWith(
      files: [...state.files, ...newFiles],
      error: null,
    );
  }

  /// Add a single file to the upload queue
  void addFile(File file) {
    addFiles([file]);
  }

  /// Remove a file from the queue
  void removeFile(String id) {
    final fileState = state.files.firstWhere(
      (f) => f.id == id,
      orElse: () => throw StateError('File not found'),
    );

    // Cancel if uploading
    if (fileState.status == UploadFileStatus.uploading) {
      fileState.cancelToken?.cancel('Removed by user');
    }

    state = state.copyWith(
      files: state.files.where((f) => f.id != id).toList(),
    );
  }

  /// Clear all files
  void clearFiles() {
    // Cancel any ongoing uploads
    for (final file in state.files) {
      if (file.status == UploadFileStatus.uploading) {
        file.cancelToken?.cancel('Cleared by user');
      }
    }

    state = const UploadState();
  }

  /// Clear completed files (success and error)
  void clearCompletedFiles() {
    state = state.copyWith(
      files: state.files
          .where((f) =>
              f.status != UploadFileStatus.success &&
              f.status != UploadFileStatus.error &&
              f.status != UploadFileStatus.cancelled)
          .toList(),
    );
  }

  /// Retry a failed upload
  Future<void> retryFile(String id) async {
    final index = state.files.indexWhere((f) => f.id == id);
    if (index == -1) return;

    final fileState = state.files[index];
    if (fileState.status != UploadFileStatus.error &&
        fileState.status != UploadFileStatus.cancelled) {
      return;
    }

    // Reset to pending
    _updateFileState(id, (f) => f.copyWith(
      status: UploadFileStatus.pending,
      progress: 0,
      error: null,
    ));

    // Upload the file
    await _uploadSingleFile(fileState.file, id);
  }

  /// Upload all pending files
  Future<void> uploadAllFiles() async {
    final pendingFiles = state.files
        .where((f) => f.status == UploadFileStatus.pending)
        .toList();

    if (pendingFiles.isEmpty) return;

    state = state.copyWith(isUploading: true, error: null);

    try {
      // Upload files sequentially to track progress properly
      for (final fileState in pendingFiles) {
        if (!mounted) break;

        await _uploadSingleFile(fileState.file, fileState.id);
      }
    } catch (e) {
      debugPrint('[UploadNotifier] Upload error: $e');
      state = state.copyWith(error: 'Upload failed: ${e.toString()}');
    } finally {
      if (mounted) {
        state = state.copyWith(isUploading: false);
      }
    }
  }

  /// Upload a single file
  Future<UploadResult> _uploadSingleFile(File file, String fileId) async {
    final cancelToken = CancelToken();

    // Update state to uploading
    _updateFileState(fileId, (f) => f.copyWith(
      status: UploadFileStatus.uploading,
      progress: 0,
      cancelToken: cancelToken,
    ));

    final result = await _uploadService.uploadFile(
      file,
      options: UploadOptions(
        folder: _folder,
        isPublic: _isPublic,
        cancelToken: cancelToken,
        onProgress: (progress) {
          if (mounted) {
            _updateFileState(fileId, (f) => f.copyWith(
              progress: progress.percentage,
            ));
          }
        },
      ),
    );

    if (mounted) {
      if (result.success && result.file != null) {
        _updateFileState(fileId, (f) => f.copyWith(
          status: UploadFileStatus.success,
          progress: 100,
          result: result.file,
        ));
      } else {
        final isCancelled = result.error == 'Upload cancelled';
        _updateFileState(fileId, (f) => f.copyWith(
          status: isCancelled
              ? UploadFileStatus.cancelled
              : UploadFileStatus.error,
          error: result.error,
        ));
      }
    }

    return result;
  }

  /// Cancel a specific file upload
  void cancelUpload(String id) {
    final fileState = state.files.firstWhere(
      (f) => f.id == id,
      orElse: () => throw StateError('File not found'),
    );

    if (fileState.status == UploadFileStatus.uploading) {
      fileState.cancelToken?.cancel('Cancelled by user');
      _updateFileState(id, (f) => f.copyWith(
        status: UploadFileStatus.cancelled,
        error: 'Cancelled',
      ));
    }
  }

  /// Cancel all ongoing uploads
  void cancelAllUploads() {
    for (final file in state.files) {
      if (file.status == UploadFileStatus.uploading) {
        file.cancelToken?.cancel('Cancelled by user');
      }
    }

    state = state.copyWith(
      files: state.files.map((f) {
        if (f.status == UploadFileStatus.uploading) {
          return f.copyWith(
            status: UploadFileStatus.cancelled,
            error: 'Cancelled',
          );
        }
        return f;
      }).toList(),
      isUploading: false,
    );
  }

  /// Helper to update a specific file's state
  void _updateFileState(
    String id,
    UploadFileState Function(UploadFileState) update,
  ) {
    state = state.copyWith(
      files: state.files.map((f) {
        if (f.id == id) {
          return update(f);
        }
        return f;
      }).toList(),
    );
  }
}

// =============================================================================
// Providers
// =============================================================================

/// Provider for the upload service
final uploadServiceProvider = Provider.family<UploadService, Dio>((ref, dio) {
  return UploadService(dio: dio);
});

/// Provider for the upload notifier
final uploadNotifierProvider = StateNotifierProvider.autoDispose
    .family<UploadNotifier, UploadState, UploadNotifierParams>((ref, params) {
  final uploadService = UploadService(dio: params.dio);

  return UploadNotifier(
    uploadService: uploadService,
    folder: params.folder,
    isPublic: params.isPublic,
  );
});

/// Parameters for the upload notifier provider
class UploadNotifierParams {
  final Dio dio;
  final String? folder;
  final bool isPublic;

  const UploadNotifierParams({
    required this.dio,
    this.folder,
    this.isPublic = false,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UploadNotifierParams &&
        other.dio == dio &&
        other.folder == folder &&
        other.isPublic == isPublic;
  }

  @override
  int get hashCode => Object.hash(dio, folder, isPublic);
}

// =============================================================================
// Extensions
// =============================================================================

extension IterableExtensions<T> on Iterable<T> {
  int get count => length;
}
