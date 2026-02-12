// =============================================================================
// LMS Certificate Service
// =============================================================================
// PDF generation (pdfkit), QR code creation (qrcode), and verification.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface CertificateGenerateInput {
  enrollmentId: string;
  userId: string;
  courseTitle: string;
  studentName: string;
}

interface CertificateRecord {
  id: string;
  enrollmentId: string;
  userId: string;
  courseTitle: string;
  studentName: string;
  issuerName: string;
  verificationCode: string;
  issuedAt: Date;
  pdfUrl: string | null;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async findCertificateById(id: string): Promise<CertificateRecord | null> {
    // Replace with: return db.certificate.findUnique({ where: { id } });
    console.log('[DB] Finding certificate:', id);
    return null;
  },

  async findCertificateByVerificationCode(code: string): Promise<CertificateRecord | null> {
    // Replace with: return db.certificate.findUnique({ where: { verificationCode: code } });
    console.log('[DB] Finding certificate by verification code:', code);
    return null;
  },

  async findCertificatesByUser(userId: string): Promise<CertificateRecord[]> {
    // Replace with: return db.certificate.findMany({ where: { userId }, orderBy: { issuedAt: 'desc' } });
    console.log('[DB] Finding certificates for user:', userId);
    return [];
  },

  async findCertificateByEnrollment(enrollmentId: string): Promise<CertificateRecord | null> {
    // Replace with: return db.certificate.findFirst({ where: { enrollmentId } });
    console.log('[DB] Finding certificate for enrollment:', enrollmentId);
    return null;
  },

  async createCertificate(data: {
    enrollmentId: string;
    userId: string;
    courseTitle: string;
    studentName: string;
    issuerName: string;
    verificationCode: string;
  }): Promise<CertificateRecord> {
    // Replace with: return db.certificate.create({ data });
    console.log('[DB] Creating certificate for:', data.studentName);
    return {
      id: 'cert_' + Date.now(),
      ...data,
      issuedAt: new Date(),
      pdfUrl: null,
    };
  },

  async updateCertificatePdfUrl(id: string, pdfUrl: string): Promise<void> {
    // Replace with: await db.certificate.update({ where: { id }, data: { pdfUrl } });
    console.log('[DB] Updating certificate PDF URL:', id);
  },

  async checkEnrollmentCompleted(enrollmentId: string): Promise<boolean> {
    // Replace with: const enrollment = await db.enrollment.findUnique({ where: { id: enrollmentId } }); return enrollment?.status === 'COMPLETED';
    console.log('[DB] Checking enrollment completion:', enrollmentId);
    return false;
  },
};

// =============================================================================
// Certificate Service
// =============================================================================

export class CertificateService {
  private issuerName: string;
  private verifyBaseUrl: string;

  constructor(config?: { issuerName?: string; verifyBaseUrl?: string }) {
    this.issuerName = config?.issuerName || process.env.LMS_CERTIFICATE_ISSUER || 'Learning Platform';
    this.verifyBaseUrl = config?.verifyBaseUrl || process.env.LMS_CERTIFICATE_VERIFY_URL || 'http://localhost:3000/certificates';
  }

  /**
   * Generate a certificate for a completed course
   */
  async generateCertificate(input: CertificateGenerateInput): Promise<CertificateRecord> {
    // Check if enrollment is completed
    const isCompleted = await dbOperations.checkEnrollmentCompleted(input.enrollmentId);
    if (!isCompleted) {
      throw new Error('Course must be completed before generating a certificate');
    }

    // Check if certificate already exists
    const existing = await dbOperations.findCertificateByEnrollment(input.enrollmentId);
    if (existing) {
      return existing;
    }

    // Generate unique verification code
    const verificationCode = this.generateVerificationCode();

    // Create certificate record
    const certificate = await dbOperations.createCertificate({
      enrollmentId: input.enrollmentId,
      userId: input.userId,
      courseTitle: input.courseTitle,
      studentName: input.studentName,
      issuerName: this.issuerName,
      verificationCode,
    });

    return certificate;
  }

  /**
   * Get a certificate by ID
   */
  async getCertificate(id: string) {
    return dbOperations.findCertificateById(id);
  }

  /**
   * Get all certificates for a user
   */
  async getUserCertificates(userId: string) {
    return dbOperations.findCertificatesByUser(userId);
  }

  /**
   * Verify a certificate by its verification code
   */
  async verifyCertificate(verificationCode: string) {
    const certificate = await dbOperations.findCertificateByVerificationCode(verificationCode);
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
    const certificate = await dbOperations.findCertificateById(certificateId);
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

let certificateServiceInstance: CertificateService | null = null;

export function getCertificateService(): CertificateService {
  if (!certificateServiceInstance) {
    certificateServiceInstance = new CertificateService();
  }
  return certificateServiceInstance;
}

export default CertificateService;
