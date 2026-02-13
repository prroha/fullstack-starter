// =============================================================================
// E-Commerce TypeScript Interfaces
// =============================================================================

// --- Enums ---

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type EcommerceOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// --- Product Category ---

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

// --- Product ---

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  sellerId: string;
  sellerName?: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  status: ProductStatus;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories?: ProductCategory[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  avgRating?: number;
  reviewCount?: number;
}

export interface ProductCreateInput {
  title: string;
  description: string;
  shortDescription?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  sku?: string;
  stock?: number;
  categoryIds?: string[];
  images?: { url: string; altText?: string }[];
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

// --- Product Image ---

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

// --- Product Variant ---

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  options: Record<string, string>;
  sortOrder: number;
}

// --- Cart ---

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface CartItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

// --- Order ---

export interface EcommerceOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: EcommerceOrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: Address | null;
  billingAddress: Address | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface OrderCreateInput {
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
}

// --- Review ---

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateInput {
  productId: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdateInput {
  rating?: number;
  comment?: string;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: Record<number, number>; // { 5: 10, 4: 5, 3: 2, 2: 1, 1: 0 }
}

// --- Customer ---

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
}

// --- Seller ---

export interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
}

export interface SellerRevenueData {
  period: string;
  amount: number;
  orders: number;
}

export interface ProductAnalytics {
  productId: string;
  productTitle: string;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  stock: number;
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
