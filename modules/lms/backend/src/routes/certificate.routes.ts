import { Router, Request, Response } from 'express';
import { getCertificateService } from '../services/certificate.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const certificateService = getCertificateService();

// =============================================================================
// Certificate Endpoints
// =============================================================================

/**
 * GET /certificates
 * List current user's certificates
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const certificates = await certificateService.getUserCertificates(authReq.user.userId);
    res.json({ success: true, data: certificates });
  } catch (error) {
    console.error('[CertificateRoutes] List error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list certificates' });
  }
});

/**
 * GET /certificates/:id
 * Get a specific certificate
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const certificate = await certificateService.getCertificate(req.params.id);
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }
    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('[CertificateRoutes] Get error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get certificate' });
  }
});

/**
 * POST /certificates/generate
 * Generate a certificate for a completed enrollment
 */
router.post('/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { enrollmentId, courseTitle, studentName } = req.body;

    if (!enrollmentId || !courseTitle) {
      res.status(400).json({ error: 'enrollmentId and courseTitle are required' });
      return;
    }

    const certificate = await certificateService.generateCertificate({
      enrollmentId,
      userId: authReq.user.userId,
      courseTitle,
      studentName: studentName || authReq.user.name || 'Student',
    });

    res.status(201).json({ success: true, data: certificate });
  } catch (error) {
    console.error('[CertificateRoutes] Generate error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to generate certificate',
    });
  }
});

/**
 * GET /certificates/:id/download
 * Download certificate as PDF
 */
router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const pdfBuffer = await certificateService.generatePdf(req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${req.params.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[CertificateRoutes] Download error:', error instanceof Error ? error.message : error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    });
  }
});

/**
 * GET /certificates/:id/qr
 * Get QR code image for certificate verification
 */
router.get('/:id/qr', async (req: Request, res: Response): Promise<void> => {
  try {
    const certificate = await certificateService.getCertificate(req.params.id);
    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const qrDataUrl = await certificateService.generateQrCode(certificate.verificationCode);
    res.json({ success: true, data: { qrCode: qrDataUrl } });
  } catch (error) {
    console.error('[CertificateRoutes] QR error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * GET /certificates/verify/:code
 * Verify a certificate by its verification code (public)
 */
router.get('/verify/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await certificateService.verifyCertificate(req.params.code);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[CertificateRoutes] Verify error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

export default router;
