/**
 * Code Generator Service
 *
 * Generates complete, working projects by:
 * 1. Copying the /core/ directory as the base
 * 2. Merging feature-specific files from selected features
 * 3. Generating merged Prisma schema
 * 4. Merging package.json dependencies
 * 5. Generating .env.example with all required variables
 * 6. Creating README and LICENSE files
 */

import archiver, { Archiver } from "archiver";
import { Writable } from "stream";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../config/db.js";
import { mergeSchemas, SchemaMappingConfig } from "../utils/schema-merger.js";
import {
  mergePackageJson,
  NpmPackageConfig,
  stringifyPackageJson,
  generateScripts,
} from "../utils/package-merger.js";

// =====================================================
// Types
// =====================================================

export interface FileMappingConfig {
  source: string;
  destination: string;
  transform?: "none" | "template";
}

export interface EnvVarConfig {
  key: string;
  description: string;
  required: boolean;
  default?: string;
}

export interface FeatureConfig {
  slug: string;
  name: string;
  description: string;
  module: {
    slug: string;
    name: string;
    category: string;
  };
  fileMappings: FileMappingConfig[] | null;
  schemaMappings: SchemaMappingConfig[] | null;
  envVars: EnvVarConfig[] | null;
  npmPackages: NpmPackageConfig[] | null;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  tier: string;
  selectedFeatures: string[];
  customerEmail: string;
  customerName: string | null;
  total: number;
  template: {
    name: string;
    slug: string;
    includedFeatures: string[];
  } | null;
  license: {
    id: string;
    licenseKey: string;
    downloadToken: string;
    downloadCount: number;
    maxDownloads: number;
    status: string;
    expiresAt: Date | null;
  } | null;
}

export interface ResolvedFeatures {
  features: FeatureConfig[];
  allFeatureSlugs: string[];
  dependencyTree: Map<string, string[]>;
}

// =====================================================
// Configuration
// =====================================================

// Path to the project root (parent of core/ and modules/)
const PROJECT_ROOT_PATH = path.resolve(process.cwd(), "..", "..");

// Path to the core directory (base template)
const CORE_BASE_PATH = path.join(PROJECT_ROOT_PATH, "core");

// Directories to exclude when copying core
const EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  ".nyc_output",
  "_preview", // Preview-only code (not included in user downloads)
];

// Files to exclude when copying core
const EXCLUDED_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".DS_Store",
  "Thumbs.db",
  "*.log",
  // Preview-specific files that might exist outside _preview directories
  "preview-banner.tsx",
  "preview-wrapper.tsx",
  "preview-context.tsx",
];

// =====================================================
// Project Generator Class
// =====================================================

export class ProjectGenerator {
  private coreBasePath: string;
  private projectRootPath: string;

  constructor(coreBasePath?: string, projectRootPath?: string) {
    this.coreBasePath = coreBasePath || CORE_BASE_PATH;
    this.projectRootPath = projectRootPath || PROJECT_ROOT_PATH;
  }

  /**
   * Validate that a resolved path stays within the allowed root directory.
   * Prevents path traversal attacks via ../
   */
  private validatePath(filePath: string, allowedRoot: string, label: string): string {
    const resolved = path.resolve(allowedRoot, filePath);
    const normalizedRoot = path.resolve(allowedRoot);
    if (resolved !== normalizedRoot && !resolved.startsWith(normalizedRoot + path.sep)) {
      throw new Error(`Path traversal detected in ${label}: ${filePath}`);
    }
    return resolved;
  }

