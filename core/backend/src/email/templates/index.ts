/**
 * Email Templates Index
 *
 * Exports all email templates and shared utilities.
 */

// Base template and utilities
export {
  baseTemplate,
  emailButton,
  emailDivider,
  emailParagraph,
  emailHeading,
  emailMutedText,
  emailInfoBox,
  emailWarningBox,
  htmlToPlainText,
  type BaseTemplateOptions,
  type EmailOutput,
} from "./base.template";

// Individual templates
export { welcomeEmail, type WelcomeEmailData } from "./welcome.template";
export { passwordResetEmail, type PasswordResetEmailData } from "./password-reset.template";
export { emailVerificationEmail, type EmailVerificationData } from "./email-verification.template";
export { passwordChangedEmail, type PasswordChangedEmailData } from "./password-changed.template";
export { contactFormEmail, type ContactFormEmailData } from "./contact-form.template";
