'use client';

import { useState, useEffect, useCallback } from 'react';
import { emailService, EmailTemplate } from '../lib/email';

// =============================================================================
// Types
// =============================================================================

interface EmailTemplatePreviewProps {
  /** Initially selected template */
  defaultTemplate?: string;
  /** Custom class name */
  className?: string;
  /** Callback when send is clicked */
  onSend?: (template: string, data: Record<string, string>) => void;
  /** Show send button */
  showSendButton?: boolean;
  /** Custom templates (optional, will fetch from API if not provided) */
  templates?: EmailTemplate[];
}

interface TemplateData {
  [key: string]: string;
}

// =============================================================================
// Template Preview Content
// =============================================================================

const templatePreviews: Record<string, (data: TemplateData) => string> = {
  welcome: (data) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Welcome, ${data.name || 'User'}!</h1>
      <p>Thank you for joining our platform. We're excited to have you on board.</p>
      <p>You can now access all our features and start exploring.</p>
      <a href="${data.loginUrl || '#'}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Get Started</a>
      <p style="color: #666; font-size: 14px; margin-top: 32px;">If you have any questions, feel free to reach out to our support team.</p>
    </div>
  `,
  'password-reset': (data) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">Password Reset Request</h1>
      <p>Hi ${data.name || 'User'},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <a href="${data.resetUrl || '#'}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p style="color: #666; font-size: 14px;">This link will expire in ${data.expiresIn || '1 hour'}.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br>${data.resetUrl || '#'}</p>
    </div>
  `,
  notification: (data) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb;">${data.title || 'New Notification'}</h1>
      <p>Hi ${data.name || 'User'},</p>
      <p>${data.message || 'You have a new notification.'}</p>
      ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${data.actionText || 'View Details'}</a>` : ''}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="color: #999; font-size: 12px;">This is an automated notification from our platform.</p>
    </div>
  `,
};

// =============================================================================
// Component
// =============================================================================

export default function EmailTemplatePreview({
  defaultTemplate = 'welcome',
  className = '',
  onSend,
  showSendButton = false,
  templates: propTemplates,
}: EmailTemplatePreviewProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(propTemplates || []);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [loading, setLoading] = useState(!propTemplates);
  const [previewHtml, setPreviewHtml] = useState('');

  // Fetch templates if not provided
  useEffect(() => {
    if (!propTemplates) {
      fetchTemplates();
    }
  }, [propTemplates]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const fetchedTemplates = await emailService.getTemplates();
      if (fetchedTemplates.length > 0) {
        setTemplates(fetchedTemplates);
      } else {
        // Fallback templates
        setTemplates([
          {
            id: 'welcome',
            name: 'Welcome Email',
            description: 'Sent to new users after registration',
            variables: ['name', 'loginUrl'],
          },
          {
            id: 'password-reset',
            name: 'Password Reset',
            description: 'Sent when a user requests a password reset',
            variables: ['name', 'resetUrl', 'expiresIn'],
          },
          {
            id: 'notification',
            name: 'Notification',
            description: 'General notification template',
            variables: ['name', 'title', 'message', 'actionUrl', 'actionText'],
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update preview when template or data changes
  useEffect(() => {
    const previewFn = templatePreviews[selectedTemplate];
    if (previewFn) {
      setPreviewHtml(previewFn(templateData));
    }
  }, [selectedTemplate, templateData]);

  // Initialize data with placeholder values when template changes
  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (template) {
      const initialData: TemplateData = {};
      template.variables.forEach((variable) => {
        initialData[variable] = getPlaceholderValue(variable);
      });
      setTemplateData(initialData);
    }
  }, [selectedTemplate, templates]);

  const getPlaceholderValue = (variable: string): string => {
    const placeholders: Record<string, string> = {
      name: 'John Doe',
      loginUrl: 'https://example.com/login',
      resetUrl: 'https://example.com/reset?token=abc123',
      expiresIn: '1 hour',
      title: 'Important Update',
      message: 'We have some exciting news to share with you!',
      actionUrl: 'https://example.com/action',
      actionText: 'View Details',
    };
    return placeholders[variable] || '';
  };

  const handleDataChange = useCallback((variable: string, value: string) => {
    setTemplateData((prev) => ({ ...prev, [variable]: value }));
  }, []);

  const handleSend = useCallback(() => {
    if (onSend) {
      onSend(selectedTemplate, templateData);
    }
  }, [onSend, selectedTemplate, templateData]);

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded mb-4 w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Template Selector */}
      <div>
        <label
          htmlFor="template-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Template
        </label>
        <select
          id="template-select"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {currentTemplate && (
          <p className="mt-1 text-sm text-gray-500">{currentTemplate.description}</p>
        )}
      </div>

      {/* Template Variables */}
      {currentTemplate && currentTemplate.variables.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Template Variables</h3>
          <div className="space-y-3">
            {currentTemplate.variables.map((variable) => (
              <div key={variable}>
                <label
                  htmlFor={`var-${variable}`}
                  className="block text-sm text-gray-600 mb-1"
                >
                  {variable}
                </label>
                <input
                  id={`var-${variable}`}
                  type="text"
                  value={templateData[variable] || ''}
                  onChange={(e) => handleDataChange(variable, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Email Header Bar */}
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-sm text-gray-600">Email Preview</span>
            </div>
          </div>

          {/* Email Content */}
          <div
            className="p-4 min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>

      {/* Send Button */}
      {showSendButton && onSend && (
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Send Test Email
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Additional Exports
// =============================================================================

export { EmailTemplatePreview };

/**
 * Standalone preview component for a specific template
 */
export function WelcomeEmailPreview({
  name = 'John Doe',
  loginUrl = '#',
}: {
  name?: string;
  loginUrl?: string;
}) {
  const html = templatePreviews.welcome({ name, loginUrl });
  return (
    <div
      className="border border-gray-300 rounded-lg overflow-hidden bg-white p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function PasswordResetEmailPreview({
  name = 'John Doe',
  resetUrl = '#',
  expiresIn = '1 hour',
}: {
  name?: string;
  resetUrl?: string;
  expiresIn?: string;
}) {
  const html = templatePreviews['password-reset']({ name, resetUrl, expiresIn });
  return (
    <div
      className="border border-gray-300 rounded-lg overflow-hidden bg-white p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function NotificationEmailPreview({
  name = 'John Doe',
  title = 'New Notification',
  message = 'You have a new notification.',
  actionUrl,
  actionText,
}: {
  name?: string;
  title?: string;
  message?: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const html = templatePreviews.notification({
    name,
    title,
    message,
    actionUrl: actionUrl || '',
    actionText: actionText || 'View Details',
  });
  return (
    <div
      className="border border-gray-300 rounded-lg overflow-hidden bg-white p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
