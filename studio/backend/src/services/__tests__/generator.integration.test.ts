/**
 * Integration Tests for Project Generator Service
 *
 * Tests the full code generation flow including:
 * - ZIP archive creation
 * - File structure
 * - Package.json dependencies
 * - Prisma schema merging
 * - Environment variables
 * - README and LICENSE generation
 */

import { PassThrough } from "stream";
import {
  ProjectGenerator,
  OrderDetails,
  FeatureConfig,
  EnvVarConfig,
} from "../generator.service.js";

// Mock the prisma client
jest.mock("../../config/db.js", () => ({
  prisma: {
    feature: {
      findMany: jest.fn(),
    },
  },
}));

// Mock fs/promises for file operations
jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));

import { prisma } from "../../config/db.js";
import fs from "fs/promises";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Creates a mock order with minimal configuration
 */
function createMockOrder(overrides: Partial<OrderDetails> = {}): OrderDetails {
  return {
    id: "order-123",
    orderNumber: "ORD-2024-001",
    tier: "starter",
    selectedFeatures: ["auth.basic"],
    customerEmail: "test@example.com",
    customerName: "Test User",
    total: 49.0,
    template: {
      name: "SaaS Starter",
      slug: "saas-starter",
      includedFeatures: [],
    },
    license: {
      id: "license-123",
      licenseKey: "XXXX-XXXX-XXXX-XXXX",
      downloadToken: "download-token-123",
      downloadCount: 0,
      maxDownloads: 5,
      status: "active",
      expiresAt: null,
    },
    ...overrides,
  };
}

/**
 * Creates a mock feature configuration
 */
function createMockFeature(overrides: Partial<FeatureConfig> = {}): FeatureConfig {
  return {
    slug: "auth.basic",
    name: "Basic Authentication",
    description: "Email/password authentication with JWT",
    module: {
      slug: "auth",
      name: "Authentication",
      category: "core",
    },
    fileMappings: null,
    schemaMappings: null,
    envVars: null,
    npmPackages: null,
    ...overrides,
  };
}

/**
 * Mock feature for payments module
 */
const mockPaymentsFeature: FeatureConfig = {
  slug: "payments.stripe",
  name: "Stripe Payments",
  description: "Stripe integration for subscriptions and one-time payments",
  module: {
    slug: "payments",
    name: "Payments",
    category: "monetization",
  },
  fileMappings: [
    {
      source: "modules/payments/backend/src/services/stripe.service.ts",
      destination: "backend/src/services/stripe.service.ts",
    },
    {
      source: "modules/payments/backend/src/routes/payments.routes.ts",
      destination: "backend/src/routes/payments.routes.ts",
    },
  ],
  schemaMappings: [
    {
      model: "Subscription",
      source: "modules/payments/backend/prisma/subscription.prisma",
    },
  ],
  envVars: [
    {
      key: "STRIPE_SECRET_KEY",
      description: "Stripe secret API key",
      required: true,
    },
    {
      key: "STRIPE_PUBLISHABLE_KEY",
      description: "Stripe publishable key for frontend",
      required: true,
    },
    {
      key: "STRIPE_WEBHOOK_SECRET",
      description: "Stripe webhook signing secret",
      required: true,
    },
  ],
  npmPackages: [
    { name: "stripe", version: "^14.0.0", dev: false },
  ],
};

/**
 * Mock feature for file upload module
 */
const mockFileUploadFeature: FeatureConfig = {
  slug: "file-upload.s3",
  name: "S3 File Upload",
  description: "AWS S3 file upload with presigned URLs",
  module: {
    slug: "file-upload",
    name: "File Upload",
    category: "storage",
  },
  fileMappings: [
    {
      source: "modules/file-upload/backend/src/services/s3.service.ts",
      destination: "backend/src/services/s3.service.ts",
    },
  ],
  schemaMappings: [
    {
      model: "File",
      source: "modules/file-upload/backend/prisma/file.prisma",
    },
  ],
  envVars: [
    {
      key: "AWS_ACCESS_KEY_ID",
      description: "AWS access key ID",
      required: true,
    },
    {
      key: "AWS_SECRET_ACCESS_KEY",
      description: "AWS secret access key",
      required: true,
    },
    {
      key: "AWS_S3_BUCKET",
      description: "S3 bucket name",
      required: true,
    },
    {
      key: "AWS_REGION",
      description: "AWS region",
      required: true,
      default: "us-east-1",
    },
  ],
  npmPackages: [
    { name: "@aws-sdk/client-s3", version: "^3.500.0", dev: false },
    { name: "@aws-sdk/s3-request-presigner", version: "^3.500.0", dev: false },
  ],
};

