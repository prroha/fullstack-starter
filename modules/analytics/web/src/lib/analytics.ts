/**
 * Analytics Service
 *
 * A unified analytics interface supporting multiple providers:
 * - Mixpanel
 * - PostHog
 * - Custom/API-based
 *
 * Usage:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.track('button_clicked', { buttonId: 'signup' });
 */

// =============================================================================
// Types
// =============================================================================

export type AnalyticsProvider = 'mixpanel' | 'posthog' | 'custom' | 'none';

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  token?: string;
  apiUrl?: string;
  debug?: boolean;
  enabled?: boolean;
}

export interface UserProperties {
  email?: string;
  name?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface EventProperties {
  [key: string]: string | number | boolean | undefined | null;
}

interface AnalyticsProviderInterface {
  init(config: AnalyticsConfig): void;
  identify(userId: string, properties?: UserProperties): void;
  track(event: string, properties?: EventProperties): void;
  page(name?: string, properties?: EventProperties): void;
  reset(): void;
}

// =============================================================================
// Mixpanel Provider
// =============================================================================

class MixpanelProvider implements AnalyticsProviderInterface {
  private mixpanel: typeof import('mixpanel-browser') | null = null;
  private debug = false;

  init(config: AnalyticsConfig): void {
    this.debug = config.debug || false;

    if (typeof window === 'undefined') return;

    import('mixpanel-browser').then((mp) => {
      this.mixpanel = mp.default;
      this.mixpanel.init(config.token!, {
        debug: this.debug,
        track_pageview: false,
        persistence: 'localStorage',
      });
      this.log('Mixpanel initialized');
    });
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.mixpanel) return;
    this.mixpanel.identify(userId);
    if (properties) {
      this.mixpanel.people.set(properties);
    }
    this.log('Identified user:', userId);
  }

  track(event: string, properties?: EventProperties): void {
    if (!this.mixpanel) return;
    this.mixpanel.track(event, properties);
    this.log('Tracked event:', event, properties);
  }

  page(name?: string, properties?: EventProperties): void {
    if (!this.mixpanel) return;
    this.mixpanel.track('Page View', {
      page: name || window.location.pathname,
      ...properties,
    });
    this.log('Page view:', name || window.location.pathname);
  }

  reset(): void {
    if (!this.mixpanel) return;
    this.mixpanel.reset();
    this.log('Analytics reset');
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Analytics:Mixpanel]', ...args);
    }
  }
}

// =============================================================================
// PostHog Provider
// =============================================================================

class PostHogProvider implements AnalyticsProviderInterface {
  private posthog: { default: {
    init: (token: string, options: object) => void;
    identify: (userId: string, properties?: UserProperties) => void;
    capture: (event: string, properties?: EventProperties) => void;
    reset: () => void;
  } } | null = null;
  private debug = false;

  init(config: AnalyticsConfig): void {
    this.debug = config.debug || false;

    if (typeof window === 'undefined') return;

    import('posthog-js').then((ph) => {
      this.posthog = ph;
      this.posthog.default.init(config.token!, {
        api_host: config.apiUrl || 'https://app.posthog.com',
        loaded: () => this.log('PostHog initialized'),
        autocapture: false,
      });
    }).catch(() => {
      console.warn('[Analytics] PostHog not installed. Run: npm install posthog-js');
    });
  }

  identify(userId: string, properties?: UserProperties): void {
    if (!this.posthog) return;
    this.posthog.default.identify(userId, properties);
    this.log('Identified user:', userId);
  }

  track(event: string, properties?: EventProperties): void {
    if (!this.posthog) return;
    this.posthog.default.capture(event, properties);
    this.log('Tracked event:', event, properties);
  }

  page(name?: string, properties?: EventProperties): void {
    if (!this.posthog) return;
    this.posthog.default.capture('$pageview', {
      $current_url: window.location.href,
      page_name: name,
      ...properties,
    });
    this.log('Page view:', name || window.location.pathname);
  }

  reset(): void {
    if (!this.posthog) return;
    this.posthog.default.reset();
    this.log('Analytics reset');
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Analytics:PostHog]', ...args);
    }
  }
}

// =============================================================================
// Custom API Provider
// =============================================================================

