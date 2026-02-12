// =============================================================================
// LMS TypeScript Interfaces
// =============================================================================

// --- Enums ---

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonType = 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ';
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'EXPIRED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

// --- Category ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  displayOrder: number;
}

// --- Course ---

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  instructorId: string;
  instructorName?: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  status: CourseStatus;
  level: string | null;
  language: string;
  duration: number;
  maxStudents: number | null;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
  sections?: Section[];
  enrollmentCount?: number;
  avgRating?: number;
  reviewCount?: number;
  reviews?: Review[];
  revenue?: number;
}

export interface CourseCreateInput {
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price?: number;
  compareAtPrice?: number;
  level?: string;
  language?: string;
  maxStudents?: number;
  categoryIds?: string[];
}

export interface CourseUpdateInput extends Partial<CourseCreateInput> {}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// --- Section ---

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

export interface SectionCreateInput {
  courseId: string;
  title: string;
  description?: string;
}

// --- Lesson ---

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  type: LessonType;
  contentUrl: string | null;
  contentText: string | null;
  duration: number;
  sortOrder: number;
  isFree: boolean;
}

export interface LessonCreateInput {
  sectionId: string;
  title: string;
  description?: string;
  type?: LessonType;
  contentUrl?: string;
  contentText?: string;
  duration?: number;
  isFree?: boolean;
}

export interface LessonUpdateInput extends Partial<Omit<LessonCreateInput, 'sectionId'>> {}

// --- Enrollment ---

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  course?: Course;
}

// --- Progress ---

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  timeSpent: number;
  lastPosition: number;
  completedAt: string | null;
}

export interface ProgressUpdateInput {
  lessonId: string;
  completed?: boolean;
  timeSpent?: number;
  lastPosition?: number;
}

// --- Quiz ---

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  passingScore: number;
  maxAttempts: number;
  timeLimitMins: number | null;
  shuffleQuestions: boolean;
  questions?: Question[];
}

export interface QuizCreateInput {
  lessonId: string;
  title: string;
  description?: string;
  passingScore?: number;
  maxAttempts?: number;
  timeLimitMins?: number;
  shuffleQuestions?: boolean;
}

// --- Question ---

export interface QuestionOption {
  label: string;
  value: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  points: number;
  sortOrder: number;
}

export interface QuestionCreateInput {
  type?: QuestionType;
  text: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
}

// --- Quiz Attempt ---

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points?: number;
  correctAnswer?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  answers: QuizAnswer[] | null;
  startedAt: string;
  completedAt: string | null;
}

// --- Certificate ---

export interface Certificate {
  id: string;
  enrollmentId: string;
  userId: string;
  courseTitle: string;
  studentName: string;
  issuerName: string;
  verificationCode: string;
  issuedAt: string;
  pdfUrl: string | null;
}

export interface CertificateVerification {
  valid: boolean;
  certificate: Certificate | null;
}

// --- Review ---

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewCreateInput {
  courseId: string;
  rating: number;
  comment?: string;
}

// --- Instructor ---

export interface InstructorStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  averageRating: number;
  reviewCount: number;
  revenue: number;
}

export interface EarningsData {
  period: string;
  amount: number;
  enrollments: number;
}

// --- API Response ---

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
