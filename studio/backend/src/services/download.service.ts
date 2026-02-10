import archiver from "archiver";
import { Writable } from "stream";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/errors.js";

// =====================================================
// Types
// =====================================================

interface OrderWithDetails {
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

interface FeatureConfig {
  slug: string;
  name: string;
  description: string;
  module: {
    slug: string;
    name: string;
    category: string;
  };
  fileMappings: unknown;
  schemaMappings: unknown;
  envVars: unknown;
  npmPackages: unknown;
}

interface ConfigurationFile {
  tier: string;
  template: string | null;
  features: string[];
  license: {
    key: string;
    issuedAt: string;
    orderNumber: string;
    customerEmail: string;
  };
  generatedAt: string;
}

// =====================================================
// Download Service
// =====================================================

/**
 * Generate a license key if not already generated
 */
export async function ensureLicenseExists(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { license: true },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  if (order.status !== "COMPLETED") {
    throw ApiError.badRequest("Order must be completed to generate license");
  }

  if (order.license) {
    return order.license.licenseKey;
  }

  // Generate new license
  const { v4: uuid } = await import("uuid");
  const licenseKey = generateLicenseKey();
  const downloadToken = uuid();

  await prisma.license.create({
    data: {
      orderId,
      licenseKey,
      downloadToken,
      expiresAt: null, // Lifetime license
      maxDownloads: 10,
    },
  });

  return licenseKey;
}

/**
 * Generate a formatted license key
 */
function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segments = 4;
  const segmentLength = 5;
  const parts: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }

  return parts.join("-");
}

/**
 * Validate order for download
 */
export async function validateOrderForDownload(
  orderId: string
): Promise<OrderWithDetails> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      template: {
        select: {
          name: true,
          slug: true,
          includedFeatures: true,
        },
      },
      license: true,
    },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  if (order.status !== "COMPLETED") {
    throw ApiError.badRequest("Order must be completed to download");
  }

  if (!order.license) {
    throw ApiError.badRequest("License not found. Please contact support.");
  }

  if (order.license.status !== "ACTIVE") {
    throw ApiError.badRequest(
      `License is ${order.license.status.toLowerCase()}. Please contact support.`
    );
  }

  if (order.license.expiresAt && new Date(order.license.expiresAt) < new Date()) {
    throw ApiError.badRequest("License has expired. Please contact support.");
  }

  if (
    order.license.maxDownloads &&
    order.license.downloadCount >= order.license.maxDownloads
  ) {
    throw ApiError.badRequest(
      "Maximum download limit reached. Please contact support to reset."
    );
  }

  return order as OrderWithDetails;
}

/**
 * Get feature configurations for selected features
 */
