-- CreateTable
CREATE TABLE "bundle_discounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minItems" INTEGER NOT NULL DEFAULT 2,
    "applicableTiers" TEXT[],
    "applicableFeatures" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_discounts_pkey" PRIMARY KEY ("id")
);
