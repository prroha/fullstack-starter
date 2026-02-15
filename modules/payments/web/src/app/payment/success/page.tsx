'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/feedback/alert';
import { Check } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Payment Successful!
        </h1>

        <p className="text-muted-foreground mb-6">
          Thank you for your purchase. Your subscription is now active.
        </p>

        {error && (
          <Alert variant="warning" className="mb-4 text-left">
            Note: {error}. Please check your email for confirmation.
          </Alert>
        )}

        {session && (
          <div className="bg-muted rounded-lg p-4 mb-6 text-left">
            {session.customerEmail && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">
                  {session.customerEmail}
                </span>
              </div>
            )}
            {session.amountTotal && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">
                  {formatAmount(session.amountTotal, session.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600 capitalize">
                {session.paymentStatus || 'Paid'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full py-3" size="lg">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full py-3" size="lg">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mt-6">
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
