/**
 * Email Module Index
 *
 * Exports all email-related functionality.
 */

// Re-export email service
export { emailService, type SendEmailOptions, type SendEmailResult, type EmailUser, type ContactMessage } from "../services/email.service.js";

// Re-export templates
export * from "./templates/index.js";
