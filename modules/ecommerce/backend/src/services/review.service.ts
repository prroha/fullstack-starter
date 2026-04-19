// =============================================================================
// E-Commerce Review Service
// =============================================================================
// Business logic for product reviews, ratings, and rating statistics.
// Supports dependency injection for preview mode (per-schema PrismaClient).
// Table: @@map("ecommerce_product_reviews")

import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

export interface ReviewCreateInput {
  productId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

interface RatingStats {
  average: number;
  total: number;
  distribution: Record<number, number>;
}

// =============================================================================
// Review Service
// =============================================================================

export class ReviewService {
  constructor(private db: PrismaClient) {}

  /**
   * List reviews for a product with pagination
   */
  async listProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.db.productReview.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.productReview.count({ where: { productId } }),
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
   * Create a new review (validates rating range 1-5)
   */
  async createReview(input: ReviewCreateInput) {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return this.db.productReview.create({
      data: {
        productId: input.productId,
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

    const existing = await this.db.productReview.findUnique({ where: { id } });
    if (!existing) return null;

    return this.db.productReview.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string) {
    await this.db.productReview.delete({ where: { id } });
  }

  /**
   * Get rating statistics for a product (average, total, distribution)
   */
  async getProductRatingStats(productId: string): Promise<RatingStats> {
    const [aggregate, distribution] = await Promise.all([
      this.db.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.db.productReview.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
    ]);

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      dist[d.rating] = d._count.rating;
    });

    const average = aggregate._avg.rating || 0;

    return {
      average: Math.round(average * 10) / 10,
      total: aggregate._count.rating,
      distribution: dist,
    };
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createReviewService(db: PrismaClient): ReviewService {
  return new ReviewService(db);
}

let reviewServiceInstance: ReviewService | null = null;

export function getReviewService(db?: PrismaClient): ReviewService {
  if (db) return createReviewService(db);
  if (!reviewServiceInstance) {
    const { db: globalDb } = require('../../../../core/backend/src/lib/db.js');
    reviewServiceInstance = new ReviewService(globalDb);
  }
  return reviewServiceInstance;
}

export default ReviewService;
