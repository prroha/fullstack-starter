'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Product, ProductCategory, ProductUpdateInput } from '@/lib/ecommerce/types';
import { productApi } from '@/lib/ecommerce/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [productData, categoriesData] = await Promise.all([
          productApi.getById(id),
          productApi.getCategories(),
        ]);

        setProduct(productData);
        setCategories(categoriesData);

        // Populate form fields (convert price from cents to dollars)
        setTitle(productData.title);
        setDescription(productData.description);
        setShortDescription(productData.shortDescription || '');
        setPriceDollars(productData.price ? (productData.price / 100).toFixed(2) : '');
        setCompareAtPriceDollars(
          productData.compareAtPrice ? (productData.compareAtPrice / 100).toFixed(2) : ''
        );
        setSku(productData.sku || '');
        setStock(String(productData.stock));
        setSelectedCategoryIds(
          productData.categories?.map((c) => c.id) || []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  function handleCategoryToggle(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cid) => cid !== categoryId)
        : [...prev, categoryId]
    );
  }

  function clearMessages() {
    setError(null);
    setSuccessMessage(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      setSaving(true);

      // Convert price from dollars to cents
      const priceInCents = priceDollars
        ? Math.round(parseFloat(priceDollars) * 100)
        : 0;

      const compareAtPriceInCents = compareAtPriceDollars
        ? Math.round(parseFloat(compareAtPriceDollars) * 100)
        : undefined;

      const input: ProductUpdateInput = {
        title: title.trim(),
        description: description.trim(),
        shortDescription: shortDescription.trim() || undefined,
        price: priceInCents,
        compareAtPrice: compareAtPriceInCents,
        sku: sku.trim() || undefined,
        stock: stock ? parseInt(stock, 10) : 0,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      };

      const updated = await productApi.update(id, input);
      setProduct(updated);
      setSuccessMessage('Product saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    if (!product) return;
    clearMessages();

    try {
      setPublishing(true);

      let updated: Product;
      if (product.status === 'ACTIVE') {
        updated = await productApi.unpublish(id);
      } else {
        updated = await productApi.publish(id);
      }

      setProduct(updated);
      setSuccessMessage(
        updated.status === 'ACTIVE'
          ? 'Product published successfully.'
          : 'Product unpublished.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update publish status');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    clearMessages();

    try {
      setDeleting(true);
      await productApi.delete(id);
      router.push('/dashboard/seller/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleting(false);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (error && !product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold text-lg">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/seller/products')}
            className="mt-3"
          >
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
          {product && (
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : product.status === 'ARCHIVED'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-muted text-foreground'
                }`}
              >
                {product.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePublishToggle}
            isLoading={publishing}
          >
            {product?.status === 'ACTIVE' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            isLoading={deleting}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
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
          <Label className="mb-2">Categories</Label>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedCategoryIds.includes(category.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-foreground">{category.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button type="submit" isLoading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/seller/products')}
          >
            Back to Products
          </Button>
        </div>
      </form>
    </div>
  );
}
