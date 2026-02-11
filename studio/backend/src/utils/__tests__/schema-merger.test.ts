/**
 * Unit tests for schema-merger utility
 */

import {
  mergeSchemas,
  validateSchemaCompleteness,
  generateBaseSchema,
  MergeResult,
  SchemaMappingConfig,
} from "../schema-merger";

// Mock fs/promises
jest.mock("fs/promises");

import fs from "fs/promises";

const mockedFs = jest.mocked(fs);

describe("schema-merger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.warn during tests
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Sample Prisma schema content for testing
  const baseSchemaContent = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
`;

  const paymentSchemaContent = `
model Payment {
  id        String        @id @default(cuid())
  amount    Int
  currency  String
  status    PaymentStatus
  userId    String
  createdAt DateTime      @default(now())
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
`;

  const subscriptionSchemaContent = `
model Subscription {
  id        String             @id @default(cuid())
  planId    String
  userId    String
  status    SubscriptionStatus
  startDate DateTime
  endDate   DateTime?
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
}
`;

  const duplicateUserSchemaContent = `
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

  describe("mergeSchemas()", () => {
    it("should merge multiple schema files into a single schema", async () => {
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("payment")) {
          return Promise.resolve(paymentSchemaContent);
        }
        if (pathStr.includes("subscription")) {
          return Promise.resolve(subscriptionSchemaContent);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Payment", source: "modules/payments/backend/prisma/schema.prisma" },
        { model: "Subscription", source: "modules/subscription/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(result.models).toContain("User");
      expect(result.models).toContain("Payment");
      expect(result.models).toContain("Subscription");
      expect(result.enums).toContain("Role");
      expect(result.enums).toContain("PaymentStatus");
      expect(result.enums).toContain("SubscriptionStatus");
      expect(result.schema).toContain("model User {");
      expect(result.schema).toContain("model Payment {");
      expect(result.schema).toContain("model Subscription {");
    });

    it("should include generator and datasource in merged schema", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const result = await mergeSchemas("/project/core", []);

      expect(result.schema).toContain('generator client {');
      expect(result.schema).toContain('provider = "prisma-client-js"');
      expect(result.schema).toContain('datasource db {');
      expect(result.schema).toContain('provider = "postgresql"');
    });

    it("should return arrays of model and enum names", async () => {
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("payment")) {
          return Promise.resolve(paymentSchemaContent);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Payment", source: "modules/payments/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(Array.isArray(result.models)).toBe(true);
      expect(Array.isArray(result.enums)).toBe(true);
      expect(result.models.length).toBeGreaterThan(0);
      expect(result.enums.length).toBeGreaterThan(0);
    });

    it("should use default project root when not provided", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const result = await mergeSchemas("/project/core", []);

      expect(result.models).toContain("User");
      expect(result.enums).toContain("Role");
    });
  });

  describe("validateSchemaCompleteness()", () => {
    it("should return valid=true when all required models are present", () => {
      const result: MergeResult = {
        schema: "...",
        models: ["User", "Payment", "Subscription"],
        enums: ["Role", "PaymentStatus"],
      };

      const validation = validateSchemaCompleteness(result, ["User", "Payment"]);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it("should return valid=false when required models are missing", () => {
      const result: MergeResult = {
        schema: "...",
        models: ["User"],
        enums: ["Role"],
      };

      const validation = validateSchemaCompleteness(result, ["User", "Payment", "Order"]);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain("Payment");
      expect(validation.missing).toContain("Order");
      expect(validation.missing).not.toContain("User");
    });

    it("should return valid=true when no required models specified", () => {
      const result: MergeResult = {
        schema: "...",
        models: ["User"],
        enums: ["Role"],
      };

      const validation = validateSchemaCompleteness(result, []);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it("should return all missing models in the missing array", () => {
      const result: MergeResult = {
        schema: "...",
        models: [],
        enums: [],
      };

      const requiredModels = ["User", "Payment", "Subscription", "Order"];
      const validation = validateSchemaCompleteness(result, requiredModels);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toHaveLength(4);
      expect(validation.missing).toEqual(requiredModels);
    });
  });

  describe("generateBaseSchema()", () => {
    it("should generate schema from core base path", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schema = await generateBaseSchema("/project/core");

      expect(schema).toContain("generator client");
      expect(schema).toContain("datasource db");
      expect(schema).toContain("model User");
    });

    it("should return schema string without feature schemas", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schema = await generateBaseSchema("/project/core");

      expect(typeof schema).toBe("string");
      expect(schema).toContain("model User {");
      expect(schema).toContain("enum Role {");
    });

    it("should return base schema with proper formatting", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schema = await generateBaseSchema("/project/core");

      // Should end with newline
      expect(schema.endsWith("\n")).toBe(true);
      // Should have section headers
      expect(schema).toContain("// MODELS");
      expect(schema).toContain("// ENUMS");
    });
  });

  describe("parsing model blocks from schema content", () => {
    it("should correctly parse single model from schema", async () => {
      const singleModelSchema = `
model Product {
  id          String   @id @default(cuid())
  name        String
  price       Int
  description String?
}
`;
      mockedFs.readFile.mockResolvedValue(singleModelSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.models).toContain("Product");
      expect(result.models).toHaveLength(1);
    });

    it("should correctly parse multiple models from schema", async () => {
      const multiModelSchema = `
model Product {
  id    String @id
  name  String
}

model Category {
  id    String @id
  title String
}

model Tag {
  id   String @id
  name String
}
`;
      mockedFs.readFile.mockResolvedValue(multiModelSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.models).toContain("Product");
      expect(result.models).toContain("Category");
      expect(result.models).toContain("Tag");
      expect(result.models).toHaveLength(3);
    });

    it("should parse model with complex field definitions", async () => {
      const complexModelSchema = `
model Order {
  id        String      @id @default(cuid())
  items     OrderItem[]
  total     Decimal     @db.Decimal(10, 2)
  status    OrderStatus @default(PENDING)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([status, createdAt])
  @@map("orders")
}
`;
      mockedFs.readFile.mockResolvedValue(complexModelSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.models).toContain("Order");
      expect(result.schema).toContain("@@index");
      expect(result.schema).toContain("@@map");
    });
  });

  describe("parsing enum blocks from schema content", () => {
    it("should correctly parse single enum from schema", async () => {
      const singleEnumSchema = `
enum Status {
  ACTIVE
  INACTIVE
  PENDING
}
`;
      mockedFs.readFile.mockResolvedValue(singleEnumSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.enums).toContain("Status");
      expect(result.enums).toHaveLength(1);
    });

    it("should correctly parse multiple enums from schema", async () => {
      const multiEnumSchema = `
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
}

enum PaymentMethod {
  CARD
  BANK
  WALLET
}
`;
      mockedFs.readFile.mockResolvedValue(multiEnumSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.enums).toContain("UserRole");
      expect(result.enums).toContain("OrderStatus");
      expect(result.enums).toContain("PaymentMethod");
      expect(result.enums).toHaveLength(3);
    });

    it("should parse mixed models and enums correctly", async () => {
      const mixedSchema = `
enum Role {
  USER
  ADMIN
}

model User {
  id   String @id
  role Role
}

enum Status {
  ACTIVE
  INACTIVE
}

model Post {
  id     String @id
  status Status
}
`;
      mockedFs.readFile.mockResolvedValue(mixedSchema);

      const result = await mergeSchemas("/project/core", []);

      expect(result.models).toContain("User");
      expect(result.models).toContain("Post");
      expect(result.enums).toContain("Role");
      expect(result.enums).toContain("Status");
    });
  });

  describe("handling of missing schema files", () => {
    it("should warn but not fail when schema file is missing", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        return Promise.reject(new Error("ENOENT: File not found"));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Missing", source: "modules/missing/backend/prisma/schema.prisma" },
      ];

      // Should not throw
      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result.models).toContain("User"); // Base schema still works
      expect(result.schema).toBeDefined();
    });

    it("should continue processing other files when one is missing", async () => {
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("payment")) {
          return Promise.resolve(paymentSchemaContent);
        }
        if (pathStr.includes("missing")) {
          return Promise.reject(new Error("ENOENT: File not found"));
        }
        return Promise.reject(new Error(`Unexpected path: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Payment", source: "modules/payments/backend/prisma/schema.prisma" },
        { model: "Missing", source: "modules/missing/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(result.models).toContain("User");
      expect(result.models).toContain("Payment");
      expect(result.enums).toContain("PaymentStatus");
    });

    it("should return empty models/enums when base schema is also missing", async () => {
      mockedFs.readFile.mockRejectedValue(new Error("ENOENT: File not found"));

      const result = await mergeSchemas("/project/core", []);

      // Should still return a valid structure with base generator/datasource
      expect(result.schema).toContain("generator client");
      expect(result.schema).toContain("datasource db");
      expect(result.models).toHaveLength(0);
      expect(result.enums).toHaveLength(0);
    });
  });

  describe("deduplication of models", () => {
    it("should not duplicate models when same model appears in multiple features", async () => {
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("feature1")) {
          return Promise.resolve(duplicateUserSchemaContent);
        }
        if (pathStr.includes("feature2")) {
          return Promise.resolve(duplicateUserSchemaContent);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "User", source: "modules/feature1/backend/prisma/schema.prisma" },
        { model: "User", source: "modules/feature2/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      // Count occurrences of "model User" in the schema
      const userModelCount = (result.schema.match(/model User \{/g) || []).length;
      expect(userModelCount).toBe(1);

      // User should appear only once in the models array
      const userCount = result.models.filter((m) => m === "User").length;
      expect(userCount).toBe(1);
    });

    it("should keep first occurrence when models have different definitions", async () => {
      const extendedUserSchema = `
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("extended")) {
          return Promise.resolve(extendedUserSchema);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "User", source: "modules/extended/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      // Base schema User should be kept (first occurrence wins)
      expect(result.schema).not.toContain("bio");
      expect(result.models.filter((m) => m === "User")).toHaveLength(1);
    });

    it("should not duplicate enums when same enum appears in multiple features", async () => {
      const featureWithRole = `
enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

model Feature {
  id String @id
}
`;
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("feature")) {
          return Promise.resolve(featureWithRole);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Feature", source: "modules/feature/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      // Count occurrences of "enum Role" in the schema
      const roleEnumCount = (result.schema.match(/enum Role \{/g) || []).length;
      expect(roleEnumCount).toBe(1);

      // Role should appear only once in the enums array
      const roleCount = result.enums.filter((e) => e === "Role").length;
      expect(roleCount).toBe(1);
    });

    it("should add new models from features while keeping base models", async () => {
      mockedFs.readFile.mockImplementation((filePath) => {
        const pathStr = filePath.toString();
        if (pathStr.includes("core") && pathStr.includes("schema.prisma")) {
          return Promise.resolve(baseSchemaContent);
        }
        if (pathStr.includes("payment")) {
          return Promise.resolve(paymentSchemaContent);
        }
        return Promise.reject(new Error(`File not found: ${pathStr}`));
      });

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Payment", source: "modules/payments/backend/prisma/schema.prisma" },
      ];

      const result = await mergeSchemas("/project/core", schemaMappings, "/project");

      // Should have both base and feature models
      expect(result.models).toContain("User");
      expect(result.models).toContain("Payment");
      expect(result.enums).toContain("Role");
      expect(result.enums).toContain("PaymentStatus");

      // Each should appear only once
      expect(result.models.length).toBe(new Set(result.models).size);
      expect(result.enums.length).toBe(new Set(result.enums).size);
    });
  });

  describe("schema path resolution", () => {
    it("should resolve modules/ paths relative to project root", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Test", source: "modules/test/backend/prisma/schema.prisma" },
      ];

      await mergeSchemas("/project/core", schemaMappings, "/project");

      // Check that the modules path was resolved from project root
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("/project/modules/test/backend/prisma/schema.prisma"),
        "utf-8"
      );
    });

    it("should resolve core/ paths relative to project root", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Core", source: "core/backend/prisma/other.prisma" },
      ];

      await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("/project/core/backend/prisma/other.prisma"),
        "utf-8"
      );
    });

    it("should resolve legacy paths relative to core base path", async () => {
      mockedFs.readFile.mockResolvedValue(baseSchemaContent);

      const schemaMappings: SchemaMappingConfig[] = [
        { model: "Legacy", source: "backend/prisma/legacy.prisma" },
      ];

      await mergeSchemas("/project/core", schemaMappings, "/project");

      expect(mockedFs.readFile).toHaveBeenCalledWith(
        expect.stringContaining("/project/core/backend/prisma/legacy.prisma"),
        "utf-8"
      );
    });
  });
});
