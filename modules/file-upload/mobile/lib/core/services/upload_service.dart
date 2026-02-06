import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

// =============================================================================
// Types
// =============================================================================

/// Uploaded file information
class UploadedFile {
  final String key;
  final String url;
  final int size;
  final String contentType;
  final String originalName;

  const UploadedFile({
    required this.key,
    required this.url,
    required this.size,
    required this.contentType,
    required this.originalName,
  });

  factory UploadedFile.fromJson(Map<String, dynamic> json) {
    return UploadedFile(
      key: json['key'] as String,
      url: json['url'] as String,
      size: json['size'] as int,
      contentType: json['contentType'] as String,
      originalName: json['originalName'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'url': url,
      'size': size,
      'contentType': contentType,
      'originalName': originalName,
    };
  }
}

/// Upload progress information
class UploadProgress {
  final int sent;
  final int total;
  final double percentage;

  const UploadProgress({
    required this.sent,
    required this.total,
    required this.percentage,
  });
}

/// Upload result
class UploadResult {
  final bool success;
  final UploadedFile? file;
  final List<UploadedFile>? files;
  final String? error;

  const UploadResult({
    required this.success,
    this.file,
    this.files,
    this.error,
  });

  factory UploadResult.fromJson(Map<String, dynamic> json) {
    return UploadResult(
      success: json['success'] as bool,
      file: json['file'] != null
          ? UploadedFile.fromJson(json['file'] as Map<String, dynamic>)
          : null,
      files: json['files'] != null
          ? (json['files'] as List)
              .map((f) => UploadedFile.fromJson(f as Map<String, dynamic>))
              .toList()
          : null,
      error: json['error'] as String?,
    );
  }
}

/// Upload options
class UploadOptions {
  final String? folder;
  final bool isPublic;
  final void Function(UploadProgress)? onProgress;
  final CancelToken? cancelToken;

  const UploadOptions({
    this.folder,
    this.isPublic = false,
    this.onProgress,
    this.cancelToken,
  });
}

/// File info from list
class FileInfo {
  final String key;
  final int size;
  final DateTime? lastModified;

  const FileInfo({
    required this.key,
    required this.size,
    this.lastModified,
  });

  factory FileInfo.fromJson(Map<String, dynamic> json) {
    return FileInfo(
      key: json['key'] as String,
      size: json['size'] as int,
      lastModified: json['lastModified'] != null
          ? DateTime.parse(json['lastModified'] as String)
          : null,
    );
  }
}

/// List result
class ListResult {
  final List<FileInfo> files;
  final String? nextCursor;
  final bool hasMore;

  const ListResult({
    required this.files,
    this.nextCursor,
    required this.hasMore,
  });

  factory ListResult.fromJson(Map<String, dynamic> json) {
    return ListResult(
      files: (json['files'] as List)
          .map((f) => FileInfo.fromJson(f as Map<String, dynamic>))
          .toList(),
      nextCursor: json['nextCursor'] as String?,
      hasMore: json['hasMore'] as bool,
    );
  }
}

// =============================================================================
// Upload Service
// =============================================================================

/// Service for handling file uploads with progress tracking and cancellation
class UploadService {
  final Dio _dio;
  final String _baseUrl;

  UploadService({
    required Dio dio,
    String? baseUrl,
  })  : _dio = dio,
        _baseUrl = baseUrl ?? '/upload';

  /// Upload a single file with multipart form data
  Future<UploadResult> uploadFile(
    File file, {
    UploadOptions options = const UploadOptions(),
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final mimeType = _getMimeType(fileName);

      // Create form data
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: DioMediaType.parse(mimeType),
        ),
      });

      // Build query parameters
      final queryParams = <String, dynamic>{};
      if (options.folder != null) {
        queryParams['folder'] = options.folder;
      }
      if (options.isPublic) {
        queryParams['public'] = 'true';
      }

      // Make request with progress tracking
      final response = await _dio.post<Map<String, dynamic>>(
        _baseUrl,
        data: formData,
        queryParameters: queryParams,
        cancelToken: options.cancelToken,
        onSendProgress: (sent, total) {
          if (options.onProgress != null && total > 0) {
            options.onProgress!(UploadProgress(
              sent: sent,
              total: total,
              percentage: (sent / total) * 100,
            ));
          }
        },
      );

      if (response.data != null) {
        return UploadResult.fromJson(response.data!);
      }

      return const UploadResult(
        success: false,
        error: 'Invalid server response',
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        return const UploadResult(
          success: false,
          error: 'Upload cancelled',
        );
      }

      final errorMessage = _extractErrorMessage(e);
      debugPrint('[UploadService] Upload error: $errorMessage');

