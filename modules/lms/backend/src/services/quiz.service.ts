// =============================================================================
// LMS Quiz Service
// =============================================================================
// Business logic for quiz management, scoring, attempt tracking, and retakes.
// Uses dependency injection for PrismaClient.

import type { PrismaClient } from '@prisma/client';

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

// =============================================================================
// Quiz Service
// =============================================================================

export class QuizService {
  constructor(private db: PrismaClient) {}

  // --- Quiz CRUD ---

  async getQuiz(id: string) {
    return this.db.quiz.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getQuizzesByLesson(lessonId: string) {
    return this.db.quiz.findMany({
      where: { lessonId },
      include: { questions: true },
    });
  }

  async createQuiz(input: QuizCreateInput) {
    return this.db.quiz.create({
      data: {
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        passingScore: input.passingScore ?? 70,
        maxAttempts: input.maxAttempts ?? 3,
        timeLimitMins: input.timeLimitMins,
        shuffleQuestions: input.shuffleQuestions ?? false,
      },
    });
  }

  async updateQuiz(id: string, input: QuizUpdateInput) {
    return this.db.quiz.update({
      where: { id },
      data: input,
    });
  }

  async deleteQuiz(id: string) {
    await this.db.quiz.delete({ where: { id } });
  }

  // --- Question CRUD ---

  async getQuestions(quizId: string) {
    return this.db.question.findMany({
      where: { quizId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createQuestion(input: QuestionCreateInput) {
    const maxResult = await this.db.question.aggregate({
      where: { quizId: input.quizId },
      _max: { sortOrder: true },
    });
    const maxOrder = maxResult._max.sortOrder || 0;

    return this.db.question.create({
      data: {
        quizId: input.quizId,
        type: input.type || 'MULTIPLE_CHOICE',
        text: input.text,
        options: input.options as unknown as undefined,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        points: input.points ?? 1,
        sortOrder: maxOrder + 1,
      },
    });
  }

  async updateQuestion(id: string, input: QuestionUpdateInput) {
    return this.db.question.update({
      where: { id },
      data: {
        type: input.type,
        text: input.text,
        options: input.options as unknown as undefined,
        correctAnswer: input.correctAnswer,
        explanation: input.explanation,
        points: input.points,
      },
    });
  }

  async deleteQuestion(id: string) {
    await this.db.question.delete({ where: { id } });
  }

  // --- Quiz Attempts ---

  /**
   * Submit a quiz attempt, score it, and return results
   */
  async submitAttempt(submission: QuizSubmission) {
    const quiz = await this.db.quiz.findUnique({
      where: { id: submission.quizId },
    });
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Check max attempts
    if (quiz.maxAttempts > 0) {
      const attemptCount = await this.db.quizAttempt.count({
        where: { quizId: submission.quizId, userId: submission.userId },
      });
      if (attemptCount >= quiz.maxAttempts) {
        throw new Error(`Maximum attempts (${quiz.maxAttempts}) reached`);
      }
    }

    // Get questions and score
    const questions = await this.db.question.findMany({
      where: { quizId: submission.quizId },
      orderBy: { sortOrder: 'asc' },
    });

    const { score, gradedAnswers } = this.gradeSubmission(
      questions as QuestionRecord[],
      submission.answers,
    );

    const passed = score >= quiz.passingScore;

    return this.db.quizAttempt.create({
      data: {
        quizId: submission.quizId,
        userId: submission.userId,
        score,
        passed,
        answers: gradedAnswers as unknown as undefined,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Get all attempts for a user on a quiz
   */
  async getAttempts(quizId: string, userId: string) {
    return this.db.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get the best attempt for a user on a quiz
   */
  async getBestAttempt(quizId: string, userId: string) {
    return this.db.quizAttempt.findFirst({
      where: { quizId, userId },
      orderBy: { score: 'desc' },
    });
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

export function createQuizService(db: PrismaClient): QuizService {
  return new QuizService(db);
}

let instance: QuizService | null = null;

export function getQuizService(db?: PrismaClient): QuizService {
  if (db) return createQuizService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new QuizService(globalDb);
  }
  return instance;
}

export default QuizService;
