'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductCategory, ProductCreateInput } from '@/lib/ecommerce/types';
import { productApi } from '@/lib/ecommerce/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function CreateProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [compareAtPriceDollars, setCompareAtPriceDollars] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await productApi.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Convert price from dollars to cents
      const priceInCents = priceDollars
        ? Math.round(parseFloat(priceDollars) * 100)
        : undefined;

      const compareAtPriceInCents = compareAtPriceDollars
        ? Math.round(parseFloat(compareAtPriceDollars) * 100)
        : undefined;

      const input: ProductCreateInput = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: priceInCents,
        compareAtPrice: compareAtPriceInCents,
        sku: sku.trim() || undefined,
        stock: stock ? parseInt(stock, 10) : 0,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        // Note: Image upload would use the file-upload module
      };

      await productApi.create(input);
      router.push('/dashboard/seller/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to add a new product to your store.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" required className="mb-1">
            Title
          </Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wireless Bluetooth Headphones"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" required className="mb-1">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of your product..."
            required
            rows={5}
            className="resize-y"
          />
        </div>

        {/* Short Description */}
        <div>
          <Label htmlFor="shortDescription" className="mb-1">
            Short Description
          </Label>
          <Textarea
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="A brief summary shown in product listings..."
            rows={2}
            className="resize-y"
          />
        </div>

        {/* Price & Compare At Price Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price" className="mb-1">
              Price (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Leave empty for free products.</p>
          </div>

          <div>
            <Label htmlFor="compareAtPrice" className="mb-1">
              Compare At Price (USD)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={compareAtPriceDollars}
                onChange={(e) => setCompareAtPriceDollars(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Original price (for showing discounts).</p>
          </div>
        </div>

        {/* SKU & Stock Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sku" className="mb-1">
              SKU
            </Label>
            <Input
              id="sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. WBH-001"
            />
          </div>

          <div>
            <Label htmlFor="stock" className="mb-1">
              Stock
            </Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-2">
            Categories
          </Label>
          {loadingCategories ? (
            <p className="text-sm text-gray-500">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategoryIds.includes(category.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button type="submit" isLoading={submitting}>
            Create Product
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/seller/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
