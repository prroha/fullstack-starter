/**
 * Email Service for Xitolaunch
 *
 * Handles all transactional emails using Resend:
 * - Order confirmations
 * - Download link delivery
 * - License key notifications
 * - Refund confirmations
 * - Welcome emails
 */

import { Resend } from "resend";
import { env } from "../config/env.js";

// =====================================================
// Types
// =====================================================

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OrderEmailData {
  customerEmail: string;
  customerName?: string | null;
  orderNumber: string;
  tier: string;
  tierName: string;
  selectedFeatures: string[];
  subtotal: number;
  discount: number;
  total: number;
  licenseKey: string;
  downloadUrl: string;
  downloadExpiresAt?: Date;
}

export interface RefundEmailData {
  customerEmail: string;
  customerName?: string | null;
  orderNumber: string;
  refundAmount: number;
  reason?: string;
}

export interface WelcomeEmailData {
  email: string;
  name?: string | null;
  loginUrl?: string;
}

export interface DownloadLinkEmailData {
  customerEmail: string;
  customerName?: string | null;
  orderNumber: string;
  licenseKey: string;
  downloadUrl: string;
  expiresAt?: Date;
}

// =====================================================
// Email Templates
// =====================================================

function getBaseStyles(): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: #f8fafc;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }
    h1 {
      color: #111827;
      font-size: 24px;
      margin: 0 0 16px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: center;
    }
    .highlight-box h2 {
      margin: 0 0 8px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
    }
    .highlight-box .value {
      font-size: 24px;
      font-weight: 700;
      font-family: 'SF Mono', Monaco, monospace;
    }
    .btn {
      display: inline-block;
      background: #6366f1;
      color: white !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .btn:hover {
      background: #5558e3;
    }
    .order-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .order-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-row:last-child {
      border-bottom: none;
      font-weight: 600;
    }
    .features-list {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    .features-list li {
      padding: 6px 0;
      padding-left: 24px;
      position: relative;
    }
    .features-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
    }
    .code-box {
      background: #1f2937;
      color: #e5e7eb;
      padding: 16px;
      border-radius: 8px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 14px;
      word-break: break-all;
    }
  `;
}

function orderConfirmationTemplate(data: OrderEmailData): { html: string; text: string } {
  const name = data.customerName || "there";
  const featuresHtml = data.selectedFeatures
    .slice(0, 10)
    .map((f) => `<li>${f}</li>`)
    .join("");
  const moreFeatures = data.selectedFeatures.length > 10
    ? `<li>...and ${data.selectedFeatures.length - 10} more</li>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ Xitolaunch</div>
      <h1>Thank You for Your Purchase!</h1>
      <p style="color: #6b7280;">Order #${data.orderNumber}</p>
    </div>

    <p>Hi ${name},</p>
    <p>Your order has been confirmed! You now have access to the Fullstack Starter Kit with the <strong>${data.tierName}</strong> tier.</p>

    <div class="highlight-box">
      <h2>Your License Key</h2>
      <div class="value">${data.licenseKey}</div>
    </div>

    <div style="text-align: center;">
      <a href="${data.downloadUrl}" class="btn">Download Your Starter Kit</a>
    </div>

    <div class="order-details">
      <h3 style="margin: 0 0 16px 0;">Order Summary</h3>
      <div class="order-row">
        <span>${data.tierName} Tier</span>
        <span>$${(data.subtotal / 100).toFixed(2)}</span>
      </div>
      ${data.discount > 0 ? `
      <div class="order-row" style="color: #10b981;">
        <span>Discount</span>
        <span>-$${(data.discount / 100).toFixed(2)}</span>
      </div>` : ""}
      <div class="order-row">
        <span>Total</span>
        <span>$${(data.total / 100).toFixed(2)}</span>
      </div>
    </div>

    <h3>Included Features</h3>
    <ul class="features-list">
      ${featuresHtml}
      ${moreFeatures}
    </ul>

    <div class="warning">
      <strong>Important:</strong> Save your license key! You'll need it to activate updates and access support.
    </div>

    <h3>What's Next?</h3>
    <ol>
      <li>Download and extract the starter kit</li>
      <li>Follow the setup guide in the README</li>
      <li>Configure your environment variables</li>
      <li>Start building your project!</li>
    </ol>

    <div class="footer">
      <p>Questions? Reply to this email or visit our <a href="#">documentation</a>.</p>
      <p>© ${new Date().getFullYear()} Xitolaunch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Thank You for Your Purchase!
Order #${data.orderNumber}

Hi ${name},

Your order has been confirmed! You now have access to the Fullstack Starter Kit with the ${data.tierName} tier.

LICENSE KEY: ${data.licenseKey}

DOWNLOAD LINK: ${data.downloadUrl}

ORDER SUMMARY:
- ${data.tierName} Tier: $${(data.subtotal / 100).toFixed(2)}
${data.discount > 0 ? `- Discount: -$${(data.discount / 100).toFixed(2)}` : ""}
- Total: $${(data.total / 100).toFixed(2)}

INCLUDED FEATURES:
${data.selectedFeatures.map((f) => `• ${f}`).join("\n")}

IMPORTANT: Save your license key! You'll need it for updates and support.

NEXT STEPS:
1. Download and extract the starter kit
2. Follow the setup guide in the README
3. Configure your environment variables
4. Start building your project!

Questions? Reply to this email.
© ${new Date().getFullYear()} Xitolaunch
  `.trim();

  return { html, text };
}

function downloadLinkTemplate(data: DownloadLinkEmailData): { html: string; text: string } {
  const name = data.customerName || "there";
  const expiresText = data.expiresAt
    ? `This link expires on ${data.expiresAt.toLocaleDateString()}.`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ Xitolaunch</div>
      <h1>Your Download Link</h1>
      <p style="color: #6b7280;">Order #${data.orderNumber}</p>
    </div>

    <p>Hi ${name},</p>
    <p>Here's your download link for the Fullstack Starter Kit.</p>

    <div class="highlight-box">
      <h2>Your License Key</h2>
      <div class="value">${data.licenseKey}</div>
    </div>

    <div style="text-align: center;">
      <a href="${data.downloadUrl}" class="btn">Download Now</a>
      ${expiresText ? `<p style="color: #6b7280; font-size: 14px; margin-top: 8px;">${expiresText}</p>` : ""}
    </div>

    <p style="margin-top: 24px;">If the button doesn't work, copy and paste this URL:</p>
    <div class="code-box">${data.downloadUrl}</div>

    <div class="footer">
      <p>Questions? Reply to this email.</p>
      <p>© ${new Date().getFullYear()} Xitolaunch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Your Download Link
Order #${data.orderNumber}

Hi ${name},

Here's your download link for the Fullstack Starter Kit.

LICENSE KEY: ${data.licenseKey}

DOWNLOAD LINK: ${data.downloadUrl}
${expiresText}

Questions? Reply to this email.
© ${new Date().getFullYear()} Xitolaunch
  `.trim();

  return { html, text };
}

