'use client';

import type { EcommerceOrder } from '../../lib/ecommerce/types';
import { formatPrice, formatQuantity } from '../../lib/ecommerce/formatters';
import OrderStatusBadge from './order-status-badge';

interface OrderCardProps {
  order: EcommerceOrder;
  onClick?: (order: EcommerceOrder) => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const itemCount = order.items?.length ?? 0;
  const firstTwoItems = (order.items ?? []).slice(0, 2);

  const handleClick = () => {
    onClick?.(order);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(order);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-shadow ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-foreground truncate">
            {order.orderNumber}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-sm text-muted-foreground flex-shrink-0">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Items summary */}
      <div className="mt-3 text-sm text-muted-foreground">
        <span>{formatQuantity(itemCount)}</span>
        {firstTwoItems.length > 0 && (
          <span className="ml-1">
            &mdash;{' '}
            {firstTwoItems.map((item) => item.productTitle).join(', ')}
            {itemCount > 2 && ` +${itemCount - 2} more`}
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-foreground">
          {formatPrice(order.totalAmount, order.currency)}
        </span>
        {onClick && (
          <span className="text-sm font-medium text-primary hover:underline">
            View Details
          </span>
        )}
      </div>
    </div>
  );
}
