'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Course, Category, CourseUpdateInput } from '@/lib/lms/types';
import { courseApi } from '@/lib/lms/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/feedback/alert';
import { Spinner } from '@/components/ui/spinner';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('en');
  const [maxStudents, setMaxStudents] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [courseData, categoriesData] = await Promise.all([
          courseApi.getBySlug(id),
          courseApi.getCategories(),
        ]);

        setCourse(courseData);
        setCategories(categoriesData);

        // Populate form
        setTitle(courseData.title);
        setDescription(courseData.description);
        setShortDescription(courseData.shortDescription || '');
        setPriceDollars(courseData.price ? (courseData.price / 100).toFixed(2) : '');
        setLevel(courseData.level || '');
        setLanguage(courseData.language || 'en');
        setMaxStudents(courseData.maxStudents ? String(courseData.maxStudents) : '');
        setThumbnailUrl(courseData.thumbnailUrl || '');
        setSelectedCategoryIds(
          courseData.categories?.map((c) => c.id) || []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cid) => cid !== categoryId)
        : [...prev, categoryId]
    );
  }

  function clearMessages() {
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setSaving(true);

      const priceInCents = priceDollars
        ? Math.round(parseFloat(priceDollars) * 100)
        : 0;

      const input: CourseUpdateInput = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: priceInCents,
        level: level || undefined,
        language: language || undefined,
        maxStudents: maxStudents ? parseInt(maxStudents, 10) : undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      };

      const updated = await courseApi.update(id, input);
      setCourse(updated);
      setSuccessMessage('Course saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    if (!course) return;
    clearMessages();

    try {
      setPublishing(true);

      let updated: Course;
      if (course.status === 'PUBLISHED') {
        updated = await courseApi.unpublish(id);
      } else {
        updated = await courseApi.publish(id);
      }

      setCourse(updated);
      setSuccessMessage(
        updated.status === 'PUBLISHED'
          ? 'Course published successfully.'
          : 'Course unpublished.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    clearMessages();

    try {
      setDeleting(true);
      await courseApi.delete(id);
      router.push('/dashboard/instructor/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive" title="Error">
          {error}
        </Alert>
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/instructor/courses')}
          >
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Course</h1>
          {course && (
            <div className="mt-2 flex items-center gap-3">
              <Badge
                variant={
                  course.status === 'PUBLISHED'
                    ? 'success'
                    : course.status === 'ARCHIVED'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {course.status}
              </Badge>
              <Button
                variant="link"
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/instructor/courses/${id}/lessons`)
                }
              >
                Manage Lessons
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={course?.status === 'PUBLISHED' ? 'outline' : 'default'}
            size="sm"
            onClick={handlePublishToggle}
            isLoading={publishing}
          >
            {course?.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            isLoading={deleting}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}
      {successMessage && (
        <div className="mb-6">
          <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" required className="mb-1">
            Title
          </Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" required className="mb-1">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="resize-y"
          />
        </div>

        {/* Short Description */}
        <div>
          <Label htmlFor="shortDescription" className="mb-1">
            Short Description
          </Label>
          <Textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={2}
            className="resize-y"
          />
        </div>

        {/* Price & Level Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="mb-1">
              Price (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="level" className="mb-1">
              Level
            </Label>
            <Select
              id="level"
              value={level}
              onChange={(value) => setLevel(value)}
              placeholder="Select level"
              options={LEVELS}
            />
          </div>
        </div>

        {/* Language & Max Students Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language" className="mb-1">
              Language
            </Label>
            <Input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. en, es, fr"
            />
          </div>

          <div>
            <Label htmlFor="maxStudents" className="mb-1">
              Max Students
            </Label>
            <Input
              id="maxStudents"
              type="number"
              min="1"
              value={maxStudents}
              onChange={(e) => setMaxStudents(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
        </div>

        {/* Thumbnail URL */}
        <div>
          <Label htmlFor="thumbnailUrl" className="mb-1">
            Thumbnail URL
          </Label>
          <Input
            id="thumbnailUrl"
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {thumbnailUrl && (
            <div className="mt-2">
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="w-32 h-20 object-cover rounded border border-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2">Categories</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategoryIds.includes(category.id)
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button
            type="submit"
            isLoading={saving}
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/instructor/courses')}
          >
            Back to Courses
          </Button>
        </div>
      </form>
    </div>
  );
}
