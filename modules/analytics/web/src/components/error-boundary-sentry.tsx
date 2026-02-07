'use client';

/**
 * Sentry Error Boundary Component
 *
 * Premium tier feature providing:
 * - Automatic error capturing to Sentry
 * - User-friendly fallback UI
 * - Error recovery options
 *
 * Usage:
 *   import { SentryErrorBoundary } from '@/components/error-boundary-sentry';
 *
 *   <SentryErrorBoundary fallback={<CustomErrorUI />}>
 *     <YourComponent />
 *   </SentryErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { captureException, setContext, addBreadcrumb } from '../lib/error-tracking';

// =============================================================================
// Types
// =============================================================================

export interface ErrorBoundaryProps {
  /** Children components to wrap */
  children: ReactNode;
  /** Custom fallback UI when error occurs */
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when reset/retry is triggered */
  onReset?: () => void;
  /** Custom error message to display */
  errorMessage?: string;
  /** Show error details in development */
  showErrorDetails?: boolean;
  /** Scope name for Sentry context */
  scopeName?: string;
  /** Additional context to send to Sentry */
  context?: Record<string, unknown>;
  /** Level for error capture */
  level?: 'fatal' | 'error' | 'warning';
  /** Fingerprint for grouping similar errors */
  fingerprint?: string[];
}

export interface FallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  eventId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId?: string;
}

// =============================================================================
// Error Boundary Component
// =============================================================================

export class SentryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, scopeName, context, level, fingerprint } = this.props;

    // Update state with error info
    this.setState({ errorInfo });

    // Add breadcrumb for the error
    addBreadcrumb({
      category: 'error-boundary',
      message: `Error caught by ${scopeName || 'ErrorBoundary'}`,
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
        errorMessage: error.message,
      },
    });

    // Set context if provided
    if (scopeName || context) {
      setContext(scopeName || 'error-boundary', {
        ...(context || {}),
        componentStack: errorInfo.componentStack,
      });
    }

    // Capture exception to Sentry
    const eventId = captureException(error, {
      level: level || 'error',
      fingerprint,
      tags: {
        'error.boundary': scopeName || 'default',
      },
      extra: {
        componentStack: errorInfo.componentStack,
        ...context,
      },
    });

    this.setState({ eventId });

    // Call custom error handler
    onError?.(error, errorInfo);
  }

  resetError = (): void => {
    const { onReset } = this.props;

    addBreadcrumb({
      category: 'error-boundary',
      message: 'Error boundary reset',
      level: 'info',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: undefined,
    });

    onReset?.();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback, errorMessage, showErrorDetails } = this.props;

    if (hasError && error && errorInfo) {
      // Custom fallback component
      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo,
          resetError: this.resetError,
          eventId,
        });
      }

      // Custom fallback element
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          eventId={eventId}
          errorMessage={errorMessage}
          showErrorDetails={showErrorDetails ?? process.env.NODE_ENV === 'development'}
        />
      );
    }

    return children;
  }
}

// =============================================================================
// Default Error Fallback UI
// =============================================================================

interface DefaultErrorFallbackProps extends FallbackProps {
  errorMessage?: string;
  showErrorDetails?: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  eventId,
  errorMessage,
  showErrorDetails,
}: DefaultErrorFallbackProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '2rem',
        margin: '1rem',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        maxWidth: '600px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 style={{ margin: 0, color: '#dc2626', fontSize: '1.25rem', fontWeight: 600 }}>
          Something went wrong
        </h2>
      </div>

      <p style={{ color: '#7f1d1d', marginBottom: '1rem', lineHeight: 1.5 }}>
        {errorMessage || 'An unexpected error occurred. Our team has been notified.'}
      </p>

      {eventId && (
        <p style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Error ID: <code style={{ backgroundColor: '#fee2e2', padding: '0.125rem 0.25rem', borderRadius: '4px' }}>{eventId}</code>
        </p>
      )}

      {showErrorDetails && (
        <details style={{ marginBottom: '1rem' }}>
          <summary
            style={{
              cursor: 'pointer',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
            }}
          >
            Error Details
          </summary>
          <div
            style={{
              backgroundColor: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '200px',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#f87171' }}>{error.name}:</strong> {error.message}
            </div>
            {error.stack && (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {error.stack}
              </pre>
            )}
            {errorInfo.componentStack && (
              <>
                <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#60a5fa' }}>Component Stack:</strong>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </details>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={resetError}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'white',
            color: '#dc2626',
            border: '1px solid #dc2626',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Higher-Order Component
// =============================================================================

/**
 * HOC to wrap a component with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary = (props: P) => (
    <SentryErrorBoundary {...errorBoundaryProps} scopeName={errorBoundaryProps?.scopeName || displayName}>
      <WrappedComponent {...props} />
    </SentryErrorBoundary>
  );

  WithErrorBoundary.displayName = `withSentryErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// =============================================================================
// App-Level Error Boundary
// =============================================================================

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Custom error page component */
  ErrorPage?: React.ComponentType<FallbackProps>;
}

/**
 * App-level error boundary with full-page fallback
 */
export function AppErrorBoundary({ children, ErrorPage }: AppErrorBoundaryProps) {
  return (
    <SentryErrorBoundary
      scopeName="app"
      level="fatal"
      fallback={(props) =>
        ErrorPage ? (
          <ErrorPage {...props} />
        ) : (
          <FullPageErrorFallback {...props} />
        )
      }
    >
      {children}
    </SentryErrorBoundary>
  );
}

function FullPageErrorFallback({ error, resetError, eventId }: FallbackProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
          Oops! Something went wrong
        </h1>

        <p style={{ color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
        </p>

        {eventId && (
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            Reference: {eventId}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={resetError}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Go Home
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '2rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem' }}>
              Developer Info
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#1f2937',
                color: '#f9fafb',
                borderRadius: '8px',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '200px',
                textAlign: 'left',
              }}
            >
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default SentryErrorBoundary;
