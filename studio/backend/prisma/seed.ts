/**
 * Starter Studio Database Seed Script
 *
 * Populates the database with:
 * - Pricing Tiers (5 tiers)
 * - Modules (10 categories)
 * - Features (35+ features across modules)
 * - Templates (5 pre-configured bundles)
 * - Bundle Discounts (3 promotional bundles)
 */

import { PrismaClient, CouponType } from "@prisma/client";

const prisma = new PrismaClient();

// =====================================================
// PRICING TIERS
// =====================================================
const pricingTiers = [
  {
    slug: "starter",
    name: "Starter",
    description: "Perfect for side projects and learning. Get started with essential features at no cost.",
    price: 0, // Free
    includedFeatures: [
      "auth.basic",
      "ui.components",
      "storage.local",
    ],
    isPopular: false,
    displayOrder: 1,
    color: "#6B7280", // gray
  },
  {
    slug: "basic",
    name: "Basic",
    description: "Essential features for small projects. Perfect for MVPs and startups getting started.",
    price: 4900, // $49
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "ui.components",
      "ui.themes",
      "storage.local",
      "storage.upload",
      "analytics.basic",
    ],
    isPopular: false,
    displayOrder: 2,
    color: "#3B82F6", // blue
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Most popular choice for growing businesses. Includes all the features you need to scale.",
    price: 14900, // $149
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "auth.mfa",
      "security.rbac",
      "payments.stripe",
      "payments.webhooks",
      "ui.components",
      "ui.themes",
      "ui.forms",
      "storage.local",
      "storage.upload",
      "storage.s3",
      "comms.email",
      "analytics.basic",
      "analytics.dashboard",
      "mobile.core",
    ],
    isPopular: true,
    displayOrder: 3,
    color: "#8B5CF6", // purple
  },
  {
    slug: "business",
    name: "Business",
    description: "Advanced features for established businesses. Everything in Pro plus premium integrations.",
    price: 29900, // $299
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "auth.mfa",
      "auth.sso",
      "security.rbac",
      "security.audit",
      "payments.stripe",
      "payments.webhooks",
      "payments.subscriptions",
      "ui.components",
      "ui.themes",
      "ui.forms",
      "ui.dashboard",
      "storage.local",
      "storage.upload",
      "storage.s3",
      "storage.cdn",
      "comms.email",
      "comms.push",
      "analytics.basic",
      "analytics.dashboard",
      "analytics.reports",
      "mobile.core",
      "mobile.push",
      "infra.docker",
      "integrations.webhooks",
    ],
    isPopular: false,
    displayOrder: 4,
    color: "#F59E0B", // amber
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "All features included. Best for large teams and organizations with complex requirements.",
    price: 59900, // $599
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "auth.mfa",
      "auth.sso",
      "auth.magic-link",
      "security.rbac",
      "security.audit",
      "security.encryption",
      "payments.stripe",
      "payments.webhooks",
      "payments.subscriptions",
      "payments.multi-currency",
      "ui.components",
      "ui.themes",
      "ui.forms",
      "ui.dashboard",
      "ui.charts",
      "storage.local",
      "storage.upload",
      "storage.s3",
      "storage.cdn",
      "storage.backup",
      "comms.email",
      "comms.push",
      "comms.sms",
      "comms.realtime",
      "analytics.basic",
      "analytics.dashboard",
      "analytics.reports",
      "analytics.export",
      "mobile.core",
      "mobile.push",
      "mobile.offline",
      "infra.docker",
      "infra.kubernetes",
      "infra.ci-cd",
      "integrations.webhooks",
      "integrations.api",
      "integrations.zapier",
    ],
    isPopular: false,
    displayOrder: 5,
    color: "#10B981", // emerald
  },
];

