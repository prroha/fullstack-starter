// =============================================================================
// Booking Review Service
// =============================================================================
// Business logic for review CRUD, rating aggregation, and uniqueness validation.
// Uses placeholder db operations - replace with actual Prisma client.

// =============================================================================
// Types
// =============================================================================

export interface ReviewCreateInput {
  serviceId: string;
  providerId: string;
  userId: string;
  userName: string;
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

interface ReviewRecord {
  id: string;
  serviceId: string;
  providerId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Database Operations (Placeholder)
// =============================================================================
// Replace with actual Prisma client:
// import { db } from '../../../../core/backend/src/lib/db';

const dbOperations = {
  async findServiceReviews(serviceId: string, filters: ReviewFilters): Promise<{ items: ReviewRecord[]; total: number }> {
    // Replace with:
    // const [items, total] = await Promise.all([
    //   db.review.findMany({ where: { serviceId }, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, orderBy: { createdAt: 'desc' } }),
    //   db.review.count({ where: { serviceId } }),
    // ]);
    console.log('[DB] Finding reviews for service:', serviceId, filters);
    return { items: [], total: 0 };
  },

  async findProviderReviews(providerId: string, filters: ReviewFilters): Promise<{ items: ReviewRecord[]; total: number }> {
    // Replace with:
    // const [items, total] = await Promise.all([
    //   db.review.findMany({ where: { providerId }, skip: ((filters.page || 1) - 1) * (filters.limit || 20), take: filters.limit || 20, orderBy: { createdAt: 'desc' } }),
    //   db.review.count({ where: { providerId } }),
    // ]);
    console.log('[DB] Finding reviews for provider:', providerId, filters);
    return { items: [], total: 0 };
  },

  async findReviewById(id: string): Promise<ReviewRecord | null> {
    // Replace with: return db.review.findUnique({ where: { id } });
    console.log('[DB] Finding review by ID:', id);
    return null;
  },

  async findExistingReview(serviceId: string, userId: string): Promise<ReviewRecord | null> {
    // Replace with: return db.review.findUnique({ where: { serviceId_userId: { serviceId, userId } } });
    console.log('[DB] Checking existing review:', serviceId, userId);
    return null;
  },

  async createReview(data: {
    serviceId: string;
    providerId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string | null;
  }): Promise<ReviewRecord> {
    // Replace with: return db.review.create({ data });
    console.log('[DB] Creating review for service:', data.serviceId);
    return {
      id: 'review_' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async updateReview(id: string, data: ReviewUpdateInput): Promise<ReviewRecord | null> {
    // Replace with: return db.review.update({ where: { id }, data: { ...data, updatedAt: new Date() } });
    console.log('[DB] Updating review:', id);
    return null;
  },

  async deleteReview(id: string): Promise<void> {
    // Replace with: await db.review.delete({ where: { id } });
    console.log('[DB] Deleting review:', id);
  },

  async getServiceRatingStats(serviceId: string): Promise<RatingStats> {
    // Replace with:
    // const [avgResult, totalReviews, dist1, dist2, dist3, dist4, dist5] = await Promise.all([
    //   db.review.aggregate({ where: { serviceId }, _avg: { rating: true } }),
    //   db.review.count({ where: { serviceId } }),
    //   db.review.count({ where: { serviceId, rating: 1 } }),
    //   db.review.count({ where: { serviceId, rating: 2 } }),
    //   db.review.count({ where: { serviceId, rating: 3 } }),
    //   db.review.count({ where: { serviceId, rating: 4 } }),
    //   db.review.count({ where: { serviceId, rating: 5 } }),
    // ]);
    console.log('[DB] Getting rating stats for service:', serviceId);
    return {
      avgRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  },
};

// =============================================================================
// Review Service
// =============================================================================

export class ReviewService {
  /**
   * List reviews for a service with pagination
   */
  async listServiceReviews(serviceId: string, filters: ReviewFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findServiceReviews(serviceId, {
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * List reviews for a provider with pagination
   */
  async listProviderReviews(providerId: string, filters: ReviewFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await dbOperations.findProviderReviews(providerId, {
      page,
      limit,
    });

    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Create a new review. Validates uniqueness per service + user.
   */
  async createReview(input: ReviewCreateInput): Promise<ReviewRecord> {
    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check for existing review (one per user per service)
    const existing = await dbOperations.findExistingReview(input.serviceId, input.userId);
    if (existing) {
      throw new Error('You have already reviewed this service');
    }

    return dbOperations.createReview({
      serviceId: input.serviceId,
      providerId: input.providerId,
      userId: input.userId,
      userName: input.userName,
      rating: input.rating,
      comment: input.comment || null,
    });
  }

  /**
   * Update an existing review
   */
  async updateReview(id: string, input: ReviewUpdateInput) {
    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const review = await dbOperations.findReviewById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    return dbOperations.updateReview(id, input);
  }

  /**
   * Delete a review
   */
  async deleteReview(id: string) {
    const review = await dbOperations.findReviewById(id);
    if (!review) {
      throw new Error('Review not found');
    }

    return dbOperations.deleteReview(id);
  }

  /**
   * Get rating statistics for a service (average, total, distribution)
   */
  async getServiceRatingStats(serviceId: string): Promise<RatingStats> {
    return dbOperations.getServiceRatingStats(serviceId);
  }
}

// =============================================================================
// Factory
// =============================================================================

let reviewServiceInstance: ReviewService | null = null;

export function getReviewService(): ReviewService {
  if (!reviewServiceInstance) {
    reviewServiceInstance = new ReviewService();
  }
  return reviewServiceInstance;
}

export default ReviewService;
