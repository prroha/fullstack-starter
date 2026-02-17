/**
 * E2E Integration Tests for Project Generator Service
 *
 * These tests use:
 * - Real Prisma database (uses existing seeded data)
 * - Real file system (reads from actual /core/ directory)
 * - Real ZIP generation (writes to temp directory)
 * - Actual extraction and verification of generated content
 *
 * PREREQUISITES:
 * - Database must be seeded with `npm run db:seed` before running these tests
 * - Core directory must exist at PROJECT_ROOT/core/
 *
 * Test scenarios:
 * 1. Generate project with auth.basic feature
 * 2. Generate project with multiple features
 * 3. Verify Prisma schema is valid
 * 4. Verify package.json is valid JSON with correct structure
 */

import { PassThrough } from "stream";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { PrismaClient } from "@prisma/client";
import AdmZip from "adm-zip";
import { ProjectGenerator, OrderDetails } from "../generator.service.js";

// ============================================================================
// Test Database Setup
// ============================================================================

// Use the existing database with seeded data
const prisma = new PrismaClient();

// Project paths - use real paths
// __dirname is at studio/backend/src/services/__tests__
// Go up 5 levels: __tests__ -> services -> src -> backend -> studio -> PROJECT_ROOT
const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const CORE_BASE_PATH = path.join(PROJECT_ROOT, "core");

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a mock order for testing
 */
function createTestOrder(overrides: Partial<OrderDetails> = {}): OrderDetails {
  return {
    id: "test-order-e2e-001",
    orderNumber: "ORD-E2E-2024-001",
    tier: "pro",
    selectedFeatures: ["auth.basic"],
    customerEmail: "e2e-test@example.com",
    customerName: "E2E Test User",
    total: 149.0,
    template: {
      name: "SaaS Starter",
      slug: "saas-starter",
      includedFeatures: [],
    },
    license: {
      id: "license-e2e-001",
      licenseKey: "TEST-E2E-XXXX-XXXX",
      downloadToken: "e2e-download-token",
      downloadCount: 0,
      maxDownloads: 10,
      status: "active",
      expiresAt: null,
    },
    ...overrides,
  };
}

/**
 * Generates a project and collects the ZIP buffer
 */
async function generateProjectZip(
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
 * Extracts a ZIP buffer to a temp directory and returns the path
 */
async function extractZipToTemp(zipBuffer: Buffer, prefix: string): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  const zip = new AdmZip(zipBuffer);
  zip.extractAllTo(tempDir, true);
  return tempDir;
}

/**
 * Recursively lists all files in a directory
 */
async function listFilesRecursive(dir: string, basePath: string = ""): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Cleans up temp directory
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Validates Prisma schema basic structure
 */
