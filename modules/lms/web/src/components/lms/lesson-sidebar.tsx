'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Section, Lesson } from '../../lib/lms/types';
import { formatDuration } from '../../lib/lms/formatters';

interface LessonSidebarProps {
  sections: Section[];
  currentLessonId: string | null;
  progressMap: Record<string, boolean>;
  onSelectLesson: (lesson: Lesson) => void;
  defaultCollapsed?: boolean;
}

function LessonTypeIcon({ type }: { type: Lesson['type'] }) {
  switch (type) {
    case 'VIDEO':
      return (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'TEXT':
      return (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'PDF':
      return (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'QUIZ':
      return (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}

function CompletionCheck({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success" aria-label="Completed">
        <svg className="h-3 w-3 text-success-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border"
      aria-label="Not completed"
    />
  );
}

interface SectionItemProps {
  section: Section;
  index: number;
  currentLessonId: string | null;
  progressMap: Record<string, boolean>;
  onSelectLesson: (lesson: Lesson) => void;
  defaultExpanded: boolean;
}

function SectionItem({
  section,
  index,
  currentLessonId,
  progressMap,
  onSelectLesson,
  defaultExpanded,
}: SectionItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const completedCount = section.lessons.filter(
    (l) => progressMap[l.id] === true,
  ).length;
  const totalCount = section.lessons.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const totalDuration = section.lessons.reduce((sum, l) => sum + l.duration, 0);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Section header */}
      <Button
        variant="ghost"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left h-auto rounded-none hover:bg-muted/50 transition-colors"
        aria-expanded={expanded}
        aria-controls={`section-${section.id}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <span className="block text-sm font-medium text-foreground truncate">
              {index + 1}. {section.title}
            </span>
            <span className="block text-xs text-muted-foreground">
              {completedCount}/{totalCount} lessons
              {totalDuration > 0 && <> &middot; {formatDuration(totalDuration)}</>}
            </span>
          </div>
        </div>
        {allCompleted && (
          <Badge variant="success" size="sm">Done</Badge>
        )}
      </Button>

      {/* Lessons list */}
      {expanded && (
        <ul id={`section-${section.id}`} className="pb-1" role="list">
          {section.lessons
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const isCompleted = progressMap[lesson.id] === true;

              return (
                <li key={lesson.id}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => onSelectLesson(lesson)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 pl-8 text-left h-auto rounded-none transition-colors ${
                      isCurrent
                        ? 'bg-primary/10 border-l-2 border-primary'
                        : 'hover:bg-muted/50 border-l-2 border-transparent'
                    }`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <CompletionCheck completed={isCompleted} />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-sm truncate ${
                          isCurrent
                            ? 'font-medium text-primary'
                            : isCompleted
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                        }`}
                      >
                        {lesson.title}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LessonTypeIcon type={lesson.type} />
                        {lesson.duration > 0 && <span>{lesson.duration} min</span>}
                        {lesson.isFree && (
                          <span className="text-success font-medium">Free</span>
                        )}
                      </span>
                    </div>
                  </Button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export default function LessonSidebar({
  sections,
  currentLessonId,
  progressMap,
  onSelectLesson,
  defaultCollapsed = false,
}: LessonSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(!defaultCollapsed);

  const sortedSections = sections.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  const totalLessons = sortedSections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedLessons = sortedSections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => progressMap[l.id] === true).length,
    0,
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Determine which section contains the current lesson so it can be expanded by default
  const currentSectionId = currentLessonId
    ? sortedSections.find((s) => s.lessons.some((l) => l.id === currentLessonId))?.id ?? null
    : null;

  return (
    <div className="flex flex-col border border-border rounded-lg bg-card shadow-sm overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Course Content</h3>
          <p className="text-xs text-muted-foreground">
            {completedLessons}/{totalLessons} lessons completed ({progressPercent}%)
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-2 pb-1">
        <Progress value={progressPercent} size="sm" />
      </div>

      {/* Sections list */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto">
          {sortedSections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index}
              currentLessonId={currentLessonId}
              progressMap={progressMap}
              onSelectLesson={onSelectLesson}
              defaultExpanded={section.id === currentSectionId || sortedSections.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