async function getFeatureConfigs(
  featureSlugs: string[]
): Promise<FeatureConfig[]> {
  const features = await prisma.feature.findMany({
    where: {
      slug: { in: featureSlugs },
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

  return features.map((f) => ({
    slug: f.slug,
    name: f.name,
    description: f.description,
    module: f.module,
    fileMappings: f.fileMappings,
    schemaMappings: f.schemaMappings,
    envVars: f.envVars,
    npmPackages: f.npmPackages,
  }));
}

/**
 * Generate LICENSE.md content
 */
function generateLicenseContent(order: OrderWithDetails): string {
  const date = new Date().toISOString().split("T")[0];
  return `# Starter Studio License

## License Information

- **License Key:** ${order.license!.licenseKey}
- **Order Number:** ${order.orderNumber}
- **Licensed To:** ${order.customerName || order.customerEmail}
- **Email:** ${order.customerEmail}
- **Tier:** ${order.tier.charAt(0).toUpperCase() + order.tier.slice(1)}
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

Generated by Starter Studio
https://starter.studio
`;
}

/**
 * Generate README.md content
 */
function generateReadmeContent(
  order: OrderWithDetails,
  features: FeatureConfig[]
): string {
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

  // Collect all env vars
  const envVars: Array<{ key: string; description: string; required: boolean; default?: string }> = [];
  for (const feature of features) {
    if (feature.envVars && Array.isArray(feature.envVars)) {
      envVars.push(...(feature.envVars as Array<{ key: string; description: string; required: boolean; default?: string }>));
    }
  }

  // Collect all npm packages
  const npmPackages: Array<{ name: string; version: string; dev?: boolean }> = [];
  for (const feature of features) {
    if (feature.npmPackages && Array.isArray(feature.npmPackages)) {
      npmPackages.push(...(feature.npmPackages as Array<{ name: string; version: string; dev?: boolean }>));
    }
  }

  return `# Starter Studio - ${templateName}

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
cd web
npm install

# Mobile (if included)
cd mobile
flutter pub get
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
${
  envVars.length > 0
    ? `
## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
${envVars.map((v) => `| \`${v.key}\` | ${v.description} | ${v.required ? "Yes" : "No"} |`).join("\n")}
`
    : ""
}
${
  npmPackages.length > 0
    ? `
## Additional Dependencies

The following packages are included for the selected features:

\`\`\`json
{
  "dependencies": {
${npmPackages
  .filter((p) => !p.dev)
  .map((p) => `    "${p.name}": "${p.version}"`)
  .join(",\n")}
  },
  "devDependencies": {
${npmPackages
  .filter((p) => p.dev)
  .map((p) => `    "${p.name}": "${p.version}"`)
  .join(",\n")}
  }
}
\`\`\`
`
    : ""
}
## Project Structure

\`\`\`
.
├── backend/           # Express.js API server
│   ├── prisma/        # Database schema and migrations
│   └── src/
│       ├── routes/    # API routes
│       ├── services/  # Business logic
│       └── utils/     # Utilities
├── web/               # Next.js frontend
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   └── lib/       # Utilities and hooks
├── mobile/            # Flutter mobile app (if included)
│   └── lib/
│       ├── core/      # Core utilities
│       ├── data/      # Data layer
│       └── presentation/ # UI layer
└── docs/              # Documentation
\`\`\`

## Support

For questions and support:
- Check the documentation at https://docs.starter.studio
- Contact support with your order number: ${order.orderNumber}

## License

See LICENSE.md for license terms.

---

Built with Starter Studio
https://starter.studio
`;
}

/**
 * Generate configuration JSON content
 */
function generateConfigContent(
  order: OrderWithDetails,
  features: FeatureConfig[]
): ConfigurationFile {
  return {
    tier: order.tier,
    template: order.template?.slug || null,
    features: features.map((f) => f.slug),
    license: {
      key: order.license!.licenseKey,
      issuedAt: new Date().toISOString(),
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate placeholder code structure for a feature
 */
function generateFeaturePlaceholder(feature: FeatureConfig): string {
  return `/**
 * ${feature.name}
 *
 * ${feature.description}
 *
 * Module: ${feature.module.name}
 * Category: ${feature.module.category}
 *
 * This file contains placeholder code for the ${feature.name} feature.
 * The actual implementation will be included in the full package.
 */

// TODO: Implementation for ${feature.slug}

export const ${toCamelCase(feature.slug)} = {
  name: "${feature.name}",
  module: "${feature.module.slug}",
  category: "${feature.module.category}",

  // Feature initialization
  initialize: async () => {
    console.log("Initializing ${feature.name}...");
    // Implementation goes here
  },

  // Feature configuration
  config: ${JSON.stringify(
    {
      envVars: feature.envVars || [],
      npmPackages: feature.npmPackages || [],
    },
    null,
    2
  )},
};

export default ${toCamelCase(feature.slug)};
`;
}

/**
 * Convert slug to camelCase
 */
function toCamelCase(slug: string): string {
  return slug
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

/**
 * Generate download package as a ZIP stream
 */
export async function generateDownloadPackage(
  orderId: string,
  outputStream: Writable
): Promise<void> {
  // Validate order and get details
  const order = await validateOrderForDownload(orderId);

  // Get feature configurations
  const allFeatures = [
    ...order.selectedFeatures,
    ...(order.template?.includedFeatures || []),
  ];
  const uniqueFeatures = [...new Set(allFeatures)];
  const features = await getFeatureConfigs(uniqueFeatures);

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

  // Add LICENSE.md
  archive.append(generateLicenseContent(order), { name: "LICENSE.md" });

  // Add README.md
  archive.append(generateReadmeContent(order, features), { name: "README.md" });

  // Add configuration file
  archive.append(
    JSON.stringify(generateConfigContent(order, features), null, 2),
    { name: "starter-config.json" }
  );

  // Add placeholder structure for each feature
  const featuresByCategory = features.reduce(
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

  for (const [category, categoryFeatures] of Object.entries(featuresByCategory)) {
    for (const feature of categoryFeatures) {
      const filePath = `src/features/${category}/${feature.slug}/index.ts`;
      archive.append(generateFeaturePlaceholder(feature), { name: filePath });
    }
  }

  // Add .env.example
  const envVars: Array<{ key: string; description: string; required: boolean; default?: string }> = [];
  for (const feature of features) {
    if (feature.envVars && Array.isArray(feature.envVars)) {
      envVars.push(...(feature.envVars as Array<{ key: string; description: string; required: boolean; default?: string }>));
    }
  }

  if (envVars.length > 0) {
    const envContent = envVars
      .map((v) => `# ${v.description}\n${v.key}=${v.default || ""}`)
      .join("\n\n");
    archive.append(envContent, { name: "backend/.env.example" });
  }

  // Increment download count
  await prisma.license.update({
    where: { id: order.license!.id },
    data: {
      downloadCount: { increment: 1 },
      lastDownloadAt: new Date(),
    },
  });

  // Finalize the archive
  await archive.finalize();
}

/**
 * Get order details for success page
 */
export async function getOrderDetails(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      license: {
        select: {
          id: true,
          licenseKey: true,
          downloadCount: true,
          maxDownloads: true,
          status: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order");
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    tier: order.tier,
    total: order.total,
    discount: order.discount,
    status: order.status,
    selectedFeatures: order.selectedFeatures,
    template: order.template,
    license: order.license,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  };
}