// =====================================================
// MODULES
// =====================================================
const modules = [
  {
    slug: "auth",
    name: "Authentication",
    description: "User authentication and identity management solutions including social login, MFA, and SSO.",
    category: "auth",
    iconName: "Shield",
    displayOrder: 1,
  },
  {
    slug: "security",
    name: "Security",
    description: "Advanced security features including role-based access control, audit logs, and encryption.",
    category: "security",
    iconName: "Lock",
    displayOrder: 2,
  },
  {
    slug: "payments",
    name: "Payments",
    description: "Payment processing, subscriptions, and billing management with Stripe integration.",
    category: "payments",
    iconName: "CreditCard",
    displayOrder: 3,
  },
  {
    slug: "storage",
    name: "Storage",
    description: "File storage, upload handling, and CDN integration for all your storage needs.",
    category: "storage",
    iconName: "HardDrive",
    displayOrder: 4,
  },
  {
    slug: "comms",
    name: "Communications",
    description: "Email, push notifications, SMS, and real-time messaging capabilities.",
    category: "comms",
    iconName: "MessageSquare",
    displayOrder: 5,
  },
  {
    slug: "ui",
    name: "UI Components",
    description: "Pre-built UI components, themes, forms, and dashboard templates.",
    category: "ui",
    iconName: "LayoutGrid",
    displayOrder: 6,
  },
  {
    slug: "analytics",
    name: "Analytics",
    description: "Analytics dashboards, reporting, and data export capabilities.",
    category: "analytics",
    iconName: "BarChart3",
    displayOrder: 7,
  },
  {
    slug: "mobile",
    name: "Mobile",
    description: "Cross-platform mobile app features including offline support and push notifications.",
    category: "mobile",
    iconName: "Smartphone",
    displayOrder: 8,
  },
  {
    slug: "infra",
    name: "Infrastructure",
    description: "Deployment and infrastructure tools including Docker, Kubernetes, and CI/CD pipelines.",
    category: "infrastructure",
    iconName: "Server",
    displayOrder: 9,
  },
  {
    slug: "integrations",
    name: "Integrations",
    description: "Third-party integrations, webhooks, and API management.",
    category: "integrations",
    iconName: "Puzzle",
    displayOrder: 10,
  },
];

// =====================================================
// FEATURES
// =====================================================
interface FeatureData {
  slug: string;
  name: string;
  description: string;
  moduleSlug: string;
  price: number;
  tier: string | null;
  requires: string[];
  conflicts: string[];
  iconName: string | null;
  displayOrder: number;
  isNew: boolean;
  isPopular: boolean;
  envVars?: { key: string; description: string; required: boolean; default?: string }[];
  npmPackages?: { name: string; version: string; dev?: boolean }[];
}

