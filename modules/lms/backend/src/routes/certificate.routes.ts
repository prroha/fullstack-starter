import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getCertificateService } from '../services/certificate.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const certificateService = getCertificateService();

// =============================================================================
// Certificate Endpoints
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /certificates
   * List current user's certificates
   */
  fastify.get('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const certificates = await certificateService.getUserCertificates(authReq.user.userId);
    return reply.send({ success: true, data: certificates });
  });

  /**
   * GET /certificates/:id
   * Get a specific certificate
   */
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const certificate = await certificateService.getCertificate(id);
    if (!certificate) {
      return reply.code(404).send({ error: 'Certificate not found' });
    }
    return reply.send({ success: true, data: certificate });
  });

  /**
   * POST /certificates/generate
   * Generate a certificate for a completed enrollment
   */
  fastify.post('/generate', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { enrollmentId, courseTitle, studentName } = req.body as { enrollmentId: string; courseTitle: string; studentName?: string };

    if (!enrollmentId || !courseTitle) {
      return reply.code(400).send({ error: 'enrollmentId and courseTitle are required' });
    }

    const certificate = await certificateService.generateCertificate({
      enrollmentId,
      userId: authReq.user.userId,
      courseTitle,
      studentName: studentName || authReq.user.name || 'Student',
    });

    return reply.code(201).send({ success: true, data: certificate });
  });

  /**
   * GET /certificates/:id/download
   * Download certificate as PDF
   */
  fastify.get('/:id/download', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const pdfBuffer = await certificateService.generatePdf(id);

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename=certificate-${id}.pdf`)
      .send(pdfBuffer);
  });

  /**
   * GET /certificates/:id/qr
   * Get QR code image for certificate verification
   */
  fastify.get('/:id/qr', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const certificate = await certificateService.getCertificate(id);
    if (!certificate) {
      return reply.code(404).send({ error: 'Certificate not found' });
    }

    const qrDataUrl = await certificateService.generateQrCode(certificate.verificationCode);
    return reply.send({ success: true, data: { qrCode: qrDataUrl } });
  });

  /**
   * GET /certificates/verify/:code
   * Verify a certificate by its verification code (public)
   */
  fastify.get('/verify/:code', async (req: FastifyRequest, reply: FastifyReply) => {
    const { code } = req.params as { code: string };
    const result = await certificateService.verifyCertificate(code);
    return reply.send({ success: true, data: result });
  });
};

export default routes;