  /**
   * Main entry point - generate a complete project as a ZIP archive
   */
  async generate(order: OrderDetails, outputStream: Writable): Promise<void> {
    // Resolve all features including dependencies
    const resolved = await this.resolveFeatures(
      order.selectedFeatures,
      order.tier,
      order.template?.includedFeatures || []
    );

    // Create archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Pipe archive to output stream
    archive.pipe(outputStream);

    // Handle archive errors
    archive.on("error", (err) => {
      throw err;
    });

    // Generate project name from order
    const projectName = this.generateProjectName(order);

    // 1. Copy core directory as base
    await this.copyDirectory(
      archive,
      this.coreBasePath,
      projectName,
      (relativePath) => this.shouldIncludeFile(relativePath)
    );

    // 2. Copy feature-specific files
    await this.copyFeatureFiles(archive, resolved.features, projectName);

    // 3. Generate merged Prisma schema
    const allSchemaMappings = this.collectSchemaMappings(resolved.features);
    const schemaResult = await mergeSchemas(this.coreBasePath, allSchemaMappings, this.projectRootPath);
    archive.append(schemaResult.schema, {
      name: `${projectName}/backend/prisma/schema.prisma`,
    });

    // 4. Generate merged package.json for backend
    const backendPackages = this.collectNpmPackages(resolved.features, false);
    const backendPackageResult = await mergePackageJson(
      this.coreBasePath,
      projectName,
      backendPackages,
      "backend"
    );
    backendPackageResult.packageJson.scripts = generateScripts(
      backendPackageResult.packageJson.scripts || {},
      resolved.allFeatureSlugs
    );
    archive.append(stringifyPackageJson(backendPackageResult.packageJson), {
      name: `${projectName}/backend/package.json`,
    });

    // 5. Generate merged package.json for web
    const webPackages = this.collectNpmPackages(resolved.features, true);
    try {
      const webPackageResult = await mergePackageJson(
        this.coreBasePath,
        projectName,
        webPackages,
        "web"
      );
      archive.append(stringifyPackageJson(webPackageResult.packageJson), {
        name: `${projectName}/web/package.json`,
      });
    } catch (error) {
      // Web package.json is optional
      console.warn("Could not generate web package.json:", error);
    }

    // 6. Generate .env.example
    const envContent = this.generateEnvExample(resolved.features);
    archive.append(envContent, {
      name: `${projectName}/backend/.env.example`,
    });

    // 7. Generate LICENSE.md
    const licenseContent = this.generateLicense(order);
    archive.append(licenseContent, {
      name: `${projectName}/LICENSE.md`,
    });

    // 8. Generate README.md
    const readmeContent = this.generateReadme(order, resolved.features);
    archive.append(readmeContent, {
      name: `${projectName}/README.md`,
    });

    // 9. Generate starter-config.json
    const configContent = this.generateConfig(order, resolved.features);
    archive.append(configContent, {
      name: `${projectName}/starter-config.json`,
    });

    // Finalize the archive
    await archive.finalize();
  }

