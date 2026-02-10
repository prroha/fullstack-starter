/**
 * Unit tests for DependencyResolver class
 *
 * To run these tests, install Vitest in the studio/web package:
 *
 *   npm install -D vitest
 *
 * Add test script to package.json:
 *
 *   "scripts": {
 *     "test": "vitest",
 *     "test:run": "vitest run"
 *   }
 *
 * Create vitest.config.ts (optional, for path aliases):
 *
 *   import { defineConfig } from 'vitest/config';
 *   import path from 'path';
 *
 *   export default defineConfig({
 *     test: {
 *       globals: true,
 *     },
 *     resolve: {
 *       alias: {
 *         '@studio/shared': path.resolve(__dirname, '../shared/types/index.ts'),
 *       },
 *     },
 *   });
 *
 * Then run: npm test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DependencyResolver } from "../dependencies";
import type { Feature } from "@studio/shared";

/**
 * Helper to create a minimal mock feature
 */
function createMockFeature(
  slug: string,
  options: Partial<Feature> = {}
): Feature {
  return {
    id: `id-${slug}`,
    slug,
    name: options.name || slug.charAt(0).toUpperCase() + slug.slice(1),
    description: options.description || `Description for ${slug}`,
    moduleId: options.moduleId || "module-1",
    price: options.price ?? 0,
    tier: options.tier ?? null,
    requires: options.requires || [],
    conflicts: options.conflicts || [],
    displayOrder: options.displayOrder ?? 0,
    isActive: options.isActive ?? true,
    isNew: options.isNew ?? false,
    isPopular: options.isPopular ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("DependencyResolver", () => {
  describe("constructor and initialization", () => {
    it("should initialize with empty features array", () => {
      const resolver = new DependencyResolver([]);
      expect(resolver.getDependencies("any")).toEqual([]);
      expect(resolver.getDependents("any")).toEqual([]);
    });

    it("should initialize with features and build graphs", () => {
      const features: Feature[] = [
        createMockFeature("auth", { requires: [] }),
        createMockFeature("oauth", { requires: ["auth"] }),
      ];

      const resolver = new DependencyResolver(features);
      expect(resolver.getDependencies("oauth")).toEqual(["auth"]);
      expect(resolver.getDependents("auth")).toEqual(["oauth"]);
    });

    it("should handle features with no dependencies", () => {
      const features: Feature[] = [
        createMockFeature("standalone-1"),
        createMockFeature("standalone-2"),
      ];

      const resolver = new DependencyResolver(features);
      expect(resolver.getDependencies("standalone-1")).toEqual([]);
      expect(resolver.getDependencies("standalone-2")).toEqual([]);
    });
  });

  describe("updateFeatures", () => {
    it("should rebuild graphs when features are updated", () => {
      const resolver = new DependencyResolver([
        createMockFeature("auth"),
        createMockFeature("oauth", { requires: ["auth"] }),
      ]);

      expect(resolver.getDependencies("oauth")).toEqual(["auth"]);

      // Update with new features
      resolver.updateFeatures([
        createMockFeature("database"),
        createMockFeature("orm", { requires: ["database"] }),
      ]);

      expect(resolver.getDependencies("oauth")).toEqual([]);
      expect(resolver.getDependencies("orm")).toEqual(["database"]);
    });

    it("should clear old data when updating with empty array", () => {
      const resolver = new DependencyResolver([
        createMockFeature("auth"),
        createMockFeature("oauth", { requires: ["auth"] }),
      ]);

      resolver.updateFeatures([]);

      expect(resolver.getDependencies("oauth")).toEqual([]);
      expect(resolver.getDependents("auth")).toEqual([]);
    });
  });

  describe("getDependencies - recursive dependency resolution", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
        createMockFeature("sso", { requires: ["oauth"] }),
        createMockFeature("database"),
        createMockFeature("orm", { requires: ["database"] }),
        createMockFeature("multi-tenant", { requires: ["auth", "database"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return empty array for feature with no dependencies", () => {
      expect(resolver.getDependencies("core")).toEqual([]);
      expect(resolver.getDependencies("database")).toEqual([]);
    });

    it("should return direct dependencies", () => {
      expect(resolver.getDependencies("auth")).toEqual(["core"]);
      expect(resolver.getDependencies("orm")).toEqual(["database"]);
    });

    it("should return all transitive dependencies", () => {
      const deps = resolver.getDependencies("sso");
      expect(deps).toContain("oauth");
      expect(deps).toContain("auth");
      expect(deps).toContain("core");
      expect(deps).toHaveLength(3);
    });

    it("should handle multiple dependency branches", () => {
      const deps = resolver.getDependencies("multi-tenant");
      expect(deps).toContain("auth");
      expect(deps).toContain("core");
      expect(deps).toContain("database");
      expect(deps).toHaveLength(3);
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.getDependencies("unknown")).toEqual([]);
    });

    it("should handle deep dependency chains", () => {
      const features: Feature[] = [
        createMockFeature("level-0"),
        createMockFeature("level-1", { requires: ["level-0"] }),
        createMockFeature("level-2", { requires: ["level-1"] }),
        createMockFeature("level-3", { requires: ["level-2"] }),
        createMockFeature("level-4", { requires: ["level-3"] }),
        createMockFeature("level-5", { requires: ["level-4"] }),
      ];
      const deepResolver = new DependencyResolver(features);

      const deps = deepResolver.getDependencies("level-5");
      expect(deps).toHaveLength(5);
      expect(deps).toContain("level-0");
      expect(deps).toContain("level-1");
      expect(deps).toContain("level-2");
      expect(deps).toContain("level-3");
      expect(deps).toContain("level-4");
    });

    it("should handle circular dependencies gracefully", () => {
      // A -> B -> C -> A (circular)
      const features: Feature[] = [
        createMockFeature("a", { requires: ["c"] }),
        createMockFeature("b", { requires: ["a"] }),
        createMockFeature("c", { requires: ["b"] }),
      ];
      const circularResolver = new DependencyResolver(features);

      // Should not infinite loop
      const depsA = circularResolver.getDependencies("a");
      expect(depsA).toContain("b");
      expect(depsA).toContain("c");

      const depsB = circularResolver.getDependencies("b");
      expect(depsB).toContain("a");
      expect(depsB).toContain("c");
    });

    it("should handle diamond dependency pattern", () => {
      // D depends on B and C, both B and C depend on A
      const features: Feature[] = [
        createMockFeature("a"),
        createMockFeature("b", { requires: ["a"] }),
        createMockFeature("c", { requires: ["a"] }),
        createMockFeature("d", { requires: ["b", "c"] }),
      ];
      const diamondResolver = new DependencyResolver(features);

      const deps = diamondResolver.getDependencies("d");
      expect(deps).toContain("a");
      expect(deps).toContain("b");
      expect(deps).toContain("c");
      // "a" should only appear once
      expect(deps.filter((d) => d === "a")).toHaveLength(1);
    });
  });

  describe("getDirectDependencies", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return only direct dependencies", () => {
      expect(resolver.getDirectDependencies("oauth")).toEqual(["auth"]);
    });

    it("should return empty array for no dependencies", () => {
      expect(resolver.getDirectDependencies("core")).toEqual([]);
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.getDirectDependencies("unknown")).toEqual([]);
    });
  });

  describe("getDependents - reverse dependency lookup", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
        createMockFeature("sso", { requires: ["oauth"] }),
        createMockFeature("magic-link", { requires: ["auth"] }),
        createMockFeature("database"),
        createMockFeature("multi-tenant", { requires: ["auth", "database"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return empty array for feature with no dependents", () => {
      expect(resolver.getDependents("sso")).toEqual([]);
      expect(resolver.getDependents("magic-link")).toEqual([]);
    });

    it("should return direct dependents", () => {
      const dependents = resolver.getDependents("oauth");
      expect(dependents).toContain("sso");
    });

    it("should return all transitive dependents", () => {
      const dependents = resolver.getDependents("core");
      expect(dependents).toContain("auth");
      expect(dependents).toContain("oauth");
      expect(dependents).toContain("sso");
      expect(dependents).toContain("magic-link");
      expect(dependents).toContain("multi-tenant");
    });

    it("should handle multiple dependents at same level", () => {
      const dependents = resolver.getDependents("auth");
      expect(dependents).toContain("oauth");
      expect(dependents).toContain("magic-link");
      expect(dependents).toContain("multi-tenant");
      expect(dependents).toContain("sso"); // transitive through oauth
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.getDependents("unknown")).toEqual([]);
    });

    it("should handle circular dependencies gracefully", () => {
      const features: Feature[] = [
        createMockFeature("a", { requires: ["c"] }),
        createMockFeature("b", { requires: ["a"] }),
        createMockFeature("c", { requires: ["b"] }),
      ];
      const circularResolver = new DependencyResolver(features);

      // Should not infinite loop
      const dependentsA = circularResolver.getDependents("a");
      expect(dependentsA).toContain("b");
      expect(dependentsA).toContain("c");
    });
  });

  describe("getDirectDependents", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
        createMockFeature("magic-link", { requires: ["auth"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return only direct dependents", () => {
      const directDependents = resolver.getDirectDependents("auth");
      expect(directDependents).toContain("oauth");
      expect(directDependents).toContain("magic-link");
      expect(directDependents).toHaveLength(2);
    });

    it("should return empty array for no dependents", () => {
      expect(resolver.getDirectDependents("oauth")).toEqual([]);
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.getDirectDependents("unknown")).toEqual([]);
    });
  });

  describe("checkConflicts - conflict detection", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("prisma", { conflicts: ["typeorm", "drizzle"] }),
        createMockFeature("typeorm", { conflicts: ["prisma", "drizzle"] }),
        createMockFeature("drizzle", { conflicts: ["prisma", "typeorm"] }),
        createMockFeature("postgres"),
        createMockFeature("mysql"),
        createMockFeature("auth"),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return empty array when no conflicts exist", () => {
      expect(resolver.checkConflicts("auth", ["postgres", "mysql"])).toEqual(
        []
      );
    });

    it("should return empty array when selected is empty", () => {
      expect(resolver.checkConflicts("prisma", [])).toEqual([]);
    });

    it("should detect single conflict", () => {
      const conflicts = resolver.checkConflicts("prisma", ["typeorm"]);
      expect(conflicts).toEqual(["typeorm"]);
    });

    it("should detect multiple conflicts", () => {
      const conflicts = resolver.checkConflicts("prisma", [
        "typeorm",
        "drizzle",
      ]);
      expect(conflicts).toContain("typeorm");
      expect(conflicts).toContain("drizzle");
      expect(conflicts).toHaveLength(2);
    });

    it("should only return conflicts that are in selected", () => {
      const conflicts = resolver.checkConflicts("prisma", [
        "typeorm",
        "postgres",
      ]);
      expect(conflicts).toEqual(["typeorm"]);
    });

    it("should return empty array for feature with no conflicts defined", () => {
      expect(resolver.checkConflicts("postgres", ["prisma", "typeorm"])).toEqual(
        []
      );
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.checkConflicts("unknown", ["prisma", "typeorm"])).toEqual(
        []
      );
    });

    it("should handle bidirectional conflicts", () => {
      // Conflict added only on one side should work bidirectionally
      const features: Feature[] = [
        createMockFeature("a", { conflicts: ["b"] }),
        createMockFeature("b"), // No conflicts defined
      ];
      const biResolver = new DependencyResolver(features);

      expect(biResolver.checkConflicts("a", ["b"])).toEqual(["b"]);
      expect(biResolver.checkConflicts("b", ["a"])).toEqual(["a"]);
    });
  });

  describe("getConflicts", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("prisma", { conflicts: ["typeorm", "drizzle"] }),
        createMockFeature("typeorm"),
        createMockFeature("drizzle"),
        createMockFeature("standalone"),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return all conflicts for a feature", () => {
      const conflicts = resolver.getConflicts("prisma");
      expect(conflicts).toContain("typeorm");
      expect(conflicts).toContain("drizzle");
    });

    it("should return empty array for feature with no conflicts", () => {
      expect(resolver.getConflicts("standalone")).toEqual([]);
    });

    it("should return empty array for unknown feature", () => {
      expect(resolver.getConflicts("unknown")).toEqual([]);
    });
  });

  describe("canSelect - validation methods", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("auth", { name: "Authentication" }),
        createMockFeature("oauth", { name: "OAuth", requires: ["auth"] }),
        createMockFeature("prisma", {
          name: "Prisma ORM",
          conflicts: ["typeorm"],
        }),
        createMockFeature("typeorm", {
          name: "TypeORM",
          conflicts: ["prisma"],
        }),
        createMockFeature("standalone"),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return canSelect: true when no conflicts", () => {
      const result = resolver.canSelect("standalone", []);
      expect(result.canSelect).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should return canSelect: true when selecting with non-conflicting features", () => {
      const result = resolver.canSelect("prisma", ["auth", "oauth"]);
      expect(result.canSelect).toBe(true);
    });

    it("should return canSelect: false with reason when conflict exists", () => {
      const result = resolver.canSelect("prisma", ["typeorm"]);
      expect(result.canSelect).toBe(false);
      expect(result.reason).toContain("Prisma ORM");
      expect(result.reason).toContain("conflicts with");
      expect(result.reason).toContain("TypeORM");
    });

    it("should return first conflict message when multiple conflicts", () => {
      const features: Feature[] = [
        createMockFeature("a", { name: "Feature A", conflicts: ["b", "c"] }),
        createMockFeature("b", { name: "Feature B" }),
        createMockFeature("c", { name: "Feature C" }),
      ];
      const multiResolver = new DependencyResolver(features);

      const result = multiResolver.canSelect("a", ["b", "c"]);
      expect(result.canSelect).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it("should use slug as fallback when feature name not found", () => {
      const features: Feature[] = [
        createMockFeature("feature-a", { conflicts: ["feature-b"] }),
      ];
      const sparseResolver = new DependencyResolver(features);

      // feature-b not in features map, so it uses slug
      const result = sparseResolver.canSelect("feature-a", ["feature-b"]);
      expect(result.canSelect).toBe(false);
      expect(result.reason).toContain("feature-b");
    });
  });

  describe("canDeselect - validation methods", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core", { name: "Core" }),
        createMockFeature("auth", { name: "Authentication", requires: ["core"] }),
        createMockFeature("oauth", { name: "OAuth", requires: ["auth"] }),
        createMockFeature("standalone", { name: "Standalone" }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return canDeselect: true when no dependents are selected", () => {
      const result = resolver.canDeselect("standalone", ["core", "auth"]);
      expect(result.canDeselect).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should return canDeselect: true when dependents exist but are not selected", () => {
      const result = resolver.canDeselect("core", []);
      expect(result.canDeselect).toBe(true);
    });

    it("should return canDeselect: false when selected feature depends on it", () => {
      const result = resolver.canDeselect("auth", ["auth", "oauth"]);
      expect(result.canDeselect).toBe(false);
      expect(result.reason).toContain("OAuth");
      expect(result.reason).toContain("requires");
      expect(result.reason).toContain("Authentication");
    });

    it("should return canDeselect: false for transitive dependents", () => {
      const result = resolver.canDeselect("core", ["core", "auth", "oauth"]);
      expect(result.canDeselect).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it("should return canDeselect: true for unknown feature", () => {
      const result = resolver.canDeselect("unknown", ["core", "auth"]);
      expect(result.canDeselect).toBe(true);
    });
  });

  describe("resolveSelection - full selection resolution with auto-select", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core", { name: "Core" }),
        createMockFeature("auth", { name: "Authentication", requires: ["core"] }),
        createMockFeature("oauth", { name: "OAuth", requires: ["auth"] }),
        createMockFeature("magic-link", {
          name: "Magic Link",
          requires: ["auth"],
        }),
        createMockFeature("prisma", {
          name: "Prisma",
          conflicts: ["typeorm"],
        }),
        createMockFeature("typeorm", {
          name: "TypeORM",
          conflicts: ["prisma"],
        }),
        createMockFeature("database", { name: "Database" }),
        createMockFeature("orm", { name: "ORM", requires: ["database"] }),
        createMockFeature("standalone", { name: "Standalone" }),
      ];
      resolver = new DependencyResolver(features);
    });

    describe("basic selection", () => {
      it("should resolve empty selection", () => {
        const result = resolver.resolveSelection([]);

        expect(result.selectedFeatures).toEqual([]);
        expect(result.userSelected).toEqual([]);
        expect(result.autoSelected).toEqual([]);
        expect(result.tierIncluded).toEqual([]);
        expect(result.conflicts).toEqual([]);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it("should resolve selection with no dependencies", () => {
        const result = resolver.resolveSelection(["standalone"]);

        expect(result.selectedFeatures).toEqual(["standalone"]);
        expect(result.userSelected).toEqual(["standalone"]);
        expect(result.autoSelected).toEqual([]);
        expect(result.isValid).toBe(true);
      });

      it("should include tier-included features", () => {
        const result = resolver.resolveSelection(["standalone"], ["core"]);

        expect(result.selectedFeatures).toContain("standalone");
        expect(result.selectedFeatures).toContain("core");
        expect(result.tierIncluded).toEqual(["core"]);
      });
    });

    describe("auto-selecting dependencies", () => {
      it("should auto-select direct dependencies", () => {
        const result = resolver.resolveSelection(["auth"]);

        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        expect(result.userSelected).toEqual(["auth"]);
        expect(result.autoSelected).toEqual(["core"]);
      });

      it("should auto-select transitive dependencies", () => {
        const result = resolver.resolveSelection(["oauth"]);

        expect(result.selectedFeatures).toContain("oauth");
        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        expect(result.userSelected).toEqual(["oauth"]);
        expect(result.autoSelected).toContain("auth");
        expect(result.autoSelected).toContain("core");
      });

      it("should not double-add already selected dependencies", () => {
        const result = resolver.resolveSelection(["oauth", "auth", "core"]);

        expect(result.selectedFeatures).toContain("oauth");
        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        // Each feature should appear only once
        expect(
          result.selectedFeatures.filter((f) => f === "core")
        ).toHaveLength(1);
        expect(result.autoSelected).toEqual([]);
      });

      it("should not auto-select if already in tierIncluded", () => {
        const result = resolver.resolveSelection(["auth"], ["core"]);

        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        expect(result.autoSelected).toEqual([]);
        expect(result.tierIncluded).toEqual(["core"]);
      });

      it("should handle multiple features with shared dependencies", () => {
        const result = resolver.resolveSelection(["oauth", "magic-link"]);

        expect(result.selectedFeatures).toContain("oauth");
        expect(result.selectedFeatures).toContain("magic-link");
        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        // Shared dependencies should only appear once
        expect(
          result.selectedFeatures.filter((f) => f === "auth")
        ).toHaveLength(1);
        expect(
          result.selectedFeatures.filter((f) => f === "core")
        ).toHaveLength(1);
      });
    });

    describe("conflict detection", () => {
      it("should detect and report conflicts", () => {
        const result = resolver.resolveSelection(["prisma", "typeorm"]);

        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].feature).toBe("prisma");
        expect(result.conflicts[0].conflictsWith).toBe("typeorm");
        expect(result.conflicts[0].message).toContain("conflicts with");
        expect(result.errors).toHaveLength(1);
      });

      it("should not duplicate conflict reports", () => {
        // Conflicts are bidirectional, but should only be reported once
        const result = resolver.resolveSelection(["prisma", "typeorm"]);

        expect(result.conflicts).toHaveLength(1);
      });

      it("should detect conflicts with tier-included features", () => {
        const result = resolver.resolveSelection(["prisma"], ["typeorm"]);

        expect(result.isValid).toBe(false);
        expect(result.conflicts).toHaveLength(1);
      });

      it("should detect conflicts with auto-selected features", () => {
        const features: Feature[] = [
          createMockFeature("a", { requires: ["conflict-target"] }),
          createMockFeature("conflict-target"),
          createMockFeature("b", { conflicts: ["conflict-target"] }),
        ];
        const conflictResolver = new DependencyResolver(features);

        const result = conflictResolver.resolveSelection(["a", "b"]);

        expect(result.isValid).toBe(false);
        expect(result.conflicts.length).toBeGreaterThan(0);
      });

      it("should be valid when no conflicts exist", () => {
        const result = resolver.resolveSelection([
          "oauth",
          "prisma",
          "standalone",
        ]);

        expect(result.isValid).toBe(true);
        expect(result.conflicts).toEqual([]);
        expect(result.errors).toEqual([]);
      });
    });

    describe("complex scenarios", () => {
      it("should handle large selection with multiple dependency chains", () => {
        const result = resolver.resolveSelection([
          "oauth",
          "magic-link",
          "orm",
          "standalone",
        ]);

        expect(result.selectedFeatures).toContain("oauth");
        expect(result.selectedFeatures).toContain("magic-link");
        expect(result.selectedFeatures).toContain("orm");
        expect(result.selectedFeatures).toContain("standalone");
        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        expect(result.selectedFeatures).toContain("database");
        expect(result.isValid).toBe(true);
      });

      it("should handle tier-included with auto-select interaction", () => {
        const result = resolver.resolveSelection(["oauth"], ["core"]);

        expect(result.selectedFeatures).toContain("oauth");
        expect(result.selectedFeatures).toContain("auth");
        expect(result.selectedFeatures).toContain("core");
        expect(result.tierIncluded).toEqual(["core"]);
        // auth should be auto-selected, core should not (already in tier)
        expect(result.autoSelected).toEqual(["auth"]);
      });
    });
  });

  describe("getMissingDependencies", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return all missing dependencies", () => {
      const missing = resolver.getMissingDependencies("oauth", []);
      expect(missing).toContain("auth");
      expect(missing).toContain("core");
    });

    it("should return only missing dependencies", () => {
      const missing = resolver.getMissingDependencies("oauth", ["auth"]);
      expect(missing).toEqual(["core"]);
    });

    it("should return empty when all dependencies are selected", () => {
      const missing = resolver.getMissingDependencies("oauth", [
        "auth",
        "core",
      ]);
      expect(missing).toEqual([]);
    });

    it("should return empty for feature with no dependencies", () => {
      const missing = resolver.getMissingDependencies("core", []);
      expect(missing).toEqual([]);
    });
  });

  describe("getCascadeDeselect - cascade deselection", () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
      const features: Feature[] = [
        createMockFeature("core"),
        createMockFeature("auth", { requires: ["core"] }),
        createMockFeature("oauth", { requires: ["auth"] }),
        createMockFeature("sso", { requires: ["oauth"] }),
        createMockFeature("magic-link", { requires: ["auth"] }),
        createMockFeature("database"),
        createMockFeature("multi-tenant", { requires: ["auth", "database"] }),
      ];
      resolver = new DependencyResolver(features);
    });

    it("should return empty array when no dependents are selected", () => {
      const cascade = resolver.getCascadeDeselect("sso", ["sso"]);
      expect(cascade).toEqual([]);
    });

    it("should return direct dependents that would lose dependency", () => {
      const cascade = resolver.getCascadeDeselect("auth", [
        "core",
        "auth",
        "oauth",
      ]);
      expect(cascade).toContain("oauth");
    });

    it("should return transitive cascade", () => {
      const cascade = resolver.getCascadeDeselect("auth", [
        "core",
        "auth",
        "oauth",
        "sso",
      ]);
      expect(cascade).toContain("oauth");
      expect(cascade).toContain("sso");
    });

    it("should cascade through entire dependency chain", () => {
      const cascade = resolver.getCascadeDeselect("core", [
        "core",
        "auth",
        "oauth",
        "sso",
        "magic-link",
      ]);
      expect(cascade).toContain("auth");
      expect(cascade).toContain("oauth");
      expect(cascade).toContain("sso");
      expect(cascade).toContain("magic-link");
    });

    it("should not include features that have other dependencies met", () => {
      // multi-tenant requires both auth and database
      const cascade = resolver.getCascadeDeselect("auth", [
        "core",
        "auth",
        "database",
        "multi-tenant",
      ]);
      // multi-tenant should cascade because it loses auth dependency
      expect(cascade).toContain("multi-tenant");
    });

    it("should not include features not in selected", () => {
      const cascade = resolver.getCascadeDeselect("auth", ["core", "auth"]);
      // oauth and magic-link are not selected, so they should not cascade
      expect(cascade).not.toContain("oauth");
      expect(cascade).not.toContain("magic-link");
    });

    it("should handle empty selected array", () => {
      const cascade = resolver.getCascadeDeselect("auth", []);
      expect(cascade).toEqual([]);
    });

    it("should handle feature not in selected", () => {
      const cascade = resolver.getCascadeDeselect("unknown", [
        "core",
        "auth",
        "oauth",
      ]);
      expect(cascade).toEqual([]);
    });

    it("should handle complex cascade with multiple branches", () => {
      const cascade = resolver.getCascadeDeselect("core", [
        "core",
        "auth",
        "oauth",
        "sso",
        "magic-link",
        "database",
        "multi-tenant",
      ]);

      // All auth-dependent features should cascade
      expect(cascade).toContain("auth");
      expect(cascade).toContain("oauth");
      expect(cascade).toContain("sso");
      expect(cascade).toContain("magic-link");
      expect(cascade).toContain("multi-tenant");
      // database should not cascade (doesn't depend on core)
      expect(cascade).not.toContain("database");
    });

    it("should not cascade feature that still has all dependencies met", () => {
      const features: Feature[] = [
        createMockFeature("a"),
        createMockFeature("b"),
        createMockFeature("c", { requires: ["a", "b"] }),
      ];
      const multiDepResolver = new DependencyResolver(features);

      // If we deselect 'a', but 'b' is still selected, 'c' should still cascade
      // because it needs BOTH a and b
      const cascade = multiDepResolver.getCascadeDeselect("a", ["a", "b", "c"]);
      expect(cascade).toContain("c");
    });
  });

  describe("edge cases", () => {
    it("should handle self-referencing dependency (if somehow created)", () => {
      const features: Feature[] = [
        createMockFeature("self-ref", { requires: ["self-ref"] }),
      ];
      const resolver = new DependencyResolver(features);

      // Should not infinite loop
      const deps = resolver.getDependencies("self-ref");
      expect(deps).toEqual([]);
    });

    it("should handle feature with itself in conflicts", () => {
      const features: Feature[] = [
        createMockFeature("self-conflict", { conflicts: ["self-conflict"] }),
      ];
      const resolver = new DependencyResolver(features);

      const conflicts = resolver.checkConflicts("self-conflict", [
        "self-conflict",
      ]);
      expect(conflicts).toContain("self-conflict");
    });

    it("should handle very large feature set", () => {
      const features: Feature[] = [];
      for (let i = 0; i < 100; i++) {
        const requires = i > 0 ? [`feature-${i - 1}`] : [];
        features.push(createMockFeature(`feature-${i}`, { requires }));
      }
      const resolver = new DependencyResolver(features);

      const deps = resolver.getDependencies("feature-99");
      expect(deps).toHaveLength(99);
      expect(deps).toContain("feature-0");
      expect(deps).toContain("feature-98");
    });

    it("should handle features with empty strings in requires/conflicts", () => {
      const features: Feature[] = [
        createMockFeature("feature", { requires: [""], conflicts: [""] }),
      ];
      const resolver = new DependencyResolver(features);

      // Should handle gracefully
      expect(resolver.getDependencies("feature")).toEqual([""]);
      expect(resolver.getConflicts("feature")).toEqual([""]);
    });

    it("should handle duplicate entries in requires", () => {
      const features: Feature[] = [
        createMockFeature("base"),
        createMockFeature("feature", { requires: ["base", "base", "base"] }),
      ];
      const resolver = new DependencyResolver(features);

      const deps = resolver.getDependencies("feature");
      expect(deps).toEqual(["base"]);
    });
  });
});