const features: FeatureData[] = [
  // AUTH MODULE
  {
    slug: "auth.basic",
    name: "Basic Authentication",
    description: "Email/password authentication with secure session management and password reset functionality.",
    moduleSlug: "auth",
    price: 0,
    tier: null,
    requires: [],
    conflicts: [],
    iconName: "Key",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
    envVars: [
      { key: "JWT_SECRET", description: "Secret key for JWT token signing", required: true },
      { key: "JWT_EXPIRES_IN", description: "JWT token expiration time", required: false, default: "7d" },
    ],
    npmPackages: [
      { name: "jsonwebtoken", version: "^9.0.0" },
      { name: "bcryptjs", version: "^2.4.3" },
    ],
  },
  {
    slug: "auth.social",
    name: "Social Login",
    description: "OAuth integration for Google, GitHub, and other social providers.",
    moduleSlug: "auth",
    price: 1900, // $19
    tier: "basic",
    requires: ["auth.basic"],
    conflicts: [],
    iconName: "Users",
    displayOrder: 2,
    isNew: false,
    isPopular: true,
    envVars: [
      { key: "GOOGLE_CLIENT_ID", description: "Google OAuth client ID", required: false },
      { key: "GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret", required: false },
      { key: "GITHUB_CLIENT_ID", description: "GitHub OAuth client ID", required: false },
      { key: "GITHUB_CLIENT_SECRET", description: "GitHub OAuth client secret", required: false },
    ],
    npmPackages: [{ name: "passport", version: "^0.7.0" }],
  },
  {
    slug: "auth.mfa",
    name: "Multi-Factor Authentication",
    description: "TOTP-based two-factor authentication with backup codes and device management.",
    moduleSlug: "auth",
    price: 2900, // $29
    tier: "pro",
    requires: ["auth.basic"],
    conflicts: [],
    iconName: "Fingerprint",
    displayOrder: 3,
    isNew: false,
    isPopular: false,
    npmPackages: [{ name: "otplib", version: "^12.0.1" }],
  },
  {
    slug: "auth.sso",
    name: "Single Sign-On (SSO)",
    description: "Enterprise SSO with SAML 2.0 and OpenID Connect support.",
    moduleSlug: "auth",
    price: 4900, // $49
    tier: "business",
    requires: ["auth.basic"],
    conflicts: [],
    iconName: "Building2",
    displayOrder: 4,
    isNew: true,
    isPopular: false,
    npmPackages: [{ name: "passport-saml", version: "^4.0.0" }],
  },
  {
    slug: "auth.magic-link",
    name: "Magic Link Authentication",
    description: "Passwordless authentication via email magic links for seamless user experience.",
    moduleSlug: "auth",
    price: 1900, // $19
    tier: "enterprise",
    requires: ["auth.basic", "comms.email"],
    conflicts: [],
    iconName: "Wand2",
    displayOrder: 5,
    isNew: true,
    isPopular: false,
  },

  // SECURITY MODULE
  {
    slug: "security.rbac",
    name: "Role-Based Access Control",
    description: "Flexible RBAC system with roles, permissions, and resource-level access control.",
    moduleSlug: "security",
    price: 2900, // $29
    tier: "pro",
    requires: ["auth.basic"],
    conflicts: [],
    iconName: "Shield",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "security.audit",
    name: "Audit Logging",
    description: "Comprehensive audit logs for all user and system actions with retention policies.",
    moduleSlug: "security",
    price: 2900, // $29
    tier: "business",
    requires: [],
    conflicts: [],
    iconName: "FileSearch",
    displayOrder: 2,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "security.encryption",
    name: "Data Encryption",
    description: "End-to-end encryption for sensitive data with key rotation and management.",
    moduleSlug: "security",
    price: 3900, // $39
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "KeyRound",
    displayOrder: 3,
    isNew: false,
    isPopular: false,
  },

  // PAYMENTS MODULE
  {
    slug: "payments.stripe",
    name: "Stripe Payments",
    description: "Full Stripe integration for one-time payments, checkout sessions, and payment methods.",
    moduleSlug: "payments",
    price: 3900, // $39
    tier: "pro",
    requires: [],
    conflicts: [],
    iconName: "CreditCard",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
    envVars: [
      { key: "STRIPE_SECRET_KEY", description: "Stripe secret API key", required: true },
      { key: "STRIPE_PUBLISHABLE_KEY", description: "Stripe publishable key", required: true },
    ],
    npmPackages: [{ name: "stripe", version: "^14.0.0" }],
  },
  {
    slug: "payments.webhooks",
    name: "Payment Webhooks",
    description: "Webhook handling for payment events, refunds, disputes, and subscription changes.",
    moduleSlug: "payments",
    price: 1900, // $19
    tier: "pro",
    requires: ["payments.stripe"],
    conflicts: [],
    iconName: "Webhook",
    displayOrder: 2,
    isNew: false,
    isPopular: false,
    envVars: [
      { key: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook signing secret", required: true },
    ],
  },
  {
    slug: "payments.subscriptions",
    name: "Subscription Management",
    description: "Recurring billing, subscription plans, trials, and customer portal.",
    moduleSlug: "payments",
    price: 4900, // $49
    tier: "business",
    requires: ["payments.stripe", "payments.webhooks"],
    conflicts: [],
    iconName: "RefreshCw",
    displayOrder: 3,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "payments.multi-currency",
    name: "Multi-Currency Support",
    description: "Accept payments in multiple currencies with automatic conversion and pricing rules.",
    moduleSlug: "payments",
    price: 2900, // $29
    tier: "enterprise",
    requires: ["payments.stripe"],
    conflicts: [],
    iconName: "Globe",
    displayOrder: 4,
    isNew: true,
    isPopular: false,
  },

  // STORAGE MODULE
  {
    slug: "storage.local",
    name: "Local Storage",
    description: "Local file storage for development and small-scale applications.",
    moduleSlug: "storage",
    price: 0,
    tier: null,
    requires: [],
    conflicts: [],
    iconName: "Folder",
    displayOrder: 1,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "storage.upload",
    name: "File Upload",
    description: "Secure file upload handling with validation, size limits, and progress tracking.",
    moduleSlug: "storage",
    price: 1900, // $19
    tier: "basic",
    requires: [],
    conflicts: [],
    iconName: "Upload",
    displayOrder: 2,
    isNew: false,
    isPopular: true,
    npmPackages: [{ name: "multer", version: "^2.0.0" }],
  },
  {
    slug: "storage.s3",
    name: "S3 Storage",
    description: "AWS S3 integration for scalable cloud storage with pre-signed URLs.",
    moduleSlug: "storage",
    price: 2900, // $29
    tier: "pro",
    requires: ["storage.upload"],
    conflicts: [],
    iconName: "Cloud",
    displayOrder: 3,
    isNew: false,
    isPopular: true,
    envVars: [
      { key: "AWS_ACCESS_KEY_ID", description: "AWS access key", required: true },
      { key: "AWS_SECRET_ACCESS_KEY", description: "AWS secret key", required: true },
      { key: "AWS_S3_BUCKET", description: "S3 bucket name", required: true },
      { key: "AWS_REGION", description: "AWS region", required: false, default: "us-east-1" },
    ],
    npmPackages: [{ name: "@aws-sdk/client-s3", version: "^3.0.0" }],
  },
  {
    slug: "storage.cdn",
    name: "CDN Integration",
    description: "CloudFront or other CDN integration for fast global content delivery.",
    moduleSlug: "storage",
    price: 2900, // $29
    tier: "business",
    requires: ["storage.s3"],
    conflicts: [],
    iconName: "Zap",
    displayOrder: 4,
    isNew: false,
    isPopular: false,
    envVars: [{ key: "CDN_BASE_URL", description: "CDN base URL", required: true }],
  },
  {
    slug: "storage.backup",
    name: "Automated Backups",
    description: "Scheduled backups with retention policies and point-in-time recovery.",
    moduleSlug: "storage",
    price: 3900, // $39
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "Archive",
    displayOrder: 5,
    isNew: false,
    isPopular: false,
  },

  // COMMUNICATIONS MODULE
  {
    slug: "comms.email",
    name: "Email Service",
    description: "Transactional email with templates, scheduling, and delivery tracking.",
    moduleSlug: "comms",
    price: 2900, // $29
    tier: "pro",
    requires: [],
    conflicts: [],
    iconName: "Mail",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
    envVars: [
      { key: "SMTP_HOST", description: "SMTP server host", required: true },
      { key: "SMTP_PORT", description: "SMTP server port", required: true },
      { key: "SMTP_USER", description: "SMTP username", required: true },
      { key: "SMTP_PASS", description: "SMTP password", required: true },
    ],
    npmPackages: [{ name: "nodemailer", version: "^6.9.0" }],
  },
  {
    slug: "comms.push",
    name: "Push Notifications",
    description: "Web and mobile push notifications with segmentation and scheduling.",
    moduleSlug: "comms",
    price: 2900, // $29
    tier: "business",
    requires: [],
    conflicts: [],
    iconName: "Bell",
    displayOrder: 2,
    isNew: false,
    isPopular: false,
    npmPackages: [{ name: "web-push", version: "^3.6.0" }],
  },
  {
    slug: "comms.sms",
    name: "SMS Messaging",
    description: "SMS notifications and verification via Twilio integration.",
    moduleSlug: "comms",
    price: 2900, // $29
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "MessageCircle",
    displayOrder: 3,
    isNew: false,
    isPopular: false,
    envVars: [
      { key: "TWILIO_ACCOUNT_SID", description: "Twilio account SID", required: true },
      { key: "TWILIO_AUTH_TOKEN", description: "Twilio auth token", required: true },
      { key: "TWILIO_PHONE_NUMBER", description: "Twilio phone number", required: true },
    ],
    npmPackages: [{ name: "twilio", version: "^4.0.0" }],
  },
  {
    slug: "comms.realtime",
    name: "Real-time Messaging",
    description: "WebSocket-based real-time communication for chat, notifications, and live updates.",
    moduleSlug: "comms",
    price: 3900, // $39
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "Radio",
    displayOrder: 4,
    isNew: true,
    isPopular: true,
    npmPackages: [{ name: "socket.io", version: "^4.7.0" }],
  },

  // UI MODULE
  {
    slug: "ui.components",
    name: "Core UI Components",
    description: "Essential UI components including buttons, inputs, modals, and cards.",
    moduleSlug: "ui",
    price: 0,
    tier: null,
    requires: [],
    conflicts: [],
    iconName: "Blocks",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "ui.themes",
    name: "Theme System",
    description: "Dark/light mode with customizable color schemes and design tokens.",
    moduleSlug: "ui",
    price: 1900, // $19
    tier: "basic",
    requires: ["ui.components"],
    conflicts: [],
    iconName: "Palette",
    displayOrder: 2,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "ui.forms",
    name: "Advanced Forms",
    description: "Form validation, multi-step wizards, and dynamic form builders.",
    moduleSlug: "ui",
    price: 2900, // $29
    tier: "pro",
    requires: ["ui.components"],
    conflicts: [],
    iconName: "ClipboardList",
    displayOrder: 3,
    isNew: false,
    isPopular: false,
    npmPackages: [
      { name: "react-hook-form", version: "^7.0.0" },
      { name: "zod", version: "^3.22.0" },
    ],
  },
  {
    slug: "ui.dashboard",
    name: "Dashboard Layout",
    description: "Pre-built dashboard layouts with sidebar navigation and responsive design.",
    moduleSlug: "ui",
    price: 2900, // $29
    tier: "business",
    requires: ["ui.components"],
    conflicts: [],
    iconName: "LayoutDashboard",
    displayOrder: 4,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "ui.charts",
    name: "Charts & Visualizations",
    description: "Interactive charts, graphs, and data visualization components.",
    moduleSlug: "ui",
    price: 2900, // $29
    tier: "enterprise",
    requires: ["ui.components"],
    conflicts: [],
    iconName: "PieChart",
    displayOrder: 5,
    isNew: false,
    isPopular: false,
    npmPackages: [{ name: "recharts", version: "^2.10.0" }],
  },

  // ANALYTICS MODULE
  {
    slug: "analytics.basic",
    name: "Basic Analytics",
    description: "Page views, user sessions, and basic event tracking.",
    moduleSlug: "analytics",
    price: 0,
    tier: "basic",
    requires: [],
    conflicts: [],
    iconName: "Activity",
    displayOrder: 1,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "analytics.dashboard",
    name: "Analytics Dashboard",
    description: "Visual analytics dashboard with key metrics and trend analysis.",
    moduleSlug: "analytics",
    price: 2900, // $29
    tier: "pro",
    requires: ["analytics.basic"],
    conflicts: [],
    iconName: "BarChart2",
    displayOrder: 2,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "analytics.reports",
    name: "Custom Reports",
    description: "Create and schedule custom reports with filters and date ranges.",
    moduleSlug: "analytics",
    price: 2900, // $29
    tier: "business",
    requires: ["analytics.dashboard"],
    conflicts: [],
    iconName: "FileText",
    displayOrder: 3,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "analytics.export",
    name: "Data Export",
    description: "Export analytics data to CSV, Excel, or JSON formats.",
    moduleSlug: "analytics",
    price: 1900, // $19
    tier: "enterprise",
    requires: ["analytics.basic"],
    conflicts: [],
    iconName: "Download",
    displayOrder: 4,
    isNew: false,
    isPopular: false,
  },

  // MOBILE MODULE
  {
    slug: "mobile.core",
    name: "Mobile App Core",
    description: "React Native / Flutter mobile app foundation with navigation and state management.",
    moduleSlug: "mobile",
    price: 4900, // $49
    tier: "pro",
    requires: [],
    conflicts: [],
    iconName: "Smartphone",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "mobile.push",
    name: "Mobile Push Notifications",
    description: "iOS and Android push notifications with Firebase Cloud Messaging.",
    moduleSlug: "mobile",
    price: 2900, // $29
    tier: "business",
    requires: ["mobile.core"],
    conflicts: [],
    iconName: "BellRing",
    displayOrder: 2,
    isNew: false,
    isPopular: false,
    envVars: [{ key: "FCM_SERVER_KEY", description: "Firebase Cloud Messaging server key", required: true }],
  },
  {
    slug: "mobile.offline",
    name: "Offline Support",
    description: "Offline-first architecture with data sync and conflict resolution.",
    moduleSlug: "mobile",
    price: 3900, // $39
    tier: "enterprise",
    requires: ["mobile.core"],
    conflicts: [],
    iconName: "WifiOff",
    displayOrder: 3,
    isNew: true,
    isPopular: false,
  },

  // INFRASTRUCTURE MODULE
  {
    slug: "infra.docker",
    name: "Docker Configuration",
    description: "Production-ready Dockerfile and docker-compose for local development.",
    moduleSlug: "infra",
    price: 1900, // $19
    tier: "business",
    requires: [],
    conflicts: [],
    iconName: "Box",
    displayOrder: 1,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "infra.kubernetes",
    name: "Kubernetes Manifests",
    description: "Kubernetes deployment manifests with Helm charts for production deployment.",
    moduleSlug: "infra",
    price: 3900, // $39
    tier: "enterprise",
    requires: ["infra.docker"],
    conflicts: [],
    iconName: "Network",
    displayOrder: 2,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "infra.ci-cd",
    name: "CI/CD Pipelines",
    description: "GitHub Actions workflows for automated testing, building, and deployment.",
    moduleSlug: "infra",
    price: 2900, // $29
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "GitBranch",
    displayOrder: 3,
    isNew: false,
    isPopular: true,
  },

  // INTEGRATIONS MODULE
  {
    slug: "integrations.webhooks",
    name: "Outgoing Webhooks",
    description: "Send webhook notifications to external services on key events.",
    moduleSlug: "integrations",
    price: 1900, // $19
    tier: "business",
    requires: [],
    conflicts: [],
    iconName: "ExternalLink",
    displayOrder: 1,
    isNew: false,
    isPopular: false,
  },
  {
    slug: "integrations.api",
    name: "REST API",
    description: "Comprehensive REST API with OpenAPI documentation and rate limiting.",
    moduleSlug: "integrations",
    price: 2900, // $29
    tier: "enterprise",
    requires: [],
    conflicts: [],
    iconName: "Code",
    displayOrder: 2,
    isNew: false,
    isPopular: true,
  },
  {
    slug: "integrations.zapier",
    name: "Zapier Integration",
    description: "Connect with 5000+ apps through Zapier triggers and actions.",
    moduleSlug: "integrations",
    price: 2900, // $29
    tier: "enterprise",
    requires: ["integrations.webhooks"],
    conflicts: [],
    iconName: "Zap",
    displayOrder: 3,
    isNew: true,
    isPopular: false,
  },
];

// =====================================================
// TEMPLATES
// =====================================================
const templates = [
  {
    slug: "saas-starter",
    name: "SaaS Starter Kit",
    description:
      "Complete SaaS boilerplate with authentication, billing, dashboards, and team management. Perfect for launching your next SaaS product quickly.",
    shortDescription: "Launch your SaaS product in days, not months.",
    price: 19900, // $199
    compareAtPrice: 29900, // $299
    tier: "pro",
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "auth.mfa",
      "security.rbac",
      "payments.stripe",
      "payments.webhooks",
      "payments.subscriptions",
      "ui.components",
      "ui.themes",
      "ui.forms",
      "ui.dashboard",
      "comms.email",
      "analytics.basic",
      "analytics.dashboard",
    ],
    previewImageUrl: "/images/templates/saas-starter.png",
    previewUrl: "https://demo.starterstudio.com/saas",
    iconName: "Rocket",
    color: "#8B5CF6",
    displayOrder: 1,
    isFeatured: true,
  },
  {
    slug: "ecommerce",
    name: "E-Commerce Platform",
    description:
      "Full-featured e-commerce solution with product catalog, cart, checkout, and order management. Includes inventory tracking and multi-currency support.",
    shortDescription: "Build your online store with all the essentials.",
    price: 24900, // $249
    compareAtPrice: 34900, // $349
    tier: "business",
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "payments.stripe",
      "payments.webhooks",
      "payments.multi-currency",
      "storage.upload",
      "storage.s3",
      "storage.cdn",
      "ui.components",
      "ui.themes",
      "comms.email",
      "analytics.basic",
      "analytics.dashboard",
    ],
    previewImageUrl: "/images/templates/ecommerce.png",
    previewUrl: "https://demo.starterstudio.com/ecommerce",
    iconName: "ShoppingCart",
    color: "#10B981",
    displayOrder: 2,
    isFeatured: true,
  },
  {
    slug: "lms",
    name: "Learning Management System",
    description:
      "Complete LMS for creating and selling online courses. Includes course builder, progress tracking, certificates, and student management.",
    shortDescription: "Create and sell online courses effortlessly.",
    price: 29900, // $299
    compareAtPrice: 39900, // $399
    tier: "business",
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "auth.mfa",
      "security.rbac",
      "payments.stripe",
      "payments.subscriptions",
      "storage.upload",
      "storage.s3",
      "storage.cdn",
      "ui.components",
      "ui.themes",
      "ui.forms",
      "comms.email",
      "comms.push",
      "analytics.basic",
      "analytics.dashboard",
      "analytics.reports",
    ],
    previewImageUrl: "/images/templates/lms.png",
    previewUrl: "https://demo.starterstudio.com/lms",
    iconName: "GraduationCap",
    color: "#F59E0B",
    displayOrder: 3,
    isFeatured: false,
  },
  {
    slug: "admin-dashboard",
    name: "Admin Dashboard",
    description:
      "Professional admin dashboard with user management, analytics, settings, and audit logs. Perfect for internal tools and back-office applications.",
    shortDescription: "Professional admin panel ready to customize.",
    price: 14900, // $149
    compareAtPrice: 19900, // $199
    tier: "pro",
    includedFeatures: [
      "auth.basic",
      "auth.mfa",
      "security.rbac",
      "security.audit",
      "ui.components",
      "ui.themes",
      "ui.dashboard",
      "ui.charts",
      "analytics.basic",
      "analytics.dashboard",
      "analytics.reports",
      "analytics.export",
    ],
    previewImageUrl: "/images/templates/admin-dashboard.png",
    previewUrl: "https://demo.starterstudio.com/admin",
    iconName: "LayoutDashboard",
    color: "#3B82F6",
    displayOrder: 4,
    isFeatured: true,
  },
  {
    slug: "mobile-app-kit",
    name: "Mobile App Starter",
    description:
      "Cross-platform mobile app foundation with authentication, push notifications, and offline support. Built with React Native/Flutter.",
    shortDescription: "Launch your mobile app faster than ever.",
    price: 19900, // $199
    compareAtPrice: 29900, // $299
    tier: "pro",
    includedFeatures: [
      "auth.basic",
      "auth.social",
      "mobile.core",
      "mobile.push",
      "mobile.offline",
      "storage.upload",
      "storage.s3",
      "comms.push",
      "analytics.basic",
    ],
    previewImageUrl: "/images/templates/mobile-app.png",
    previewUrl: "https://demo.starterstudio.com/mobile",
    iconName: "Smartphone",
    color: "#EC4899",
    displayOrder: 5,
    isFeatured: false,
  },
];

