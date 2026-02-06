import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Import from your app's core package
// Adjust these paths based on your project structure
// Example: import 'package:your_app/core/errors/failures.dart';
import '../errors/failures.dart';
import '../network/api_client.dart';
import '../../data/repositories/base_repository.dart';

// =============================================================================
// Models
// =============================================================================

/// Audit log level enum
enum AuditLevel {
  info,
  warning,
  error,
  security;

  String get value => name;

  static AuditLevel fromString(String value) {
    return AuditLevel.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => AuditLevel.info,
    );
  }
}

/// Audit log category enum
enum AuditCategory {
  auth,
  user,
  admin,
  payment,
  system,
  api,
  security;

  String get value => name;

  static AuditCategory fromString(String value) {
    return AuditCategory.values.firstWhere(
      (e) => e.name == value.toLowerCase(),
      orElse: () => AuditCategory.api,
    );
  }
}

/// Audit log entry model
class AuditLog {
  final String id;
  final DateTime timestamp;
  final AuditLevel level;
  final String action;
  final String? category;
  final String? userId;
  final String? userEmail;
  final String? targetId;
  final String? targetType;
  final String? method;
  final String? path;
  final int? statusCode;
  final String? ipAddress;
  final String? userAgent;
  final int? duration;
  final Map<String, dynamic>? metadata;
  final String? error;

