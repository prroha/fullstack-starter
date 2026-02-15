/**
 * Unit tests for ProjectGenerator service
 *
 * Tests the code generation service that produces complete projects
 * by merging core templates with feature-specific files.
 *
 * To run these tests:
 * 1. Install Jest: npm install -D jest @types/jest ts-jest
 * 2. Add jest.config.js (see below)
 * 3. Add test script to package.json: "test": "jest"
 * 4. Run: npm test
 *
 * jest.config.js:
 * ```
 * module.exports = {
 *   preset: 'ts-jest',
 *   testEnvironment: 'node',
 *   moduleNameMapper: {
 *     '^(\\.{1,2}/.*)\\.js$': '$1',
 *   },
 *   transform: {
 *     '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
 *   },
 *   extensionsToTreatAsEsm: ['.ts'],
 * };
 * ```
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  ProjectGenerator,
  FeatureConfig,
  OrderDetails,
} from "../generator.service.js";

// =====================================================
// Mock Setup
// =====================================================

// Mock prisma client
jest.mock("../../config/db.js", () => ({
  prisma: {
    feature: {
      findMany: jest.fn(),
    },
  },
}));

// Mock fs/promises
jest.mock("fs/promises", () => ({
  readdir: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
}));

// Mock schema-merger
jest.mock("../../utils/schema-merger.js", () => ({
  mergeSchemas: jest.fn(),
}));

// Mock package-merger
jest.mock("../../utils/package-merger.js", () => ({
  mergePackageJson: jest.fn(),
  stringifyPackageJson: jest.fn(),
  generateScripts: jest.fn(),
}));

// Import mocked modules
import { prisma } from "../../config/db.js";

// Type the mock for prisma.feature.findMany
const mockFindMany = prisma.feature.findMany as jest.MockedFunction<typeof prisma.feature.findMany>;

// =====================================================
// Mock Data Factories
// =====================================================

function createMockFeatureConfig(overrides: Partial<FeatureConfig> = {}): FeatureConfig {
  return {
    slug: overrides.slug || "test-feature",
    name: overrides.name || "Test Feature",
    description: overrides.description || "A test feature description",
    module: overrides.module || {
      slug: "test-module",
      name: "Test Module",
      category: "core",
    },
    fileMappings: overrides.fileMappings ?? null,
    schemaMappings: overrides.schemaMappings ?? null,
    envVars: overrides.envVars ?? null,
    npmPackages: overrides.npmPackages ?? null,
  };
}

function createMockOrderDetails(overrides: Partial<OrderDetails> = {}): OrderDetails {
  const defaultTemplate = {
    name: "SaaS Starter",
    slug: "saas-starter",
    includedFeatures: ["auth"],
  };
  const defaultLicense = {
    id: "license-123",
    licenseKey: "STARTER-XXXX-XXXX-XXXX",
    downloadToken: "token-abc",
    downloadCount: 0,
    maxDownloads: 5,
    status: "active",
    expiresAt: null,
  };

  return {
    id: overrides.id || "order-123",
    orderNumber: overrides.orderNumber || "ORD-2024-001",
    tier: overrides.tier || "starter",
    selectedFeatures: overrides.selectedFeatures || ["auth", "payments"],
    customerEmail: overrides.customerEmail || "test@example.com",
    customerName: "customerName" in overrides ? (overrides.customerName as string | null) : "Test Customer",
    total: "total" in overrides ? overrides.total! : 9900,
    // Use "in" check to distinguish between undefined (not passed) and null (explicitly passed)
    template: "template" in overrides ? (overrides.template as OrderDetails["template"]) : defaultTemplate,
    license: "license" in overrides ? (overrides.license as OrderDetails["license"]) : defaultLicense,
  };
}

function createMockDbFeature(
  slug: string,
  options: {
    requires?: string[];
    fileMappings?: unknown[];
    schemaMappings?: unknown[];
    envVars?: unknown[];
    npmPackages?: unknown[];
  } = {}
) {
  return {
    id: `id-${slug}`,
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `Description for ${slug}`,
    moduleId: "mod-1",
    price: 0,
    tier: null,
    requires: options.requires || [],
    conflicts: [],
    displayOrder: 0,
    isActive: true,
    isNew: false,
    isPopular: false,
    fileMappings: options.fileMappings || null,
    schemaMappings: options.schemaMappings || null,
    envVars: options.envVars || null,
    npmPackages: options.npmPackages || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    module: {
      slug: "core",
      name: "Core",
      category: "infrastructure",
    },
  };
}

// =====================================================
// Tests
// =====================================================

describe("ProjectGenerator", () => {
  let generator: ProjectGenerator;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create generator with custom paths for testing
    generator = new ProjectGenerator("/mock/core", "/mock/project-root");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // -------------------------------------------------
  // resolveFeatures()
  // -------------------------------------------------

  describe("resolveFeatures()", () => {
    it("should resolve features without dependencies", async () => {
      const mockFeatures = [
        createMockDbFeature("auth"),
        createMockDbFeature("payments"),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(
        ["auth", "payments"],
        "starter",
        []
      );

      expect(result.allFeatureSlugs).toContain("auth");
      expect(result.allFeatureSlugs).toContain("payments");
      expect(result.features).toHaveLength(2);
      expect(result.dependencyTree.size).toBe(2);
    });

    it("should resolve features with direct dependencies", async () => {
      const mockFeatures = [
        createMockDbFeature("auth"),
        createMockDbFeature("oauth", { requires: ["auth"] }),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(["oauth"], "starter", []);

      expect(result.allFeatureSlugs).toContain("oauth");
      expect(result.allFeatureSlugs).toContain("auth");
      expect(result.dependencyTree.get("oauth")).toEqual(["auth"]);
    });

    it("should resolve transitive dependencies", async () => {
      const mockFeatures = [
        createMockDbFeature("core"),
        createMockDbFeature("auth", { requires: ["core"] }),
        createMockDbFeature("oauth", { requires: ["auth"] }),
        createMockDbFeature("sso", { requires: ["oauth"] }),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(["sso"], "starter", []);

      expect(result.allFeatureSlugs).toContain("sso");
      expect(result.allFeatureSlugs).toContain("oauth");
      expect(result.allFeatureSlugs).toContain("auth");
      expect(result.allFeatureSlugs).toContain("core");
    });

    it("should combine selected features with template features", async () => {
      const mockFeatures = [
        createMockDbFeature("auth"),
        createMockDbFeature("payments"),
        createMockDbFeature("analytics"),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(
        ["payments"],
        "starter",
        ["auth", "analytics"] // template features
      );

      expect(result.allFeatureSlugs).toContain("payments");
      expect(result.allFeatureSlugs).toContain("auth");
      expect(result.allFeatureSlugs).toContain("analytics");
    });

    it("should deduplicate features when same feature is in selected and template", async () => {
      const mockFeatures = [
        createMockDbFeature("auth"),
        createMockDbFeature("payments"),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(
        ["auth", "payments"],
        "starter",
        ["auth"] // auth is in both
      );

      // Should only have auth once
      const authCount = result.allFeatureSlugs.filter((s) => s === "auth").length;
      expect(authCount).toBe(1);
    });

    it("should fetch missing dependency features in second query", async () => {
      // First query returns oauth (which requires auth) but not auth
      const firstQueryResult = [
        createMockDbFeature("oauth", { requires: ["auth"] }),
      ];

      // Second query fetches the missing dependency
      const secondQueryResult = [createMockDbFeature("auth")];

      mockFindMany
        .mockResolvedValueOnce(firstQueryResult as any)
        .mockResolvedValueOnce(secondQueryResult as any);

      const result = await generator.resolveFeatures(["oauth"], "starter", []);

      expect(prisma.feature.findMany).toHaveBeenCalledTimes(2);
      expect(result.allFeatureSlugs).toContain("auth");
      expect(result.allFeatureSlugs).toContain("oauth");
    });

    it("should convert database features to FeatureConfig format", async () => {
      const mockFeatures = [
        createMockDbFeature("auth", {
          fileMappings: [{ source: "src/auth", destination: "src/auth" }],
          schemaMappings: [{ model: "User", source: "prisma/user.prisma" }],
          envVars: [{ key: "JWT_SECRET", description: "JWT secret", required: true }],
          npmPackages: [{ name: "jsonwebtoken", version: "^9.0.0" }],
        }),
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(["auth"], "starter", []);

      const authFeature = result.features.find((f) => f.slug === "auth");
      expect(authFeature).toBeDefined();
      expect(authFeature?.fileMappings).toHaveLength(1);
      expect(authFeature?.schemaMappings).toHaveLength(1);
      expect(authFeature?.envVars).toHaveLength(1);
      expect(authFeature?.npmPackages).toHaveLength(1);
    });

    it("should handle empty feature selection", async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await generator.resolveFeatures([], "starter", []);

      expect(result.features).toHaveLength(0);
      expect(result.allFeatureSlugs).toHaveLength(0);
      expect(result.dependencyTree.size).toBe(0);
    });

    it("should handle features with null requires", async () => {
      const mockFeatures = [
        {
          ...createMockDbFeature("standalone"),
          requires: null,
        },
      ];

      mockFindMany.mockResolvedValue(mockFeatures as any);

      const result = await generator.resolveFeatures(["standalone"], "starter", []);

      expect(result.allFeatureSlugs).toContain("standalone");
      expect(result.dependencyTree.get("standalone")).toEqual([]);
    });
  });

  // -------------------------------------------------
  // shouldIncludeFile() - Testing via class method access
  // -------------------------------------------------

  describe("shouldIncludeFile()", () => {
    // Access private method for testing
    let shouldIncludeFile: (relativePath: string) => boolean;

    beforeEach(() => {
      // Access private method via any cast (for testing purposes)
      shouldIncludeFile = (generator as any).shouldIncludeFile.bind(generator);
    });

    describe("excluded directories", () => {
      it("should exclude node_modules", () => {
        expect(shouldIncludeFile("node_modules")).toBe(false);
      });

      it("should exclude .git", () => {
        expect(shouldIncludeFile(".git")).toBe(false);
      });

      it("should exclude dist", () => {
        expect(shouldIncludeFile("dist")).toBe(false);
      });

      it("should exclude build", () => {
        expect(shouldIncludeFile("build")).toBe(false);
      });

      it("should exclude .next", () => {
        expect(shouldIncludeFile(".next")).toBe(false);
      });

      it("should exclude .turbo", () => {
        expect(shouldIncludeFile(".turbo")).toBe(false);
      });

      it("should exclude coverage", () => {
        expect(shouldIncludeFile("coverage")).toBe(false);
      });

      it("should exclude .nyc_output", () => {
        expect(shouldIncludeFile(".nyc_output")).toBe(false);
      });

      it("should exclude _preview directory", () => {
        expect(shouldIncludeFile("_preview")).toBe(false);
      });
    });

    describe("excluded files", () => {
      it("should exclude .env", () => {
        expect(shouldIncludeFile(".env")).toBe(false);
      });

      it("should exclude .env.local", () => {
        expect(shouldIncludeFile(".env.local")).toBe(false);
      });

      it("should exclude .env.development", () => {
        expect(shouldIncludeFile(".env.development")).toBe(false);
      });

      it("should exclude .env.production", () => {
        expect(shouldIncludeFile(".env.production")).toBe(false);
      });

      it("should exclude .DS_Store", () => {
        expect(shouldIncludeFile(".DS_Store")).toBe(false);
      });

      it("should exclude Thumbs.db", () => {
        expect(shouldIncludeFile("Thumbs.db")).toBe(false);
      });

      it("should exclude files matching *.log pattern", () => {
        expect(shouldIncludeFile("debug.log")).toBe(false);
        expect(shouldIncludeFile("error.log")).toBe(false);
        expect(shouldIncludeFile("npm-debug.log")).toBe(false);
      });

      it("should exclude preview-banner.tsx", () => {
        expect(shouldIncludeFile("preview-banner.tsx")).toBe(false);
      });

      it("should exclude preview-wrapper.tsx", () => {
        expect(shouldIncludeFile("preview-wrapper.tsx")).toBe(false);
      });

      it("should exclude preview-context.tsx", () => {
        expect(shouldIncludeFile("preview-context.tsx")).toBe(false);
      });
    });

    describe("included files", () => {
      it("should include regular source files", () => {
        expect(shouldIncludeFile("index.ts")).toBe(true);
        expect(shouldIncludeFile("app.tsx")).toBe(true);
        expect(shouldIncludeFile("utils.js")).toBe(true);
      });

      it("should include package.json", () => {
        expect(shouldIncludeFile("package.json")).toBe(true);
      });

      it("should include tsconfig.json", () => {
        expect(shouldIncludeFile("tsconfig.json")).toBe(true);
      });

      it("should include .env.example", () => {
        expect(shouldIncludeFile(".env.example")).toBe(true);
      });

      it("should include README.md", () => {
        expect(shouldIncludeFile("README.md")).toBe(true);
      });

      it("should include src directory", () => {
        expect(shouldIncludeFile("src")).toBe(true);
      });

      it("should include prisma directory", () => {
        expect(shouldIncludeFile("prisma")).toBe(true);
      });

      it("should include non-excluded directories", () => {
        expect(shouldIncludeFile("lib")).toBe(true);
        expect(shouldIncludeFile("utils")).toBe(true);
        expect(shouldIncludeFile("components")).toBe(true);
      });
    });

    describe("path handling", () => {
      it("should check basename of nested paths", () => {
        expect(shouldIncludeFile("src/components/node_modules")).toBe(false);
        expect(shouldIncludeFile("backend/.env")).toBe(false);
        expect(shouldIncludeFile("web/.next")).toBe(false);
      });

      it("should include nested source files", () => {
        expect(shouldIncludeFile("src/components/Button.tsx")).toBe(true);
        expect(shouldIncludeFile("lib/utils/helpers.ts")).toBe(true);
      });
    });
  });

  // -------------------------------------------------
  // generateEnvExample()
  // -------------------------------------------------

  describe("generateEnvExample()", () => {
    let generateEnvExample: (features: FeatureConfig[]) => string;

    beforeEach(() => {
      generateEnvExample = (generator as any).generateEnvExample.bind(generator);
    });

    it("should generate base environment variables", () => {
      const result = generateEnvExample([]);

      expect(result).toContain("# Environment Variables");
      expect(result).toContain("# Generated by Xitolaunch");
      expect(result).toContain("NODE_ENV=development");
      expect(result).toContain("PORT=8000");
      expect(result).toContain("API_URL=http://localhost:8000");
      expect(result).toContain("DATABASE_URL=postgresql://");
      expect(result).toContain("JWT_SECRET=");
      expect(result).toContain("JWT_EXPIRES_IN=7d");
      expect(result).toContain("JWT_REFRESH_EXPIRES_IN=30d");
      expect(result).toContain("CORS_ORIGIN=http://localhost:3000");
      expect(result).toContain("FRONTEND_URL=http://localhost:3000");
    });

    it("should add feature-specific environment variables", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Payments",
          envVars: [
            {
              key: "STRIPE_SECRET_KEY",
              description: "Stripe API secret key",
              required: true,
              default: "",
            },
            {
              key: "STRIPE_WEBHOOK_SECRET",
              description: "Stripe webhook signing secret",
              required: true,
              default: "",
            },
          ],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).toContain("# Feature Configuration");
      expect(result).toContain("# Payments");
      expect(result).toContain("STRIPE_SECRET_KEY=");
      expect(result).toContain("# Stripe API secret key (required)");
      expect(result).toContain("STRIPE_WEBHOOK_SECRET=");
    });

    it("should include default values for env vars", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Analytics",
          envVars: [
            {
              key: "ANALYTICS_ENABLED",
              description: "Enable analytics tracking",
              required: false,
              default: "true",
            },
          ],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).toContain("ANALYTICS_ENABLED=true");
    });

    it("should mark required env vars appropriately", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Email",
          envVars: [
            {
              key: "SMTP_HOST",
              description: "SMTP server host",
              required: true,
            },
            {
              key: "SMTP_PORT",
              description: "SMTP server port",
              required: false,
              default: "587",
            },
          ],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).toContain("# SMTP server host (required)");
      expect(result).toMatch(/# SMTP server port\n/);
    });

    it("should group env vars by feature", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Payments",
          envVars: [
            { key: "STRIPE_KEY", description: "Stripe key", required: true },
          ],
        }),
        createMockFeatureConfig({
          name: "Storage",
          envVars: [
            { key: "S3_BUCKET", description: "S3 bucket name", required: true },
          ],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).toContain("# Payments");
      expect(result).toContain("# Storage");
      // Verify ordering (Payments before Storage)
      const paymentsIndex = result.indexOf("# Payments");
      const storageIndex = result.indexOf("# Storage");
      expect(paymentsIndex).toBeLessThan(storageIndex);
    });

    it("should skip features with no env vars", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "NoEnvFeature",
          envVars: null,
        }),
        createMockFeatureConfig({
          name: "EmptyEnvFeature",
          envVars: [],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).not.toContain("# NoEnvFeature");
      expect(result).not.toContain("# EmptyEnvFeature");
    });

    it("should not include Feature Configuration section when no features have env vars", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({ envVars: null }),
        createMockFeatureConfig({ envVars: [] }),
      ];

      const result = generateEnvExample(features);

      expect(result).not.toContain("# Feature Configuration");
    });
  });

  // -------------------------------------------------
  // generateLicense()
  // -------------------------------------------------

  describe("generateLicense()", () => {
    let generateLicense: (order: OrderDetails) => string;

    beforeEach(() => {
      generateLicense = (generator as any).generateLicense.bind(generator);
    });

    it("should include license key", () => {
      const order = createMockOrderDetails({
        license: {
          id: "lic-1",
          licenseKey: "STARTER-ABCD-EFGH-IJKL",
          downloadToken: "token",
          downloadCount: 0,
          maxDownloads: 5,
          status: "active",
          expiresAt: null,
        },
      });

      const result = generateLicense(order);

      expect(result).toContain("**License Key:** STARTER-ABCD-EFGH-IJKL");
    });

    it("should include order number", () => {
      const order = createMockOrderDetails({
        orderNumber: "ORD-2024-12345",
      });

      const result = generateLicense(order);

      expect(result).toContain("**Order Number:** ORD-2024-12345");
    });

    it("should include customer name when provided", () => {
      const order = createMockOrderDetails({
        customerName: "John Doe",
        customerEmail: "john@example.com",
      });

      const result = generateLicense(order);

      expect(result).toContain("**Licensed To:** John Doe");
    });

    it("should use email when customer name is null", () => {
      const order = createMockOrderDetails({
        customerName: null,
        customerEmail: "anonymous@example.com",
      });

      const result = generateLicense(order);

      expect(result).toContain("**Licensed To:** anonymous@example.com");
    });

    it("should include customer email", () => {
      const order = createMockOrderDetails({
        customerEmail: "customer@company.com",
      });

      const result = generateLicense(order);

      expect(result).toContain("**Email:** customer@company.com");
    });

    it("should capitalize tier name", () => {
      const order = createMockOrderDetails({ tier: "enterprise" });
      const result = generateLicense(order);

      expect(result).toContain("**Tier:** Enterprise");
    });

    it("should handle starter tier", () => {
      const order = createMockOrderDetails({ tier: "starter" });
      const result = generateLicense(order);

      expect(result).toContain("**Tier:** Starter");
    });

    it("should handle pro tier", () => {
      const order = createMockOrderDetails({ tier: "pro" });
      const result = generateLicense(order);

      expect(result).toContain("**Tier:** Pro");
    });

    it("should include issue date", () => {
      const result = generateLicense(createMockOrderDetails());

      expect(result).toMatch(/\*\*Issue Date:\*\* \d{4}-\d{2}-\d{2}/);
    });

    it("should include license terms sections", () => {
      const result = generateLicense(createMockOrderDetails());

      expect(result).toContain("## License Terms");
      expect(result).toContain("**Use** - Use the purchased code");
      expect(result).toContain("**Modify** - Modify and customize");
      expect(result).toContain("**Deploy** - Deploy applications");
      expect(result).toContain("**Redistribute** - Sell, share, or redistribute");
      expect(result).toContain("**Transfer** - Transfer this license");
      expect(result).toContain("**Sublicense** - Grant sublicenses");
    });

    it("should include support section", () => {
      const result = generateLicense(createMockOrderDetails());

      expect(result).toContain("## Support");
      expect(result).toContain("contact us with your order number");
    });

    it("should include validity section", () => {
      const result = generateLicense(createMockOrderDetails());

      expect(result).toContain("## Validity");
      expect(result).toContain("valid for lifetime use");
    });

    it("should include Xitolaunch branding", () => {
      const result = generateLicense(createMockOrderDetails());

      expect(result).toContain("# Xitolaunch License");
      expect(result).toContain("Generated by Xitolaunch");
      expect(result).toContain("https://xitolaunch.com");
    });

    it("should handle missing license gracefully", () => {
      const order = createMockOrderDetails({ license: null });
      const result = generateLicense(order);

      expect(result).toContain("**License Key:** N/A");
    });
  });

  // -------------------------------------------------
  // generateReadme()
  // -------------------------------------------------

  describe("generateReadme()", () => {
    let generateReadme: (order: OrderDetails, features: FeatureConfig[]) => string;

    beforeEach(() => {
      generateReadme = (generator as any).generateReadme.bind(generator);
    });

    it("should include template name as title", () => {
      const order = createMockOrderDetails({
        template: {
          name: "E-commerce Starter",
          slug: "ecommerce",
          includedFeatures: [],
        },
      });

      const result = generateReadme(order, []);

      expect(result).toContain("# E-commerce Starter");
    });

    it("should use Custom Configuration when no template", () => {
      const order = createMockOrderDetails({ template: null });
      const result = generateReadme(order, []);

      expect(result).toContain("# Custom Configuration");
    });

    it("should include tier information", () => {
      const order = createMockOrderDetails({ tier: "enterprise" });
      const result = generateReadme(order, []);

      expect(result).toContain("**Tier:** Enterprise");
    });

    it("should include order number", () => {
      const order = createMockOrderDetails({ orderNumber: "ORD-2024-99999" });
      const result = generateReadme(order, []);

      expect(result).toContain("**Order Number:** ORD-2024-99999");
    });

    it("should include generated timestamp", () => {
      const result = generateReadme(createMockOrderDetails(), []);

      expect(result).toMatch(/\*\*Generated:\*\* \d{4}-\d{2}-\d{2}T/);
    });

    it("should include quick start instructions", () => {
      const result = generateReadme(createMockOrderDetails(), []);

      expect(result).toContain("## Quick Start");
      expect(result).toContain("### 1. Install Dependencies");
      expect(result).toContain("cd backend");
      expect(result).toContain("npm install");
      expect(result).toContain("### 2. Configure Environment");
      expect(result).toContain("cp backend/.env.example backend/.env");
      expect(result).toContain("### 3. Set Up Database");
      expect(result).toContain("npm run db:migrate");
      expect(result).toContain("npm run db:seed");
      expect(result).toContain("### 4. Start Development");
      expect(result).toContain("npm run dev");
    });

    it("should list features grouped by category", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Authentication",
          description: "User authentication system",
          module: { slug: "auth", name: "Auth", category: "security" },
        }),
        createMockFeatureConfig({
          name: "Payments",
          description: "Stripe payment integration",
          module: { slug: "payments", name: "Payments", category: "billing" },
        }),
        createMockFeatureConfig({
          name: "Audit Logging",
          description: "Security audit logs",
          module: { slug: "audit", name: "Audit", category: "security" },
        }),
      ];

      const result = generateReadme(createMockOrderDetails(), features);

      expect(result).toContain("## Included Features");
      expect(result).toContain("### Security");
      expect(result).toContain("### Billing");
      expect(result).toContain("**Authentication** - User authentication system");
      expect(result).toContain("**Payments** - Stripe payment integration");
      expect(result).toContain("**Audit Logging** - Security audit logs");
    });

    it("should capitalize category names", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          module: { slug: "mod", name: "Mod", category: "infrastructure" },
        }),
      ];

      const result = generateReadme(createMockOrderDetails(), features);

      expect(result).toContain("### Infrastructure");
    });

    it("should include project structure", () => {
      const result = generateReadme(createMockOrderDetails(), []);

      expect(result).toContain("## Project Structure");
      expect(result).toContain("backend/");
      expect(result).toContain("prisma/");
      expect(result).toContain("web/");
      expect(result).toContain("controllers/");
      expect(result).toContain("services/");
      expect(result).toContain("routes/");
    });

    it("should include support section with order number", () => {
      const order = createMockOrderDetails({ orderNumber: "ORD-SUPPORT-TEST" });
      const result = generateReadme(order, []);

      expect(result).toContain("## Support");
      expect(result).toContain("https://docs.xitolaunch.com");
      expect(result).toContain("ORD-SUPPORT-TEST");
    });

    it("should include license reference", () => {
      const result = generateReadme(createMockOrderDetails(), []);

      expect(result).toContain("## License");
      expect(result).toContain("See LICENSE.md");
    });

    it("should include Xitolaunch branding", () => {
      const result = generateReadme(createMockOrderDetails(), []);

      expect(result).toContain("Built with Xitolaunch");
      expect(result).toContain("https://xitolaunch.com");
    });
  });

  // -------------------------------------------------
  // generateConfig()
  // -------------------------------------------------

  describe("generateConfig()", () => {
    let generateConfig: (order: OrderDetails, features: FeatureConfig[]) => string;

    beforeEach(() => {
      generateConfig = (generator as any).generateConfig.bind(generator);
    });

    it("should generate valid JSON", () => {
      const result = generateConfig(createMockOrderDetails(), []);

      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("should include tier information", () => {
      const order = createMockOrderDetails({ tier: "pro" });
      const result = JSON.parse(generateConfig(order, []));

      expect(result.tier).toBe("pro");
    });

    it("should include template slug", () => {
      const order = createMockOrderDetails({
        template: {
          name: "SaaS Starter",
          slug: "saas-starter",
          includedFeatures: [],
        },
      });
      const result = JSON.parse(generateConfig(order, []));

      expect(result.template).toBe("saas-starter");
    });

    it("should handle null template", () => {
      const order = createMockOrderDetails({ template: null });
      const result = JSON.parse(generateConfig(order, []));

      expect(result.template).toBeNull();
    });

    it("should include feature slugs array", () => {
      const features: FeatureConfig[] = [
        createMockFeatureConfig({ slug: "auth" }),
        createMockFeatureConfig({ slug: "payments" }),
        createMockFeatureConfig({ slug: "analytics" }),
      ];

      const result = JSON.parse(generateConfig(createMockOrderDetails(), features));

      expect(result.features).toEqual(["auth", "payments", "analytics"]);
    });

    it("should include license information", () => {
      const order = createMockOrderDetails({
        license: {
          id: "lic-1",
          licenseKey: "TEST-LICENSE-KEY",
          downloadToken: "token",
          downloadCount: 0,
          maxDownloads: 5,
          status: "active",
          expiresAt: null,
        },
        orderNumber: "ORD-CONFIG-TEST",
        customerEmail: "config@test.com",
      });

      const result = JSON.parse(generateConfig(order, []));

      expect(result.license.key).toBe("TEST-LICENSE-KEY");
      expect(result.license.orderNumber).toBe("ORD-CONFIG-TEST");
      expect(result.license.customerEmail).toBe("config@test.com");
      expect(result.license.issuedAt).toBeDefined();
    });

    it("should handle null license", () => {
      const order = createMockOrderDetails({ license: null });
      const result = JSON.parse(generateConfig(order, []));

      expect(result.license.key).toBeNull();
    });

    it("should include generatedAt timestamp", () => {
      const result = JSON.parse(generateConfig(createMockOrderDetails(), []));

      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });

    it("should format JSON with indentation", () => {
      const result = generateConfig(createMockOrderDetails(), []);

      // Check for pretty-printed format (contains newlines and spaces)
      expect(result).toContain("\n");
      expect(result).toMatch(/^\{\n\s+"/);
    });

    it("should include empty features array when no features", () => {
      const result = JSON.parse(generateConfig(createMockOrderDetails(), []));

      expect(result.features).toEqual([]);
    });
  });

  // -------------------------------------------------
  // generateProjectName()
  // -------------------------------------------------

  describe("generateProjectName()", () => {
    let generateProjectName: (order: OrderDetails) => string;

    beforeEach(() => {
      generateProjectName = (generator as any).generateProjectName.bind(generator);
    });

    it("should combine template slug and tier", () => {
      const order = createMockOrderDetails({
        template: {
          name: "SaaS Starter",
          slug: "saas-starter",
          includedFeatures: [],
        },
        tier: "pro",
      });

      const result = generateProjectName(order);

      expect(result).toBe("saas-starter-pro");
    });

    it("should use starter as default template slug when no template", () => {
      const order = createMockOrderDetails({ template: null, tier: "enterprise" });

      const result = generateProjectName(order);

      expect(result).toBe("starter-enterprise");
    });

    it("should handle different tiers", () => {
      const baseTierOrder = { template: { name: "Test", slug: "test", includedFeatures: [] } };

      expect(
        generateProjectName(createMockOrderDetails({ ...baseTierOrder, tier: "basic" }))
      ).toBe("test-basic");

      expect(
        generateProjectName(createMockOrderDetails({ ...baseTierOrder, tier: "starter" }))
      ).toBe("test-starter");

      expect(
        generateProjectName(createMockOrderDetails({ ...baseTierOrder, tier: "pro" }))
      ).toBe("test-pro");

      expect(
        generateProjectName(createMockOrderDetails({ ...baseTierOrder, tier: "enterprise" }))
      ).toBe("test-enterprise");
    });

    it("should handle template slug with special characters", () => {
      const order = createMockOrderDetails({
        template: {
          name: "E-commerce Pro",
          slug: "e-commerce-pro",
          includedFeatures: [],
        },
        tier: "starter",
      });

      const result = generateProjectName(order);

      expect(result).toBe("e-commerce-pro-starter");
    });

    it("should handle lowercase template slugs", () => {
      const order = createMockOrderDetails({
        template: {
          name: "My App",
          slug: "myapp",
          includedFeatures: [],
        },
        tier: "pro",
      });

      const result = generateProjectName(order);

      expect(result).toBe("myapp-pro");
    });
  });

  // -------------------------------------------------
  // Edge Cases and Integration-like Tests
  // -------------------------------------------------

  describe("edge cases", () => {
    it("should handle features with all null optional fields", () => {
      const generateEnvExample = (generator as any).generateEnvExample.bind(generator);
      const features: FeatureConfig[] = [
        {
          slug: "minimal",
          name: "Minimal Feature",
          description: "A minimal feature",
          module: { slug: "mod", name: "Module", category: "misc" },
          fileMappings: null,
          schemaMappings: null,
          envVars: null,
          npmPackages: null,
        },
      ];

      const result = generateEnvExample(features);

      // Should not throw and should contain base env vars
      expect(result).toContain("NODE_ENV=development");
    });

    it("should handle very long feature names in README", () => {
      const generateReadme = (generator as any).generateReadme.bind(generator);
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "This Is A Very Long Feature Name That Might Cause Formatting Issues",
          description: "A feature with a very long name for testing purposes",
        }),
      ];

      const result = generateReadme(createMockOrderDetails(), features);

      expect(result).toContain("This Is A Very Long Feature Name");
    });

    it("should handle special characters in customer info", () => {
      const generateLicense = (generator as any).generateLicense.bind(generator);
      const order = createMockOrderDetails({
        customerName: "O'Brien & Associates <LLC>",
        customerEmail: "test+special@example.com",
      });

      const result = generateLicense(order);

      expect(result).toContain("O'Brien & Associates <LLC>");
      expect(result).toContain("test+special@example.com");
    });

    it("should handle empty string values in env vars", () => {
      const generateEnvExample = (generator as any).generateEnvExample.bind(generator);
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Test",
          envVars: [
            { key: "EMPTY_VAR", description: "An empty var", required: false, default: "" },
          ],
        }),
      ];

      const result = generateEnvExample(features);

      expect(result).toContain("EMPTY_VAR=");
    });

    it("should handle unicode characters in descriptions", () => {
      const generateReadme = (generator as any).generateReadme.bind(generator);
      const features: FeatureConfig[] = [
        createMockFeatureConfig({
          name: "Internationalization",
          description: "Support for i18n with Japanese (日本語), Chinese (中文), and more",
        }),
      ];

      const result = generateReadme(createMockOrderDetails(), features);

      expect(result).toContain("日本語");
      expect(result).toContain("中文");
    });
  });
});
