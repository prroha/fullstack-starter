'use client';

import ServiceCard from './service-card';
import type { BookingService } from '@/lib/booking/types';

interface ServiceGridProps {
  services: BookingService[];
  onServiceClick?: (service: BookingService) => void;
}

export default function ServiceGrid({ services, onServiceClick }: ServiceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onClick={onServiceClick}
        />
      ))}
    </div>
  );
}
