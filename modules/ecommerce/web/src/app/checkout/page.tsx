"use client";

import { useState, useEffect, useCallback } from "react";
import { orderApi, cartApi } from "@/lib/ecommerce/api";
import { formatPrice } from "@/lib/ecommerce/formatters";
import type { Address, Cart } from "@/lib/ecommerce/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// =============================================================================
// Constants
// =============================================================================

const EMPTY_ADDRESS: Address = {
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
};

// =============================================================================
// Checkout Page
// =============================================================================

export default function CheckoutPage() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState<Address>({
    ...EMPTY_ADDRESS,
  });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState<Address>({
    ...EMPTY_ADDRESS,
  });
  const [notes, setNotes] = useState("");

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const shippingCost = subtotal > 0 ? 0 : 0; // Free shipping placeholder
  const total = subtotal + shippingCost;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const isShippingValid =
    shippingAddress.firstName.trim() !== "" &&
    shippingAddress.lastName.trim() !== "" &&
    shippingAddress.line1.trim() !== "" &&
    shippingAddress.city.trim() !== "" &&
    shippingAddress.state.trim() !== "" &&
    shippingAddress.postalCode.trim() !== "" &&
    shippingAddress.country.trim() !== "";

  const isBillingValid =
    sameAsBilling ||
    (billingAddress.firstName.trim() !== "" &&
      billingAddress.lastName.trim() !== "" &&
      billingAddress.line1.trim() !== "" &&
      billingAddress.city.trim() !== "" &&
      billingAddress.state.trim() !== "" &&
      billingAddress.postalCode.trim() !== "" &&
      billingAddress.country.trim() !== "");

  const canSubmit = isShippingValid && isBillingValid && items.length > 0 && !submitting;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateShipping = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const updateBilling = (field: keyof Address, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      setError(null);

      const order = await orderApi.create({
        shippingAddress,
        billingAddress: sameAsBilling ? undefined : billingAddress,
        notes: notes.trim() || undefined,
      });

      window.location.href = `/checkout/success?orderId=${order.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
            <div className="lg:col-span-4">
              <div className="h-64 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Address Form Component
  // ---------------------------------------------------------------------------

  const renderAddressForm = (
    address: Address,
    onChange: (field: keyof Address, value: string) => void,
    prefix: string,
  ) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${prefix}-firstName`} required>
          First Name
        </Label>
        <Input
          id={`${prefix}-firstName`}
          type="text"
          value={address.firstName}
          onChange={(e) => onChange("firstName", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-lastName`} required>
          Last Name
        </Label>
        <Input
          id={`${prefix}-lastName`}
          type="text"
          value={address.lastName}
          onChange={(e) => onChange("lastName", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-line1`} required>
          Address Line 1
        </Label>
        <Input
          id={`${prefix}-line1`}
          type="text"
          value={address.line1}
          onChange={(e) => onChange("line1", e.target.value)}
          placeholder="Street address"
          className="mt-1"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-line2`}>
          Address Line 2
        </Label>
        <Input
          id={`${prefix}-line2`}
          type="text"
          value={address.line2 ?? ""}
          onChange={(e) => onChange("line2", e.target.value)}
          placeholder="Apartment, suite, etc."
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-city`} required>
          City
        </Label>
        <Input
          id={`${prefix}-city`}
          type="text"
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-state`} required>
          State / Province
        </Label>
        <Input
          id={`${prefix}-state`}
          type="text"
          value={address.state}
          onChange={(e) => onChange("state", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-postalCode`} required>
          Postal Code
        </Label>
        <Input
          id={`${prefix}-postalCode`}
          type="text"
          value={address.postalCode}
          onChange={(e) => onChange("postalCode", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-country`} required>
          Country
        </Label>
        <Input
          id={`${prefix}-country`}
          type="text"
          value={address.country}
          onChange={(e) => onChange("country", e.target.value)}
          className="mt-1"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-phone`}>
          Phone
        </Label>
        <Input
          id={`${prefix}-phone`}
          type="tel"
          value={address.phone ?? ""}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Checkout
        </h1>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Empty Cart */}
        {items.length === 0 && !error && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              Your cart is empty
            </p>
            <Button asChild className="mt-4">
              <a href="/shop">Continue Shopping</a>
            </Button>
          </div>
        )}

        {/* Checkout Form */}
        {items.length > 0 && (
          <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* Left Column: Forms */}
            <div className="lg:col-span-8 space-y-8">
              {/* Shipping Address */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Shipping Address
                </h2>
                {renderAddressForm(shippingAddress, updateShipping, "shipping")}
              </div>

              {/* Same as Billing Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm text-foreground">
                  Billing address is the same as shipping address
                </span>
              </label>

              {/* Billing Address */}
              {!sameAsBilling && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">
                    Billing Address
                  </h2>
                  {renderAddressForm(billingAddress, updateBilling, "billing")}
                </div>
              )}

              {/* Notes */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Order Notes
                </h2>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemPrice =
                      item.variant?.price ?? item.product?.price ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-foreground">
                            {item.product?.title ?? "Product"}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-muted-foreground">
                              {item.variant.name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="ml-4 flex-shrink-0 font-medium text-foreground">
                          {formatPrice(itemPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">
                      {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  isLoading={submitting}
                  className="mt-6 w-full"
                  size="lg"
                >
                  Place Order
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
