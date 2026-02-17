'use client';

import { useMemo } from 'react';
import type { ProductVariant } from '../../lib/ecommerce/types';
import { formatPrice } from '../../lib/ecommerce/formatters';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

export default function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  // Group variants by option types (e.g., "size", "color")
  const optionGroups = useMemo(() => {
    if (!variants || variants.length === 0) return [];

    // Collect all unique option keys
    const optionKeys = new Set<string>();
    for (const variant of variants) {
      if (variant.options) {
        for (const key of Object.keys(variant.options)) {
          optionKeys.add(key);
        }
      }
    }

    const basePrice = variants[0]?.price ?? 0;

    return Array.from(optionKeys).map((key) => {
      // Get unique values for this option key, with their associated variants
      const valuesMap = new Map<
        string,
        { value: string; variantIds: string[]; priceDelta: number }
      >();

      for (const variant of variants) {
        const value = variant.options?.[key];
        if (value === undefined) continue;

        if (!valuesMap.has(value)) {
          valuesMap.set(value, {
            value,
            variantIds: [],
            priceDelta: variant.price - basePrice,
          });
        }
        valuesMap.get(value)!.variantIds.push(variant.id);
      }

      return {
        key,
        values: Array.from(valuesMap.values()),
      };
    });
  }, [variants]);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {optionGroups.map((group) => (
        <div key={group.key}>
          <Label className="mb-2 block capitalize">
            {group.key}
          </Label>
          <div className="flex flex-wrap gap-2">
            {group.values.map((option) => {
              const isActive = option.variantIds.includes(
                selectedVariantId ?? '',
              );

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const targetId = option.variantIds[0];
                    if (targetId) onSelect(targetId);
                  }}
                  className={isActive ? 'ring-2 ring-primary' : ''}
                >
                  {option.value}
                  {option.priceDelta !== 0 && (
                    <span
                      className={`text-xs ${
                        option.priceDelta > 0
                          ? 'opacity-70'
                          : 'text-success'
                      }`}
                    >
                      {option.priceDelta > 0 ? '+' : ''}
                      {formatPrice(option.priceDelta)}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
