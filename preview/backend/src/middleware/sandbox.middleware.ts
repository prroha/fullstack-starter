import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";

/**
 * Mock email service — stores "sent" emails in memory per session.
 * Viewable at GET /internal/emails/:sessionToken (Phase 7).
 */
const mockEmailStore = new Map<string, Array<{
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}>>();

export const mockEmailService = {
  async sendEmail(to: string, subject: string, body: string, sessionToken?: string): Promise<{ id: string }> {
    const id = `mock_email_${crypto.randomUUID()}`;
    if (sessionToken) {
      const emails = mockEmailStore.get(sessionToken) || [];
      emails.push({ to, subject, body, sentAt: new Date() });
      mockEmailStore.set(sessionToken, emails);
    }
    return { id };
  },

  async sendWelcomeEmail() { return { id: "mock_welcome" }; },
  async sendPasswordResetEmail() { return { id: "mock_reset" }; },
  async sendPasswordChangedEmail() { return { id: "mock_changed" }; },
  async sendVerificationEmail() { return { id: "mock_verify" }; },

  getEmails(sessionToken: string) {
    return mockEmailStore.get(sessionToken) || [];
  },

  clearEmails(sessionToken: string) {
    mockEmailStore.delete(sessionToken);
  },
};

/**
 * Mock payment service — always succeeds, no real charges.
 */
export const mockPaymentService = {
  async createCheckoutSession() {
    return { id: `mock_cs_${crypto.randomUUID()}`, url: "#mock-checkout" };
  },
  async confirmPayment() {
    return { status: "succeeded", id: `mock_pi_${crypto.randomUUID()}` };
  },
  async refundPayment() {
    return { status: "refunded", id: `mock_re_${crypto.randomUUID()}` };
  },
};

/**
 * Mock storage service — no actual file storage in preview.
 */
export const mockStorageService = {
  async uploadFile(_buffer: Buffer, filename: string) {
    return {
      url: `https://preview.local/uploads/${crypto.randomUUID()}/${filename}`,
      key: `mock/${filename}`,
    };
  },
  async deleteFile() { /* no-op */ },
  async getSignedUrl(key: string) {
    return `https://preview.local/signed/${key}`;
  },
};

// Augment Fastify request type for sandbox services
declare module "fastify" {
  interface FastifyRequest {
    sandboxEmail?: typeof mockEmailService;
    sandboxPayment?: typeof mockPaymentService;
    sandboxStorage?: typeof mockStorageService;
  }
}

/**
 * Sandbox middleware — intercepts and stubs external services
 * to prevent real side effects in preview mode.
 *
 * Registered as Fastify onRequest hook BEFORE route handlers.
 */
export async function sandboxMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Skip for health and internal routes
  if (req.url === "/health" || req.url.startsWith("/internal")) {
    return;
  }

  // Inject mock service providers into request context
  req.sandboxEmail = mockEmailService;
  req.sandboxPayment = mockPaymentService;
  req.sandboxStorage = mockStorageService;
}
