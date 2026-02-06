/**
 * Email Service
 *
 * Client-side wrapper for the email API.
 * Provides methods to send transactional and templated emails.
 *
 * Usage:
 *   import { emailService } from '@/lib/email';
 *   await emailService.send({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi!</p>' });
 */

// =============================================================================
// Types
// =============================================================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendTemplateOptions {
  to: string | string[];
  template: 'welcome' | 'password-reset' | 'notification';
  data: Record<string, string>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

export interface EmailServiceConfig {
  apiBaseUrl?: string;
  getAuthToken?: () => Promise<string | null>;
}

// =============================================================================
// Email Service
// =============================================================================

class EmailService {
  private apiBaseUrl: string;
  private getAuthToken: (() => Promise<string | null>) | null = null;

  constructor(config: EmailServiceConfig = {}) {
    this.apiBaseUrl = config.apiBaseUrl || '/api/email';
    this.getAuthToken = config.getAuthToken || null;
  }

  /**
   * Configure the email service
   */
  configure(config: EmailServiceConfig): void {
    if (config.apiBaseUrl) {
      this.apiBaseUrl = config.apiBaseUrl;
    }
    if (config.getAuthToken) {
      this.getAuthToken = config.getAuthToken;
    }
  }

  /**
   * Get authorization headers
   */
  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Send a transactional email
   */
  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.apiBaseUrl}/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify(options),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Send error:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplate(options: SendTemplateOptions): Promise<EmailResult> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.apiBaseUrl}/send-template`, {
        method: 'POST',
        headers,
        body: JSON.stringify(options),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] SendTemplate error:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get available email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.apiBaseUrl}/templates`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[EmailService] GetTemplates error:', data.error);
        return [];
      }

      return data.templates || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] GetTemplates error:', message);
      return [];
    }
  }

  /**
   * Send welcome email to a new user
   */
  async sendWelcome(
    to: string,
    data: { name: string; loginUrl?: string }
  ): Promise<EmailResult> {
    return this.sendTemplate({
      to,
      template: 'welcome',
      data: {
        name: data.name,
        loginUrl: data.loginUrl || '',
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    to: string,
    data: { name: string; resetUrl: string; expiresIn?: string }
  ): Promise<EmailResult> {
    return this.sendTemplate({
      to,
      template: 'password-reset',
      data: {
        name: data.name,
        resetUrl: data.resetUrl,
        expiresIn: data.expiresIn || '1 hour',
      },
    });
  }

  /**
   * Send notification email
   */
  async sendNotification(
    to: string,
    data: {
      name: string;
      title: string;
      message: string;
      actionUrl?: string;
      actionText?: string;
    }
  ): Promise<EmailResult> {
    return this.sendTemplate({
      to,
      template: 'notification',
      data: {
        name: data.name,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl || '',
        actionText: data.actionText || 'View Details',
      },
    });
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const emailService = new EmailService();

// =============================================================================
// React Hook
// =============================================================================

import { useState, useCallback } from 'react';

interface UseEmailState {
  loading: boolean;
  error: string | null;
}

/**
 * React hook for sending emails
 */
export function useEmail() {
  const [state, setState] = useState<UseEmailState>({
    loading: false,
    error: null,
  });

  const send = useCallback(async (options: SendEmailOptions): Promise<EmailResult> => {
    setState({ loading: true, error: null });

    try {
      const result = await emailService.send(options);

      if (!result.success) {
        setState({ loading: false, error: result.error || 'Failed to send email' });
      } else {
        setState({ loading: false, error: null });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: message });
      return { success: false, error: message };
    }
  }, []);

  const sendTemplate = useCallback(async (options: SendTemplateOptions): Promise<EmailResult> => {
    setState({ loading: true, error: null });

    try {
      const result = await emailService.sendTemplate(options);

      if (!result.success) {
        setState({ loading: false, error: result.error || 'Failed to send email' });
      } else {
        setState({ loading: false, error: null });
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: message });
      return { success: false, error: message };
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    send,
    sendTemplate,
    sendWelcome: emailService.sendWelcome.bind(emailService),
    sendPasswordReset: emailService.sendPasswordReset.bind(emailService),
    sendNotification: emailService.sendNotification.bind(emailService),
    getTemplates: emailService.getTemplates.bind(emailService),
    clearError,
  };
}

export default emailService;
