'use client';

import Link from 'next/link';

// =============================================================================
// Cancel Page Component
// =============================================================================

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-warning/10 mb-6">
          <svg
            className="h-8 w-8 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Payment Canceled
        </h1>

        <p className="text-muted-foreground mb-8">
          Your payment was not completed. No charges have been made to your
          account.
        </p>

        <div className="space-y-3">
          <Link
            href="/payment"
            className="block w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-muted-foreground text-sm mb-4">
            Need help? Contact our support team
          </p>
          <a
            href="mailto:support@example.com"
            className="text-primary hover:text-primary/80 font-medium"
          >
            support@example.com
          </a>
        </div>
      </div>
    </div>
  );
}
