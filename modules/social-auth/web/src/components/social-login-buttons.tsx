'use client';

/**
 * Social Login Buttons Component
 *
 * Provides OAuth login buttons for various social providers.
 * Uses core Button and Spinner components for consistency.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
}

interface SocialLoginButtonsProps {
  /** API base URL for OAuth endpoints */
  apiBaseUrl?: string;
  /** Callback after successful login */
  onSuccess?: (provider: string, userId: string) => void;
  /** Callback on login error */
  onError?: (provider: string, error: string) => void;
  /** Custom return URL after OAuth */
  returnUrl?: string;
  /** Show divider text */
  dividerText?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Show loading state while redirecting */
  showLoadingOnClick?: boolean;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Custom class name */
  className?: string;
}

// =============================================================================
// Social Login Buttons Component
// =============================================================================

export default function SocialLoginButtons({
  apiBaseUrl = '/api',
  onSuccess,
  onError,
  returnUrl,
  dividerText = 'Or continue with',
  size = 'md',
  showLoadingOnClick = true,
  layout = 'vertical',
  className = '',
}: SocialLoginButtonsProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Fetch available providers
  useEffect(() => {
    fetchProviders();
    // Check for OAuth callback
    checkCallback();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/oauth/providers`);
      const data = await response.json();

      if (data.success && data.providers) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      // Fallback to common providers
      setProviders([
        { id: 'google', name: 'Google', enabled: true },
        { id: 'github', name: 'GitHub', enabled: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkCallback = () => {
    // Check URL for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    const provider = params.get('provider');
    const userId = params.get('userId');
    const error = params.get('error');

    if (provider && userId && onSuccess) {
      onSuccess(provider, userId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error && onError) {
      onError(provider || 'unknown', error);
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleLogin = (provider: string) => {
    if (showLoadingOnClick) {
      setLoadingProvider(provider);
    }

    // Build OAuth URL
    let url = `${apiBaseUrl}/oauth/${provider}`;
    if (returnUrl) {
      url += `?returnUrl=${encodeURIComponent(returnUrl)}`;
    }

    // Redirect to OAuth endpoint
    window.location.href = url;
  };

  // Size classes for buttons
  const buttonSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default';

  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Divider */}
      {dividerText && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">{dividerText}</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div
        className={cn(
          layout === 'horizontal' ? 'flex flex-row gap-3' : 'flex flex-col gap-3'
        )}
      >
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            size={buttonSize}
            onClick={() => handleLogin(provider.id)}
            disabled={loadingProvider !== null}
            isLoading={loadingProvider === provider.id}
            className={cn(
              layout === 'horizontal' ? 'flex-1' : 'w-full',
              'justify-center gap-3'
            )}
          >
            {loadingProvider !== provider.id && (
              <ProviderIcon provider={provider.id} className="h-5 w-5" />
            )}
            <span className={layout === 'horizontal' && size === 'sm' ? 'sr-only' : ''}>
              {loadingProvider === provider.id
                ? 'Connecting...'
                : `Continue with ${provider.name}`}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Provider Icons (domain-specific, kept in this module)
// =============================================================================

function ProviderIcon({
  provider,
  className = 'w-5 h-5',
}: {
  provider: string;
  className?: string;
}) {
  switch (provider) {
    case 'google':
      return <GoogleIcon className={className} />;
    case 'github':
      return <GitHubIcon className={className} />;
    case 'apple':
      return <AppleIcon className={className} />;
    case 'facebook':
      return <FacebookIcon className={className} />;
    default:
      return null;
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// =============================================================================
// Individual Button Exports (using core Button)
// =============================================================================

export function GoogleLoginButton({
  onClick,
  loading,
  disabled,
  className = '',
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
      className={cn('w-full justify-center gap-3', className)}
    >
      {!loading && <GoogleIcon className="w-5 h-5" />}
      <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
    </Button>
  );
}

export function GitHubLoginButton({
  onClick,
  loading,
  disabled,
  className = '',
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
      className={cn('w-full justify-center gap-3 bg-gray-900 hover:bg-gray-800', className)}
    >
      {!loading && <GitHubIcon className="w-5 h-5" />}
      <span>{loading ? 'Connecting...' : 'Continue with GitHub'}</span>
    </Button>
  );
}

export function AppleLoginButton({
  onClick,
  loading,
  disabled,
  className = '',
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      isLoading={loading}
      className={cn('w-full justify-center gap-3 bg-black hover:bg-gray-900', className)}
    >
      {!loading && <AppleIcon className="w-5 h-5" />}
      <span>{loading ? 'Connecting...' : 'Continue with Apple'}</span>
    </Button>
  );
}
