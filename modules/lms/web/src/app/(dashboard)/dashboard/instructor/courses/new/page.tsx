'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, CourseCreateInput } from '@/lib/lms/types';
import { courseApi } from '@/lib/lms/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/feedback/alert';
import { Spinner } from '@/components/ui/spinner';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function CreateCoursePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    async function fetchCategories() {
      try {
        const data = await courseApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const priceInCents = priceDollars
        ? Math.round(parseFloat(priceDollars) * 100)
        : undefined;

      const input: CourseCreateInput = {
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

      const course = await courseApi.create(input);
      router.push(`/dashboard/instructor/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create New Course</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the details below to create your new course.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert variant="destructive" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            placeholder="e.g. Introduction to Web Development"
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
            placeholder="Detailed description of what students will learn..."
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
            placeholder="A brief summary shown in course listings..."
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
            <p className="mt-1 text-xs text-muted-foreground">Leave empty or 0 for a free course.</p>
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
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2">
            Categories
          </Label>
          {loadingCategories ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
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
            isLoading={submitting}
          >
            Create Course
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/instructor/courses')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