function refundConfirmationTemplate(data: RefundEmailData): { html: string; text: string } {
  const name = data.customerName || "there";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ Xitolaunch</div>
      <h1>Refund Processed</h1>
      <p style="color: #6b7280;">Order #${data.orderNumber}</p>
    </div>

    <p>Hi ${name},</p>
    <p>We've processed your refund request. Here are the details:</p>

    <div class="order-details">
      <div class="order-row">
        <span>Order Number</span>
        <span>${data.orderNumber}</span>
      </div>
      <div class="order-row">
        <span>Refund Amount</span>
        <span>$${(data.refundAmount / 100).toFixed(2)}</span>
      </div>
      ${data.reason ? `
      <div class="order-row">
        <span>Reason</span>
        <span>${data.reason}</span>
      </div>` : ""}
    </div>

    <p>The refund will appear on your original payment method within 5-10 business days, depending on your bank.</p>

    <p>We're sorry to see you go. If there's anything we could have done better, please let us know by replying to this email.</p>

    <div class="footer">
      <p>Questions? Reply to this email.</p>
      <p>© ${new Date().getFullYear()} Xitolaunch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Refund Processed
Order #${data.orderNumber}

Hi ${name},

We've processed your refund request. Here are the details:

ORDER NUMBER: ${data.orderNumber}
REFUND AMOUNT: $${(data.refundAmount / 100).toFixed(2)}
${data.reason ? `REASON: ${data.reason}` : ""}

The refund will appear on your original payment method within 5-10 business days, depending on your bank.

We're sorry to see you go. If there's anything we could have done better, please let us know.

Questions? Reply to this email.
© ${new Date().getFullYear()} Xitolaunch
  `.trim();

  return { html, text };
}

function welcomeTemplate(data: WelcomeEmailData): { html: string; text: string } {
  const name = data.name || "there";
  const loginUrl = data.loginUrl || "#";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ Xitolaunch</div>
      <h1>Welcome to Xitolaunch!</h1>
    </div>

    <p>Hi ${name},</p>
    <p>Thanks for creating an account! You now have access to manage your purchases, download updates, and access exclusive content.</p>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Go to Dashboard</a>
    </div>

    <h3>What You Can Do:</h3>
    <ul class="features-list">
      <li>View your order history</li>
      <li>Download your purchased starter kits</li>
      <li>Access license keys and updates</li>
      <li>Get priority support</li>
    </ul>

    <div class="footer">
      <p>Questions? Reply to this email.</p>
      <p>© ${new Date().getFullYear()} Xitolaunch. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to Xitolaunch!

Hi ${name},

Thanks for creating an account! You now have access to manage your purchases, download updates, and access exclusive content.

GO TO DASHBOARD: ${loginUrl}

WHAT YOU CAN DO:
• View your order history
• Download your purchased starter kits
• Access license keys and updates
• Get priority support

Questions? Reply to this email.
© ${new Date().getFullYear()} Xitolaunch
  `.trim();

  return { html, text };
}

