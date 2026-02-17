import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { getQuizService } from '../services/quiz.service.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

// =============================================================================
// Routes
// =============================================================================

const quizService = getQuizService();

// =============================================================================
// Quiz CRUD
// =============================================================================

const routes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /quizzes/lesson/:lessonId
   * Get all quizzes for a lesson
   */
  fastify.get('/lesson/:lessonId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { lessonId } = req.params as { lessonId: string };
    const quizzes = await quizService.getQuizzesByLesson(lessonId);
    return reply.send({ success: true, data: quizzes });
  });

  /**
   * GET /quizzes/:id
   * Get a quiz with its questions
   */
  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const quiz = await quizService.getQuiz(id);
    if (!quiz) {
      return reply.code(404).send({ error: 'Quiz not found' });
    }
    return reply.send({ success: true, data: quiz });
  });

  /**
   * POST /quizzes
   * Create a new quiz (instructor)
   */
  fastify.post('/', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { lessonId, title, description, passingScore, maxAttempts, timeLimitMins, shuffleQuestions } = req.body as Record<string, unknown>;

    if (!lessonId || !title) {
      return reply.code(400).send({ error: 'lessonId and title are required' });
    }

    const quiz = await quizService.createQuiz({
      lessonId,
      title,
      description,
      passingScore,
      maxAttempts,
      timeLimitMins,
      shuffleQuestions,
    });

    return reply.code(201).send({ success: true, data: quiz });
  });

  /**
   * PATCH /quizzes/:id
   * Update a quiz (instructor)
   */
  fastify.patch('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { title, description, passingScore, maxAttempts, timeLimitMins, shuffleQuestions } = req.body as Record<string, unknown>;

    const quiz = await quizService.updateQuiz(id, {
      title,
      description,
      passingScore,
      maxAttempts,
      timeLimitMins,
      shuffleQuestions,
    });

    if (!quiz) {
      return reply.code(404).send({ error: 'Quiz not found' });
    }

    return reply.send({ success: true, data: quiz });
  });

  /**
   * DELETE /quizzes/:id
   * Delete a quiz (instructor)
   */
  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await quizService.deleteQuiz(id);
    return reply.send({ success: true, message: 'Quiz deleted' });
  });

  // =============================================================================
  // Question Management
  // =============================================================================

  /**
   * GET /quizzes/:quizId/questions
   * Get all questions for a quiz
   */
  fastify.get('/:quizId/questions', async (req: FastifyRequest, reply: FastifyReply) => {
    const { quizId } = req.params as { quizId: string };
    const questions = await quizService.getQuestions(quizId);
    return reply.send({ success: true, data: questions });
  });

  /**
   * POST /quizzes/:quizId/questions
   * Add a question to a quiz (instructor)
   */
  fastify.post('/:quizId/questions', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { quizId } = req.params as { quizId: string };
    const { type, text, options, correctAnswer, explanation, points } = req.body as Record<string, unknown>;

    if (!text) {
      return reply.code(400).send({ error: 'Question text is required' });
    }

    const question = await quizService.createQuestion({
      quizId,
      type,
      text,
      options,
      correctAnswer,
      explanation,
      points,
    });

    return reply.code(201).send({ success: true, data: question });
  });

  /**
   * PATCH /quizzes/questions/:id
   * Update a question (instructor)
   */
  fastify.patch('/questions/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { type, text, options, correctAnswer, explanation, points } = req.body as Record<string, unknown>;

    const question = await quizService.updateQuestion(id, {
      type,
      text,
      options,
      correctAnswer,
      explanation,
      points,
    });

    if (!question) {
      return reply.code(404).send({ error: 'Question not found' });
    }

    return reply.send({ success: true, data: question });
  });

  /**
   * DELETE /quizzes/questions/:id
   * Delete a question (instructor)
   */
  fastify.delete('/questions/:id', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    await quizService.deleteQuestion(id);
    return reply.send({ success: true, message: 'Question deleted' });
  });

  // =============================================================================
  // Quiz Attempts
  // =============================================================================

  /**
   * POST /quizzes/:quizId/submit
   * Submit a quiz attempt
   */
  fastify.post('/:quizId/submit', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { quizId } = req.params as { quizId: string };
    const { answers } = req.body as { answers: unknown[] };

    if (!Array.isArray(answers)) {
      return reply.code(400).send({ error: 'answers array is required' });
    }

    const attempt = await quizService.submitAttempt({
      quizId,
      userId: authReq.user.userId,
      answers,
    });

    return reply.send({ success: true, data: attempt });
  });

  /**
   * GET /quizzes/:quizId/attempts
   * Get user's attempts for a quiz
   */
  fastify.get('/:quizId/attempts', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { quizId } = req.params as { quizId: string };
    const attempts = await quizService.getAttempts(quizId, authReq.user.userId);
    return reply.send({ success: true, data: attempts });
  });

  /**
   * GET /quizzes/:quizId/best
   * Get user's best attempt for a quiz
   */
  fastify.get('/:quizId/best', { preHandler: [authMiddleware] }, async (req: FastifyRequest, reply: FastifyReply) => {
    const authReq = req as AuthenticatedRequest;
    const { quizId } = req.params as { quizId: string };
    const attempt = await quizService.getBestAttempt(quizId, authReq.user.userId);
    return reply.send({ success: true, data: attempt });
  });
};

export default routes;