  /**
   * Resolve features with their dependencies
   */
  async resolveFeatures(
    selectedFeatures: string[],
    _tier: string,
    templateFeatures: string[]
  ): Promise<ResolvedFeatures> {
    // Combine selected and template features
    const allSelected = [...new Set([...selectedFeatures, ...templateFeatures])];

    // Get all feature configs from database
    const features = await prisma.feature.findMany({
      where: {
        slug: { in: allSelected },
        isActive: true,
      },
      include: {
        module: {
          select: {
            slug: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Build dependency tree and resolve all dependencies
    const dependencyTree = new Map<string, string[]>();
    const resolvedSlugs = new Set<string>();

    const resolveRecursive = async (slug: string) => {
      if (resolvedSlugs.has(slug)) return;
      resolvedSlugs.add(slug);

      const feature = features.find((f) => f.slug === slug);
      if (!feature) return;

      const requires = feature.requires as string[] || [];
      dependencyTree.set(slug, requires);

      // Recursively resolve dependencies
      for (const dep of requires) {
        await resolveRecursive(dep);
      }
    };

    // Resolve all selected features
    for (const slug of allSelected) {
      await resolveRecursive(slug);
    }

    // Fetch any missing dependency features
    const missingSlugs = Array.from(resolvedSlugs).filter(
      (slug) => !features.some((f) => f.slug === slug)
    );

    if (missingSlugs.length > 0) {
      const missingFeatures = await prisma.feature.findMany({
        where: {
          slug: { in: missingSlugs },
          isActive: true,
        },
        include: {
          module: {
            select: {
              slug: true,
              name: true,
              category: true,
            },
          },
        },
      });
      features.push(...missingFeatures);
    }

    // Convert to FeatureConfig format
    const featureConfigs: FeatureConfig[] = features.map((f) => ({
      slug: f.slug,
      name: f.name,
      description: f.description,
      module: f.module,
      fileMappings: f.fileMappings as FileMappingConfig[] | null,
      schemaMappings: f.schemaMappings as SchemaMappingConfig[] | null,
      envVars: f.envVars as EnvVarConfig[] | null,
      npmPackages: f.npmPackages as NpmPackageConfig[] | null,
    }));

    return {
      features: featureConfigs,
      allFeatureSlugs: Array.from(resolvedSlugs),
      dependencyTree,
    };
  }

  /**
   * Copy entire directory recursively to archive
   */
  private async copyDirectory(
    archive: Archiver,
    sourcePath: string,
    destPath: string,
    filter: (relativePath: string) => boolean
  ): Promise<void> {
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(sourcePath, entry.name);
      const relativePath = entry.name;
      const dstPath = path.join(destPath, entry.name);

      if (!filter(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively copy directory
        await this.copyDirectoryRecursive(archive, srcPath, dstPath, filter);
      } else if (entry.isFile()) {
        // Copy file
        const content = await fs.readFile(srcPath);
        archive.append(content, { name: dstPath });
      }
    }
  }

  /**
   * Recursively copy directory contents
   */
  private async copyDirectoryRecursive(
    archive: Archiver,
    sourcePath: string,
    destPath: string,
    filter: (relativePath: string) => boolean
  ): Promise<void> {
    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(sourcePath, entry.name);
      const dstPath = path.join(destPath, entry.name);

      if (!filter(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.copyDirectoryRecursive(archive, srcPath, dstPath, filter);
      } else if (entry.isFile()) {
        const content = await fs.readFile(srcPath);
        archive.append(content, { name: dstPath });
      }
    }
  }

  /**
   * Copy feature-specific files
   * Source paths can be relative to:
   * - modules/ directory (e.g., "modules/payments/backend/src/...")
   * - core/ directory (e.g., "core/backend/src/...")
   * - Or absolute paths
   */
  private async copyFeatureFiles(
    archive: Archiver,
    features: FeatureConfig[],
    projectName: string
  ): Promise<void> {
    for (const feature of features) {
      if (!feature.fileMappings) continue;

      for (const mapping of feature.fileMappings) {
        // Validate source path stays within project root (prevents path traversal)
        this.validatePath(mapping.source, this.projectRootPath, 'fileMappings.source');

        // Validate destination path stays within project output directory (prevents zip-slip)
        this.validatePath(mapping.destination, projectName, 'fileMappings.destination');

        // Resolve source path - use projectRootPath for modules, coreBasePath for core
        let srcPath: string;
        if (mapping.source.startsWith("modules/")) {
          srcPath = path.join(this.projectRootPath, mapping.source);
        } else if (mapping.source.startsWith("core/")) {
          srcPath = path.join(this.projectRootPath, mapping.source);
        } else {
          // Legacy: assume relative to core
          srcPath = path.join(this.coreBasePath, mapping.source);
        }

        const dstPath = path.join(projectName, mapping.destination);

        try {
          const stat = await fs.stat(srcPath);

          if (stat.isDirectory()) {
            // Copy entire directory
            await this.copyDirectoryRecursive(
              archive,
              srcPath,
              dstPath,
              () => true
            );
          } else {
            // Copy single file
            const content = await fs.readFile(srcPath);
            archive.append(content, { name: dstPath });
          }
        } catch (error) {
          console.warn(
            `Warning: Could not copy feature file ${mapping.source}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Determine if a file/directory should be included in the copy
   */
  private shouldIncludeFile(relativePath: string): boolean {
    const baseName = path.basename(relativePath);

    // Check excluded directories
    if (EXCLUDED_DIRS.includes(baseName)) {
      return false;
    }

    // Check excluded files
    for (const pattern of EXCLUDED_FILES) {
      if (pattern.startsWith("*")) {
        const ext = pattern.slice(1);
        if (baseName.endsWith(ext)) {
          return false;
        }
      } else if (baseName === pattern) {
        return false;
      }
    }

    return true;
  }

  /**
   * Collect all schema mappings from features
   */
  private collectSchemaMappings(features: FeatureConfig[]): SchemaMappingConfig[] {
    const mappings: SchemaMappingConfig[] = [];

    for (const feature of features) {
      if (feature.schemaMappings) {
        mappings.push(...feature.schemaMappings);
      }
    }

    return mappings;
  }

  /**
   * Collect all npm packages from features
   */
  private collectNpmPackages(
    features: FeatureConfig[],
    _webOnly: boolean
  ): NpmPackageConfig[] {
    const packages: NpmPackageConfig[] = [];

    for (const feature of features) {
      if (feature.npmPackages) {
        // TODO: Filter based on platform if webOnly flag is true
        packages.push(...feature.npmPackages);
      }
    }

    return packages;
  }

  /**
   * Generate .env.example content
   */
  private generateEnvExample(features: FeatureConfig[]): string {
    const lines: string[] = [
      "# Environment Variables",
      "# Generated by Xitolaunch",
      "",
      "# ======================",
      "# Core Configuration",
      "# ======================",
      "",
      "# Server",
      "NODE_ENV=development",
      "PORT=8000",
      "API_URL=http://localhost:8000",
      "",
      "# Database",
      "DATABASE_URL=postgresql://user:password@localhost:5432/mydb",
      "",
      "# JWT",
      "JWT_SECRET=your-super-secret-jwt-key-min-32-chars",
      "JWT_EXPIRES_IN=7d",
      "JWT_REFRESH_EXPIRES_IN=30d",
      "",
      "# CORS",
      'CORS_ORIGIN=http://localhost:3000',
      "FRONTEND_URL=http://localhost:3000",
      "",
    ];

    // Group env vars by feature
    const featureEnvVars = new Map<string, EnvVarConfig[]>();

    for (const feature of features) {
      if (feature.envVars && feature.envVars.length > 0) {
        featureEnvVars.set(feature.name, feature.envVars);
      }
    }

    // Add feature-specific env vars
    if (featureEnvVars.size > 0) {
      lines.push("# ======================");
      lines.push("# Feature Configuration");
      lines.push("# ======================");
      lines.push("");

      for (const [featureName, envVars] of featureEnvVars) {
        lines.push(`# ${featureName}`);
        for (const env of envVars) {
          lines.push(`# ${env.description}${env.required ? " (required)" : ""}`);
          lines.push(`${env.key}=${env.default || ""}`);
        }
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate LICENSE.md content
   */
  private generateLicense(order: OrderDetails): string {
    const date = new Date().toISOString().split("T")[0];
    const tierName = order.tier.charAt(0).toUpperCase() + order.tier.slice(1);

    return `# Xitolaunch License

## License Information

- **License Key:** ${order.license?.licenseKey || "N/A"}
- **Order Number:** ${order.orderNumber}
- **Licensed To:** ${order.customerName || order.customerEmail}
- **Email:** ${order.customerEmail}
- **Tier:** ${tierName}
- **Issue Date:** ${date}

## License Terms

This license grants you the right to:

1. **Use** - Use the purchased code in unlimited personal and commercial projects
2. **Modify** - Modify and customize the code for your projects
3. **Deploy** - Deploy applications built with this code without restrictions

This license does NOT grant you the right to:

1. **Redistribute** - Sell, share, or redistribute the source code
2. **Transfer** - Transfer this license to another person or organization
3. **Sublicense** - Grant sublicenses to third parties

## Support

For support inquiries, please contact us with your order number.

## Validity

This license is valid for lifetime use with the purchased tier and features.

---

Generated by Xitolaunch
https://xitolaunch.com
`;
  }

  /**
   * Generate README.md content
   */
  private generateReadme(order: OrderDetails, features: FeatureConfig[]): string {
    const tierName = order.tier.charAt(0).toUpperCase() + order.tier.slice(1);
    const templateName = order.template?.name || "Custom Configuration";

    // Group features by module
    const featuresByModule = features.reduce(
      (acc, feature) => {
        const category = feature.module.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(feature);
        return acc;
      },
      {} as Record<string, FeatureConfig[]>
    );

    // Generate feature list
    let featureList = "";
    for (const [category, categoryFeatures] of Object.entries(featuresByModule)) {
      featureList += `\n### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      for (const feature of categoryFeatures) {
        featureList += `- **${feature.name}** - ${feature.description}\n`;
      }
    }

    return `# ${templateName}

## Package Information

- **Tier:** ${tierName}
- **Template:** ${templateName}
- **Order Number:** ${order.orderNumber}
- **Generated:** ${new Date().toISOString()}

## Quick Start

### 1. Install Dependencies

\`\`\`bash
# Backend
cd backend
npm install

# Web Frontend
cd ../web
npm install
\`\`\`

### 2. Configure Environment

Copy the example environment files and update with your values:

\`\`\`bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
\`\`\`

### 3. Set Up Database

\`\`\`bash
cd backend
npm run db:migrate
npm run db:seed
\`\`\`

### 4. Start Development

\`\`\`bash
# In separate terminals:
cd backend && npm run dev
cd web && npm run dev
\`\`\`

## Included Features
${featureList}

## Project Structure

\`\`\`
.
├── backend/           # Express.js API server
│   ├── prisma/        # Database schema and migrations
│   └── src/
│       ├── config/    # Configuration
│       ├── controllers/ # API handlers
│       ├── middleware/  # Express middleware
│       ├── routes/    # API routes
│       ├── services/  # Business logic
│       └── utils/     # Utilities
├── web/               # Next.js frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   └── lib/       # Utilities and hooks
└── docs/              # Documentation
\`\`\`

## Support

For questions and support:
- Check the documentation at https://docs.xitolaunch.com
- Contact support with your order number: ${order.orderNumber}

## License

See LICENSE.md for license terms.

---

Built with Xitolaunch
https://xitolaunch.com
`;
  }

  /**
   * Generate configuration JSON
   */
  private generateConfig(order: OrderDetails, features: FeatureConfig[]): string {
    const config = {
      tier: order.tier,
      template: order.template?.slug || null,
      features: features.map((f) => f.slug),
      license: {
        key: order.license?.licenseKey || null,
        issuedAt: new Date().toISOString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
      },
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate project name from order
   */
  private generateProjectName(order: OrderDetails): string {
    const templateSlug = order.template?.slug || "starter";
    return `${templateSlug}-${order.tier}`;
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const projectGenerator = new ProjectGenerator();
