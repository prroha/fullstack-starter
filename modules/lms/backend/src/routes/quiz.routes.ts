import { Router, Request, Response } from 'express';
import { getQuizService } from '../services/quiz.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

// =============================================================================
// Router
// =============================================================================

const router = Router();
const quizService = getQuizService();

// =============================================================================
// Quiz CRUD
// =============================================================================

/**
 * GET /quizzes/lesson/:lessonId
 * Get all quizzes for a lesson
 */
router.get('/lesson/:lessonId', async (req: Request, res: Response): Promise<void> => {
  try {
    const quizzes = await quizService.getQuizzesByLesson(req.params.lessonId);
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('[QuizRoutes] List quizzes error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list quizzes' });
  }
});

/**
 * GET /quizzes/:id
 * Get a quiz with its questions
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const quiz = await quizService.getQuiz(req.params.id);
    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('[QuizRoutes] Get quiz error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get quiz' });
  }
});

/**
 * POST /quizzes
 * Create a new quiz (instructor)
 */
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lessonId, title, description, passingScore, maxAttempts, timeLimitMins, shuffleQuestions } = req.body;

    if (!lessonId || !title) {
      res.status(400).json({ error: 'lessonId and title are required' });
      return;
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

    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error('[QuizRoutes] Create quiz error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

/**
 * PATCH /quizzes/:id
 * Update a quiz (instructor)
 */
router.patch('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, passingScore, maxAttempts, timeLimitMins, shuffleQuestions } = req.body;

    const quiz = await quizService.updateQuiz(req.params.id, {
      title,
      description,
      passingScore,
      maxAttempts,
      timeLimitMins,
      shuffleQuestions,
    });

    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found' });
      return;
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('[QuizRoutes] Update quiz error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

/**
 * DELETE /quizzes/:id
 * Delete a quiz (instructor)
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await quizService.deleteQuiz(req.params.id);
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    console.error('[QuizRoutes] Delete quiz error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// =============================================================================
// Question Management
// =============================================================================

/**
 * GET /quizzes/:quizId/questions
 * Get all questions for a quiz
 */
router.get('/:quizId/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await quizService.getQuestions(req.params.quizId);
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('[QuizRoutes] List questions error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to list questions' });
  }
});

/**
 * POST /quizzes/:quizId/questions
 * Add a question to a quiz (instructor)
 */
router.post('/:quizId/questions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, text, options, correctAnswer, explanation, points } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Question text is required' });
      return;
    }

    const question = await quizService.createQuestion({
      quizId: req.params.quizId,
      type,
      text,
      options,
      correctAnswer,
      explanation,
      points,
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error('[QuizRoutes] Create question error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

/**
 * PATCH /quizzes/questions/:id
 * Update a question (instructor)
 */
router.patch('/questions/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, text, options, correctAnswer, explanation, points } = req.body;

    const question = await quizService.updateQuestion(req.params.id, {
      type,
      text,
      options,
      correctAnswer,
      explanation,
      points,
    });

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({ success: true, data: question });
  } catch (error) {
    console.error('[QuizRoutes] Update question error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

/**
 * DELETE /quizzes/questions/:id
 * Delete a question (instructor)
 */
router.delete('/questions/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    await quizService.deleteQuestion(req.params.id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    console.error('[QuizRoutes] Delete question error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// =============================================================================
// Quiz Attempts
// =============================================================================

/**
 * POST /quizzes/:quizId/submit
 * Submit a quiz attempt
 */
router.post('/:quizId/submit', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      res.status(400).json({ error: 'answers array is required' });
      return;
    }

    const attempt = await quizService.submitAttempt({
      quizId: req.params.quizId,
      userId: authReq.user.userId,
      answers,
    });

    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('[QuizRoutes] Submit attempt error:', error instanceof Error ? error.message : error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to submit quiz',
    });
  }
});

/**
 * GET /quizzes/:quizId/attempts
 * Get user's attempts for a quiz
 */
router.get('/:quizId/attempts', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const attempts = await quizService.getAttempts(req.params.quizId, authReq.user.userId);
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('[QuizRoutes] Get attempts error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get attempts' });
  }
});

/**
 * GET /quizzes/:quizId/best
 * Get user's best attempt for a quiz
 */
router.get('/:quizId/best', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const attempt = await quizService.getBestAttempt(req.params.quizId, authReq.user.userId);
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('[QuizRoutes] Get best attempt error:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'Failed to get best attempt' });
  }
});

export default router;
