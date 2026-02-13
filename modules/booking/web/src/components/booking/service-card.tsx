'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import type { BookingService } from '@/lib/booking/types';
import { formatPrice, formatDuration } from '@/lib/booking/formatters';

interface ServiceCardProps {
  service: BookingService;
  onClick?: (service: BookingService) => void;
}

export default function ServiceCard({ service, onClick }: ServiceCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    onClick?.(service);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(service);
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
      aria-label={onClick ? `View service: ${service.name}` : undefined}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {service.thumbnailUrl && !imgError ? (
          <img
            src={service.thumbnailUrl}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-100">
            <svg
              className="h-12 w-12 text-teal-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Badge overlays */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {service.price === 0 && (
            <Badge variant="success" size="sm">
              Free
            </Badge>
          )}
        </div>
        {service.isFeatured && (
          <Badge variant="default" size="sm" className="absolute top-2 right-2">
            Featured
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Name */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
          {service.name}
        </h3>

        {/* Short description */}
        {service.shortDescription && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {service.shortDescription}
          </p>
        )}

        {/* Duration */}
        {service.duration > 0 && (
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDuration(service.duration)}
          </div>
        )}

        {/* Rating */}
        <div className="mb-3 flex items-center gap-1">
          <Rating
            value={service.avgRating ?? 0}
            readOnly
            allowHalf
            size="sm"
            showValue
          />
          {(service.reviewCount ?? 0) > 0 && (
            <span className="text-sm text-muted-foreground">
              ({(service.reviewCount ?? 0).toLocaleString()})
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(service.price, service.currency)}
          </span>
          {service.compareAtPrice != null && service.compareAtPrice > service.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(service.compareAtPrice, service.currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
