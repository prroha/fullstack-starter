import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

// =============================================================================
// Types
// =============================================================================

/// Options for sending a transactional email
class SendEmailOptions {
  final List<String> to;
  final String subject;
  final String? html;
  final String? text;
  final String? replyTo;
  final List<String>? cc;
  final List<String>? bcc;

  const SendEmailOptions({
    required this.to,
    required this.subject,
    this.html,
    this.text,
    this.replyTo,
    this.cc,
    this.bcc,
  });

  Map<String, dynamic> toJson() {
    return {
      'to': to.length == 1 ? to.first : to,
      'subject': subject,
      if (html != null) 'html': html,
      if (text != null) 'text': text,
      if (replyTo != null) 'replyTo': replyTo,
      if (cc != null && cc!.isNotEmpty) 'cc': cc!.length == 1 ? cc!.first : cc,
      if (bcc != null && bcc!.isNotEmpty)
        'bcc': bcc!.length == 1 ? bcc!.first : bcc,
    };
  }
}

/// Available email templates
enum EmailTemplateType {
  welcome,
  passwordReset,
  notification,
}

extension EmailTemplateTypeExtension on EmailTemplateType {
  String get value {
    switch (this) {
      case EmailTemplateType.welcome:
        return 'welcome';
      case EmailTemplateType.passwordReset:
        return 'password-reset';
      case EmailTemplateType.notification:
        return 'notification';
    }
  }
}

/// Options for sending a templated email
class SendTemplateOptions {
  final List<String> to;
  final EmailTemplateType template;
  final Map<String, String> data;
  final String? replyTo;
  final List<String>? cc;
  final List<String>? bcc;

  const SendTemplateOptions({
    required this.to,
    required this.template,
    required this.data,
    this.replyTo,
    this.cc,
    this.bcc,
  });

  Map<String, dynamic> toJson() {
    return {
      'to': to.length == 1 ? to.first : to,
      'template': template.value,
      'data': data,
      if (replyTo != null) 'replyTo': replyTo,
      if (cc != null && cc!.isNotEmpty) 'cc': cc!.length == 1 ? cc!.first : cc,
      if (bcc != null && bcc!.isNotEmpty)
        'bcc': bcc!.length == 1 ? bcc!.first : bcc,
    };
  }
}

/// Result of an email operation
class EmailResult {
  final bool success;
  final String? messageId;
  final String? error;

  const EmailResult({
    required this.success,
    this.messageId,
    this.error,
  });

  factory EmailResult.fromJson(Map<String, dynamic> json) {
    return EmailResult(
      success: json['success'] as bool? ?? false,
      messageId: json['messageId'] as String?,
      error: json['error'] as String?,
    );
  }

  factory EmailResult.failure(String error) {
    return EmailResult(
      success: false,
      error: error,
    );
  }
}

/// Email template information
class EmailTemplate {
  final String id;
  final String name;
  final String description;
  final List<String> variables;

  const EmailTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.variables,
  });

  factory EmailTemplate.fromJson(Map<String, dynamic> json) {
    return EmailTemplate(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      variables: List<String>.from(json['variables'] as List),
    );
  }
}

// =============================================================================
// Email Service
// =============================================================================

/// Service for sending emails via the backend API
class EmailService {
  static final EmailService _instance = EmailService._internal();

  factory EmailService() => _instance;

  EmailService._internal();

  String _apiBaseUrl = '/api/email';
  Future<String?> Function()? _getAuthToken;

  /// Configure the email service
  void configure({
    String? apiBaseUrl,
    Future<String?> Function()? getAuthToken,
  }) {
    if (apiBaseUrl != null) {
      _apiBaseUrl = apiBaseUrl;
    }
    if (getAuthToken != null) {
      _getAuthToken = getAuthToken;
    }
  }

  /// Get authorization headers
  Future<Map<String, String>> _getHeaders() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };

    if (_getAuthToken != null) {
      final token = await _getAuthToken!();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // ===========================================================================
  // Send Email
  // ===========================================================================

  /// Send a transactional email
  Future<EmailResult> send(SendEmailOptions options) async {
    try {
      final headers = await _getHeaders();

      final response = await http.post(
        Uri.parse('$_apiBaseUrl/send'),
        headers: headers,
        body: jsonEncode(options.toJson()),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200) {
        return EmailResult.failure(
          data['error'] as String? ?? 'Request failed with status ${response.statusCode}',
        );
      }

      return EmailResult.fromJson(data);
    } catch (e) {
      _log('Send error: $e');
      return EmailResult.failure(e.toString());
    }
  }

  /// Send a templated email
  Future<EmailResult> sendTemplate(SendTemplateOptions options) async {
    try {
      final headers = await _getHeaders();

      final response = await http.post(
        Uri.parse('$_apiBaseUrl/send-template'),
        headers: headers,
        body: jsonEncode(options.toJson()),
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200) {
        return EmailResult.failure(
          data['error'] as String? ?? 'Request failed with status ${response.statusCode}',
        );
      }

      return EmailResult.fromJson(data);
    } catch (e) {
      _log('SendTemplate error: $e');
      return EmailResult.failure(e.toString());
    }
  }

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /// Send welcome email to a new user
  Future<EmailResult> sendWelcome({
    required String to,
    required String name,
    String? loginUrl,
  }) {
    return sendTemplate(SendTemplateOptions(
      to: [to],
      template: EmailTemplateType.welcome,
      data: {
        'name': name,
        if (loginUrl != null) 'loginUrl': loginUrl,
      },
    ));
  }

  /// Send password reset email
  Future<EmailResult> sendPasswordReset({
    required String to,
    required String name,
    required String resetUrl,
    String? expiresIn,
  }) {
    return sendTemplate(SendTemplateOptions(
      to: [to],
      template: EmailTemplateType.passwordReset,
      data: {
        'name': name,
        'resetUrl': resetUrl,
        if (expiresIn != null) 'expiresIn': expiresIn,
      },
    ));
  }

  /// Send notification email
  Future<EmailResult> sendNotification({
    required String to,
    required String name,
    required String title,
    required String message,
    String? actionUrl,
    String? actionText,
  }) {
    return sendTemplate(SendTemplateOptions(
      to: [to],
      template: EmailTemplateType.notification,
      data: {
        'name': name,
        'title': title,
        'message': message,
        if (actionUrl != null) 'actionUrl': actionUrl,
        if (actionText != null) 'actionText': actionText,
      },
    ));
  }

  // ===========================================================================
  // Templates
  // ===========================================================================

  /// Get available email templates
  Future<List<EmailTemplate>> getTemplates() async {
    try {
      final headers = await _getHeaders();

      final response = await http.get(
        Uri.parse('$_apiBaseUrl/templates'),
        headers: headers,
      );

      final data = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode != 200 || data['success'] != true) {
        _log('GetTemplates error: ${data['error']}');
        return [];
      }

      final templates = data['templates'] as List?;
      if (templates == null) return [];

      return templates
          .map((t) => EmailTemplate.fromJson(t as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _log('GetTemplates error: $e');
      return [];
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  void _log(String message) {
    if (kDebugMode) {
      debugPrint('[EmailService] $message');
    }
  }
}

// =============================================================================
// Global Instance
// =============================================================================

/// Global email service instance
final emailService = EmailService();
