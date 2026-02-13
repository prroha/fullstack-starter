'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { QuizAttempt, Question } from '../../lib/lms/types';

interface QuizResultsProps {
  attempt: QuizAttempt;
  questions: Question[];
}

export default function QuizResults({ attempt, questions }: QuizResultsProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const scorePercent = Math.round(attempt.score);
  const passed = attempt.passed;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const earnedPoints = attempt.answers
    ? attempt.answers.reduce((sum, a) => sum + (a.points ?? 0), 0)
    : 0;

  const answersMap = new Map(
    (attempt.answers ?? []).map((a) => [a.questionId, a])
  );

  function toggleQuestion(questionId: string) {
    setExpandedQuestion((prev) => (prev === questionId ? null : questionId));
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'In progress';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Score Summary */}
      <div
        className={`rounded-xl p-6 mb-6 text-center border-2 ${
          passed
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        {/* Circular score indicator */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={passed ? '#dcfce7' : '#fee2e2'}
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={passed ? '#22c55e' : '#ef4444'}
              strokeWidth="12"
              strokeDasharray={`${(scorePercent / 100) * 351.86} 351.86`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-3xl font-bold ${
                passed ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {scorePercent}%
            </span>
          </div>
        </div>

        {/* Pass / Fail badge */}
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
            passed
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {passed ? 'Passed' : 'Failed'}
        </span>

        {/* Points summary */}
        <p className="mt-3 text-sm text-muted-foreground">
          {earnedPoints} / {totalPoints} points earned
        </p>

        {/* Timing info */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Started: {formatDate(attempt.startedAt)}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Completed: {formatDate(attempt.completedAt)}</span>
        </div>
      </div>

      {/* Per-question breakdown */}
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Question Breakdown
      </h3>

      <div className="space-y-3">
        {questions.map((question, index) => {
          const answer = answersMap.get(question.id);
          const isCorrect = answer?.isCorrect ?? false;
          const isExpanded = expandedQuestion === question.id;

          return (
            <div
              key={question.id}
              className={`border rounded-lg overflow-hidden transition-colors ${
                isCorrect ? 'border-green-200' : 'border-red-200'
              }`}
            >
              {/* Question header */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleQuestion(question.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted transition-colors h-auto rounded-none justify-start"
              >
                {/* Question number & status icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isCorrect ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>

                {/* Question text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Q{index + 1}. {question.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {answer?.points ?? 0} / {question.points} pts
                    {question.type === 'MULTIPLE_CHOICE' && ' - Multiple Choice'}
                    {question.type === 'TRUE_FALSE' && ' - True/False'}
                    {question.type === 'SHORT_ANSWER' && ' - Short Answer'}
                  </p>
                </div>

                {/* Expand chevron */}
                <svg
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-muted space-y-3">
                  {/* Full question text */}
                  <p className="text-sm text-foreground font-medium">
                    {question.text}
                  </p>

                  {/* Options for multiple choice / true-false */}
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1.5">
                      {question.options.map((option) => {
                        const isUserAnswer = answer?.answer === option.value;
                        const isCorrectOption = option.isCorrect;

                        let optionClasses =
                          'flex items-center gap-2 px-3 py-2 rounded-md text-sm border';

                        if (isCorrectOption) {
                          optionClasses +=
                            ' bg-green-50 border-green-300 text-green-800';
                        } else if (isUserAnswer && !isCorrectOption) {
                          optionClasses +=
                            ' bg-red-50 border-red-300 text-red-800';
                        } else {
                          optionClasses +=
                            ' bg-card border-border text-muted-foreground';
                        }

                        return (
                          <div key={option.value} className={optionClasses}>
                            {isCorrectOption && (
                              <svg
                                className="w-4 h-4 text-green-600 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <svg
                                className="w-4 h-4 text-red-600 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            <span>{option.label}</span>
                            {isUserAnswer && (
                              <span className="ml-auto text-xs font-medium opacity-70">
                                Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short answer display */}
                  {question.type === 'SHORT_ANSWER' && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-muted-foreground mt-0.5 w-24 flex-shrink-0">
                          Your answer:
                        </span>
                        <span
                          className={`text-sm ${
                            isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {answer?.answer ?? 'No answer'}
                        </span>
                      </div>
                      {!isCorrect && question.correctAnswer && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground mt-0.5 w-24 flex-shrink-0">
                            Correct answer:
                          </span>
                          <span className="text-sm text-green-700">
                            {question.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Correct answer fallback if no options */}
                  {!isCorrect &&
                    !question.options &&
                    question.type !== 'SHORT_ANSWER' &&
                    question.correctAnswer && (
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Correct answer:</span>{' '}
                        {question.correctAnswer}
                      </p>
                    )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs font-semibold text-blue-700 mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Correct:{' '}
            <span className="font-semibold text-green-700">
              {attempt.answers?.filter((a) => a.isCorrect).length ?? 0}
            </span>{' '}
            / {questions.length}
          </span>
          <span className="text-muted-foreground">
            Score:{' '}
            <span className="font-semibold text-foreground">
              {scorePercent}%
            </span>
          </span>
          <span className="text-muted-foreground">
            Points:{' '}
            <span className="font-semibold text-foreground">
              {earnedPoints} / {totalPoints}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
