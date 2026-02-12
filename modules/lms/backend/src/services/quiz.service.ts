// =============================================================================
// LMS Quiz Service
// =============================================================================
// Business logic for quiz management, scoring, attempt tracking, and retakes.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface QuizCreateInput {
  lessonId: string;
  title: string;
  description?: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimitMins?: number;
  shuffleQuestions?: boolean;
}

export interface QuizUpdateInput {
  title?: string;
  description?: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimitMins?: number;
  shuffleQuestions?: boolean;
}

export interface QuestionCreateInput {
  quizId: string;
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text: string;
  options?: Array<{ label: string; value: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

export interface QuestionUpdateInput {
  type?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  text?: string;
  options?: Array<{ label: string; value: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

export interface QuizSubmission {
  quizId: string;
  userId: string;
  answers: Array<{ questionId: string; answer: string }>;
}

interface QuizRecord {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  passingScore: number;
  maxAttempts: number;
  timeLimitMins: number | null;
  shuffleQuestions: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionRecord {
  id: string;
  quizId: string;
  type: string;
  text: string;
  options: unknown;
  correctAnswer: string | null;
  explanation: string | null;
  points: number;
  sortOrder: number;
  createdAt: Date;
}

interface QuizAttemptRecord {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  answers: unknown;
  startedAt: Date;
  completedAt: Date | null;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================

const dbOperations = {
  async findQuizById(id: string): Promise<QuizRecord | null> {
    // Replace with: return db.quiz.findUnique({ where: { id }, include: { questions: { orderBy: { sortOrder: 'asc' } } } });
    console.log('[DB] Finding quiz:', id);
    return null;
  },

  async findQuizzesByLesson(lessonId: string): Promise<QuizRecord[]> {
    // Replace with: return db.quiz.findMany({ where: { lessonId }, include: { questions: true } });
    console.log('[DB] Finding quizzes for lesson:', lessonId);
    return [];
  },

  async createQuiz(data: QuizCreateInput): Promise<QuizRecord> {
    // Replace with: return db.quiz.create({ data });
    console.log('[DB] Creating quiz:', data.title);
    return {
      id: 'quiz_' + Date.now(),
      lessonId: data.lessonId,
      title: data.title,
      description: data.description || null,
      passingScore: data.passingScore || 70,
      maxAttempts: data.maxAttempts || 3,
      timeLimitMins: data.timeLimitMins || null,
      shuffleQuestions: data.shuffleQuestions || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateQuiz(id: string, data: QuizUpdateInput): Promise<QuizRecord | null> {
    // Replace with: return db.quiz.update({ where: { id }, data });
    console.log('[DB] Updating quiz:', id);
    return null;
  },

  async deleteQuiz(id: string): Promise<void> {
    // Replace with: await db.quiz.delete({ where: { id } });
    console.log('[DB] Deleting quiz:', id);
  },

  async findQuestionById(id: string): Promise<QuestionRecord | null> {
    // Replace with: return db.question.findUnique({ where: { id } });
    console.log('[DB] Finding question:', id);
    return null;
  },

  async findQuestionsByQuiz(quizId: string): Promise<QuestionRecord[]> {
    // Replace with: return db.question.findMany({ where: { quizId }, orderBy: { sortOrder: 'asc' } });
    console.log('[DB] Finding questions for quiz:', quizId);
    return [];
  },

  async createQuestion(data: QuestionCreateInput & { sortOrder: number }): Promise<QuestionRecord> {
    // Replace with: return db.question.create({ data });
    console.log('[DB] Creating question for quiz:', data.quizId);
    return {
      id: 'question_' + Date.now(),
      quizId: data.quizId,
      type: data.type || 'MULTIPLE_CHOICE',
      text: data.text,
      options: data.options || null,
      correctAnswer: data.correctAnswer || null,
      explanation: data.explanation || null,
      points: data.points || 1,
      sortOrder: data.sortOrder,
      createdAt: new Date(),
    };
  },

  async updateQuestion(id: string, data: QuestionUpdateInput): Promise<QuestionRecord | null> {
    // Replace with: return db.question.update({ where: { id }, data });
    console.log('[DB] Updating question:', id);
    return null;
  },

  async deleteQuestion(id: string): Promise<void> {
    // Replace with: await db.question.delete({ where: { id } });
    console.log('[DB] Deleting question:', id);
  },

  async getMaxQuestionOrder(quizId: string): Promise<number> {
    // Replace with aggregate
    console.log('[DB] Getting max question order:', quizId);
    return 0;
  },

  async createAttempt(data: {
    quizId: string;
    userId: string;
    score: number;
    passed: boolean;
    answers: unknown;
    completedAt: Date;
  }): Promise<QuizAttemptRecord> {
    // Replace with: return db.quizAttempt.create({ data });
    console.log('[DB] Creating quiz attempt:', data.quizId, data.userId);
    return {
      id: 'attempt_' + Date.now(),
      ...data,
      startedAt: new Date(),
    };
  },

  async getAttemptCount(quizId: string, userId: string): Promise<number> {
    // Replace with: return db.quizAttempt.count({ where: { quizId, userId } });
    console.log('[DB] Getting attempt count:', quizId, userId);
    return 0;
  },

  async getAttempts(quizId: string, userId: string): Promise<QuizAttemptRecord[]> {
    // Replace with: return db.quizAttempt.findMany({ where: { quizId, userId }, orderBy: { startedAt: 'desc' } });
    console.log('[DB] Getting attempts:', quizId, userId);
    return [];
  },

  async getBestAttempt(quizId: string, userId: string): Promise<QuizAttemptRecord | null> {
    // Replace with: return db.quizAttempt.findFirst({ where: { quizId, userId }, orderBy: { score: 'desc' } });
    console.log('[DB] Getting best attempt:', quizId, userId);
    return null;
  },
};

// =============================================================================
// Quiz Service
// =============================================================================

export class QuizService {
  // --- Quiz CRUD ---

  async getQuiz(id: string) {
    return dbOperations.findQuizById(id);
  }

  async getQuizzesByLesson(lessonId: string) {
    return dbOperations.findQuizzesByLesson(lessonId);
  }

  async createQuiz(input: QuizCreateInput) {
    return dbOperations.createQuiz(input);
  }

  async updateQuiz(id: string, input: QuizUpdateInput) {
    return dbOperations.updateQuiz(id, input);
  }

  async deleteQuiz(id: string) {
    return dbOperations.deleteQuiz(id);
  }

  // --- Question CRUD ---

  async getQuestions(quizId: string) {
    return dbOperations.findQuestionsByQuiz(quizId);
  }

  async createQuestion(input: QuestionCreateInput) {
    const maxOrder = await dbOperations.getMaxQuestionOrder(input.quizId);
    return dbOperations.createQuestion({ ...input, sortOrder: maxOrder + 1 });
  }

  async updateQuestion(id: string, input: QuestionUpdateInput) {
    return dbOperations.updateQuestion(id, input);
  }

  async deleteQuestion(id: string) {
    return dbOperations.deleteQuestion(id);
  }

  // --- Quiz Attempts ---

  /**
   * Submit a quiz attempt, score it, and return results
   */
  async submitAttempt(submission: QuizSubmission): Promise<QuizAttemptRecord> {
    const quiz = await dbOperations.findQuizById(submission.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Check max attempts
    if (quiz.maxAttempts > 0) {
      const attemptCount = await dbOperations.getAttemptCount(submission.quizId, submission.userId);
      if (attemptCount >= quiz.maxAttempts) {
        throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached`);
      }
    }

    // Get questions and score
    const questions = await dbOperations.findQuestionsByQuiz(submission.quizId);
    const { score, gradedAnswers, totalPoints, earnedPoints } = this.gradeSubmission(
      questions,
      submission.answers,
    );

    const passed = score >= quiz.passingScore;

    return dbOperations.createAttempt({
      quizId: submission.quizId,
      userId: submission.userId,
      score,
      passed,
      answers: gradedAnswers,
      completedAt: new Date(),
    });
  }

  /**
   * Get all attempts for a user on a quiz
   */
  async getAttempts(quizId: string, userId: string) {
    return dbOperations.getAttempts(quizId, userId);
  }

  /**
   * Get the best attempt for a user on a quiz
   */
  async getBestAttempt(quizId: string, userId: string) {
    return dbOperations.getBestAttempt(quizId, userId);
  }

  /**
   * Grade a submission against questions
   */
  private gradeSubmission(
    questions: QuestionRecord[],
    answers: Array<{ questionId: string; answer: string }>,
  ): { score: number; gradedAnswers: unknown[]; totalPoints: number; earnedPoints: number } {
    let totalPoints = 0;
    let earnedPoints = 0;

    const gradedAnswers = questions.map((question) => {
      totalPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const isCorrect = this.checkAnswer(question, userAnswer?.answer || '');

      if (isCorrect) {
        earnedPoints += question.points;
      }

      return {
        questionId: question.id,
        answer: userAnswer?.answer || '',
        isCorrect,
        points: isCorrect ? question.points : 0,
        correctAnswer: question.type === 'SHORT_ANSWER' ? question.correctAnswer : undefined,
      };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return { score, gradedAnswers, totalPoints, earnedPoints };
  }

  /**
   * Check if an answer is correct for a given question
   */
  private checkAnswer(question: QuestionRecord, answer: string): boolean {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE': {
        const options = question.options as Array<{ label: string; value: string; isCorrect: boolean }> | null;
        if (!options) return false;
        const correctOption = options.find((o) => o.isCorrect);
        return correctOption?.value === answer;
      }
      case 'SHORT_ANSWER': {
        if (!question.correctAnswer) return false;
        return question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
      }
      default:
        return false;
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

let quizServiceInstance: QuizService | null = null;

export function getQuizService(): QuizService {
  if (!quizServiceInstance) {
    quizServiceInstance = new QuizService();
  }
  return quizServiceInstance;
}

export default QuizService;
