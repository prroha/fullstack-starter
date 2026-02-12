// =============================================================================
// LMS API Client
// =============================================================================
// API methods for all LMS endpoints. Uses fetch with configurable base URL.

import type {
  Course,
  CourseCreateInput,
  CourseUpdateInput,
  CourseFilters,
  Category,
  Section,
  SectionCreateInput,
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  Enrollment,
  LessonProgress,
  ProgressUpdateInput,
  Quiz,
  QuizCreateInput,
  Question,
  QuestionCreateInput,
  QuizAttempt,
  Certificate,
  CertificateVerification,
  Review,
  ReviewCreateInput,
  InstructorStats,
  CourseAnalytics,
  EarningsData,
  PaginatedResponse,
  ApiResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const LMS_BASE = `${API_BASE}/lms`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || json.message || `Request failed: ${res.status}`);
  }

  return json.data ?? json;
}

// =============================================================================
// Courses
// =============================================================================

export const courseApi = {
  list(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.level) params.set('level', filters.level);
    if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${LMS_BASE}/courses${qs ? `?${qs}` : ''}`);
  },

  getBySlug(slug: string): Promise<Course> {
    return request(`${LMS_BASE}/courses/${slug}`);
  },

  create(data: CourseCreateInput): Promise<Course> {
    return request(`${LMS_BASE}/courses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: CourseUpdateInput): Promise<Course> {
    return request(`${LMS_BASE}/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${LMS_BASE}/courses/${id}`, { method: 'DELETE' });
  },

  publish(id: string): Promise<Course> {
    return request(`${LMS_BASE}/courses/${id}/publish`, { method: 'POST' });
  },

  unpublish(id: string): Promise<Course> {
    return request(`${LMS_BASE}/courses/${id}/unpublish`, { method: 'POST' });
  },

  getCategories(): Promise<Category[]> {
    return request(`${LMS_BASE}/courses/categories`);
  },
};

// =============================================================================
// Sections & Lessons
// =============================================================================

