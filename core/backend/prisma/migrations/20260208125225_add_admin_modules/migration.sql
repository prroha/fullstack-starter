-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'PROMO');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

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

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
