import type { Metadata, Viewport } from "next";

// =====================================================
// SEO Configuration Types
// =====================================================

interface SeoConfig {
  title: string;
  description: string;
  siteName?: string;
  siteUrl?: string;
  locale?: string;
  twitterHandle?: string;
}

interface PageSeoOptions {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}

// =====================================================
// Default Configuration
// =====================================================

const defaultSeoConfig: SeoConfig = {
  title: "My App",
  description: "Built with Fullstack Starter Template",
  siteName: "My App",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://example.com",
  locale: "en_US",
  twitterHandle: undefined,
};

// =====================================================
// SEO Helper Functions
// =====================================================

/**
 * Create SEO configuration for the application
 */
function createSeoConfig(config: Partial<SeoConfig>): SeoConfig {
  return {
    ...defaultSeoConfig,
    ...config,
  };
}

/**
 * Generate metadata for a page
 */
function generateMetadata(
  options: PageSeoOptions,
  config: SeoConfig = defaultSeoConfig
): Metadata {
  const title = options.title
    ? `${options.title} | ${config.siteName}`
    : config.title;
  const description = options.description || config.description;
  const url = options.path
    ? `${config.siteUrl}${options.path}`
    : config.siteUrl;

  const metadata: Metadata = {
    title,
    description,
    keywords: options.keywords,
    authors: [{ name: config.siteName }],
    creator: config.siteName,
    publisher: config.siteName,
    metadataBase: new URL(config.siteUrl || "https://example.com"),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: config.locale,
      url,
      title,
      description,
      siteName: config.siteName,
      images: options.image
        ? [
            {
              url: options.image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: config.twitterHandle,
      images: options.image ? [options.image] : undefined,
    },
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };

  return metadata;
}

/**
 * Generate viewport configuration
 */
function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
  };
}

/**
 * Generate structured data for JSON-LD
 */
function generateJsonLd(
  type: "WebSite" | "Organization" | "Article" | "Product" | "BreadcrumbList",
  data: Record<string, unknown>
): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return JSON.stringify(jsonLd);
}

/**
 * Generate breadcrumb structured data
 */
function generateBreadcrumbJsonLd(
  items: { name: string; href: string }[]
): string {
  return generateJsonLd("BreadcrumbList", {
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href,
    })),
  });
}

/**
 * Generate website structured data
 */
function generateWebsiteJsonLd(config: SeoConfig): string {
  return generateJsonLd("WebSite", {
    name: config.siteName,
    url: config.siteUrl,
    description: config.description,
  });
}

// =====================================================
// JSON-LD Script Component Helper
// =====================================================

interface JsonLdScriptProps {
  data: string;
}

/**
 * Render JSON-LD script tag in a page
 * Usage: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdData }} />
 */
function createJsonLdScript(data: string): {
  type: string;
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: data },
  };
}

// =====================================================
// Exports
// =====================================================

export {
  createSeoConfig,
  generateMetadata,
  generateViewport,
  generateJsonLd,
  generateBreadcrumbJsonLd,
  generateWebsiteJsonLd,
  createJsonLdScript,
  defaultSeoConfig,
};

export type { SeoConfig, PageSeoOptions, JsonLdScriptProps };