export const lessonApi = {
  listSections(courseId: string): Promise<Section[]> {
    return request(`${LMS_BASE}/lessons/sections/${courseId}`);
  },

  createSection(data: SectionCreateInput): Promise<Section> {
    return request(`${LMS_BASE}/lessons/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSection(id: string, data: { title?: string; description?: string }): Promise<Section> {
    return request(`${LMS_BASE}/lessons/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSection(id: string): Promise<void> {
    return request(`${LMS_BASE}/lessons/sections/${id}`, { method: 'DELETE' });
  },

  reorderSections(courseId: string, orderedIds: string[]): Promise<void> {
    return request(`${LMS_BASE}/lessons/sections/${courseId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },

  getLesson(id: string): Promise<Lesson> {
    return request(`${LMS_BASE}/lessons/${id}`);
  },

  createLesson(data: LessonCreateInput): Promise<Lesson> {
    return request(`${LMS_BASE}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateLesson(id: string, data: LessonUpdateInput): Promise<Lesson> {
    return request(`${LMS_BASE}/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteLesson(id: string): Promise<void> {
    return request(`${LMS_BASE}/lessons/${id}`, { method: 'DELETE' });
  },

  reorderLessons(sectionId: string, orderedIds: string[]): Promise<void> {
    return request(`${LMS_BASE}/lessons/reorder/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
  },
};

// =============================================================================
// Enrollments
// =============================================================================

export const enrollmentApi = {
  enroll(courseId: string): Promise<Enrollment> {
    return request(`${LMS_BASE}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  },

  list(): Promise<Enrollment[]> {
    return request(`${LMS_BASE}/enrollments`);
  },

  getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
    return request(`${LMS_BASE}/enrollments/course/${courseId}`);
  },

  getProgress(enrollmentId: string): Promise<LessonProgress[]> {
    return request(`${LMS_BASE}/enrollments/${enrollmentId}/progress`);
  },

  updateProgress(enrollmentId: string, data: ProgressUpdateInput): Promise<LessonProgress> {
    return request(`${LMS_BASE}/enrollments/${enrollmentId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  completeLesson(enrollmentId: string, lessonId: string): Promise<LessonProgress> {
    return request(`${LMS_BASE}/enrollments/${enrollmentId}/complete/${lessonId}`, {
      method: 'POST',
    });
  },

  drop(enrollmentId: string): Promise<Enrollment> {
    return request(`${LMS_BASE}/enrollments/${enrollmentId}/drop`, { method: 'POST' });
  },
};

// =============================================================================
// Quizzes
// =============================================================================

export const quizApi = {
  getByLesson(lessonId: string): Promise<Quiz[]> {
    return request(`${LMS_BASE}/quizzes/lesson/${lessonId}`);
  },

  get(id: string): Promise<Quiz> {
    return request(`${LMS_BASE}/quizzes/${id}`);
  },

  create(data: QuizCreateInput): Promise<Quiz> {
    return request(`${LMS_BASE}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<QuizCreateInput>): Promise<Quiz> {
    return request(`${LMS_BASE}/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${LMS_BASE}/quizzes/${id}`, { method: 'DELETE' });
  },

  getQuestions(quizId: string): Promise<Question[]> {
    return request(`${LMS_BASE}/quizzes/${quizId}/questions`);
  },

  addQuestion(quizId: string, data: QuestionCreateInput): Promise<Question> {
    return request(`${LMS_BASE}/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuestion(id: string, data: Partial<QuestionCreateInput>): Promise<Question> {
    return request(`${LMS_BASE}/quizzes/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteQuestion(id: string): Promise<void> {
    return request(`${LMS_BASE}/quizzes/questions/${id}`, { method: 'DELETE' });
  },

  submit(quizId: string, answers: Array<{ questionId: string; answer: string }>): Promise<QuizAttempt> {
    return request(`${LMS_BASE}/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  getAttempts(quizId: string): Promise<QuizAttempt[]> {
    return request(`${LMS_BASE}/quizzes/${quizId}/attempts`);
  },

  getBestAttempt(quizId: string): Promise<QuizAttempt | null> {
    return request(`${LMS_BASE}/quizzes/${quizId}/best`);
  },
};

// =============================================================================
// Certificates
// =============================================================================

export const certificateApi = {
  list(): Promise<Certificate[]> {
    return request(`${LMS_BASE}/certificates`);
  },

  get(id: string): Promise<Certificate> {
    return request(`${LMS_BASE}/certificates/${id}`);
  },

  generate(data: { enrollmentId: string; courseTitle: string; studentName?: string }): Promise<Certificate> {
    return request(`${LMS_BASE}/certificates/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDownloadUrl(id: string): string {
    return `${LMS_BASE}/certificates/${id}/download`;
  },

  getQrCode(id: string): Promise<{ qrCode: string }> {
    return request(`${LMS_BASE}/certificates/${id}/qr`);
  },

  verify(code: string): Promise<CertificateVerification> {
    return request(`${LMS_BASE}/certificates/verify/${code}`);
  },
};

// =============================================================================
// Instructor
// =============================================================================

export const instructorApi = {
  getStats(): Promise<InstructorStats> {
    return request(`${LMS_BASE}/instructor/stats`);
  },

  getCourseAnalytics(): Promise<CourseAnalytics[]> {
    return request(`${LMS_BASE}/instructor/courses/analytics`);
  },

  getEarnings(period?: 'daily' | 'weekly' | 'monthly'): Promise<EarningsData[]> {
    const params = period ? `?period=${period}` : '';
    return request(`${LMS_BASE}/instructor/earnings${params}`);
  },

  getRecentEnrollments(limit?: number): Promise<Array<{ studentName: string; courseTitle: string; enrolledAt: string }>> {
    const params = limit ? `?limit=${limit}` : '';
    return request(`${LMS_BASE}/instructor/enrollments/recent${params}`);
  },

  getRecentReviews(limit?: number): Promise<Review[]> {
    const params = limit ? `?limit=${limit}` : '';
    return request(`${LMS_BASE}/instructor/reviews/recent${params}`);
  },
};
