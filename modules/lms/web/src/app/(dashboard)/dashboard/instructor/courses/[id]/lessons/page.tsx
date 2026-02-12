'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Section, Lesson, LessonType } from '@/lib/lms/types';
import { lessonApi } from '@/lib/lms/api';
import { ProgressBar } from '@/components/lms/progress-bar';

const LESSON_TYPES: { value: LessonType; label: string }[] = [
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
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Section title"
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Section description (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : initialTitle ? 'Update Section' : 'Add Section'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
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
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Lesson title"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as LessonType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
        >
          {LESSON_TYPES.map((lt) => (
            <option key={lt.value} value={lt.value}>
              {lt.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Lesson description (optional)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
      />

      {(type === 'VIDEO' || type === 'PDF') && (
        <input
          type="url"
          value={contentUrl}
          onChange={(e) => setContentUrl(e.target.value)}
          placeholder={type === 'VIDEO' ? 'Video URL' : 'PDF URL'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
      )}

      {type === 'TEXT' && (
        <textarea
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          placeholder="Lesson text content..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-y"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Duration (seconds)</label>
          <input
            type="number"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Free preview</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : initial ? 'Update Lesson' : 'Add Lesson'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
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
    if (!confirm(`Delete section "${section.title}" and all its lessons?`)) return;

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

  async function handleDeleteLesson(lessonId: string, lessonTitle: string) {
    if (!confirm(`Delete lesson "${lessonTitle}"?`)) return;

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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <span className="text-gray-400 text-sm flex-shrink-0">
            {collapsed ? '▸' : '▾'}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{section.title}</h3>
            {section.description && (
              <p className="text-xs text-gray-500 truncate">{section.description}</p>
            )}
          </div>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}
          </span>
        </button>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <button
            onClick={() => setEditingSection(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteSection}
            disabled={deletingId === section.id}
            className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
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
            <p className="text-sm text-gray-400 text-center py-4">
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
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-gray-400 text-xs flex-shrink-0 w-5 text-center" title={lesson.type}>
                        {lessonTypeIcons[lesson.type]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
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
                      <button
                        onClick={() => setEditingLessonId(lesson.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                        disabled={deletingId === lesson.id}
                        className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        Delete
                      </button>
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
            <button
              onClick={() => setShowAddLesson(true)}
              className="w-full mt-2 px-3 py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              + Add Lesson
            </button>
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
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error && sections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
            className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Lessons</h1>
          <p className="mt-1 text-gray-600">
            Organize sections and lessons for your course.
          </p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/instructor/courses/${courseId}`)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Back to Course
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sections</p>
          <p className="text-xl font-bold text-gray-900">{sections.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Lessons</p>
          <p className="text-xl font-bold text-gray-900">{totalLessons}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Duration</p>
          <p className="text-xl font-bold text-gray-900">
            {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
          </p>
        </div>
        <div className="flex-1 min-w-[120px]">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Content Progress</p>
          <ProgressBar value={totalLessons > 0 ? 100 : 0} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
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
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No sections yet.</p>
            <p className="text-gray-400 text-sm mt-1">
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
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full px-4 py-3 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            + Add Section
          </button>
        )}
      </div>
    </div>
  );
}
