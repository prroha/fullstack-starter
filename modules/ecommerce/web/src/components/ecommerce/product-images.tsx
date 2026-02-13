'use client';

import { useState } from 'react';
import type { ProductImage } from '../../lib/ecommerce/types';

interface ProductImagesProps {
  images: ProductImage[];
  productTitle?: string;
}

export default function ProductImages({ images, productTitle }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainImgError, setMainImgError] = useState(false);

  // Reset error state when switching images
  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setMainImgError(false);
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
        <svg
          className="h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
        {!mainImgError ? (
          <img
            src={currentImage.url}
            alt={currentImage.altText || productTitle || 'Product image'}
            className="h-full w-full object-contain"
            onError={() => setMainImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => handleSelect(index)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-blue-600'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === selectedIndex ? 'true' : undefined}
            >
              <img
                src={image.url}
                alt={image.altText || `Product thumbnail ${index + 1}`}
                className="h-full w-full cursor-pointer object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
