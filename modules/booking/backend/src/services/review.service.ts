// =============================================================================
// Booking Review Service
// =============================================================================
// Business logic for review CRUD, rating aggregation, and uniqueness validation.
// Uses dependency-injected PrismaClient.

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ReviewCreateInput {
  serviceId: string;
  providerId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
}

export interface RatingStats {
  avgRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// =============================================================================
// Review Service
// =============================================================================

export class ReviewService {
  constructor(private db: PrismaClient) {}

  /**
   * List reviews for a service with pagination
   */
  async listServiceReviews(serviceId: string, page: number = 1, limit: number = 20) {
    const [items, total] = await Promise.all([
      this.db.bookingReview.findMany({
        where: { serviceId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.bookingReview.count({ where: { serviceId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List reviews for a provider with pagination
   */
  async listProviderReviews(providerId: string, page: number = 1, limit: number = 20) {
    const [items, total] = await Promise.all([
      this.db.bookingReview.findMany({
        where: { providerId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.bookingReview.count({ where: { providerId } }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new review. Validates uniqueness per service + user.
   */
  async createReview(input: ReviewCreateInput) {
    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check for existing review (one per user per service)
    const existing = await this.db.bookingReview.findUnique({
      where: { serviceId_userId: { serviceId: input.serviceId, userId: input.userId } },
    });
    if (existing) {
      throw new Error('You have already reviewed this service');
    }

    return this.db.bookingReview.create({
      data: {
        serviceId: input.serviceId,
        providerId: input.providerId,
        userId: input.userId,
        userName: input.userName || null,
        rating: input.rating,
        comment: input.comment || null,
      },
    });
  }

  /**
   * Update an existing review
   */
  async updateReview(id: string, input: ReviewUpdateInput) {
    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const review = await this.db.bookingReview.findUnique({ where: { id } });
    if (!review) {
      throw new Error('Review not found');
    }

    return this.db.bookingReview.update({
      where: { id },
      data: {
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
      },
    });
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string) {
    const review = await this.db.bookingReview.findUnique({ where: { id } });
    if (!review) {
      throw new Error('Review not found');
    }

    await this.db.bookingReview.delete({ where: { id } });
  }

  /**
   * Get rating statistics for a service (average, total, distribution)
   */
  async getServiceRatingStats(serviceId: string): Promise<RatingStats> {
    const [avgResult, totalReviews, dist1, dist2, dist3, dist4, dist5] = await Promise.all([
      this.db.bookingReview.aggregate({ where: { serviceId }, _avg: { rating: true } }),
      this.db.bookingReview.count({ where: { serviceId } }),
      this.db.bookingReview.count({ where: { serviceId, rating: 1 } }),
      this.db.bookingReview.count({ where: { serviceId, rating: 2 } }),
      this.db.bookingReview.count({ where: { serviceId, rating: 3 } }),
      this.db.bookingReview.count({ where: { serviceId, rating: 4 } }),
      this.db.bookingReview.count({ where: { serviceId, rating: 5 } }),
    ]);

    return {
      avgRating: Math.round((avgResult._avg.rating || 0) * 10) / 10,
      totalReviews,
      distribution: { 1: dist1, 2: dist2, 3: dist3, 4: dist4, 5: dist5 },
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createReviewService(db: PrismaClient): ReviewService {
  return new ReviewService(db);
}

let instance: ReviewService | null = null;
export function getReviewService(db?: PrismaClient): ReviewService {
  if (db) return createReviewService(db);
  if (!instance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    instance = new ReviewService(globalDb);
  }
  return instance;
}

export default ReviewService;
