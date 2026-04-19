// =============================================================================
// LMS Certificate Service
// =============================================================================
// PDF generation (pdfkit), QR code creation (qrcode), and verification.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface CertificateGenerateInput {
  enrollmentId: string;
  userId: string;
  courseTitle: string;
  studentName: string;
}

// =============================================================================
// Certificate Service
// =============================================================================

export class CertificateService {
  private issuerName: string;
  private verifyBaseUrl: string;

  constructor(
    private db: PrismaClient,
    config?: { issuerName?: string; verifyBaseUrl?: string },
  ) {
    this.issuerName = config?.issuerName || process.env.LMS_CERTIFICATE_ISSUER || 'Learning Platform';
    this.verifyBaseUrl = config?.verifyBaseUrl || process.env.LMS_CERTIFICATE_VERIFY_URL || 'http://localhost:3000/certificates';
  }

  /**
   * Generate a certificate for a completed course
   */
  async generateCertificate(input: CertificateGenerateInput) {
    // Check if enrollment is completed
    const enrollment = await this.db.enrollment.findUnique({
      where: { id: input.enrollmentId },
    });
    if (!enrollment || enrollment.status !== 'COMPLETED') {
      throw new Error('Course must be completed before generating a certificate');
    }

    // Check if certificate already exists
    const existing = await this.db.certificate.findFirst({
      where: { enrollmentId: input.enrollmentId },
    });
    if (existing) {
      return existing;
    }

    // Generate unique verification code
    const verificationCode = this.generateVerificationCode();

    // Create certificate record
    return this.db.certificate.create({
      data: {
        enrollmentId: input.enrollmentId,
        userId: input.userId,
        courseTitle: input.courseTitle,
        studentName: input.studentName,
        issuerName: this.issuerName,
        verificationCode,
      },
    });
  }

  /**
   * Get a certificate by ID
   */
  async getCertificate(id: string) {
    return this.db.certificate.findUnique({ where: { id } });
  }

  /**
   * Get all certificates for a user
   */
  async getUserCertificates(userId: string) {
    return this.db.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  /**
   * Verify a certificate by its verification code
   */
  async verifyCertificate(verificationCode: string) {
    const certificate = await this.db.certificate.findUnique({
      where: { verificationCode },
    });
    if (!certificate) {
      return { valid: false, certificate: null };
    }
    return { valid: true, certificate };
  }

  /**
   * Generate a PDF for a certificate
   * Uses pdfkit for generation - install: npm install pdfkit @types/pdfkit
   */
  async generatePdf(certificateId: string): Promise<Buffer> {
    const certificate = await this.db.certificate.findUnique({
      where: { id: certificateId },
    });
    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Dynamic import so the module works even without pdfkit installed
    const PDFDocument = (await import('pdfkit')).default;
    const QRCode = (await import('qrcode')).default;

    // Generate QR code as data URL
    const verifyUrl = `${this.verifyBaseUrl}/${certificate.verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Certificate border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#4F46E5');
      doc.rect(35, 35, doc.page.width - 70, doc.page.height - 70).stroke('#4F46E5');

      // Title
      doc.fontSize(14).fillColor('#666666').text('CERTIFICATE OF COMPLETION', { align: 'center' });
      doc.moveDown(2);

      // Main heading
      doc.fontSize(36).fillColor('#1F2937').text('Certificate', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#666666').text('This is to certify that', { align: 'center' });
      doc.moveDown(1);

      // Student name
      doc.fontSize(28).fillColor('#4F46E5').text(certificate.studentName, { align: 'center' });
      doc.moveDown(1);

      // Course description
      doc.fontSize(14).fillColor('#666666').text('has successfully completed the course', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(22).fillColor('#1F2937').text(certificate.courseTitle, { align: 'center' });
      doc.moveDown(2);

      // Issuer and date
      doc.fontSize(12).fillColor('#666666');
      doc.text(`Issued by: ${certificate.issuerName}`, { align: 'center' });
      doc.text(`Date: ${certificate.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
      doc.text(`Verification: ${certificate.verificationCode}`, { align: 'center' });

      // QR Code
      doc.image(qrBuffer, doc.page.width - 170, doc.page.height - 170, { width: 100 });

      doc.end();
    });
  }

  /**
   * Generate QR code data URL for verification
   */
  async generateQrCode(verificationCode: string): Promise<string> {
    const QRCode = (await import('qrcode')).default;
    const verifyUrl = `${this.verifyBaseUrl}/${verificationCode}`;
    return QRCode.toDataURL(verifyUrl, { width: 200, margin: 2 });
  }

  /**
   * Generate a unique verification code
   */
  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segments: string[] = [];

    for (let s = 0; s < 3; s++) {
      let segment = '';
      for (let i = 0; i < 4; i++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }

    return `CERT-${segments.join('-')}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createCertificateService(db: PrismaClient, config?: { issuerName?: string; verifyBaseUrl?: string }): CertificateService {
  return new CertificateService(db, config);
}

let instance: CertificateService | null = null;

export function getCertificateService(db?: PrismaClient): CertificateService {
  if (db) return createCertificateService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new CertificateService(globalDb);
  }
  return instance;
}

export default CertificateService;