class CustomProvider implements AnalyticsProviderInterface {
  private apiUrl = '';
  private debug = false;
  private userId: string | null = null;

  init(config: AnalyticsConfig): void {
    this.apiUrl = config.apiUrl || '/api/analytics';
    this.debug = config.debug || false;
    this.log('Custom analytics initialized');
  }

  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    this.sendEvent('identify', { userId, ...properties });
    this.log('Identified user:', userId);
  }

  track(event: string, properties?: EventProperties): void {
    this.sendEvent('track', {
      event,
      userId: this.userId,
      properties,
      timestamp: new Date().toISOString(),
    });
    this.log('Tracked event:', event, properties);
  }

  page(name?: string, properties?: EventProperties): void {
    this.sendEvent('page', {
      page: name || window.location.pathname,
      url: window.location.href,
      userId: this.userId,
      properties,
      timestamp: new Date().toISOString(),
    });
    this.log('Page view:', name || window.location.pathname);
  }

  reset(): void {
    this.userId = null;
    this.log('Analytics reset');
  }

  private async sendEvent(type: string, data: object): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }),
      });
    } catch (error) {
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Analytics:Custom]', ...args);
    }
  }
}

// =============================================================================
// No-op Provider (disabled analytics)
// =============================================================================

class NoopProvider implements AnalyticsProviderInterface {
  init(): void {}
  identify(): void {}
  track(): void {}
  page(): void {}
  reset(): void {}
}

// =============================================================================
// Analytics Service
// =============================================================================

class Analytics {
  private provider: AnalyticsProviderInterface = new NoopProvider();
  private initialized = false;
  private queue: Array<() => void> = [];

  /**
   * Initialize analytics with a provider
   */
  init(config: AnalyticsConfig): void {
    if (this.initialized) return;

    const enabled = config.enabled ?? process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';

    if (!enabled) {
      this.provider = new NoopProvider();
      this.initialized = true;
      return;
    }

    switch (config.provider) {
      case 'mixpanel':
        this.provider = new MixpanelProvider();
        break;
      case 'posthog':
        this.provider = new PostHogProvider();
        break;
      case 'custom':
        this.provider = new CustomProvider();
        break;
      default:
        this.provider = new NoopProvider();
    }

    this.provider.init(config);
    this.initialized = true;

    // Process queued events
    this.queue.forEach((fn) => fn());
    this.queue = [];
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties): void {
    if (!this.initialized) {
      this.queue.push(() => this.identify(userId, properties));
      return;
    }
    this.provider.identify(userId, properties);
  }

  /**
   * Track an event
   */
  track(event: string, properties?: EventProperties): void {
    if (!this.initialized) {
      this.queue.push(() => this.track(event, properties));
      return;
    }
    this.provider.track(event, properties);
  }

  /**
   * Track a page view
   */
  page(name?: string, properties?: EventProperties): void {
    if (!this.initialized) {
      this.queue.push(() => this.page(name, properties));
      return;
    }
    this.provider.page(name, properties);
  }

  /**
   * Reset analytics (on logout)
   */
  reset(): void {
    if (this.initialized) {
      this.provider.reset();
    }
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const analytics = new Analytics();

// =============================================================================
// React Hook
// =============================================================================

import { useEffect, useCallback } from 'react';

/**
 * React hook for analytics
 */
export function useAnalytics() {
  const track = useCallback((event: string, properties?: EventProperties) => {
    analytics.track(event, properties);
  }, []);

  const identify = useCallback((userId: string, properties?: UserProperties) => {
    analytics.identify(userId, properties);
  }, []);

  const page = useCallback((name?: string, properties?: EventProperties) => {
    analytics.page(name, properties);
  }, []);

  return { track, identify, page, reset: analytics.reset.bind(analytics) };
}

/**
 * Track page views automatically
 */
export function usePageTracking() {
  useEffect(() => {
    analytics.page();
  }, []);
}

// =============================================================================
// Auto-initialize
// =============================================================================

if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const provider = (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER as AnalyticsProvider) || 'mixpanel';

  if (token) {
    analytics.init({
      provider,
      token,
      debug: process.env.NODE_ENV === 'development',
    });
  }
}

export default analytics;
