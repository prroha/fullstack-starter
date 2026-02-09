/**
 * Contact Form Email Template
 *
 * Sent to administrators when someone submits the contact form.
 */

import { config } from "../../config";
import {
  baseTemplate,
  emailButton,
  emailHeading,
  emailMutedText,
  emailInfoBox,
  emailDivider,
  EmailOutput,
} from "./base.template";

export interface ContactFormEmailData {
  /** Sender's name */
  name: string;
  /** Sender's email */
  email: string;
  /** Message subject (optional) */
  subject?: string;
  /** Message content */
  message: string;
  /** Submission timestamp */
  submittedAt?: Date;
  /** Optional additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Generate contact form email HTML and plain text (for admin)
 */
export function contactFormEmail(data: ContactFormEmailData): EmailOutput {
  const {
    name,
    email,
    subject = "New Contact Form Submission",
    message,
    submittedAt = new Date(),
    metadata,
  } = data;
  const branding = config.app;

  // Format the date
  const formattedDate = submittedAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = submittedAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Escape HTML in message to prevent XSS
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");

  const replyUrl = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`;

  const content = `
    ${emailHeading("New Contact Form Submission")}

    ${emailInfoBox(`
      You have received a new message from the ${branding.name} contact form.
    `)}

    <!-- Sender Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; background-color: #f4f4f5; border-radius: 6px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a; width: 100px;">From:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #27272a; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Email:</td>
              <td style="padding: 8px 0; font-size: 14px;">
                <a href="mailto:${email}" style="color: ${branding.primaryColor}; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Subject:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #27272a;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Date:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #27272a;">${formattedDate} at ${formattedTime}</td>
            </tr>
            ${metadata ? Object.entries(metadata).map(([key, value]) => `
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">${key}:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #27272a;">${value}</td>
            </tr>
            `).join("") : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Message -->
    ${emailHeading("Message", 2)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 20px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px;">
          <div style="font-size: 15px; line-height: 24px; color: #27272a;">
            ${escapedMessage}
          </div>
        </td>
      </tr>
    </table>

    ${emailButton("Reply to Sender", replyUrl)}

    ${emailDivider()}

    ${emailMutedText(`
      This message was sent via the ${branding.name} contact form.
      Reply directly to respond to the sender.
    `)}
  `;

  const html = baseTemplate({
    content,
    previewText: `Contact form: ${subject} - from ${name}`,
    showUnsubscribe: false,
    footerText: `
      <p style="margin: 0;">
        This is an automated message from ${branding.name}.
      </p>
    `,
  });

  const text = `
NEW CONTACT FORM SUBMISSION
${"=".repeat(40)}

From: ${name}
Email: ${email}
Subject: ${subject}
Date: ${formattedDate} at ${formattedTime}
${metadata ? Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join("\n") : ""}

MESSAGE:
${"-".repeat(40)}
${message}
${"-".repeat(40)}

Reply to: ${email}

---
This message was sent via the ${branding.name} contact form.
  `.trim();

  return { html, text };
}