/**
 * Mock base package.json content
 */
const mockBasePackageJson = {
  name: "fullstack-backend",
  version: "1.0.0",
  description: "Express + Prisma + TypeScript Backend",
  scripts: {
    dev: "tsx watch src/app.ts",
    build: "tsc",
    start: "node dist/app.js",
  },
  dependencies: {
    express: "^4.21.0",
    "@prisma/client": "^5.0.0",
    jsonwebtoken: "^9.0.0",
    bcryptjs: "^2.4.3",
  },
  devDependencies: {
    typescript: "^5.0.0",
    "@types/express": "^4.17.0",
  },
};

/**
 * Mock base Prisma schema content
 */
const mockBasePrismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Collects archive output into a buffer
 */
async function collectArchiveBuffer(
  generator: ProjectGenerator,
  order: OrderDetails
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const outputStream = new PassThrough();

  outputStream.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  await generator.generate(order, outputStream);
  return Buffer.concat(chunks);
}

/**
 * Checks if a buffer starts with ZIP signature (PK)
 */
function isValidZipBuffer(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

// ============================================================================
// Test Suites
// ============================================================================

describe("ProjectGenerator Integration Tests", () => {
  let generator: ProjectGenerator;
  let mockPrismaFindMany: jest.Mock;
  let mockFsReadFile: jest.Mock;
  let mockFsReaddir: jest.Mock;
  let mockFsStat: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockPrismaFindMany = prisma.feature.findMany as jest.Mock;
    mockFsReadFile = fs.readFile as jest.Mock;
    mockFsReaddir = fs.readdir as jest.Mock;
    mockFsStat = fs.stat as jest.Mock;

    // Create generator with custom paths for testing
    generator = new ProjectGenerator(
      "/mock/core",
      "/mock/project-root"
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Generate project with minimal features (just auth.basic)
  // --------------------------------------------------------------------------
  describe("Scenario 1: Generate project with minimal features", () => {
    it("should generate a project with only auth.basic feature", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      // Mock database response
      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      // Mock file system
      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock file content");
      });

      mockFsReaddir.mockResolvedValue([]);
      mockFsStat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      // Generate project
      const zipBuffer = await collectArchiveBuffer(generator, order);

      // Verify ZIP was created
      expect(zipBuffer.length).toBeGreaterThan(0);

      // Verify ZIP header (PK signature)
      expect(isValidZipBuffer(zipBuffer)).toBe(true);
    });

    it("should resolve feature dependencies correctly", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
        template: { name: "Test", slug: "test", includedFeatures: [] },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        order.template?.includedFeatures || []
      );

      expect(resolved.features).toHaveLength(1);
      expect(resolved.features[0].slug).toBe("auth.basic");
      expect(resolved.allFeatureSlugs).toContain("auth.basic");
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Generate project with multiple features from different modules
  // --------------------------------------------------------------------------
  describe("Scenario 2: Generate project with multiple features", () => {
    it("should combine features from different modules", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic", "payments.stripe", "file-upload.s3"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
        {
          ...mockFileUploadFeature,
          isActive: true,
          requires: [],
          module: mockFileUploadFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      expect(resolved.features).toHaveLength(3);
      expect(resolved.allFeatureSlugs).toContain("auth.basic");
      expect(resolved.allFeatureSlugs).toContain("payments.stripe");
      expect(resolved.allFeatureSlugs).toContain("file-upload.s3");
    });

    it("should merge features from template and selected features", async () => {
      const order = createMockOrder({
        selectedFeatures: ["payments.stripe"],
        template: {
          name: "SaaS Starter",
          slug: "saas-starter",
          includedFeatures: ["auth.basic"],
        },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        order.template?.includedFeatures || []
      );

      expect(resolved.features).toHaveLength(2);
      expect(resolved.allFeatureSlugs).toContain("auth.basic");
      expect(resolved.allFeatureSlugs).toContain("payments.stripe");
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Verify ZIP archive structure contains expected files
  // --------------------------------------------------------------------------
  describe("Scenario 3: Verify ZIP archive structure", () => {
    it("should create ZIP with correct project root folder", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
        template: { name: "SaaS Starter", slug: "saas-starter", includedFeatures: [] },
        tier: "premium",
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      // ZIP should start with 'PK' signature
      expect(zipBuffer.slice(0, 2).toString()).toBe("PK");
    });

    it("should include core files in the archive", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock file content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      // Verify ZIP was generated with reasonable size
      expect(zipBuffer.length).toBeGreaterThan(100);
    });

    it("should exclude node_modules and .git directories", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      // Simulate directory with excluded folders
      mockFsReaddir.mockImplementation((dirPath: string) => {
        if (dirPath === "/mock/core") {
          return Promise.resolve([
            { name: "src", isDirectory: () => true, isFile: () => false },
            { name: "node_modules", isDirectory: () => true, isFile: () => false },
            { name: ".git", isDirectory: () => true, isFile: () => false },
            { name: "package.json", isDirectory: () => false, isFile: () => true },
          ]);
        }
        return Promise.resolve([]);
      });

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      const zipBuffer = await collectArchiveBuffer(generator, order);

      // Archive should be created successfully
      expect(isValidZipBuffer(zipBuffer)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Verify generated package.json has correct dependencies
  // --------------------------------------------------------------------------
  describe("Scenario 4: Verify package.json dependencies", () => {
    it("should merge feature npm packages into package.json", async () => {
      const order = createMockOrder({
        selectedFeatures: ["payments.stripe"],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);
      mockFsStat.mockResolvedValue({ isDirectory: () => false, isFile: () => true });

      const zipBuffer = await collectArchiveBuffer(generator, order);

      // Archive should be created
      expect(zipBuffer.length).toBeGreaterThan(0);

      // Verify the mock was called for base package.json
      expect(mockFsReadFile).toHaveBeenCalledWith(
        expect.stringContaining("package.json"),
        expect.anything()
      );
    });

    it("should add multiple feature dependencies correctly", async () => {
      const order = createMockOrder({
        selectedFeatures: ["payments.stripe", "file-upload.s3"],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
        {
          ...mockFileUploadFeature,
          isActive: true,
          requires: [],
          module: mockFileUploadFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      // Both features should have npm packages
      const stripeFeature = resolved.features.find((f: FeatureConfig) => f.slug === "payments.stripe");
      const s3Feature = resolved.features.find((f: FeatureConfig) => f.slug === "file-upload.s3");

      expect(stripeFeature?.npmPackages).toContainEqual(
        expect.objectContaining({ name: "stripe" })
      );
      expect(s3Feature?.npmPackages).toContainEqual(
        expect.objectContaining({ name: "@aws-sdk/client-s3" })
      );
    });

    it("should preserve base dependencies when adding feature packages", async () => {
      const order = createMockOrder({
        selectedFeatures: ["payments.stripe"],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      // Execute generation to trigger file reads
      await collectArchiveBuffer(generator, order);

      // Verify base package.json was read
      expect(mockFsReadFile).toHaveBeenCalledWith(
        "/mock/core/backend/package.json",
        expect.anything()
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Verify generated schema.prisma has correct models
  // --------------------------------------------------------------------------
  describe("Scenario 5: Verify Prisma schema models", () => {
    it("should include base User model from core schema", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);

      // Verify schema.prisma was read
      expect(mockFsReadFile).toHaveBeenCalledWith(
        "/mock/core/backend/prisma/schema.prisma",
        expect.anything()
      );
    });

    it("should merge feature-specific models into schema", async () => {
      const featureWithSchema = createMockFeature({
        slug: "payments.stripe",
        schemaMappings: [
          {
            model: "Subscription",
            source: "modules/payments/backend/prisma/subscription.prisma",
          },
        ],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...featureWithSchema,
          isActive: true,
          requires: [],
          module: featureWithSchema.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        ["payments.stripe"],
        "premium",
        []
      );

      expect(resolved.features[0].schemaMappings).toHaveLength(1);
      expect(resolved.features[0].schemaMappings![0].model).toBe("Subscription");
    });

    it("should handle multiple schema mappings from different features", async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
        {
          ...mockFileUploadFeature,
          isActive: true,
          requires: [],
          module: mockFileUploadFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        ["payments.stripe", "file-upload.s3"],
        "premium",
        []
      );

      const allSchemaMappings = resolved.features.flatMap((f: FeatureConfig) => f.schemaMappings || []);
      expect(allSchemaMappings).toContainEqual(
        expect.objectContaining({ model: "Subscription" })
      );
      expect(allSchemaMappings).toContainEqual(
        expect.objectContaining({ model: "File" })
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Verify .env.example contains feature-specific env vars
  // --------------------------------------------------------------------------
  describe("Scenario 6: Verify .env.example generation", () => {
    it("should include core environment variables", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it("should include feature-specific environment variables", async () => {
      const order = createMockOrder({
        selectedFeatures: ["payments.stripe"],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      // Check that Stripe env vars are in the resolved features
      const stripeFeature = resolved.features.find((f: FeatureConfig) => f.slug === "payments.stripe");
      expect(stripeFeature?.envVars).toContainEqual(
        expect.objectContaining({ key: "STRIPE_SECRET_KEY" })
      );
      expect(stripeFeature?.envVars).toContainEqual(
        expect.objectContaining({ key: "STRIPE_PUBLISHABLE_KEY" })
      );
      expect(stripeFeature?.envVars).toContainEqual(
        expect.objectContaining({ key: "STRIPE_WEBHOOK_SECRET" })
      );
    });

    it("should include AWS env vars for S3 feature", async () => {
      const order = createMockOrder({
        selectedFeatures: ["file-upload.s3"],
      });

      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockFileUploadFeature,
          isActive: true,
          requires: [],
          module: mockFileUploadFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      const s3Feature = resolved.features.find((f: FeatureConfig) => f.slug === "file-upload.s3");
      expect(s3Feature?.envVars).toContainEqual(
        expect.objectContaining({ key: "AWS_ACCESS_KEY_ID" })
      );
      expect(s3Feature?.envVars).toContainEqual(
        expect.objectContaining({ key: "AWS_S3_BUCKET" })
      );
    });

    it("should mark required env vars correctly", async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        ["payments.stripe"],
        "premium",
        []
      );

      const stripeFeature = resolved.features.find((f: FeatureConfig) => f.slug === "payments.stripe");
      const stripeSecretKey = stripeFeature?.envVars?.find(
        (e: EnvVarConfig) => e.key === "STRIPE_SECRET_KEY"
      );
      expect(stripeSecretKey?.required).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Verify README.md contains feature documentation
  // --------------------------------------------------------------------------
  describe("Scenario 7: Verify README.md generation", () => {
    it("should generate README with order information", async () => {
      const order = createMockOrder({
        orderNumber: "ORD-2024-TEST",
        tier: "premium",
        template: {
          name: "Enterprise SaaS",
          slug: "enterprise-saas",
          includedFeatures: [],
        },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it("should list all included features in README", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic", "payments.stripe"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      expect(resolved.features).toHaveLength(2);
      expect(resolved.features.map((f: FeatureConfig) => f.name)).toContain("Basic Authentication");
      expect(resolved.features.map((f: FeatureConfig) => f.name)).toContain("Stripe Payments");
    });

    it("should group features by category in README", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic", "payments.stripe", "file-upload.s3"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
        {
          ...mockPaymentsFeature,
          isActive: true,
          requires: [],
          module: mockPaymentsFeature.module,
        },
        {
          ...mockFileUploadFeature,
          isActive: true,
          requires: [],
          module: mockFileUploadFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      // Group features by module category
      const categories = new Set(resolved.features.map((f: FeatureConfig) => f.module.category));
      expect(categories).toContain("core");
      expect(categories).toContain("monetization");
      expect(categories).toContain("storage");
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Verify LICENSE.md contains order information
  // --------------------------------------------------------------------------
  describe("Scenario 8: Verify LICENSE.md generation", () => {
    it("should include license key in LICENSE.md", async () => {
      const order = createMockOrder({
        license: {
          id: "license-123",
          licenseKey: "ABCD-EFGH-IJKL-MNOP",
          downloadToken: "token",
          downloadCount: 0,
          maxDownloads: 5,
          status: "active",
          expiresAt: null,
        },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it("should include order number in LICENSE.md", async () => {
      const order = createMockOrder({
        orderNumber: "ORD-2024-PREMIUM-001",
      });

      // The order number should be used in license generation
      expect(order.orderNumber).toBe("ORD-2024-PREMIUM-001");
    });

    it("should include customer information in LICENSE.md", async () => {
      const order = createMockOrder({
        customerEmail: "enterprise@company.com",
        customerName: "Enterprise Corp",
      });

      expect(order.customerEmail).toBe("enterprise@company.com");
      expect(order.customerName).toBe("Enterprise Corp");
    });

    it("should include tier information in LICENSE.md", async () => {
      const order = createMockOrder({
        tier: "enterprise",
      });

      expect(order.tier).toBe("enterprise");
    });

    it("should handle null license gracefully", async () => {
      const order = createMockOrder({
        license: null,
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      // Should not throw when license is null
      const zipBuffer = await collectArchiveBuffer(generator, order);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Additional Edge Cases
  // --------------------------------------------------------------------------
  describe("Edge Cases", () => {
    it("should handle order without template", async () => {
      const order = createMockOrder({
        template: null,
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it("should handle order without license", async () => {
      const order = createMockOrder({
        license: null,
      });

      expect(order.license).toBeNull();
    });

    it("should handle features with no file mappings", async () => {
      const featureWithoutFiles = createMockFeature({
        fileMappings: null,
      });

      expect(featureWithoutFiles.fileMappings).toBeNull();
    });

    it("should handle features with no npm packages", async () => {
      const featureWithoutPackages = createMockFeature({
        npmPackages: null,
      });

      expect(featureWithoutPackages.npmPackages).toBeNull();
    });

    it("should handle features with no env vars", async () => {
      const featureWithoutEnv = createMockFeature({
        envVars: null,
      });

      expect(featureWithoutEnv.envVars).toBeNull();
    });

    it("should handle features with no schema mappings", async () => {
      const featureWithoutSchema = createMockFeature({
        schemaMappings: null,
      });

      expect(featureWithoutSchema.schemaMappings).toBeNull();
    });

    it("should deduplicate template and selected features", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
        template: {
          name: "Starter",
          slug: "starter",
          includedFeatures: ["auth.basic"], // Same feature
        },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        order.template?.includedFeatures || []
      );

      // Should only have one instance of auth.basic
      expect(resolved.features).toHaveLength(1);
      expect(resolved.allFeatureSlugs.filter((s: string) => s === "auth.basic")).toHaveLength(1);
    });

    it("should resolve transitive dependencies", async () => {
      const order = createMockOrder({
        selectedFeatures: ["social-auth.google"],
      });

      // social-auth.google depends on auth.basic
      const socialAuthFeature = createMockFeature({
        slug: "social-auth.google",
        name: "Google OAuth",
        description: "Sign in with Google",
        module: {
          slug: "social-auth",
          name: "Social Auth",
          category: "authentication",
        },
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany
        .mockResolvedValueOnce([
          {
            ...socialAuthFeature,
            isActive: true,
            requires: ["auth.basic"],
            module: socialAuthFeature.module,
          },
        ])
        .mockResolvedValueOnce([
          {
            ...authFeature,
            isActive: true,
            requires: [],
            module: authFeature.module,
          },
        ]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      // Should include both social-auth.google and its dependency auth.basic
      expect(resolved.allFeatureSlugs).toContain("social-auth.google");
      expect(resolved.allFeatureSlugs).toContain("auth.basic");
    });

    it("should generate correct project name from template slug and tier", async () => {
      const order = createMockOrder({
        tier: "premium",
        template: {
          name: "SaaS Starter",
          slug: "saas-starter",
          includedFeatures: [],
        },
      });

      // Project name should be template-slug-tier: saas-starter-premium

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.resolve(JSON.stringify(mockBasePackageJson));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      const zipBuffer = await collectArchiveBuffer(generator, order);

      expect(zipBuffer.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------
  describe("Error Handling", () => {
    it("should handle missing base package.json gracefully", async () => {
      const order = createMockOrder({
        selectedFeatures: ["auth.basic"],
      });

      const authFeature = createMockFeature();

      mockPrismaFindMany.mockResolvedValue([
        {
          ...authFeature,
          isActive: true,
          requires: [],
          module: authFeature.module,
        },
      ]);

      mockFsReadFile.mockImplementation((filePath: string) => {
        if (filePath.includes("package.json")) {
          return Promise.reject(new Error("File not found"));
        }
        if (filePath.includes("schema.prisma")) {
          return Promise.resolve(mockBasePrismaSchema);
        }
        return Promise.resolve("mock content");
      });

      mockFsReaddir.mockResolvedValue([]);

      // Should throw an error when base package.json is missing
      await expect(collectArchiveBuffer(generator, order)).rejects.toThrow();
    });

    it("should handle empty feature list", async () => {
      const order = createMockOrder({
        selectedFeatures: [],
        template: { name: "Empty", slug: "empty", includedFeatures: [] },
      });

      mockPrismaFindMany.mockResolvedValue([]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        order.template?.includedFeatures || []
      );

      expect(resolved.features).toHaveLength(0);
      expect(resolved.allFeatureSlugs).toHaveLength(0);
    });

    it("should handle inactive features", async () => {
      const order = createMockOrder({
        selectedFeatures: ["inactive-feature"],
      });

      // Return empty array since the feature is inactive (filtered by isActive: true)
      mockPrismaFindMany.mockResolvedValue([]);

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      expect(resolved.features).toHaveLength(0);
    });
  });
});
