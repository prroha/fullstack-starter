import { Resend } from 'resend';

// =============================================================================
// Types
// =============================================================================

export interface EmailConfig {
  apiKey: string;
  from: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Email Service
// =============================================================================

export class EmailService {
  private resend: Resend;
  private from: string;

  constructor(config: EmailConfig) {
    if (!config.apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }
    if (!config.from) {
      throw new Error('EMAIL_FROM is required');
    }

    this.resend = new Resend(config.apiKey);
    this.from = config.from;
  }

  /**
   * Send a single email
   */
  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (error) {
        console.error('[EmailService] Send failed:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Send exception:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send a batch of emails (up to 100)
   */
  async sendBatch(
    emails: Array<SendEmailOptions & { from?: string }>
  ): Promise<SendEmailResult[]> {
    try {
      const prepared = emails.map((email) => ({
        from: email.from || this.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        replyTo: email.replyTo,
        cc: email.cc,
        bcc: email.bcc,
        tags: email.tags,
      }));

      const { data, error } = await this.resend.batch.send(prepared);

      if (error) {
        console.error('[EmailService] Batch send failed:', error);
        return emails.map(() => ({
          success: false,
          error: error.message,
        }));
      }

      return (data?.data || []).map((result) => ({
        success: true,
        messageId: result.id,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[EmailService] Batch send exception:', message);
      return emails.map(() => ({
        success: false,
        error: message,
      }));
    }
  }

  // ===========================================================================
  // Template Helpers
  // ===========================================================================

  /**
   * Send a welcome email to a new user
   */
  async sendWelcome(
    to: string,
    data: { name: string; loginUrl?: string }
  ): Promise<SendEmailResult> {
    const template = this.getWelcomeTemplate(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordReset(
    to: string,
    data: { name: string; resetUrl: string; expiresIn?: string }
  ): Promise<SendEmailResult> {
    const template = this.getPasswordResetTemplate(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send an email verification email
   */
  async sendVerification(
    to: string,
    data: { name: string; verifyUrl: string }
  ): Promise<SendEmailResult> {
    const template = this.getVerificationTemplate(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // ===========================================================================
  // Email Templates
  // ===========================================================================

  private getWelcomeTemplate(data: {
    name: string;
    loginUrl?: string;
  }): EmailTemplate {
    const loginUrl = data.loginUrl || '#';
    return {
      subject: 'Welcome to Our Platform!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Welcome, ${this.escapeHtml(data.name)}!</h1>
  <p>Thank you for joining our platform. We're excited to have you on board.</p>
  <p>You can now access all our features and start exploring.</p>
  <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Get Started</a>
  <p style="color: #666; font-size: 14px; margin-top: 32px;">If you have any questions, feel free to reach out to our support team.</p>
</body>
</html>
      `.trim(),
      text: `Welcome, ${data.name}!\n\nThank you for joining our platform. We're excited to have you on board.\n\nGet started: ${loginUrl}`,
    };
  }

  private getPasswordResetTemplate(data: {
    name: string;
    resetUrl: string;
    expiresIn?: string;
  }): EmailTemplate {
    const expiresIn = data.expiresIn || '1 hour';
    return {
      subject: 'Reset Your Password',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Password Reset Request</h1>
  <p>Hi ${this.escapeHtml(data.name)},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  <a href="${data.resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
  <p style="color: #666; font-size: 14px;">This link will expire in ${expiresIn}.</p>
  <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br>${data.resetUrl}</p>
</body>
</html>
      `.trim(),
      text: `Password Reset Request\n\nHi ${data.name},\n\nWe received a request to reset your password. Visit this link to create a new password:\n\n${data.resetUrl}\n\nThis link will expire in ${expiresIn}.\n\nIf you didn't request this, you can safely ignore this email.`,
    };
  }

  private getVerificationTemplate(data: {
    name: string;
    verifyUrl: string;
  }): EmailTemplate {
    return {
      subject: 'Verify Your Email Address',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Verify Your Email</h1>
  <p>Hi ${this.escapeHtml(data.name)},</p>
  <p>Please verify your email address by clicking the button below:</p>
  <a href="${data.verifyUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
  <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
  <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br>${data.verifyUrl}</p>
</body>
</html>
      `.trim(),
      text: `Verify Your Email\n\nHi ${data.name},\n\nPlease verify your email address by visiting this link:\n\n${data.verifyUrl}\n\nIf you didn't create an account, you can safely ignore this email.`,
    };
  }

  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

let emailServiceInstance: EmailService | null = null;

/**
 * Get or create the email service singleton
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService({
      apiKey: process.env.RESEND_API_KEY || '',
      from: process.env.EMAIL_FROM || '',
    });
  }
  return emailServiceInstance;
}

/**
 * Create a new email service instance with custom config
 */
export function createEmailService(config: EmailConfig): EmailService {
  return new EmailService(config);
}

export default EmailService;
