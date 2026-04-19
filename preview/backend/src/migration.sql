-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('PENDING', 'READ', 'REPLIED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'EMAIL_VERIFY', 'ADMIN_ACTION');

-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'PROMO');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'PAYPAL', 'MANUAL', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EcommerceOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'TEXT', 'PDF', 'QUIZ');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'WAITING_ON_AGENT', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('AGENT', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('IN_PERSON', 'VIRTUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'WAITLISTED', 'ATTENDED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskView" AS ENUM ('LIST', 'BOARD', 'CALENDAR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "active_device_id" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_failed_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "visible_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_name" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "min_purchase" DOUBLE PRECISION,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'STRIPE',
    "payment_id" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "coupon_code" TEXT,
    "items" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_category_links" (
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "ecommerce_product_category_links_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "ecommerce_products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "seller_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "compare_at_price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecommerce_product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_carts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ecommerce_cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "EcommerceOrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_intent_id" TEXT,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "shipping_cost" INTEGER NOT NULL DEFAULT 0,
    "tax_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_title" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "variant_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL DEFAULT 0,
    "total_price" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ecommerce_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecommerce_product_reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecommerce_product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_name" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_categories" (
    "course_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "lms_course_categories_pkey" PRIMARY KEY ("course_id","category_id")
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "thumbnail_url" TEXT,
    "instructor_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "compare_at_price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "level" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "max_students" INTEGER,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_sections" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_lessons" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
    "content_url" TEXT,
    "content_text" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "lms_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_progress" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "last_position" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_quizzes" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "time_limit_mins" INTEGER,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "text" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" TEXT,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "lms_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_certificates" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_title" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "issuer_name" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdf_url" TEXT,

    CONSTRAINT "lms_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_reviews" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_name" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_service_category_links" (
    "service_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "booking_service_category_links_pkey" PRIMARY KEY ("service_id","category_id")
);

-- CreateTable
CREATE TABLE "booking_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "thumbnail_url" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "compare_at_price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "duration" INTEGER NOT NULL DEFAULT 60,
    "buffer_time" INTEGER NOT NULL DEFAULT 15,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "specialties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_provider_services" (
    "provider_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,

    CONSTRAINT "booking_provider_services_pkey" PRIMARY KEY ("provider_id","service_id")
);

-- CreateTable
CREATE TABLE "booking_schedules" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "booking_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_schedule_overrides" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_schedule_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_bookings" (
    "id" TEXT NOT NULL,
    "booking_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "notes" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_reminders" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL DEFAULT 'EMAIL',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_reviews" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AgentRole" NOT NULL DEFAULT 'AGENT',
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_open_tickets" INTEGER NOT NULL DEFAULT 25,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_sla_policies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TicketPriority" NOT NULL,
    "first_response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT false,
    "escalation_email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_tickets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "category_id" TEXT,
    "assigned_agent_id" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "first_response_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "helpdesk_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_tags" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "helpdesk_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_ticket_tags" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "helpdesk_ticket_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_articles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meta_title" TEXT,
    "meta_description" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_canned_responses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "shortcut" TEXT,
    "category_id" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT true,
    "created_by_agent_id" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_canned_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpdesk_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT,
    "support_email" TEXT,
    "ticket_prefix" TEXT NOT NULL DEFAULT 'TKT',
    "next_ticket_number" INTEGER NOT NULL DEFAULT 1001,
    "auto_assign" BOOLEAN NOT NULL DEFAULT false,
    "business_hours" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_clients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company_name" TEXT,
    "tax_id" TEXT,
    "billing_address" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_tax_rates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "tax_total" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "amount_paid" INTEGER NOT NULL DEFAULT 0,
    "amount_due" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "notes" TEXT,
    "terms" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_price" INTEGER NOT NULL,
    "total_price" INTEGER NOT NULL,
    "tax_rate_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoicing_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoicing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_recurring_invoices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "frequency" "RecurringFrequency" NOT NULL DEFAULT 'MONTHLY',
    "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "next_issue_date" TIMESTAMP(3) NOT NULL,
    "template_items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "notes" TEXT,
    "terms" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "max_occurrences" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_recurring_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_activities" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoicing_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoicing_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT,
    "business_email" TEXT,
    "business_phone" TEXT,
    "business_address" JSONB,
    "logo_url" TEXT,
    "invoice_prefix" TEXT NOT NULL DEFAULT 'INV',
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "default_currency" TEXT NOT NULL DEFAULT 'usd',
    "default_due_days" INTEGER NOT NULL DEFAULT 30,
    "default_terms" TEXT,
    "default_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoicing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_venues" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "is_virtual" BOOLEAN NOT NULL DEFAULT false,
    "meeting_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT,
    "venue_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'IN_PERSON',
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "image_url" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registration_number" TEXT NOT NULL,
    "attendee_name" TEXT NOT NULL,
    "attendee_email" TEXT NOT NULL,
    "notes" TEXT,
    "checked_in_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_speakers" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "title" TEXT,
    "company" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "default_view" TEXT NOT NULL DEFAULT 'LIST',
    "default_category_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "icon" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "assignee_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NONE',
    "due_date" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_comments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_labels" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_task_labels" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "tasks_task_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "default_view" "TaskView" NOT NULL DEFAULT 'LIST',
    "default_project_id" TEXT,
    "show_completed_tasks" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_visible_id_key" ON "sessions"("visible_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "faq_categories_slug_key" ON "faq_categories"("slug");

-- CreateIndex
CREATE INDEX "faq_categories_slug_idx" ON "faq_categories"("slug");

-- CreateIndex
CREATE INDEX "faq_categories_is_active_idx" ON "faq_categories"("is_active");

-- CreateIndex
CREATE INDEX "faqs_category_id_idx" ON "faqs"("category_id");

-- CreateIndex
CREATE INDEX "faqs_is_active_idx" ON "faqs"("is_active");

-- CreateIndex
CREATE INDEX "faqs_order_idx" ON "faqs"("order");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_start_date_idx" ON "announcements"("start_date");

-- CreateIndex
CREATE INDEX "announcements_end_date_idx" ON "announcements"("end_date");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_key_idx" ON "settings"("key");

-- CreateIndex
CREATE INDEX "settings_is_public_idx" ON "settings"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_slug_idx" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_is_published_idx" ON "content_pages"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_idx" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_email_idx" ON "orders"("email");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_product_categories_name_key" ON "ecommerce_product_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_product_categories_slug_key" ON "ecommerce_product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_products_slug_key" ON "ecommerce_products"("slug");

-- CreateIndex
CREATE INDEX "ecommerce_products_seller_id_idx" ON "ecommerce_products"("seller_id");

-- CreateIndex
CREATE INDEX "ecommerce_products_status_idx" ON "ecommerce_products"("status");

-- CreateIndex
CREATE INDEX "ecommerce_products_slug_idx" ON "ecommerce_products"("slug");

-- CreateIndex
CREATE INDEX "ecommerce_product_images_product_id_idx" ON "ecommerce_product_images"("product_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_variants_product_id_idx" ON "ecommerce_product_variants"("product_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_user_id_idx" ON "ecommerce_carts"("user_id");

-- CreateIndex
CREATE INDEX "ecommerce_carts_session_id_idx" ON "ecommerce_carts"("session_id");

-- CreateIndex
CREATE INDEX "ecommerce_cart_items_cart_id_idx" ON "ecommerce_cart_items"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_cart_items_cart_id_product_id_variant_id_key" ON "ecommerce_cart_items"("cart_id", "product_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_orders_order_number_key" ON "ecommerce_orders"("order_number");

-- CreateIndex
CREATE INDEX "ecommerce_orders_user_id_idx" ON "ecommerce_orders"("user_id");

-- CreateIndex
CREATE INDEX "ecommerce_orders_status_idx" ON "ecommerce_orders"("status");

-- CreateIndex
CREATE INDEX "ecommerce_orders_order_number_idx" ON "ecommerce_orders"("order_number");

-- CreateIndex
CREATE INDEX "ecommerce_order_items_order_id_idx" ON "ecommerce_order_items"("order_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_reviews_product_id_idx" ON "ecommerce_product_reviews"("product_id");

-- CreateIndex
CREATE INDEX "ecommerce_product_reviews_user_id_idx" ON "ecommerce_product_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ecommerce_product_reviews_product_id_user_id_key" ON "ecommerce_product_reviews"("product_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_categories_name_key" ON "lms_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "lms_categories_slug_key" ON "lms_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lms_courses_slug_key" ON "lms_courses"("slug");

-- CreateIndex
CREATE INDEX "lms_courses_instructor_id_idx" ON "lms_courses"("instructor_id");

-- CreateIndex
CREATE INDEX "lms_courses_status_idx" ON "lms_courses"("status");

-- CreateIndex
CREATE INDEX "lms_courses_slug_idx" ON "lms_courses"("slug");

-- CreateIndex
CREATE INDEX "lms_sections_course_id_idx" ON "lms_sections"("course_id");

-- CreateIndex
CREATE INDEX "lms_lessons_section_id_idx" ON "lms_lessons"("section_id");

-- CreateIndex
CREATE INDEX "lms_enrollments_user_id_idx" ON "lms_enrollments"("user_id");

-- CreateIndex
CREATE INDEX "lms_enrollments_course_id_idx" ON "lms_enrollments"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_enrollments_user_id_course_id_key" ON "lms_enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "lms_progress_enrollment_id_idx" ON "lms_progress"("enrollment_id");

-- CreateIndex
CREATE INDEX "lms_progress_lesson_id_idx" ON "lms_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_progress_enrollment_id_lesson_id_key" ON "lms_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "lms_quizzes_lesson_id_idx" ON "lms_quizzes"("lesson_id");

-- CreateIndex
CREATE INDEX "lms_questions_quiz_id_idx" ON "lms_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "lms_quiz_attempts_quiz_id_idx" ON "lms_quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "lms_quiz_attempts_user_id_idx" ON "lms_quiz_attempts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_certificates_verification_code_key" ON "lms_certificates"("verification_code");

-- CreateIndex
CREATE INDEX "lms_certificates_user_id_idx" ON "lms_certificates"("user_id");

-- CreateIndex
CREATE INDEX "lms_certificates_verification_code_idx" ON "lms_certificates"("verification_code");

-- CreateIndex
CREATE INDEX "lms_reviews_course_id_idx" ON "lms_reviews"("course_id");

-- CreateIndex
CREATE INDEX "lms_reviews_user_id_idx" ON "lms_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "lms_reviews_course_id_user_id_key" ON "lms_reviews"("course_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_service_categories_name_key" ON "booking_service_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "booking_service_categories_slug_key" ON "booking_service_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "booking_services_slug_key" ON "booking_services"("slug");

-- CreateIndex
CREATE INDEX "booking_services_status_idx" ON "booking_services"("status");

-- CreateIndex
CREATE INDEX "booking_services_slug_idx" ON "booking_services"("slug");

-- CreateIndex
CREATE INDEX "booking_providers_user_id_idx" ON "booking_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_providers_user_id_key" ON "booking_providers"("user_id");

-- CreateIndex
CREATE INDEX "booking_schedules_provider_id_idx" ON "booking_schedules"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_schedules_provider_id_dayOfWeek_key" ON "booking_schedules"("provider_id", "dayOfWeek");

-- CreateIndex
CREATE INDEX "booking_schedule_overrides_provider_id_idx" ON "booking_schedule_overrides"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_schedule_overrides_provider_id_date_key" ON "booking_schedule_overrides"("provider_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "booking_bookings_booking_number_key" ON "booking_bookings"("booking_number");

-- CreateIndex
CREATE INDEX "booking_bookings_user_id_idx" ON "booking_bookings"("user_id");

-- CreateIndex
CREATE INDEX "booking_bookings_service_id_idx" ON "booking_bookings"("service_id");

-- CreateIndex
CREATE INDEX "booking_bookings_provider_id_idx" ON "booking_bookings"("provider_id");

-- CreateIndex
CREATE INDEX "booking_bookings_status_idx" ON "booking_bookings"("status");

-- CreateIndex
CREATE INDEX "booking_bookings_date_idx" ON "booking_bookings"("date");

-- CreateIndex
CREATE INDEX "booking_reminders_booking_id_idx" ON "booking_reminders"("booking_id");

-- CreateIndex
CREATE INDEX "booking_reminders_scheduled_at_idx" ON "booking_reminders"("scheduled_at");

-- CreateIndex
CREATE INDEX "booking_reviews_service_id_idx" ON "booking_reviews"("service_id");

-- CreateIndex
CREATE INDEX "booking_reviews_provider_id_idx" ON "booking_reviews"("provider_id");

-- CreateIndex
CREATE INDEX "booking_reviews_user_id_idx" ON "booking_reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_reviews_service_id_user_id_key" ON "booking_reviews"("service_id", "user_id");

-- CreateIndex
CREATE INDEX "helpdesk_categories_user_id_idx" ON "helpdesk_categories"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_categories_parent_id_idx" ON "helpdesk_categories"("parent_id");

-- CreateIndex
CREATE INDEX "helpdesk_agents_user_id_idx" ON "helpdesk_agents"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_agents_email_idx" ON "helpdesk_agents"("email");

-- CreateIndex
CREATE INDEX "helpdesk_sla_policies_user_id_idx" ON "helpdesk_sla_policies"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_sla_policies_priority_idx" ON "helpdesk_sla_policies"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "helpdesk_tickets_ticket_number_key" ON "helpdesk_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_user_id_idx" ON "helpdesk_tickets"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_status_idx" ON "helpdesk_tickets"("status");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_priority_idx" ON "helpdesk_tickets"("priority");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_category_id_idx" ON "helpdesk_tickets"("category_id");

-- CreateIndex
CREATE INDEX "helpdesk_tickets_assigned_agent_id_idx" ON "helpdesk_tickets"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "helpdesk_ticket_messages_ticket_id_idx" ON "helpdesk_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "helpdesk_tags_user_id_idx" ON "helpdesk_tags"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "helpdesk_ticket_tags_ticket_id_tag_id_key" ON "helpdesk_ticket_tags"("ticket_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "helpdesk_articles_slug_key" ON "helpdesk_articles"("slug");

-- CreateIndex
CREATE INDEX "helpdesk_articles_user_id_idx" ON "helpdesk_articles"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_articles_category_id_idx" ON "helpdesk_articles"("category_id");

-- CreateIndex
CREATE INDEX "helpdesk_articles_status_idx" ON "helpdesk_articles"("status");

-- CreateIndex
CREATE INDEX "helpdesk_canned_responses_user_id_idx" ON "helpdesk_canned_responses"("user_id");

-- CreateIndex
CREATE INDEX "helpdesk_canned_responses_created_by_agent_id_idx" ON "helpdesk_canned_responses"("created_by_agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "helpdesk_settings_user_id_key" ON "helpdesk_settings"("user_id");

-- CreateIndex
CREATE INDEX "invoicing_clients_user_id_idx" ON "invoicing_clients"("user_id");

-- CreateIndex
CREATE INDEX "invoicing_tax_rates_user_id_idx" ON "invoicing_tax_rates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoicing_invoices_invoice_number_key" ON "invoicing_invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoicing_invoices_user_id_idx" ON "invoicing_invoices"("user_id");

-- CreateIndex
CREATE INDEX "invoicing_invoices_client_id_idx" ON "invoicing_invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoicing_invoices_status_idx" ON "invoicing_invoices"("status");

-- CreateIndex
CREATE INDEX "invoicing_invoices_due_date_idx" ON "invoicing_invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoicing_invoice_items_invoice_id_idx" ON "invoicing_invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "invoicing_payments_invoice_id_idx" ON "invoicing_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "invoicing_recurring_invoices_user_id_idx" ON "invoicing_recurring_invoices"("user_id");

-- CreateIndex
CREATE INDEX "invoicing_recurring_invoices_client_id_idx" ON "invoicing_recurring_invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoicing_recurring_invoices_status_idx" ON "invoicing_recurring_invoices"("status");

-- CreateIndex
CREATE INDEX "invoicing_recurring_invoices_next_issue_date_idx" ON "invoicing_recurring_invoices"("next_issue_date");

-- CreateIndex
CREATE INDEX "invoicing_activities_invoice_id_idx" ON "invoicing_activities"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoicing_settings_user_id_key" ON "invoicing_settings"("user_id");

-- CreateIndex
CREATE INDEX "events_categories_user_id_idx" ON "events_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_categories_user_id_slug_key" ON "events_categories"("user_id", "slug");

-- CreateIndex
CREATE INDEX "events_venues_user_id_idx" ON "events_venues"("user_id");

-- CreateIndex
CREATE INDEX "events_events_user_id_idx" ON "events_events"("user_id");

-- CreateIndex
CREATE INDEX "events_events_category_id_idx" ON "events_events"("category_id");

-- CreateIndex
CREATE INDEX "events_events_venue_id_idx" ON "events_events"("venue_id");

-- CreateIndex
CREATE INDEX "events_events_status_idx" ON "events_events"("status");

-- CreateIndex
CREATE INDEX "events_events_start_date_idx" ON "events_events"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "events_registrations_registration_number_key" ON "events_registrations"("registration_number");

-- CreateIndex
CREATE INDEX "events_registrations_event_id_idx" ON "events_registrations"("event_id");

-- CreateIndex
CREATE INDEX "events_registrations_user_id_idx" ON "events_registrations"("user_id");

-- CreateIndex
CREATE INDEX "events_registrations_status_idx" ON "events_registrations"("status");

-- CreateIndex
CREATE INDEX "events_speakers_event_id_idx" ON "events_speakers"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_settings_user_id_key" ON "events_settings"("user_id");

-- CreateIndex
CREATE INDEX "tasks_projects_user_id_idx" ON "tasks_projects"("user_id");

-- CreateIndex
CREATE INDEX "tasks_tasks_user_id_idx" ON "tasks_tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_tasks_project_id_idx" ON "tasks_tasks"("project_id");

-- CreateIndex
CREATE INDEX "tasks_tasks_status_idx" ON "tasks_tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_tasks_priority_idx" ON "tasks_tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_tasks_assignee_id_idx" ON "tasks_tasks"("assignee_id");

-- CreateIndex
CREATE INDEX "tasks_comments_task_id_idx" ON "tasks_comments"("task_id");

-- CreateIndex
CREATE INDEX "tasks_labels_user_id_idx" ON "tasks_labels"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_task_labels_task_id_label_id_key" ON "tasks_task_labels"("task_id", "label_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_settings_user_id_key" ON "tasks_settings"("user_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_category_links" ADD CONSTRAINT "ecommerce_product_category_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_category_links" ADD CONSTRAINT "ecommerce_product_category_links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ecommerce_product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_images" ADD CONSTRAINT "ecommerce_product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_variants" ADD CONSTRAINT "ecommerce_product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "ecommerce_carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_cart_items" ADD CONSTRAINT "ecommerce_cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "ecommerce_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_order_items" ADD CONSTRAINT "ecommerce_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ecommerce_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecommerce_product_reviews" ADD CONSTRAINT "ecommerce_product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "ecommerce_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_categories" ADD CONSTRAINT "lms_course_categories_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_categories" ADD CONSTRAINT "lms_course_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "lms_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_sections" ADD CONSTRAINT "lms_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "lms_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_enrollments" ADD CONSTRAINT "lms_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_progress" ADD CONSTRAINT "lms_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lms_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_progress" ADD CONSTRAINT "lms_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_quizzes" ADD CONSTRAINT "lms_quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_questions" ADD CONSTRAINT "lms_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "lms_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_quiz_attempts" ADD CONSTRAINT "lms_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "lms_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_certificates" ADD CONSTRAINT "lms_certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "lms_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_reviews" ADD CONSTRAINT "lms_reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_service_category_links" ADD CONSTRAINT "booking_service_category_links_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_service_category_links" ADD CONSTRAINT "booking_service_category_links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "booking_service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_provider_services" ADD CONSTRAINT "booking_provider_services_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "booking_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_provider_services" ADD CONSTRAINT "booking_provider_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_schedules" ADD CONSTRAINT "booking_schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "booking_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_schedule_overrides" ADD CONSTRAINT "booking_schedule_overrides_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "booking_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_bookings" ADD CONSTRAINT "booking_bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_bookings" ADD CONSTRAINT "booking_bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "booking_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reminders" ADD CONSTRAINT "booking_reminders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reviews" ADD CONSTRAINT "booking_reviews_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "booking_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_reviews" ADD CONSTRAINT "booking_reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "booking_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_categories" ADD CONSTRAINT "helpdesk_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "helpdesk_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_ticket_messages" ADD CONSTRAINT "helpdesk_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_ticket_tags" ADD CONSTRAINT "helpdesk_ticket_tags_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_ticket_tags" ADD CONSTRAINT "helpdesk_ticket_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "helpdesk_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_articles" ADD CONSTRAINT "helpdesk_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_canned_responses" ADD CONSTRAINT "helpdesk_canned_responses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "helpdesk_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helpdesk_canned_responses" ADD CONSTRAINT "helpdesk_canned_responses_created_by_agent_id_fkey" FOREIGN KEY ("created_by_agent_id") REFERENCES "helpdesk_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_invoices" ADD CONSTRAINT "invoicing_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "invoicing_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_invoice_items" ADD CONSTRAINT "invoicing_invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoicing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_invoice_items" ADD CONSTRAINT "invoicing_invoice_items_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "invoicing_tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_payments" ADD CONSTRAINT "invoicing_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoicing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_recurring_invoices" ADD CONSTRAINT "invoicing_recurring_invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "invoicing_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoicing_activities" ADD CONSTRAINT "invoicing_activities_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoicing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_events" ADD CONSTRAINT "events_events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "events_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_events" ADD CONSTRAINT "events_events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "events_venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_registrations" ADD CONSTRAINT "events_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events_speakers" ADD CONSTRAINT "events_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks_tasks" ADD CONSTRAINT "tasks_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tasks_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks_comments" ADD CONSTRAINT "tasks_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks_task_labels" ADD CONSTRAINT "tasks_task_labels_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks_task_labels" ADD CONSTRAINT "tasks_task_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "tasks_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

