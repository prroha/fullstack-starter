'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// =============================================================================
// Types
// =============================================================================

interface SessionDetails {
  status: string;
  paymentStatus: string;
  customerEmail: string | null;
  amountTotal: number | null;
  currency: string | null;
}

// =============================================================================
// Success Content Component
// =============================================================================

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`/api/payment/checkout/${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setSession(data.session);
      } else {
        setError('Could not verify payment');
      }
    } catch (err) {
      console.error('Fetch session error:', err);
      setError('Could not verify payment');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (!amount || !currency) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your subscription is now active.
        </p>

        {error && (
          <p className="text-amber-600 text-sm mb-4">
            Note: {error}. Please check your email for confirmation.
          </p>
        )}

        {session && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {session.customerEmail && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">
                  {session.customerEmail}
                </span>
              </div>
            )}
            {session.amountTotal && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-900">
                  {formatAmount(session.amountTotal, session.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Status</span>
              <span className="font-medium text-green-600 capitalize">
                {session.paymentStatus || 'Paid'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-gray-400 text-sm mt-6">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Success Page Component (with Suspense)
// =============================================================================

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
