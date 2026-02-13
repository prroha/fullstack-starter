import type { EcommerceOrderStatus } from '../../lib/ecommerce/types';
import { formatOrderStatus } from '../../lib/ecommerce/formatters';
import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

const statusVariants: Record<EcommerceOrderStatus, BadgeProps['variant']> = {
  PENDING: 'warning',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'secondary',
  DELIVERED: 'success',
  CANCELLED: 'outline',
  REFUNDED: 'destructive',
};

interface OrderStatusBadgeProps {
  status: EcommerceOrderStatus;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status] ?? 'outline'}>
      {formatOrderStatus(status)}
    </Badge>
  );
}
