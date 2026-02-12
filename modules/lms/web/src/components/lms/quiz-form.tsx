'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Quiz, Question, QuizAnswer } from '../../lib/lms/types';

interface QuizFormProps {
  quiz: Quiz;
  onSubmit: (answers: QuizAnswer[]) => void;
  mode?: 'one-at-a-time' | 'all-at-once';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface MultipleChoiceFieldProps {
  question: Question;
  selectedValue: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function MultipleChoiceField({ question, selectedValue, onChange, disabled }: MultipleChoiceFieldProps) {
  const options = question.options ?? [];

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Options for: {question.text}</legend>
      {options.map((option, idx) => {
        const inputId = `q-${question.id}-opt-${idx}`;
        const isSelected = selectedValue === option.value;

        return (
          <label
            key={idx}
            htmlFor={inputId}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              id={inputId}
              type="radio"
              name={`question-${question.id}`}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-800">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

interface TrueFalseFieldProps {
  question: Question;
  selectedValue: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function TrueFalseField({ question, selectedValue, onChange, disabled }: TrueFalseFieldProps) {
  const options = [
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' },
  ];

  return (
    <fieldset className="flex gap-3">
      <legend className="sr-only">True or False: {question.text}</legend>
      {options.map((option) => {
        const inputId = `q-${question.id}-${option.value}`;
        const isSelected = selectedValue === option.value;

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              id={inputId}
              type="radio"
              name={`question-${question.id}`}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-800">{option.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

interface ShortAnswerFieldProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

function ShortAnswerField({ question, value, onChange, disabled }: ShortAnswerFieldProps) {
  return (
    <div>
      <label htmlFor={`q-${question.id}-input`} className="sr-only">
        Your answer for: {question.text}
      </label>
      <input
        id={`q-${question.id}-input`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-60"
      />
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  answer: string;
  onAnswerChange: (questionId: string, value: string) => void;
  disabled: boolean;
}

function QuestionCard({ question, index, total, answer, onAnswerChange, disabled }: QuestionCardProps) {
  const handleChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {/* Question header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
              {index + 1}
            </span>
            <span className="text-xs text-gray-500">
              of {total}
            </span>
            {question.points > 1 && (
              <span className="text-xs text-gray-400">
                ({question.points} pts)
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900">{question.text}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
          {question.type.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      {/* Answer input */}
      {question.type === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceField
          question={question}
          selectedValue={answer}
          onChange={handleChange}
          disabled={disabled}
        />
      )}
      {question.type === 'TRUE_FALSE' && (
        <TrueFalseField
          question={question}
          selectedValue={answer}
          onChange={handleChange}
          disabled={disabled}
        />
      )}
      {question.type === 'SHORT_ANSWER' && (
        <ShortAnswerField
          question={question}
          value={answer}
          onChange={handleChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export default function QuizForm({ quiz, onSubmit, mode = 'one-at-a-time' }: QuizFormProps) {
  const questions = quiz.questions ?? [];
  const orderedQuestions = useRef<Question[]>(
    quiz.shuffleQuestions ? shuffleArray(questions) : [...questions].sort((a, b) => a.sortOrder - b.sortOrder),
  ).current;

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    orderedQuestions.forEach((q) => {
      init[q.id] = '';
    });
    return init;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.timeLimitMins != null ? quiz.timeLimitMins * 60 : null,
  );

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submitted]);

  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);

    const quizAnswers: QuizAnswer[] = orderedQuestions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
    }));

    onSubmit(quizAnswers);
  }, [submitted, answers, orderedQuestions, onSubmit]);

  const handleNext = () => {
    if (currentIndex < orderedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a.trim() !== '').length;
  const totalQuestions = orderedQuestions.length;
  const allAnswered = answeredCount === totalQuestions;
  const isTimerCritical = timeLeft !== null && timeLeft <= 60;

  if (totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 px-4">
        <p className="text-sm text-gray-500">This quiz has no questions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quiz header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="mt-0.5 text-sm text-gray-600">{quiz.description}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</span>
              <span>Passing score: {quiz.passingScore}%</span>
              {quiz.maxAttempts > 0 && (
                <span>Max attempts: {quiz.maxAttempts}</span>
              )}
            </div>
          </div>

          {/* Timer */}
          {timeLeft !== null && !submitted && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono font-semibold ${
                isTimerCritical
                  ? 'bg-red-50 text-red-700 animate-pulse'
                  : 'bg-gray-100 text-gray-700'
              }`}
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(timeLeft)}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {!submitted && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>{answeredCount} of {totalQuestions} answered</span>
              <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      {mode === 'all-at-once' ? (
        <div className="space-y-4">
          {orderedQuestions.map((question, idx) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={idx}
              total={totalQuestions}
              answer={answers[question.id] ?? ''}
              onAnswerChange={handleAnswerChange}
              disabled={submitted}
            />
          ))}
        </div>
      ) : (
        <div>
          {/* Question navigation dots */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {orderedQuestions.map((q, idx) => {
              const isAnswered = (answers[q.id] ?? '').trim() !== '';
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  disabled={submitted}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${submitted ? 'pointer-events-none' : ''}`}
                  aria-label={`Go to question ${idx + 1}${isAnswered ? ' (answered)' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current question */}
          <QuestionCard
            question={orderedQuestions[currentIndex]}
            index={currentIndex}
            total={totalQuestions}
            answer={answers[orderedQuestions[currentIndex].id] ?? ''}
            onAnswerChange={handleAnswerChange}
            disabled={submitted}
          />

          {/* Navigation buttons */}
          {!submitted && (
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <span />
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit area */}
      {!submitted && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {!allAnswered && (
            <p className="text-sm text-amber-600">
              You have {totalQuestions - answeredCount} unanswered question{totalQuestions - answeredCount !== 1 ? 's' : ''}.
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Submit Quiz
          </button>
        </div>
      )}

      {/* Submitted state */}
      {submitted && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-6">
          <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-semibold text-green-800">Quiz Submitted</p>
          <p className="text-xs text-green-600">
            Your answers have been recorded. You answered {answeredCount} of {totalQuestions} questions.
          </p>
        </div>
      )}
    </div>
  );
}
