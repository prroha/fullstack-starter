import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../../../../../core/backend/src/middleware/auth.middleware';
import {
  getEmailService,
  SendEmailOptions,
  SendEmailResult,
} from '../services/email.service';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

interface SendTemplateRequest {
  to: string | string[];
  template: 'welcome' | 'password-reset' | 'notification';
  data: Record<string, string>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Router Setup
// =============================================================================

const router = Router();

// =============================================================================
// Template Loading
// =============================================================================

const templatesDir = path.join(__dirname, '../templates');

function loadTemplate(templateName: string): string | null {
  try {
    const templatePath = path.join(templatesDir, `${templateName}.html`);
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error(`[EmailRoutes] Failed to load template ${templateName}:`, error);
    return null;
  }
}

function renderTemplate(template: string, data: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, escapeHtml(value));
  }
  return rendered;
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// Template subject mapping
const templateSubjects: Record<string, string> = {
  'welcome': 'Welcome to Our Platform!',
  'password-reset': 'Reset Your Password',
  'notification': 'New Notification',
};

// =============================================================================
// Validation Helpers
// =============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateEmails(emails: string | string[]): { valid: boolean; error?: string } {
  const emailList = Array.isArray(emails) ? emails : [emails];

  for (const email of emailList) {
    if (!isValidEmail(email)) {
      return { valid: false, error: `Invalid email address: ${email}` };
    }
  }

  return { valid: true };
}

// =============================================================================
// POST /send - Send transactional email
// =============================================================================

/**
 * POST /email/send
 * Send a transactional email (requires authentication)
 */
router.post(
  '/send',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { to, subject, html, text, replyTo, cc, bcc } = req.body as SendEmailRequest;

      // Validate required fields
      if (!to) {
        res.status(400).json({
          success: false,
          error: 'Recipient email (to) is required',
        } as EmailResponse);
        return;
      }

      if (!subject) {
        res.status(400).json({
          success: false,
          error: 'Email subject is required',
        } as EmailResponse);
        return;
      }

      if (!html && !text) {
        res.status(400).json({
          success: false,
          error: 'Email content (html or text) is required',
        } as EmailResponse);
        return;
      }

      // Validate email addresses
      const toValidation = validateEmails(to);
      if (!toValidation.valid) {
        res.status(400).json({
          success: false,
          error: toValidation.error,
        } as EmailResponse);
        return;
      }

      if (cc) {
        const ccValidation = validateEmails(cc);
        if (!ccValidation.valid) {
          res.status(400).json({
            success: false,
            error: ccValidation.error,
          } as EmailResponse);
          return;
        }
      }

      if (bcc) {
        const bccValidation = validateEmails(bcc);
        if (!bccValidation.valid) {
          res.status(400).json({
            success: false,
            error: bccValidation.error,
          } as EmailResponse);
          return;
        }
      }

      // Send email
      const emailService = getEmailService();
      const options: SendEmailOptions = {
        to,
        subject,
        html,
        text,
        replyTo,
        cc,
        bcc,
      };

      const result: SendEmailResult = await emailService.send(options);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email',
        } as EmailResponse);
        return;
      }

      console.log(`[EmailRoutes] Email sent by user ${authReq.user.userId} to ${to}`);

      res.json({
        success: true,
        messageId: result.messageId,
      } as EmailResponse);
    } catch (error) {
      console.error('[EmailRoutes] Send email error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as EmailResponse);
    }
  }
);

// =============================================================================
// POST /send-template - Send templated email
// =============================================================================

/**
 * POST /email/send-template
 * Send an email using a predefined template (requires authentication)
 */
router.post(
  '/send-template',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { to, template, data, replyTo, cc, bcc } = req.body as SendTemplateRequest;

      // Validate required fields
      if (!to) {
        res.status(400).json({
          success: false,
          error: 'Recipient email (to) is required',
        } as EmailResponse);
        return;
      }

      if (!template) {
        res.status(400).json({
          success: false,
          error: 'Template name is required',
        } as EmailResponse);
        return;
      }

      const validTemplates = ['welcome', 'password-reset', 'notification'];
      if (!validTemplates.includes(template)) {
        res.status(400).json({
          success: false,
          error: `Invalid template. Valid templates: ${validTemplates.join(', ')}`,
        } as EmailResponse);
        return;
      }

      // Validate email addresses
      const toValidation = validateEmails(to);
      if (!toValidation.valid) {
        res.status(400).json({
          success: false,
          error: toValidation.error,
        } as EmailResponse);
        return;
      }

      // Load and render template
      const templateContent = loadTemplate(template);
      if (!templateContent) {
        res.status(500).json({
          success: false,
          error: `Template '${template}' not found`,
        } as EmailResponse);
        return;
      }

      const renderedHtml = renderTemplate(templateContent, data || {});
      const subject = data?.subject || templateSubjects[template] || 'Message from Our Platform';

      // Send email
      const emailService = getEmailService();
      const options: SendEmailOptions = {
        to,
        subject,
        html: renderedHtml,
        replyTo,
        cc,
        bcc,
      };

      const result: SendEmailResult = await emailService.send(options);

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email',
        } as EmailResponse);
        return;
      }

      console.log(`[EmailRoutes] Template email '${template}' sent by user ${authReq.user.userId} to ${to}`);

      res.json({
        success: true,
        messageId: result.messageId,
      } as EmailResponse);
    } catch (error) {
      console.error('[EmailRoutes] Send template email error:', error instanceof Error ? error.message : error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as EmailResponse);
    }
  }
);

// =============================================================================
// GET /templates - List available templates
// =============================================================================

/**
 * GET /email/templates
 * List available email templates
 */
router.get('/templates', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = [
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
    ];

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('[EmailRoutes] List templates error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
