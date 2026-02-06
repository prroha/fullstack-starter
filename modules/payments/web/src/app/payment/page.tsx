'use client';

import { useState, useEffect } from 'react';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchPrices();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Select a plan that works best for you
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {prices.map((price) => (
            <div
              key={price.id}
              className="bg-white rounded-xl shadow-lg p-8 flex flex-col"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {price.productName || 'Plan'}
              </h2>
              {price.productDescription && (
                <p className="text-gray-600 mb-4">{price.productDescription}</p>
              )}
              <div className="mt-auto">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {formatPrice(price.unitAmount, price.currency)}
                </div>
                <p className="text-gray-500 mb-6">
                  {formatInterval(price.interval, price.intervalCount)}
                </p>
                <button
                  onClick={() => handleCheckout(price.id)}
                  disabled={checkoutLoading && selectedPriceId === price.id}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {checkoutLoading && selectedPriceId === price.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {prices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No pricing plans available</p>
          </div>
        )}
      </div>
    </div>
  );
}