      return UploadResult(
        success: false,
        error: errorMessage,
      );
    } catch (e) {
      debugPrint('[UploadService] Upload error: $e');
      return UploadResult(
        success: false,
        error: 'Upload failed: ${e.toString()}',
      );
    }
  }

  /// Upload multiple files
  Future<UploadResult> uploadFiles(
    List<File> files, {
    UploadOptions options = const UploadOptions(),
  }) async {
    try {
      // Create form data with multiple files
      final formData = FormData();

      for (final file in files) {
        final fileName = file.path.split('/').last;
        final mimeType = _getMimeType(fileName);

        formData.files.add(MapEntry(
          'files',
          await MultipartFile.fromFile(
            file.path,
            filename: fileName,
            contentType: DioMediaType.parse(mimeType),
          ),
        ));
      }

      // Build query parameters
      final queryParams = <String, dynamic>{};
      if (options.folder != null) {
        queryParams['folder'] = options.folder;
      }
      if (options.isPublic) {
        queryParams['public'] = 'true';
      }

      // Make request
      final response = await _dio.post<Map<String, dynamic>>(
        '$_baseUrl/multiple',
        data: formData,
        queryParameters: queryParams,
        cancelToken: options.cancelToken,
        onSendProgress: (sent, total) {
          if (options.onProgress != null && total > 0) {
            options.onProgress!(UploadProgress(
              sent: sent,
              total: total,
              percentage: (sent / total) * 100,
            ));
          }
        },
      );

      if (response.data != null) {
        return UploadResult.fromJson(response.data!);
      }

      return const UploadResult(
        success: false,
        error: 'Invalid server response',
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        return const UploadResult(
          success: false,
          error: 'Upload cancelled',
        );
      }

      final errorMessage = _extractErrorMessage(e);
      return UploadResult(
        success: false,
        error: errorMessage,
      );
    } catch (e) {
      return UploadResult(
        success: false,
        error: 'Upload failed: ${e.toString()}',
      );
    }
  }

  /// Upload to public storage (optional auth)
  Future<UploadResult> uploadPublicFile(
    File file, {
    void Function(UploadProgress)? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final mimeType = _getMimeType(fileName);

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: DioMediaType.parse(mimeType),
        ),
      });

      final response = await _dio.post<Map<String, dynamic>>(
        '$_baseUrl/public',
        data: formData,
        cancelToken: cancelToken,
        onSendProgress: (sent, total) {
          if (onProgress != null && total > 0) {
            onProgress(UploadProgress(
              sent: sent,
              total: total,
              percentage: (sent / total) * 100,
            ));
          }
        },
      );

      if (response.data != null) {
        return UploadResult.fromJson(response.data!);
      }

      return const UploadResult(
        success: false,
        error: 'Invalid server response',
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        return const UploadResult(
          success: false,
          error: 'Upload cancelled',
        );
      }

      return UploadResult(
        success: false,
        error: _extractErrorMessage(e),
      );
    } catch (e) {
      return UploadResult(
        success: false,
        error: 'Upload failed: ${e.toString()}',
      );
    }
  }

  /// Get a signed URL for a private file
  Future<String?> getSignedUrl(String key, {int expiresIn = 3600}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/signed-url/${Uri.encodeComponent(key)}',
        queryParameters: {'expires': expiresIn},
      );

      if (response.data?['success'] == true) {
        return response.data!['url'] as String;
      }

      return null;
    } catch (e) {
      debugPrint('[UploadService] Get signed URL error: $e');
      return null;
    }
  }

  /// Delete a file
  Future<bool> deleteFile(String key) async {
    try {
      final response = await _dio.delete<Map<String, dynamic>>(
        '$_baseUrl/${Uri.encodeComponent(key)}',
      );

      return response.data?['success'] == true;
    } catch (e) {
      debugPrint('[UploadService] Delete error: $e');
      return false;
    }
  }

  /// List files in a folder
  Future<ListResult?> listFiles({
    String prefix = '',
    int limit = 100,
    String? cursor,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_baseUrl/list',
        queryParameters: {
          'prefix': prefix,
          'limit': limit,
          if (cursor != null) 'cursor': cursor,
        },
      );

      if (response.data?['success'] == true) {
        return ListResult.fromJson(response.data!);
      }

      return null;
    } catch (e) {
      debugPrint('[UploadService] List error: $e');
      return null;
    }
  }

  /// Get MIME type from filename
  String _getMimeType(String fileName) {
    final ext = fileName.split('.').last.toLowerCase();

    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'json': 'application/json',
    };

    return mimeTypes[ext] ?? 'application/octet-stream';
  }

  /// Extract error message from DioException
  String _extractErrorMessage(DioException e) {
    if (e.response?.data is Map) {
      final data = e.response!.data as Map;
      if (data['error'] != null) {
        return data['error'].toString();
      }
    }

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timed out';
      case DioExceptionType.sendTimeout:
        return 'Upload timed out';
      case DioExceptionType.receiveTimeout:
        return 'Server response timed out';
      case DioExceptionType.badResponse:
        return 'Server error: ${e.response?.statusCode}';
      case DioExceptionType.connectionError:
        return 'No internet connection';
      default:
        return e.message ?? 'Upload failed';
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Format file size to human-readable string
String formatFileSize(int bytes) {
  if (bytes <= 0) return '0 B';

  const suffixes = ['B', 'KB', 'MB', 'GB'];
  var i = 0;
  var size = bytes.toDouble();

  while (size >= 1024 && i < suffixes.length - 1) {
    size /= 1024;
    i++;
  }

  return '${size.toStringAsFixed(i == 0 ? 0 : 1)} ${suffixes[i]}';
}

/// Check if file is an image based on extension
bool isImageFile(String path) {
  final ext = path.split('.').last.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].contains(ext);
}

/// Validate file size
bool validateFileSize(File file, int maxBytes) {
  return file.lengthSync() <= maxBytes;
}

/// Validate file type
bool validateFileType(String path, List<String> allowedExtensions) {
  final ext = path.split('.').last.toLowerCase();
  return allowedExtensions.contains(ext);
}