// =====================================================
// Email Service Class
// =====================================================

class EmailService {
  private resend: Resend | null = null;
  private from: string;
  private isDev: boolean;

  constructor() {
    this.from = env.EMAIL_FROM;
    this.isDev = env.NODE_ENV === "development";

    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Send an email
   */
  private async send(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<SendEmailResult> {
    // Log in development
    if (this.isDev) {
      this.logEmail(to, subject, text);
    }

    // Send via Resend if configured
    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.from,
          to,
          subject,
          html,
          text,
        });

        if (error) {
          console.error("[EmailService] Send failed:", error);
          return { success: false, error: error.message };
        }

        console.log(`[EmailService] Email sent: ${data?.id} to ${to}`);
        return { success: true, messageId: data?.id };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[EmailService] Exception:", message);
        return { success: false, error: message };
      }
    }

    // Development mode without Resend configured
    if (this.isDev) {
      return {
        success: true,
        messageId: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
    }

    console.warn("[EmailService] Resend not configured - email not sent");
    return { success: false, error: "Email service not configured" };
  }

  /**
   * Log email to console (development)
   */
  private logEmail(to: string, subject: string, text: string): void {
    const separator = "=".repeat(60);
    console.log("\n" + separator);
    console.log("📧 EMAIL (Development Mode)");
    console.log(separator);
    console.log(`From: ${this.from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(separator);
    console.log(text);
    console.log(separator + "\n");
  }

  // ===========================================================================
  // Public Email Methods
  // ===========================================================================

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<SendEmailResult> {
    const { html, text } = orderConfirmationTemplate(data);
    return this.send(
      data.customerEmail,
      `Order Confirmed - ${data.orderNumber}`,
      html,
      text
    );
  }

  /**
   * Send download link email
   */
  async sendDownloadLink(data: DownloadLinkEmailData): Promise<SendEmailResult> {
    const { html, text } = downloadLinkTemplate(data);
    return this.send(
      data.customerEmail,
      `Your Download Link - ${data.orderNumber}`,
      html,
      text
    );
  }

  /**
   * Send refund confirmation email
   */
  async sendRefundConfirmation(data: RefundEmailData): Promise<SendEmailResult> {
    const { html, text } = refundConfirmationTemplate(data);
    return this.send(
      data.customerEmail,
      `Refund Processed - ${data.orderNumber}`,
      html,
      text
    );
  }

  /**
   * Send welcome email
   */
  async sendWelcome(data: WelcomeEmailData): Promise<SendEmailResult> {
    const { html, text } = welcomeTemplate(data);
    return this.send(data.email, "Welcome to Xitolaunch!", html, text);
  }
}

// Export singleton instance
export const emailService = new EmailService();
