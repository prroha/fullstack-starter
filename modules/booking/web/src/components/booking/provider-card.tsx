'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import type { Provider } from '@/lib/booking/types';

interface ProviderCardProps {
  provider: Provider;
  onClick?: (provider: Provider) => void;
}

const MAX_VISIBLE_SPECIALTIES = 3;

export default function ProviderCard({ provider, onClick }: ProviderCardProps) {
  const specialties = provider.specialties ?? [];
  const visibleSpecialties = specialties.slice(0, MAX_VISIBLE_SPECIALTIES);
  const remainingCount = specialties.length - MAX_VISIBLE_SPECIALTIES;

  const handleClick = () => {
    onClick?.(provider);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(provider);
    }
  };

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View provider: ${provider.userName ?? 'Provider'}` : undefined}
    >
      {/* Avatar */}
      <Avatar
        src={provider.avatarUrl}
        name={provider.userName ?? 'Provider'}
        size="lg"
        alt={provider.userName ?? 'Provider'}
      />

      {/* Name */}
      <h3 className="text-center text-sm font-semibold text-foreground">
        {provider.userName ?? 'Provider'}
      </h3>

      {/* Bio */}
      {provider.bio && (
        <p className="line-clamp-2 text-center text-xs text-muted-foreground">
          {provider.bio}
        </p>
      )}

      {/* Rating */}
      <div className="flex items-center gap-1">
        <Rating
          value={provider.avgRating ?? 0}
          readOnly
          allowHalf
          size="sm"
          showValue
        />
        {(provider.reviewCount ?? 0) > 0 && (
          <span className="text-sm text-muted-foreground">
            ({(provider.reviewCount ?? 0).toLocaleString()})
          </span>
        )}
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {visibleSpecialties.map((specialty) => (
            <Badge key={specialty} variant="secondary" size="sm">
              {specialty}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="outline" size="sm">
              +{remainingCount} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