  const AuditLog({
    required this.id,
    required this.timestamp,
    required this.level,
    required this.action,
    this.category,
    this.userId,
    this.userEmail,
    this.targetId,
    this.targetType,
    this.method,
    this.path,
    this.statusCode,
    this.ipAddress,
    this.userAgent,
    this.duration,
    this.metadata,
    this.error,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    return AuditLog(
      id: json['id'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      level: AuditLevel.fromString(json['level'] as String? ?? 'info'),
      action: json['action'] as String,
      category: json['category'] as String?,
      userId: json['userId'] as String?,
      userEmail: json['userEmail'] as String?,
      targetId: json['targetId'] as String?,
      targetType: json['targetType'] as String?,
      method: json['method'] as String?,
      path: json['path'] as String?,
      statusCode: json['statusCode'] as int?,
      ipAddress: json['ipAddress'] as String?,
      userAgent: json['userAgent'] as String?,
      duration: json['duration'] as int?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      error: json['error'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'timestamp': timestamp.toIso8601String(),
      'level': level.value,
      'action': action,
      'category': category,
      'userId': userId,
      'userEmail': userEmail,
      'targetId': targetId,
      'targetType': targetType,
      'method': method,
      'path': path,
      'statusCode': statusCode,
      'ipAddress': ipAddress,
      'userAgent': userAgent,
      'duration': duration,
      'metadata': metadata,
      'error': error,
    };
  }
}

/// Audit logs query result
class AuditLogsResult {
  final List<AuditLog> logs;
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  const AuditLogsResult({
    required this.logs,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory AuditLogsResult.fromJson(Map<String, dynamic> json) {
    return AuditLogsResult(
      logs: (json['logs'] as List<dynamic>)
          .map((e) => AuditLog.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}

/// Audit log statistics
class AuditStats {
  final int total;
  final Map<String, int> byLevel;
  final Map<String, int> byCategory;
  final List<DailyActivity> recentActivity;

  const AuditStats({
    required this.total,
    required this.byLevel,
    required this.byCategory,
    required this.recentActivity,
  });

  factory AuditStats.fromJson(Map<String, dynamic> json) {
    return AuditStats(
      total: json['total'] as int,
      byLevel: Map<String, int>.from(json['byLevel'] as Map),
      byCategory: Map<String, int>.from(json['byCategory'] as Map),
      recentActivity: (json['recentActivity'] as List<dynamic>?)
              ?.map((e) => DailyActivity.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Daily activity count
class DailyActivity {
  final String date;
  final int count;

  const DailyActivity({
    required this.date,
    required this.count,
  });

  factory DailyActivity.fromJson(Map<String, dynamic> json) {
    return DailyActivity(
      date: json['date'] as String,
      count: json['count'] as int,
    );
  }
}

/// Query options for fetching audit logs
class AuditQueryOptions {
  final DateTime? startDate;
  final DateTime? endDate;
  final String? userId;
  final AuditLevel? level;
  final List<AuditLevel>? levels;
  final String? action;
  final AuditCategory? category;
  final List<AuditCategory>? categories;
  final String? search;
  final int page;
  final int limit;
  final String sortBy;
  final String sortOrder;

  const AuditQueryOptions({
    this.startDate,
    this.endDate,
    this.userId,
    this.level,
    this.levels,
    this.action,
    this.category,
    this.categories,
    this.search,
    this.page = 1,
    this.limit = 50,
    this.sortBy = 'timestamp',
    this.sortOrder = 'desc',
  });

  Map<String, String> toQueryParams() {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
      'sortBy': sortBy,
      'sortOrder': sortOrder,
    };

    if (startDate != null) {
      params['startDate'] = startDate!.toIso8601String();
    }
    if (endDate != null) {
      params['endDate'] = endDate!.toIso8601String();
    }
    if (userId != null) {
      params['userId'] = userId!;
    }
    if (level != null) {
      params['level'] = level!.value;
    }
    if (levels != null && levels!.isNotEmpty) {
      params['levels'] = levels!.map((l) => l.value).join(',');
    }
    if (action != null) {
      params['action'] = action!;
    }
    if (category != null) {
      params['category'] = category!.value;
    }
    if (categories != null && categories!.isNotEmpty) {
      params['categories'] = categories!.map((c) => c.value).join(',');
    }
    if (search != null && search!.isNotEmpty) {
      params['search'] = search!;
    }

    return params;
  }

  AuditQueryOptions copyWith({
    DateTime? startDate,
    DateTime? endDate,
    String? userId,
    AuditLevel? level,
    List<AuditLevel>? levels,
    String? action,
    AuditCategory? category,
    List<AuditCategory>? categories,
    String? search,
    int? page,
    int? limit,
    String? sortBy,
    String? sortOrder,
  }) {
    return AuditQueryOptions(
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      userId: userId ?? this.userId,
      level: level ?? this.level,
      levels: levels ?? this.levels,
      action: action ?? this.action,
      category: category ?? this.category,
      categories: categories ?? this.categories,
      search: search ?? this.search,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }
}

// =============================================================================
// API Constants
// =============================================================================

/// Audit log API endpoints
class AuditApiConstants {
  static const String basePath = '/admin/audit-logs';
  static const String logs = basePath;
  static const String stats = '$basePath/stats';
  static const String export = '$basePath/export';
  static String logById(String id) => '$basePath/$id';
}

// =============================================================================
// Repository
// =============================================================================

/// Audit log repository provider
final auditRepositoryProvider = Provider<AuditRepository>((ref) {
  return AuditRepositoryImpl(dio: ref.watch(dioProvider));
});

/// Audit log repository interface
abstract class AuditRepository {
  /// Get audit logs with optional filters
  Future<Either<Failure, AuditLogsResult>> getLogs(AuditQueryOptions options);

  /// Get a single audit log by ID
  Future<Either<Failure, AuditLog>> getLogById(String id);

  /// Get audit log statistics
  Future<Either<Failure, AuditStats>> getStats({int days = 30});

  /// Export audit logs (returns download URL or file content)
  Future<Either<Failure, String>> exportLogs({
    required String format,
    AuditQueryOptions? options,
  });
}

/// Audit log repository implementation
class AuditRepositoryImpl with BaseRepository implements AuditRepository {
  final Dio _dio;

  AuditRepositoryImpl({required Dio dio}) : _dio = dio;

  @override
  Future<Either<Failure, AuditLogsResult>> getLogs(
    AuditQueryOptions options,
  ) async {
    return safeCall(() async {
      final response = await _dio.get(
        AuditApiConstants.logs,
        queryParameters: options.toQueryParams(),
      );

      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to fetch audit logs');
      }

      return AuditLogsResult.fromJson(data);
    });
  }

  @override
  Future<Either<Failure, AuditLog>> getLogById(String id) async {
    return safeCall(() async {
      final response = await _dio.get(AuditApiConstants.logById(id));

      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to fetch audit log');
      }

      return AuditLog.fromJson(data['log'] as Map<String, dynamic>);
    });
  }

  @override
  Future<Either<Failure, AuditStats>> getStats({int days = 30}) async {
    return safeCall(() async {
      final response = await _dio.get(
        AuditApiConstants.stats,
        queryParameters: {'days': days.toString()},
      );

      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw Exception(data['error'] ?? 'Failed to fetch audit statistics');
      }

      return AuditStats.fromJson(data['stats'] as Map<String, dynamic>);
    });
  }

  @override
  Future<Either<Failure, String>> exportLogs({
    required String format,
    AuditQueryOptions? options,
  }) async {
    return safeCall(() async {
      final queryParams = <String, String>{
        'format': format,
        ...(options?.toQueryParams() ?? {}),
      };

      final response = await _dio.get(
        AuditApiConstants.export,
        queryParameters: queryParams,
        options: Options(responseType: ResponseType.plain),
      );

      return response.data as String;
    });
  }
}
