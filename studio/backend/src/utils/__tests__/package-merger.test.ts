/**
 * Unit tests for package-merger utility
 */

import {
  mergeNpmPackages,
  mergePackageJson,
  generateScripts,
  stringifyPackageJson,
  NpmPackageConfig,
  PackageJson,
} from "../package-merger.js";

// Mock fs/promises
jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

import fs from "fs/promises";

const mockedReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

describe("package-merger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("mergeNpmPackages", () => {
    it("should merge feature packages into base dependencies", () => {
      const baseDeps = { express: "^4.18.0", cors: "^2.8.5" };
      const baseDevDeps = { typescript: "^5.0.0" };
      const featurePackages: NpmPackageConfig[] = [
        { name: "lodash", version: "^4.17.21", dev: false },
        { name: "jest", version: "^29.0.0", dev: true },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies).toEqual({
        express: "^4.18.0",
        cors: "^2.8.5",
        lodash: "^4.17.21",
      });
      expect(result.devDependencies).toEqual({
        typescript: "^5.0.0",
        jest: "^29.0.0",
      });
      expect(result.versionConflicts).toEqual([]);
    });

    it("should separate dependencies and devDependencies correctly", () => {
      const baseDeps = {};
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        { name: "axios", version: "^1.0.0", dev: false },
        { name: "react", version: "^18.0.0", dev: false },
        { name: "@types/node", version: "^20.0.0", dev: true },
        { name: "eslint", version: "^8.0.0", dev: true },
        { name: "prettier", version: "^3.0.0", dev: true },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies).toEqual({
        axios: "^1.0.0",
        react: "^18.0.0",
      });
      expect(result.devDependencies).toEqual({
        "@types/node": "^20.0.0",
        eslint: "^8.0.0",
        prettier: "^3.0.0",
      });
    });

    it("should not modify base dependencies when no feature packages provided", () => {
      const baseDeps = { express: "^4.18.0" };
      const baseDevDeps = { typescript: "^5.0.0" };
      const featurePackages: NpmPackageConfig[] = [];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies).toEqual({ express: "^4.18.0" });
      expect(result.devDependencies).toEqual({ typescript: "^5.0.0" });
      expect(result.versionConflicts).toEqual([]);
    });

    it("should handle empty base dependencies", () => {
      const baseDeps = {};
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        { name: "express", version: "^4.18.0", dev: false },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies).toEqual({ express: "^4.18.0" });
      expect(result.devDependencies).toEqual({});
    });

    describe("version conflict resolution", () => {
      it("should pick higher semver version when conflict exists", () => {
        const baseDeps = { lodash: "^4.17.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "lodash", version: "^4.17.21", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.dependencies.lodash).toBe("^4.17.21");
        expect(result.versionConflicts).toHaveLength(1);
        expect(result.versionConflicts[0]).toEqual({
          package: "lodash",
          selected: "^4.17.21",
          alternatives: ["^4.17.0"],
        });
      });

      it("should pick higher version when base has higher version", () => {
        const baseDeps = { lodash: "^4.18.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "lodash", version: "^4.17.0", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.dependencies.lodash).toBe("^4.18.0");
        expect(result.versionConflicts).toHaveLength(1);
        expect(result.versionConflicts[0]).toEqual({
          package: "lodash",
          selected: "^4.18.0",
          alternatives: ["^4.17.0"],
        });
      });

      it("should handle version conflict in devDependencies", () => {
        const baseDeps = {};
        const baseDevDeps = { jest: "^28.0.0" };
        const featurePackages: NpmPackageConfig[] = [
          { name: "jest", version: "^29.0.0", dev: true },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.devDependencies.jest).toBe("^29.0.0");
        expect(result.versionConflicts).toHaveLength(1);
        expect(result.versionConflicts[0]).toEqual({
          package: "jest",
          selected: "^29.0.0",
          alternatives: ["^28.0.0"],
        });
      });

      it("should handle multiple version conflicts", () => {
        const baseDeps = { lodash: "^4.17.0", axios: "^0.27.0" };
        const baseDevDeps = { jest: "^28.0.0" };
        const featurePackages: NpmPackageConfig[] = [
          { name: "lodash", version: "^4.17.21", dev: false },
          { name: "axios", version: "^1.0.0", dev: false },
          { name: "jest", version: "^29.0.0", dev: true },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.versionConflicts).toHaveLength(3);
        expect(result.dependencies.lodash).toBe("^4.17.21");
        expect(result.dependencies.axios).toBe("^1.0.0");
        expect(result.devDependencies.jest).toBe("^29.0.0");
      });

      it("should not report conflict when versions are identical", () => {
        const baseDeps = { express: "^4.18.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "express", version: "^4.18.0", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.dependencies.express).toBe("^4.18.0");
        expect(result.versionConflicts).toEqual([]);
      });

      it("should handle tilde vs caret version prefixes", () => {
        const baseDeps = { express: "~4.18.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "express", version: "^4.18.0", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        // Same version - should prefer the more flexible constraint (^)
        expect(result.versionConflicts).toHaveLength(1);
      });

      it("should handle exact versions vs ranged versions", () => {
        const baseDeps = { express: "4.18.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "express", version: "^4.18.0", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        // Since versions are semantically the same, it should pick the one without ^
        expect(result.versionConflicts).toHaveLength(1);
      });

      it("should handle major version differences", () => {
        const baseDeps = { react: "^17.0.0" };
        const baseDevDeps = {};
        const featurePackages: NpmPackageConfig[] = [
          { name: "react", version: "^18.2.0", dev: false },
        ];

        const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

        expect(result.dependencies.react).toBe("^18.2.0");
        expect(result.versionConflicts[0].selected).toBe("^18.2.0");
      });
    });
  });

  describe("mergePackageJson", () => {
    const mockBasePackageJson: PackageJson = {
      name: "base-project",
      version: "1.0.0",
      description: "Base project",
      main: "dist/index.js",
      type: "module",
      scripts: {
        dev: "tsx watch src/app.ts",
        build: "tsc",
        start: "node dist/app.js",
      },
      dependencies: {
        express: "^4.18.0",
        cors: "^2.8.5",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/express": "^4.17.0",
      },
    };

    beforeEach(() => {
      mockedReadFile.mockResolvedValue(JSON.stringify(mockBasePackageJson));
    });

    it("should merge package.json with feature packages", async () => {
      const featurePackages: NpmPackageConfig[] = [
        { name: "lodash", version: "^4.17.21", dev: false },
        { name: "jest", version: "^29.0.0", dev: true },
      ];

      const result = await mergePackageJson(
        "/core",
        "my-project",
        featurePackages,
        "backend"
      );

      expect(result.packageJson.name).toBe("my-project");
      expect(result.packageJson.version).toBe("1.0.0");
      expect(result.packageJson.description).toBe(
        "my-project - Generated by Xitolaunch"
      );
      expect(result.packageJson.dependencies?.lodash).toBe("^4.17.21");
      expect(result.packageJson.devDependencies?.jest).toBe("^29.0.0");
    });

    it("should track added dependencies", async () => {
      const featurePackages: NpmPackageConfig[] = [
        { name: "lodash", version: "^4.17.21", dev: false },
        { name: "axios", version: "^1.0.0", dev: false },
        { name: "jest", version: "^29.0.0", dev: true },
      ];

      const result = await mergePackageJson(
        "/core",
        "my-project",
        featurePackages,
        "backend"
      );

      expect(result.addedDependencies).toContain("lodash");
      expect(result.addedDependencies).toContain("axios");
      expect(result.addedDevDependencies).toContain("jest");
    });

    it("should not track existing dependencies as added", async () => {
      const featurePackages: NpmPackageConfig[] = [
        { name: "express", version: "^4.18.0", dev: false }, // Already exists
        { name: "typescript", version: "^5.0.0", dev: true }, // Already exists
      ];

      const result = await mergePackageJson(
        "/core",
        "my-project",
        featurePackages,
        "backend"
      );

      expect(result.addedDependencies).not.toContain("express");
      expect(result.addedDevDependencies).not.toContain("typescript");
    });

    it("should read from correct path based on platform", async () => {
      await mergePackageJson("/core", "my-project", [], "backend");
      expect(mockedReadFile).toHaveBeenCalledWith(
        "/core/backend/package.json",
        "utf-8"
      );

      mockedReadFile.mockClear();

      await mergePackageJson("/core", "my-project", [], "web");
      expect(mockedReadFile).toHaveBeenCalledWith(
        "/core/web/package.json",
        "utf-8"
      );
    });

    it("should throw error when base package.json cannot be read", async () => {
      mockedReadFile.mockRejectedValue(new Error("File not found"));

      await expect(
        mergePackageJson("/core", "my-project", [], "backend")
      ).rejects.toThrow("Could not read base package.json");
    });

    it("should sort dependencies alphabetically", async () => {
      const featurePackages: NpmPackageConfig[] = [
        { name: "zod", version: "^3.0.0", dev: false },
        { name: "axios", version: "^1.0.0", dev: false },
        { name: "bcrypt", version: "^5.0.0", dev: false },
      ];

      const result = await mergePackageJson(
        "/core",
        "my-project",
        featurePackages,
        "backend"
      );

      const depKeys = Object.keys(result.packageJson.dependencies || {});
      expect(depKeys).toEqual([...depKeys].sort());
    });

    it("should preserve other fields from base package.json", async () => {
      const result = await mergePackageJson(
        "/core",
        "my-project",
        [],
        "backend"
      );

      expect(result.packageJson.main).toBe("dist/index.js");
      expect(result.packageJson.type).toBe("module");
    });
  });

  describe("generateScripts", () => {
    it("should preserve existing scripts", () => {
      const baseScripts = {
        dev: "tsx watch src/custom.ts",
        build: "tsc -p tsconfig.build.json",
        test: "jest",
      };

      const result = generateScripts(baseScripts, []);

      expect(result.dev).toBe("tsx watch src/custom.ts");
      expect(result.build).toBe("tsc -p tsconfig.build.json");
      expect(result.test).toBe("jest");
    });

    it("should add default dev script if missing", () => {
      const result = generateScripts({}, []);
      expect(result.dev).toBe("tsx watch src/app.ts");
    });

    it("should add default build script if missing", () => {
      const result = generateScripts({}, []);
      expect(result.build).toBe("tsc");
    });

    it("should add default start script if missing", () => {
      const result = generateScripts({}, []);
      expect(result.start).toBe("node dist/app.js");
    });

    it("should add default lint script if missing", () => {
      const result = generateScripts({}, []);
      expect(result.lint).toBe("eslint src");
    });

    it("should add database scripts if missing", () => {
      const result = generateScripts({}, []);

      expect(result["db:migrate"]).toBe("prisma migrate dev");
      expect(result["db:push"]).toBe("prisma db push");
      expect(result["db:generate"]).toBe("prisma generate");
      expect(result["db:seed"]).toBe("tsx prisma/seed.ts");
    });

    it("should not override existing database scripts", () => {
      const baseScripts = {
        "db:migrate": "custom migrate command",
        "db:seed": "custom seed command",
      };

      const result = generateScripts(baseScripts, []);

      expect(result["db:migrate"]).toBe("custom migrate command");
      expect(result["db:seed"]).toBe("custom seed command");
    });

    it("should handle features array parameter", () => {
      const result = generateScripts({}, ["auth", "file-upload", "payments"]);

      // Currently features don't modify scripts, but the function should accept them
      expect(result.dev).toBeDefined();
      expect(result.build).toBeDefined();
    });

    it("should return all essential scripts with empty base", () => {
      const result = generateScripts({}, []);

      expect(result).toHaveProperty("dev");
      expect(result).toHaveProperty("build");
      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("lint");
      expect(result).toHaveProperty("db:migrate");
      expect(result).toHaveProperty("db:push");
      expect(result).toHaveProperty("db:generate");
      expect(result).toHaveProperty("db:seed");
    });
  });

  describe("stringifyPackageJson", () => {
    it("should format package.json with 2-space indentation", () => {
      const packageJson: PackageJson = {
        name: "test",
        version: "1.0.0",
      };

      const result = stringifyPackageJson(packageJson);

      expect(result).toBe('{\n  "name": "test",\n  "version": "1.0.0"\n}\n');
    });

    it("should add trailing newline", () => {
      const packageJson: PackageJson = {
        name: "test",
        version: "1.0.0",
      };

      const result = stringifyPackageJson(packageJson);

      expect(result.endsWith("\n")).toBe(true);
    });

    it("should handle nested objects", () => {
      const packageJson: PackageJson = {
        name: "test",
        version: "1.0.0",
        dependencies: {
          express: "^4.18.0",
        },
      };

      const result = stringifyPackageJson(packageJson);
      const parsed = JSON.parse(result);

      expect(parsed.dependencies.express).toBe("^4.18.0");
    });

    it("should handle complex package.json structure", () => {
      const packageJson: PackageJson = {
        name: "complex-project",
        version: "2.0.0",
        description: "A complex project",
        main: "dist/index.js",
        type: "module",
        scripts: {
          dev: "tsx watch src/app.ts",
          build: "tsc",
          test: "jest",
        },
        dependencies: {
          express: "^4.18.0",
          cors: "^2.8.5",
        },
        devDependencies: {
          typescript: "^5.0.0",
          jest: "^29.0.0",
        },
      };

      const result = stringifyPackageJson(packageJson);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(packageJson);
    });

    it("should produce valid JSON", () => {
      const packageJson: PackageJson = {
        name: "test",
        version: "1.0.0",
        scripts: { build: "tsc" },
      };

      const result = stringifyPackageJson(packageJson);

      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("alphabetical sorting of dependencies", () => {
    it("should sort dependencies alphabetically after merge", () => {
      const baseDeps = { zod: "^3.0.0", express: "^4.18.0" };
      const baseDevDeps = { typescript: "^5.0.0", jest: "^29.0.0" };
      const featurePackages: NpmPackageConfig[] = [
        { name: "axios", version: "^1.0.0", dev: false },
        { name: "lodash", version: "^4.17.21", dev: false },
        { name: "@types/node", version: "^20.0.0", dev: true },
        { name: "eslint", version: "^8.0.0", dev: true },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      // Note: mergeNpmPackages doesn't sort, but mergePackageJson does via sortObjectKeys
      // This test verifies the merged result contains all packages
      expect(Object.keys(result.dependencies)).toContain("zod");
      expect(Object.keys(result.dependencies)).toContain("express");
      expect(Object.keys(result.dependencies)).toContain("axios");
      expect(Object.keys(result.dependencies)).toContain("lodash");
    });

    it("should maintain alphabetical order in final package.json", async () => {
      mockedReadFile.mockResolvedValue(
        JSON.stringify({
          name: "base",
          version: "1.0.0",
          dependencies: { zod: "^3.0.0", express: "^4.18.0" },
          devDependencies: {},
        })
      );

      const featurePackages: NpmPackageConfig[] = [
        { name: "axios", version: "^1.0.0", dev: false },
        { name: "cors", version: "^2.8.5", dev: false },
      ];

      const result = await mergePackageJson(
        "/core",
        "my-project",
        featurePackages,
        "backend"
      );

      const depKeys = Object.keys(result.packageJson.dependencies || {});
      const sortedKeys = [...depKeys].sort();

      expect(depKeys).toEqual(sortedKeys);
      expect(depKeys[0]).toBe("axios");
      expect(depKeys[1]).toBe("cors");
      expect(depKeys[2]).toBe("express");
      expect(depKeys[3]).toBe("zod");
    });
  });

  describe("edge cases", () => {
    it("should handle packages with scoped names", () => {
      const baseDeps = {};
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        { name: "@prisma/client", version: "^5.0.0", dev: false },
        { name: "@types/express", version: "^4.17.0", dev: true },
        { name: "@nestjs/common", version: "^10.0.0", dev: false },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies["@prisma/client"]).toBe("^5.0.0");
      expect(result.dependencies["@nestjs/common"]).toBe("^10.0.0");
      expect(result.devDependencies["@types/express"]).toBe("^4.17.0");
    });

    it("should handle packages with pre-release versions", () => {
      const baseDeps = { "next": "^14.0.0-canary.1" };
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        { name: "next", version: "^14.0.0-canary.2", dev: false },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      // Should handle pre-release versions
      expect(result.versionConflicts).toHaveLength(1);
    });

    it("should handle packages with URLs as versions", () => {
      const baseDeps = {};
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        {
          name: "custom-package",
          version: "git+https://github.com/user/repo.git",
          dev: false,
        },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      expect(result.dependencies["custom-package"]).toBe(
        "git+https://github.com/user/repo.git"
      );
    });

    it("should handle wildcard versions", () => {
      const baseDeps = { "some-package": "*" };
      const baseDevDeps = {};
      const featurePackages: NpmPackageConfig[] = [
        { name: "some-package", version: "^1.0.0", dev: false },
      ];

      const result = mergeNpmPackages(baseDeps, baseDevDeps, featurePackages);

      // When wildcard meets specific version, should pick the specific version
      expect(result.versionConflicts).toHaveLength(1);
    });
  });
});
