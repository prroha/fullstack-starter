'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Section, Lesson, LessonType } from '@/lib/lms/types';
import { lessonApi } from '@/lib/lms/api';
import { ProgressBar } from '@/components/lms/progress-bar';
import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/feedback/alert';
import { Spinner } from '@/components/ui/spinner';

const LESSON_TYPES: { value: string; label: string }[] = [
  { value: 'VIDEO', label: 'Video' },
  { value: 'TEXT', label: 'Text' },
  { value: 'PDF', label: 'PDF' },
  { value: 'QUIZ', label: 'Quiz' },
];

// ---------------------------------------------------------------------------
// Section Form
// ---------------------------------------------------------------------------

function SectionForm({
  courseId,
  initialTitle,
  initialDescription,
  onSubmit,
  onCancel,
}: {
  courseId: string;
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (title: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialTitle || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(title.trim(), description.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-muted rounded-lg border border-border">
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Section title"
        required
      />
      <Input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Section description (optional)"
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim()}
          isLoading={submitting}
        >
          {initialTitle ? 'Update Section' : 'Add Section'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Lesson Form
// ---------------------------------------------------------------------------

function LessonForm({
  sectionId,
  initial,
  onSubmit,
  onCancel,
}: {
  sectionId: string;
  initial?: Lesson;
  onSubmit: (data: {
    title: string;
    description: string;
    type: LessonType;
    contentUrl: string;
    contentText: string;
    duration: number;
    isFree: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [type, setType] = useState<LessonType>(initial?.type || 'VIDEO');
  const [contentUrl, setContentUrl] = useState(initial?.contentUrl || '');
  const [contentText, setContentText] = useState(initial?.contentText || '');
  const [duration, setDuration] = useState(initial?.duration ? String(initial.duration) : '');
  const [isFree, setIsFree] = useState(initial?.isFree || false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        contentUrl: contentUrl.trim(),
        contentText: contentText.trim(),
        duration: duration ? parseInt(duration, 10) : 0,
        isFree,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          required
        />
        <Select
          value={type}
          onChange={(value) => setType(value as LessonType)}
          options={LESSON_TYPES}
        />
      </div>

      <Input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Lesson description (optional)"
      />

      {(type === 'VIDEO' || type === 'PDF') && (
        <Input
          type="url"
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
          placeholder={type === 'VIDEO' ? 'Video URL' : 'PDF URL'}
        />
      )}

      {type === 'TEXT' && (
        <Textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder="Lesson text content..."
          rows={3}
          className="resize-y"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1">Duration (seconds)</Label>
          <Input
            type="number"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Free preview</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim()}
          isLoading={submitting}
        >
          {initial ? 'Update Lesson' : 'Add Lesson'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Section Card
// ---------------------------------------------------------------------------

function SectionCard({
  section,
  courseId,
  onSectionUpdated,
  onSectionDeleted,
  onLessonCreated,
  onLessonUpdated,
  onLessonDeleted,
}: {
  section: Section;
  courseId: string;
  onSectionUpdated: (updated: Section) => void;
  onSectionDeleted: (sectionId: string) => void;
  onLessonCreated: (lesson: Lesson, sectionId: string) => void;
  onLessonUpdated: (lesson: Lesson) => void;
  onLessonDeleted: (lessonId: string, sectionId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateSection(title: string, description: string) {
    try {
      setError(null);
      const updated = await lessonApi.updateSection(section.id, { title, description: description || undefined });
      onSectionUpdated({ ...section, ...updated });
      setEditingSection(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
    }
  }

  async function handleDeleteSection() {
    try {
      setError(null);
      setDeletingId(section.id);
      await lessonApi.deleteSection(section.id);
      onSectionDeleted(section.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete section');
      setDeletingId(null);
    }
  }

  async function handleAddLesson(data: {
    title: string;
    description: string;
    type: LessonType;
    contentUrl: string;
    contentText: string;
    duration: number;
    isFree: boolean;
  }) {
    try {
      setError(null);
      const lesson = await lessonApi.createLesson({
        sectionId: section.id,
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        contentUrl: data.contentUrl || undefined,
        contentText: data.contentText || undefined,
        duration: data.duration || undefined,
        isFree: data.isFree,
      });
      onLessonCreated(lesson, section.id);
      setShowAddLesson(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add lesson');
    }
  }

  async function handleUpdateLesson(
    lessonId: string,
    data: {
      title: string;
      description: string;
      type: LessonType;
      contentUrl: string;
      contentText: string;
      duration: number;
      isFree: boolean;
    }
  ) {
    try {
      setError(null);
      const updated = await lessonApi.updateLesson(lessonId, {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        contentUrl: data.contentUrl || undefined,
        contentText: data.contentText || undefined,
        duration: data.duration || undefined,
        isFree: data.isFree,
      });
      onLessonUpdated(updated);
      setEditingLessonId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson');
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    try {
      setError(null);
      setDeletingId(lessonId);
      await lessonApi.deleteLesson(lessonId);
      onLessonDeleted(lessonId, section.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lesson');
    } finally {
      setDeletingId(null);
    }
  }

  const lessonTypeIcons: Record<LessonType, string> = {
    VIDEO: '▶',
    TEXT: '¶',
    PDF: '◻',
    QUIZ: '?',
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-left flex-1 min-w-0 h-auto p-0 hover:bg-transparent"
        >
          <span className="text-muted-foreground text-sm flex-shrink-0">
            {collapsed ? '▸' : '▾'}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{section.title}</h3>
            {section.description && (
              <p className="text-xs text-muted-foreground truncate">{section.description}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
            {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}
          </span>
        </Button>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingSection(true)}
          >
            Edit
          </Button>
          <ConfirmButton
            confirmMode="dialog"
            confirmTitle="Delete Section"
            confirmMessage={`Delete section "${section.title}" and all its lessons?`}
            variant="ghost"
            size="sm"
            onConfirm={handleDeleteSection}
            disabled={deletingId === section.id}
            className="text-destructive hover:text-destructive"
          >
            Delete
          </ConfirmButton>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3">
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* Section Edit Form */}
      {editingSection && (
        <div className="p-4">
          <SectionForm
            courseId={courseId}
            initialTitle={section.title}
            initialDescription={section.description || ''}
            onSubmit={handleUpdateSection}
            onCancel={() => setEditingSection(false)}
          />
        </div>
      )}

      {/* Lessons */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          {section.lessons.length === 0 && !showAddLesson && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No lessons in this section yet.
            </p>
          )}

          {section.lessons
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((lesson) => (
              <div key={lesson.id}>
                {editingLessonId === lesson.id ? (
                  <LessonForm
                    sectionId={section.id}
                    initial={lesson}
                    onSubmit={(data) => handleUpdateLesson(lesson.id, data)}
                    onCancel={() => setEditingLessonId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-md group hover:bg-muted/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-muted-foreground text-xs flex-shrink-0 w-5 text-center" title={lesson.type}>
                        {lessonTypeIcons[lesson.type]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{lesson.type}</span>
                          {lesson.duration > 0 && (
                            <span>
                              {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                            </span>
                          )}
                          {lesson.isFree && (
                            <span className="text-green-600 font-medium">Free</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLessonId(lesson.id)}
                      >
                        Edit
                      </Button>
                      <ConfirmButton
                        confirmMode="dialog"
                        confirmTitle="Delete Lesson"
                        confirmMessage={`Delete lesson "${lesson.title}"?`}
                        variant="ghost"
                        size="sm"
                        onConfirm={() => handleDeleteLesson(lesson.id)}
                        disabled={deletingId === lesson.id}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </ConfirmButton>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Add Lesson Form */}
          {showAddLesson && (
            <LessonForm
              sectionId={section.id}
              onSubmit={handleAddLesson}
              onCancel={() => setShowAddLesson(false)}
            />
          )}

          {!showAddLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddLesson(true)}
              className="w-full mt-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
            >
              + Add Lesson
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ManageLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    async function fetchSections() {
      try {
        setLoading(true);
        setError(null);
        const data = await lessonApi.listSections(courseId);
        setSections(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sections');
      } finally {
        setLoading(false);
      }
    }

    fetchSections();
  }, [courseId]);

  async function handleCreateSection(title: string, description: string) {
    try {
      setError(null);
      const section = await lessonApi.createSection({
        courseId,
        title,
        description: description || undefined,
      });
      setSections((prev) => [...prev, { ...section, lessons: section.lessons || [] }]);
      setShowAddSection(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create section');
    }
  }

  function handleSectionUpdated(updated: Section) {
    setSections((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, title: updated.title, description: updated.description } : s))
    );
  }

  function handleSectionDeleted(sectionId: string) {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function handleLessonCreated(lesson: Lesson, sectionId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, lesson] } : s
      )
    );
  }

  function handleLessonUpdated(updated: Lesson) {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => (l.id === updated.id ? updated : l)),
      }))
    );
  }

  function handleLessonDeleted(lessonId: string, sectionId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      )
    );
  }

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + s.lessons.reduce((ls, l) => ls + l.duration, 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error">
          {error}
        </Alert>
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
          >
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Lessons</h1>
          <p className="mt-1 text-muted-foreground">
            Organize sections and lessons for your course.
          </p>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
        >
          Back to Course
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-card rounded-lg border border-border">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Sections</p>
          <p className="text-xl font-bold text-foreground">{sections.length}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Lessons</p>
          <p className="text-xl font-bold text-foreground">{totalLessons}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Duration</p>
          <p className="text-xl font-bold text-foreground">
            {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
          </p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Content Progress</p>
          <ProgressBar value={totalLessons > 0 ? 100 : 0} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {sections
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              courseId={courseId}
              onSectionUpdated={handleSectionUpdated}
              onSectionDeleted={handleSectionDeleted}
              onLessonCreated={handleLessonCreated}
              onLessonUpdated={handleLessonUpdated}
              onLessonDeleted={handleLessonDeleted}
            />
          ))}

        {sections.length === 0 && !showAddSection && (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground text-lg">No sections yet.</p>
            <p className="text-muted-foreground/70 text-sm mt-1">
              Start by adding a section to organize your lessons.
            </p>
          </div>
        )}
      </div>

      {/* Add Section */}
      <div className="mt-6">
        {showAddSection ? (
          <SectionForm
            courseId={courseId}
            onSubmit={handleCreateSection}
            onCancel={() => setShowAddSection(false)}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddSection(true)}
            className="w-full border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5"
          >
            + Add Section
          </Button>
        )}
      </div>
    </div>
  );
}
