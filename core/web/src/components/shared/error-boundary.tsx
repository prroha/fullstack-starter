"use client";

import * as React from "react";
import { logger, reportError } from "@/lib/logger";

// =====================================================
// Error Boundary Props & State
// =====================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  fallbackRender?: (props: FallbackProps) => React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// =====================================================
// Error Boundary Class Component
// =====================================================

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("ErrorBoundary", "Component error caught", error, {
      componentStack: errorInfo.componentStack,
    });

    reportError(error, {
      componentStack: errorInfo.componentStack,
      boundary: "ErrorBoundary",
    });

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) return;

    // Reset on resetKeys change
    if (this.props.resetKeys) {
      const hasResetKeyChanged = this.props.resetKeys.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );
      if (hasResetKeyChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    if (hasError && error) {
      if (fallbackRender) {
        return fallbackRender({ error, resetErrorBoundary: this.reset });
      }
      if (fallback) {
        return fallback;
      }
      return <DefaultErrorFallback error={error} resetErrorBoundary={this.reset} />;
    }

    return children;
  }
}

// =====================================================
// Default Error Fallback Component
// =====================================================

function DefaultErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 rounded-lg border border-destructive/20 bg-destructive/5">
      <div className="w-12 h-12 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// =====================================================
// Specialized Error Boundaries
// =====================================================

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary for page sections
 */
function SectionErrorBoundary({
  children,
  sectionName = "This section",
  onError,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-border bg-muted/50">
          <svg
            className="w-8 h-8 text-muted-foreground mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {sectionName} could not be loaded
          </p>
          <button
            onClick={resetErrorBoundary}
            className="text-sm text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for cards/widgets
 */
function CardErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={({ resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center p-4 rounded-md border border-border bg-background text-center">
          <span className="text-muted-foreground text-sm">Failed to load</span>
          <button
            onClick={resetErrorBoundary}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for forms
 */
function FormErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-destructive">
                Form Error
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || "The form encountered an error"}
              </p>
              <button
                onClick={resetErrorBoundary}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Reset Form
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// =====================================================
// useErrorBoundary Hook
// =====================================================

interface UseErrorBoundaryReturn {
  showBoundary: (error: Error) => void;
}

const ErrorBoundaryContext = React.createContext<UseErrorBoundaryReturn | null>(null);

function ErrorBoundaryProvider({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}) {
  const [error, setError] = React.useState<Error | null>(null);

  const showBoundary = React.useCallback((err: Error) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  if (error) {
    throw error;
  }

  return (
    <ErrorBoundaryContext.Provider value={{ showBoundary }}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

function useErrorBoundary(): UseErrorBoundaryReturn {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    // Return a default implementation that throws directly
    return {
      showBoundary: (error: Error) => {
        throw error;
      },
    };
  }
  return context;
}

// =====================================================
// Exports
// =====================================================

export {
  ErrorBoundary,
  DefaultErrorFallback,
  SectionErrorBoundary,
  CardErrorBoundary,
  FormErrorBoundary,
  ErrorBoundaryProvider,
  useErrorBoundary,
};

export type { ErrorBoundaryProps, ErrorBoundaryState, FallbackProps };
