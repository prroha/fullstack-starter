'use client';

import { useState } from 'react';
import type { Product } from '../../lib/ecommerce/types';
import { formatPrice } from '../../lib/ecommerce/formatters';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const primaryImage = product.images?.[0];
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const inStock = product.stock > 0;

  const handleClick = () => {
    onClick?.(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(product);
    }
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View product: ${product.title}` : undefined}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {primaryImage && !imgError ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
            <svg
              className="h-12 w-12 text-orange-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        )}

        {/* Sale badge */}
        {onSale && (
          <Badge variant="destructive" size="sm" className="absolute top-2 left-2">
            Sale
          </Badge>
        )}

        {/* Featured badge */}
        {product.isFeatured && (
          <Badge variant="warning" size="sm" className="absolute top-2 right-2">
            Featured
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-blue-600">
          {product.title}
        </h3>

        {/* Seller */}
        {product.sellerName && (
          <p className="mb-2 text-xs text-muted-foreground">{product.sellerName}</p>
        )}

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          <Rating
            value={product.avgRating ?? 0}
            readOnly
            allowHalf
            size="sm"
            showValue
          />
          {(product.reviewCount ?? 0) > 0 && (
            <span className="text-sm text-muted-foreground">
              ({(product.reviewCount ?? 0).toLocaleString()})
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price, product.currency)}
          </span>
          {onSale && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!, product.currency)}
            </span>
          )}
        </div>

        {/* Stock indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              inStock ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span
            className={`text-xs font-medium ${
              inStock ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}