function validatePrismaSchema(schemaContent: string): {
  valid: boolean;
  hasGenerator: boolean;
  hasDatasource: boolean;
  models: string[];
  enums: string[];
  errors: string[];
} {
  const errors: string[] = [];

  // Check for generator
  const hasGenerator = /generator\s+client\s*\{/.test(schemaContent);
  if (!hasGenerator) {
    errors.push("Missing generator block");
  }

  // Check for datasource
  const hasDatasource = /datasource\s+db\s*\{/.test(schemaContent);
  if (!hasDatasource) {
    errors.push("Missing datasource block");
  }

  // Extract model names
  const modelMatches = schemaContent.match(/^model\s+(\w+)\s*\{/gm) || [];
  const models = modelMatches.map((m) => {
    const match = m.match(/^model\s+(\w+)/);
    return match ? match[1] : "";
  }).filter(Boolean);

  // Extract enum names
  const enumMatches = schemaContent.match(/^enum\s+(\w+)\s*\{/gm) || [];
  const enums = enumMatches.map((e) => {
    const match = e.match(/^enum\s+(\w+)/);
    return match ? match[1] : "";
  }).filter(Boolean);

  return {
    valid: errors.length === 0,
    hasGenerator,
    hasDatasource,
    models,
    enums,
    errors,
  };
}

/**
 * Validates package.json structure
 */
function validatePackageJson(content: string): {
  valid: boolean;
  name: string | null;
  hasScripts: boolean;
  hasDependencies: boolean;
  hasDevDependencies: boolean;
  dependencies: string[];
  errors: string[];
} {
  const errors: string[] = [];
  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(content);
  } catch (e) {
    return {
      valid: false,
      name: null,
      hasScripts: false,
      hasDependencies: false,
      hasDevDependencies: false,
      dependencies: [],
      errors: [`Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}`],
    };
  }

  const name = typeof parsed.name === "string" ? parsed.name : null;
  const hasScripts = typeof parsed.scripts === "object" && parsed.scripts !== null;
  const hasDependencies = typeof parsed.dependencies === "object" && parsed.dependencies !== null;
  const hasDevDependencies = typeof parsed.devDependencies === "object" && parsed.devDependencies !== null;

  const dependencies = hasDependencies ? Object.keys(parsed.dependencies as Record<string, unknown>) : [];

  if (!name) {
    errors.push("Missing or invalid name field");
  }

  return {
    valid: errors.length === 0,
    name,
    hasScripts,
    hasDependencies,
    hasDevDependencies,
    dependencies,
    errors,
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe("Generator E2E Tests (Real Database & File System)", () => {
  let generator: ProjectGenerator;
  let tempDirs: string[] = [];

  // -------------------------------------------------------------------------
  // Setup and Teardown
  // -------------------------------------------------------------------------

  beforeAll(async () => {
    // Verify core directory exists
    const coreExists = fsSync.existsSync(CORE_BASE_PATH);
    if (!coreExists) {
      throw new Error(`Core directory not found at: ${CORE_BASE_PATH}`);
    }

    // Verify core backend exists
    const coreBackendExists = fsSync.existsSync(path.join(CORE_BASE_PATH, "backend"));
    if (!coreBackendExists) {
      throw new Error(`Core backend directory not found`);
    }

    // Verify database has seeded data
    const authBasicFeature = await prisma.feature.findUnique({
      where: { slug: "auth.basic" },
    });

    if (!authBasicFeature) {
      throw new Error(
        "Database is not seeded. Please run `npm run db:seed` before running e2e tests."
      );
    }

    // Create generator with real paths
    generator = new ProjectGenerator(CORE_BASE_PATH, PROJECT_ROOT);
  }, 30000);

  afterAll(async () => {
    // Clean up temp directories
    for (const dir of tempDirs) {
      await cleanupTempDir(dir);
    }

    await prisma.$disconnect();
  }, 30000);

  // -------------------------------------------------------------------------
  // Scenario 1: Generate project with auth.basic feature
  // -------------------------------------------------------------------------
  describe("Scenario 1: Generate project with auth.basic feature", () => {
    let extractedPath: string;
    let projectName: string;

    beforeAll(async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic"],
        tier: "starter",
        template: {
          name: "SaaS Starter",
          slug: "saas-starter",
          includedFeatures: [],
        },
      });

      projectName = "saas-starter-starter";

      const zipBuffer = await generateProjectZip(generator, order);
      extractedPath = await extractZipToTemp(zipBuffer, "e2e-auth-basic");
      tempDirs.push(extractedPath);
    }, 60000);

    it("should create a valid ZIP file that extracts successfully", () => {
      expect(fsSync.existsSync(extractedPath)).toBe(true);
    });

    it("should create project root directory with correct name", async () => {
      const projectDir = path.join(extractedPath, projectName);
      expect(fsSync.existsSync(projectDir)).toBe(true);
    });

    it("should create backend directory structure", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const backendDir = path.join(projectDir, "backend");

      expect(fsSync.existsSync(backendDir)).toBe(true);
      expect(fsSync.existsSync(path.join(backendDir, "src"))).toBe(true);
      expect(fsSync.existsSync(path.join(backendDir, "prisma"))).toBe(true);
    });

    it("should generate valid package.json in backend", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const packageJsonPath = path.join(projectDir, "backend", "package.json");

      expect(fsSync.existsSync(packageJsonPath)).toBe(true);

      const content = await fs.readFile(packageJsonPath, "utf-8");
      const validation = validatePackageJson(content);

      expect(validation.valid).toBe(true);
      expect(validation.hasScripts).toBe(true);
      expect(validation.hasDependencies).toBe(true);
    });

    it("should include auth feature npm packages in package.json", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const packageJsonPath = path.join(projectDir, "backend", "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const parsed = JSON.parse(content);

      // Auth.basic should add jsonwebtoken and bcryptjs
      expect(parsed.dependencies).toHaveProperty("jsonwebtoken");
      expect(parsed.dependencies).toHaveProperty("bcryptjs");
    });

    it("should generate valid Prisma schema", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const schemaPath = path.join(projectDir, "backend", "prisma", "schema.prisma");

      expect(fsSync.existsSync(schemaPath)).toBe(true);

      const content = await fs.readFile(schemaPath, "utf-8");
      const validation = validatePrismaSchema(content);

      expect(validation.valid).toBe(true);
      expect(validation.hasGenerator).toBe(true);
      expect(validation.hasDatasource).toBe(true);
      expect(validation.models.length).toBeGreaterThan(0);
    });

    it("should include User model in Prisma schema", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const schemaPath = path.join(projectDir, "backend", "prisma", "schema.prisma");
      const content = await fs.readFile(schemaPath, "utf-8");
      const validation = validatePrismaSchema(content);

      expect(validation.models).toContain("User");
    });

    it("should generate .env.example with core environment variables", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const envExamplePath = path.join(projectDir, "backend", ".env.example");

      expect(fsSync.existsSync(envExamplePath)).toBe(true);

      const content = await fs.readFile(envExamplePath, "utf-8");
      expect(content).toContain("DATABASE_URL");
      expect(content).toContain("NODE_ENV");
    });

    it("should generate README.md with order information", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const readmePath = path.join(projectDir, "README.md");

      expect(fsSync.existsSync(readmePath)).toBe(true);

      const content = await fs.readFile(readmePath, "utf-8");
      expect(content).toContain("Quick Start");
      expect(content).toContain("npm install");
    });

    it("should generate LICENSE.md with license key", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const licensePath = path.join(projectDir, "LICENSE.md");

      expect(fsSync.existsSync(licensePath)).toBe(true);

      const content = await fs.readFile(licensePath, "utf-8");
      expect(content).toContain("TEST-E2E-XXXX-XXXX");
      expect(content).toContain("ORD-E2E-2024-001");
    });

    it("should generate starter-config.json with feature list", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const configPath = path.join(projectDir, "starter-config.json");

      expect(fsSync.existsSync(configPath)).toBe(true);

      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.features).toContain("auth.basic");
      expect(config.tier).toBe("starter");
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 2: Generate project with multiple features
  // -------------------------------------------------------------------------
  describe("Scenario 2: Generate project with multiple features", () => {
    let extractedPath: string;
    let projectName: string;

    beforeAll(async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic", "payments.stripe", "storage.upload"],
        tier: "pro",
        template: {
          name: "Pro Bundle",
          slug: "pro-bundle",
          includedFeatures: [],
        },
      });

      projectName = "pro-bundle-pro";

      const zipBuffer = await generateProjectZip(generator, order);
      extractedPath = await extractZipToTemp(zipBuffer, "e2e-multi-features");
      tempDirs.push(extractedPath);
    }, 60000);

    it("should include all selected features in config", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const configPath = path.join(projectDir, "starter-config.json");
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      expect(config.features).toContain("auth.basic");
      expect(config.features).toContain("payments.stripe");
      expect(config.features).toContain("storage.upload");
    });

    it("should merge npm packages from all features", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const packageJsonPath = path.join(projectDir, "backend", "package.json");
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const parsed = JSON.parse(content);

      // Auth packages
      expect(parsed.dependencies).toHaveProperty("jsonwebtoken");
      expect(parsed.dependencies).toHaveProperty("bcryptjs");

      // Payments packages
      expect(parsed.dependencies).toHaveProperty("stripe");

      // Storage packages
      expect(parsed.dependencies).toHaveProperty("multer");
    });

    it("should include all feature env vars in .env.example", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const envExamplePath = path.join(projectDir, "backend", ".env.example");
      const content = await fs.readFile(envExamplePath, "utf-8");

      // Core env vars
      expect(content).toContain("DATABASE_URL");
      expect(content).toContain("JWT_SECRET");

      // Payments env vars
      expect(content).toContain("STRIPE_SECRET_KEY");
      expect(content).toContain("STRIPE_PUBLISHABLE_KEY");
    });

    it("should list all features in README.md", async () => {
      const projectDir = path.join(extractedPath, projectName);
      const readmePath = path.join(projectDir, "README.md");
      const content = await fs.readFile(readmePath, "utf-8");

      // Should have feature names
      expect(content).toContain("Authentication");
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Verify Prisma schema is parseable
  // -------------------------------------------------------------------------
  describe("Scenario 3: Verify Prisma schema validity", () => {
    let schemaContent: string;

    beforeAll(async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic"],
        tier: "starter",
      });

      const zipBuffer = await generateProjectZip(generator, order);
      const extractedPath = await extractZipToTemp(zipBuffer, "e2e-schema-test");
      tempDirs.push(extractedPath);

      const projectName = "saas-starter-starter";
      const schemaPath = path.join(extractedPath, projectName, "backend", "prisma", "schema.prisma");
      schemaContent = await fs.readFile(schemaPath, "utf-8");
    }, 60000);

    it("should have valid generator configuration", () => {
      expect(schemaContent).toMatch(/generator\s+client\s*\{/);
      expect(schemaContent).toContain('provider = "prisma-client-js"');
    });

    it("should have valid datasource configuration", () => {
      expect(schemaContent).toMatch(/datasource\s+db\s*\{/);
      expect(schemaContent).toContain('provider = "postgresql"');
      expect(schemaContent).toContain('url      = env("DATABASE_URL")');
    });

    it("should have properly formatted model blocks", () => {
      // Check that models have opening and closing braces
      const modelBlocks = schemaContent.match(/model\s+\w+\s*\{[\s\S]*?\n\}/gm) || [];
      expect(modelBlocks.length).toBeGreaterThan(0);

      // Each model should have at least an id field
      for (const block of modelBlocks) {
        expect(block).toMatch(/id\s+\w+/);
      }
    });

    it("should have User model with required fields", () => {
      expect(schemaContent).toContain("model User");
      expect(schemaContent).toContain("email");
      expect(schemaContent).toContain("@unique");
    });

    it("should not have duplicate model definitions", () => {
      const modelNames = (schemaContent.match(/^model\s+(\w+)/gm) || [])
        .map((m) => m.replace(/^model\s+/, ""));

      const uniqueNames = new Set(modelNames);
      expect(modelNames.length).toBe(uniqueNames.size);
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Verify package.json is valid JSON with correct structure
  // -------------------------------------------------------------------------
  describe("Scenario 4: Verify package.json structure", () => {
    let backendPackageJson: Record<string, unknown>;

    beforeAll(async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic", "payments.stripe"],
        tier: "pro",
      });

      const zipBuffer = await generateProjectZip(generator, order);
      const extractedPath = await extractZipToTemp(zipBuffer, "e2e-package-test");
      tempDirs.push(extractedPath);

      const projectName = "saas-starter-pro";

      // Read backend package.json
      const backendPath = path.join(extractedPath, projectName, "backend", "package.json");
      const backendContent = await fs.readFile(backendPath, "utf-8");
      backendPackageJson = JSON.parse(backendContent);
    }, 60000);

    it("should have a valid project name in backend package.json", () => {
      expect(backendPackageJson.name).toBeDefined();
      expect(typeof backendPackageJson.name).toBe("string");
    });

    it("should have version field", () => {
      expect(backendPackageJson.version).toBe("1.0.0");
    });

    it("should have scripts section with essential scripts", () => {
      const scripts = backendPackageJson.scripts as Record<string, string>;
      expect(scripts).toBeDefined();
      expect(scripts.dev).toBeDefined();
      expect(scripts.build).toBeDefined();
      expect(scripts.start).toBeDefined();
    });

    it("should have database scripts", () => {
      const scripts = backendPackageJson.scripts as Record<string, string>;
      expect(scripts["db:migrate"]).toBeDefined();
      expect(scripts["db:generate"]).toBeDefined();
    });

    it("should have dependencies section", () => {
      expect(backendPackageJson.dependencies).toBeDefined();
      expect(typeof backendPackageJson.dependencies).toBe("object");
    });

    it("should have devDependencies section", () => {
      expect(backendPackageJson.devDependencies).toBeDefined();
      expect(typeof backendPackageJson.devDependencies).toBe("object");
    });

    it("should have core dependencies from base template", () => {
      const deps = backendPackageJson.dependencies as Record<string, string>;
      expect(deps.express).toBeDefined();
      expect(deps["@prisma/client"]).toBeDefined();
    });

    it("should have feature-specific dependencies merged", () => {
      const deps = backendPackageJson.dependencies as Record<string, string>;

      // From auth.basic
      expect(deps.jsonwebtoken).toBeDefined();
      expect(deps.bcryptjs).toBeDefined();

      // From payments.stripe
      expect(deps.stripe).toBeDefined();
    });

    it("should have sorted dependencies alphabetically", () => {
      const deps = backendPackageJson.dependencies as Record<string, string>;
      const keys = Object.keys(deps);
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 5: Feature dependency resolution
  // -------------------------------------------------------------------------
  describe("Scenario 5: Feature dependency resolution", () => {
    it("should resolve auth.social dependency on auth.basic", async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.social"], // Only select social, basic should be auto-included
        tier: "basic",
      });

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        []
      );

      expect(resolved.allFeatureSlugs).toContain("auth.social");
      expect(resolved.allFeatureSlugs).toContain("auth.basic"); // Should be resolved as dependency
    });

    it("should deduplicate features from template and selection", async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic", "payments.stripe"],
        tier: "pro",
        template: {
          name: "Test Template",
          slug: "test-template",
          includedFeatures: ["auth.basic"], // Duplicate
        },
      });

      const resolved = await generator.resolveFeatures(
        order.selectedFeatures,
        order.tier,
        order.template?.includedFeatures || []
      );

      // Should only have one instance of auth.basic
      const authBasicCount = resolved.allFeatureSlugs.filter((s: string) => s === "auth.basic").length;
      expect(authBasicCount).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 6: Directory structure verification
  // -------------------------------------------------------------------------
  describe("Scenario 6: Directory structure verification", () => {
    let extractedPath: string;
    let projectName: string;
    let allFiles: string[];

    beforeAll(async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic"],
        tier: "starter",
        template: {
          name: "Full Project",
          slug: "full-project",
          includedFeatures: [],
        },
      });

      projectName = "full-project-starter";

      const zipBuffer = await generateProjectZip(generator, order);
      extractedPath = await extractZipToTemp(zipBuffer, "e2e-structure-test");
      tempDirs.push(extractedPath);

      const projectDir = path.join(extractedPath, projectName);
      allFiles = await listFilesRecursive(projectDir);
    }, 60000);

    it("should not include node_modules", () => {
      const hasNodeModules = allFiles.some((f) => f.includes("node_modules"));
      expect(hasNodeModules).toBe(false);
    });

    it("should not include .git directory", () => {
      const hasGit = allFiles.some((f) => f.includes(".git/") || f.endsWith(".git"));
      expect(hasGit).toBe(false);
    });

    it("should not include dist/build directories", () => {
      const hasDist = allFiles.some((f) => f.includes("/dist/") || f.startsWith("dist/"));
      const hasBuild = allFiles.some((f) => f.includes("/build/") || f.startsWith("build/"));
      expect(hasDist).toBe(false);
      expect(hasBuild).toBe(false);
    });

    it("should include backend source files", () => {
      const hasBackendSrc = allFiles.some((f) => f.includes("backend/src"));
      expect(hasBackendSrc).toBe(true);
    });

    it("should include prisma directory", () => {
      const hasPrisma = allFiles.some((f) => f.includes("backend/prisma"));
      expect(hasPrisma).toBe(true);
    });

    it("should include root config files", () => {
      const hasReadme = allFiles.some((f) => f === "README.md");
      const hasLicense = allFiles.some((f) => f === "LICENSE.md");
      const hasConfig = allFiles.some((f) => f === "starter-config.json");

      expect(hasReadme).toBe(true);
      expect(hasLicense).toBe(true);
      expect(hasConfig).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Scenario 7: Edge cases and error handling
  // -------------------------------------------------------------------------
  describe("Scenario 7: Edge cases and error handling", () => {
    it("should handle order without template", async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic"],
        template: null,
      });

      const zipBuffer = await generateProjectZip(generator, order);
      const extractedPath = await extractZipToTemp(zipBuffer, "e2e-no-template");
      tempDirs.push(extractedPath);

      // Should use "starter" as default template slug
      const projectDir = path.join(extractedPath, "starter-pro");
      expect(fsSync.existsSync(projectDir)).toBe(true);
    }, 60000);

    it("should handle order without license", async () => {
      const order = createTestOrder({
        selectedFeatures: ["auth.basic"],
        license: null,
      });

      const zipBuffer = await generateProjectZip(generator, order);
      const extractedPath = await extractZipToTemp(zipBuffer, "e2e-no-license");
      tempDirs.push(extractedPath);

      const projectName = "saas-starter-pro";
      const licensePath = path.join(extractedPath, projectName, "LICENSE.md");

      // License file should still exist but with "N/A" for missing info
      expect(fsSync.existsSync(licensePath)).toBe(true);
      const content = await fs.readFile(licensePath, "utf-8");
      expect(content).toContain("N/A");
    }, 60000);

    it("should handle empty feature list gracefully", async () => {
      const order = createTestOrder({
        selectedFeatures: [],
        template: {
          name: "Empty",
          slug: "empty",
          includedFeatures: [],
        },
      });

      // Should still generate a project with just base core files
      const zipBuffer = await generateProjectZip(generator, order);
      expect(zipBuffer.length).toBeGreaterThan(0);

      const extractedPath = await extractZipToTemp(zipBuffer, "e2e-empty-features");
      tempDirs.push(extractedPath);

      const projectDir = path.join(extractedPath, "empty-pro");
      expect(fsSync.existsSync(projectDir)).toBe(true);
    }, 60000);
  });
});
