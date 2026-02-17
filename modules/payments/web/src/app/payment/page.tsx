'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/feedback/alert';
import { EmptyState } from '@/components/shared/empty-state';
import { loadStripe } from '@stripe/stripe-js';

// =============================================================================
// Types
// =============================================================================

interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  interval?: string;
  intervalCount?: number;
  productName?: string;
  productDescription?: string;
}

// =============================================================================
// Stripe Setup
// =============================================================================

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// =============================================================================
// Payment Page Component
// =============================================================================

export default function PaymentPage() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/payment/prices');
      const data = await response.json();

      if (data.success) {
        setPrices(data.prices);
      } else {
        setError('Failed to load pricing');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Fetch prices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(true);
    setSelectedPriceId(priceId);

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Use Stripe.js to redirect
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            setError(error.message || 'Checkout failed');
          }
        }
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch (err) {
      setError('Failed to start checkout');
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
      setSelectedPriceId(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatInterval = (interval?: string, count?: number) => {
    if (!interval) return 'one-time';
    const prefix = count && count > 1 ? `every ${count} ` : '';
    return `${prefix}${interval}${count && count > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Alert variant="destructive">{error}</Alert>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPrices();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Select a plan that works best for you
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 text-center">
            {error}
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prices.map((price) => (
            <div
              key={price.id}
              className="bg-card rounded-xl shadow-lg p-8 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {price.productName || 'Plan'}
              </h2>
              {price.productDescription && (
                <p className="text-muted-foreground mb-4">{price.productDescription}</p>
              )}
              <div className="mt-auto">
                <div className="text-4xl font-bold text-foreground mb-1">
                  {formatPrice(price.unitAmount, price.currency)}
                </div>
                <p className="text-muted-foreground mb-6">
                  {formatInterval(price.interval, price.intervalCount)}
                </p>
                <Button
                  onClick={() => handleCheckout(price.id)}
                  isLoading={checkoutLoading && selectedPriceId === price.id}
                  disabled={checkoutLoading && selectedPriceId === price.id}
                  className="w-full py-3"
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>

        {prices.length === 0 && (
          <EmptyState
            variant="noData"
            title="No pricing plans available"
            description="There are no pricing plans to display at this time."
          />
        )}
      </div>
    </div>
  );
}
