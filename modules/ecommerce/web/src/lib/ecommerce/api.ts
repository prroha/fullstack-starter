// =============================================================================
// E-Commerce API Client
// =============================================================================
// API methods for all ecommerce endpoints. Uses fetch with configurable base URL.

import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilters,
  ProductCategory,
  Cart,
  CartItemInput,
  EcommerceOrder,
  OrderCreateInput,
  ProductReview,
  ReviewCreateInput,
  ReviewUpdateInput,
  RatingStats,
  CustomerStats,
  SellerStats,
  SellerRevenueData,
  ProductAnalytics,
  PaginatedResponse,
} from './types';

// =============================================================================
// Config
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const ECOM_BASE = `${API_BASE}/ecommerce`;

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
// Products
// =============================================================================

export const productApi = {
  list(filters?: ProductFilters): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return request(`${ECOM_BASE}/products${qs ? `?${qs}` : ''}`);
  },

  getBySlug(slug: string): Promise<Product> {
    return request(`${ECOM_BASE}/products/${slug}`);
  },

  getById(id: string): Promise<Product> {
    return request(`${ECOM_BASE}/products/${id}`);
  },

  create(data: ProductCreateInput): Promise<Product> {
    return request(`${ECOM_BASE}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ProductUpdateInput): Promise<Product> {
    return request(`${ECOM_BASE}/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${ECOM_BASE}/products/${id}`, { method: 'DELETE' });
  },

  publish(id: string): Promise<Product> {
    return request(`${ECOM_BASE}/products/${id}/publish`, { method: 'POST' });
  },

  unpublish(id: string): Promise<Product> {
    return request(`${ECOM_BASE}/products/${id}/unpublish`, { method: 'POST' });
  },

  getCategories(): Promise<ProductCategory[]> {
    return request(`${ECOM_BASE}/products/categories`);
  },

  createCategory(data: { name: string; description?: string; imageUrl?: string }): Promise<ProductCategory> {
    return request(`${ECOM_BASE}/products/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// =============================================================================
// Cart
// =============================================================================

export const cartApi = {
  get(): Promise<Cart> {
    return request(`${ECOM_BASE}/cart`);
  },

  addItem(data: CartItemInput): Promise<Cart> {
    return request(`${ECOM_BASE}/cart/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    return request(`${ECOM_BASE}/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem(itemId: string): Promise<Cart> {
    return request(`${ECOM_BASE}/cart/items/${itemId}`, { method: 'DELETE' });
  },

  clear(): Promise<void> {
    return request(`${ECOM_BASE}/cart`, { method: 'DELETE' });
  },

  merge(sessionId: string): Promise<Cart> {
    return request(`${ECOM_BASE}/cart/merge`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },
};

// =============================================================================
// Orders
// =============================================================================

export const orderApi = {
  create(data: OrderCreateInput): Promise<EcommerceOrder> {
    return request(`${ECOM_BASE}/orders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  list(page = 1, limit = 20): Promise<PaginatedResponse<EcommerceOrder>> {
    return request(`${ECOM_BASE}/orders?page=${page}&limit=${limit}`);
  },

  getById(id: string): Promise<EcommerceOrder> {
    return request(`${ECOM_BASE}/orders/${id}`);
  },

  cancel(id: string): Promise<EcommerceOrder> {
    return request(`${ECOM_BASE}/orders/${id}/cancel`, { method: 'POST' });
  },
};

// =============================================================================
// Reviews
// =============================================================================

export const reviewApi = {
  listByProduct(productId: string, page = 1, limit = 20): Promise<PaginatedResponse<ProductReview>> {
    return request(`${ECOM_BASE}/reviews/product/${productId}?page=${page}&limit=${limit}`);
  },

  create(data: ReviewCreateInput): Promise<ProductReview> {
    return request(`${ECOM_BASE}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: ReviewUpdateInput): Promise<ProductReview> {
    return request(`${ECOM_BASE}/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request(`${ECOM_BASE}/reviews/${id}`, { method: 'DELETE' });
  },

  getRatingStats(productId: string): Promise<RatingStats> {
    return request(`${ECOM_BASE}/reviews/product/${productId}/stats`);
  },
};

// =============================================================================
// Customer
// =============================================================================

export const customerApi = {
  getOrders(page = 1, limit = 20): Promise<PaginatedResponse<EcommerceOrder>> {
    return request(`${ECOM_BASE}/customer/orders?page=${page}&limit=${limit}`);
  },

  getOrderById(id: string): Promise<EcommerceOrder> {
    return request(`${ECOM_BASE}/customer/orders/${id}`);
  },

  getStats(): Promise<CustomerStats> {
    return request(`${ECOM_BASE}/customer/stats`);
  },
};

// =============================================================================
// Seller
// =============================================================================

export const sellerApi = {
  getStats(): Promise<SellerStats> {
    return request(`${ECOM_BASE}/seller/stats`);
  },

  getProducts(page = 1, limit = 20): Promise<PaginatedResponse<Product>> {
    return request(`${ECOM_BASE}/seller/products?page=${page}&limit=${limit}`);
  },

  getProductAnalytics(): Promise<ProductAnalytics[]> {
    return request(`${ECOM_BASE}/seller/products/analytics`);
  },

  getOrders(page = 1, limit = 20): Promise<PaginatedResponse<EcommerceOrder>> {
    return request(`${ECOM_BASE}/seller/orders?page=${page}&limit=${limit}`);
  },

  getRecentOrders(limit = 5): Promise<EcommerceOrder[]> {
    return request(`${ECOM_BASE}/seller/orders/recent?limit=${limit}`);
  },

  getRecentReviews(limit = 5): Promise<ProductReview[]> {
    return request(`${ECOM_BASE}/seller/reviews/recent?limit=${limit}`);
  },

  getRevenue(period?: 'daily' | 'weekly' | 'monthly'): Promise<SellerRevenueData[]> {
    const params = period ? `?period=${period}` : '';
    return request(`${ECOM_BASE}/seller/revenue${params}`);
  },
};