// =====================================================
// BUNDLE DISCOUNTS
// =====================================================
const bundleDiscounts = [
  {
    name: "Feature Bundle Discount",
    description: "Save 10% when you select 5 or more features",
    type: CouponType.PERCENTAGE,
    value: 10,
    minItems: 5,
    applicableTiers: [],
    applicableFeatures: [],
    isActive: true,
  },
  {
    name: "Pro Bundle Saver",
    description: "Save 15% on Pro tier with 10+ features",
    type: CouponType.PERCENTAGE,
    value: 15,
    minItems: 10,
    applicableTiers: ["pro", "business", "enterprise"],
    applicableFeatures: [],
    isActive: true,
  },
  {
    name: "Enterprise All-Inclusive",
    description: "Flat $100 off Enterprise tier with all features",
    type: CouponType.FIXED,
    value: 10000, // $100 in cents
    minItems: 20,
    applicableTiers: ["enterprise"],
    applicableFeatures: [],
    isActive: true,
  },
];

// =====================================================
// SEED FUNCTION
// =====================================================
async function main() {
  console.log("Starting database seed...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.bundleDiscount.deleteMany();
  await prisma.template.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.module.deleteMany();
  await prisma.pricingTier.deleteMany();
  console.log("Existing data cleared.\n");

  // Seed Pricing Tiers
  console.log("Seeding pricing tiers...");
  for (const tier of pricingTiers) {
    await prisma.pricingTier.create({
      data: tier,
    });
    console.log(`  Created tier: ${tier.name} ($${tier.price / 100})`);
  }
  console.log(`Created ${pricingTiers.length} pricing tiers.\n`);

  // Seed Modules
  console.log("Seeding modules...");
  const moduleMap: Record<string, string> = {};
  for (const mod of modules) {
    const created = await prisma.module.create({
      data: mod,
    });
    moduleMap[mod.slug] = created.id;
    console.log(`  Created module: ${mod.name}`);
  }
  console.log(`Created ${modules.length} modules.\n`);

  // Seed Features
  console.log("Seeding features...");
  for (const feature of features) {
    const moduleId = moduleMap[feature.moduleSlug];
    if (!moduleId) {
      console.error(`  ERROR: Module not found for feature ${feature.slug}`);
      continue;
    }

    await prisma.feature.create({
      data: {
        slug: feature.slug,
        name: feature.name,
        description: feature.description,
        moduleId,
        price: feature.price,
        tier: feature.tier,
        requires: feature.requires,
        conflicts: feature.conflicts,
        iconName: feature.iconName,
        displayOrder: feature.displayOrder,
        isNew: feature.isNew,
        isPopular: feature.isPopular,
        envVars: feature.envVars ? feature.envVars : undefined,
        npmPackages: feature.npmPackages ? feature.npmPackages : undefined,
      },
    });
    console.log(`  Created feature: ${feature.slug}`);
  }
  console.log(`Created ${features.length} features.\n`);

  // Seed Templates
  console.log("Seeding templates...");
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
    console.log(`  Created template: ${template.name} ($${template.price / 100})`);
  }
  console.log(`Created ${templates.length} templates.\n`);

  // Seed Bundle Discounts
  console.log("Seeding bundle discounts...");
  for (const discount of bundleDiscounts) {
    await prisma.bundleDiscount.create({
      data: discount,
    });
    console.log(`  Created bundle discount: ${discount.name}`);
  }
  console.log(`Created ${bundleDiscounts.length} bundle discounts.\n`);

  // Summary
  console.log("=".repeat(50));
  console.log("Seed completed successfully!");
  console.log("=".repeat(50));
  console.log(`
Summary:
  - Pricing Tiers: ${pricingTiers.length}
  - Modules: ${modules.length}
  - Features: ${features.length}
  - Templates: ${templates.length}
  - Bundle Discounts: ${bundleDiscounts.length}
  `);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
