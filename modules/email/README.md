# Email Module

Transactional email service powered by [Resend](https://resend.com).

## Features

- Send single and batch emails
- Pre-built templates for common use cases:
  - Welcome emails
  - Password reset emails
  - Email verification
- TypeScript support with full type definitions
- HTML and plain text support
- Error handling with detailed error messages

## Installation

1. Install the Resend package in your backend:

```bash
cd core/backend
npm install resend
```

2. Copy the service file to your backend:

```bash
cp modules/email/backend/src/services/email.service.ts core/backend/src/services/
```

3. Add environment variables to your `.env` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

## Usage

### Basic Usage

```typescript
import { getEmailService } from './services/email.service';

const emailService = getEmailService();

// Send a simple email
await emailService.send({
  to: 'user@example.com',
  subject: 'Hello!',
  html: '<p>This is a test email</p>',
  text: 'This is a test email',
});
```

### Using Templates

```typescript
// Send welcome email
await emailService.sendWelcome('user@example.com', {
  name: 'John Doe',
  loginUrl: 'https://yourapp.com/login',
});

// Send password reset
await emailService.sendPasswordReset('user@example.com', {
  name: 'John Doe',
  resetUrl: 'https://yourapp.com/reset-password?token=xxx',
  expiresIn: '1 hour',
});

// Send email verification
await emailService.sendVerification('user@example.com', {
  name: 'John Doe',
  verifyUrl: 'https://yourapp.com/verify?token=xxx',
});
```

### Batch Emails

Send up to 100 emails in a single API call:

```typescript
const results = await emailService.sendBatch([
  { to: 'user1@example.com', subject: 'Hello', html: '<p>Hi User 1</p>' },
  { to: 'user2@example.com', subject: 'Hello', html: '<p>Hi User 2</p>' },
]);
```

### Custom Instance

Create a custom email service instance with different configuration:

```typescript
import { createEmailService } from './services/email.service';

const customEmailService = createEmailService({
  apiKey: 'custom-api-key',
  from: 'custom@yourdomain.com',
});
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key |
| `EMAIL_FROM` | Yes | Default sender email address |

## API Reference

### `EmailService`

#### `send(options: SendEmailOptions): Promise<SendEmailResult>`

Send a single email.

#### `sendBatch(emails: SendEmailOptions[]): Promise<SendEmailResult[]>`

Send multiple emails in a single API call (max 100).

#### `sendWelcome(to: string, data: { name: string; loginUrl?: string }): Promise<SendEmailResult>`

Send a welcome email using the built-in template.

#### `sendPasswordReset(to: string, data: { name: string; resetUrl: string; expiresIn?: string }): Promise<SendEmailResult>`

Send a password reset email using the built-in template.

#### `sendVerification(to: string, data: { name: string; verifyUrl: string }): Promise<SendEmailResult>`

Send an email verification email using the built-in template.

## Pricing Suggestion

$300-500 for integration including:
- Service setup and configuration
- Custom email templates
- Integration with authentication flow
