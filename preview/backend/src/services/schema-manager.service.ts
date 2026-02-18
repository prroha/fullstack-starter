import { getAdminClient, getClientForSchema, evictClient } from "../config/db.js";
import { toSchemaName, SCHEMA_NAME_REGEX } from "../utils/schema-name.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Pre-compiled migration SQL (loaded once at startup)
let migrationSQL: string | null = null;

function getMigrationSQL(): string {
  if (!migrationSQL) {
    try {
      migrationSQL = readFileSync(resolve(__dirname, "../migration.sql"), "utf-8");
    } catch {
      throw new Error("Migration SQL not found. Run 'npm run migration:compile' first.");
    }
  }
  return migrationSQL;
}

/**
 * Provision a new schema for a preview session.
 * Creates schema, runs migrations, seeds data.
 */
export async function provisionSchema(
  sessionToken: string,
  features: string[],
  _tier: string
): Promise<string> {
  const schemaName = toSchemaName(sessionToken);

  // Double-validate schema name before SQL execution
  if (!SCHEMA_NAME_REGEX.test(schemaName)) {
    throw new Error(`Invalid schema name: ${schemaName}`);
  }

  const admin = getAdminClient();
  const sql = getMigrationSQL();

  try {
    // Create schema
    // Note: $executeRawUnsafe is required because PostgreSQL does not support
    // parameterized DDL statements (CREATE SCHEMA, SET search_path, DROP SCHEMA).
    // The schemaName is validated against SCHEMA_NAME_REGEX above to prevent injection.
    await admin.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Run migrations within the schema (DDL — parameterized queries not supported)
    await admin.$executeRawUnsafe(`SET search_path TO "${schemaName}"`);
    await admin.$executeRawUnsafe(sql);
    await admin.$executeRawUnsafe(`SET search_path TO "public"`);

    // Seed with per-schema client (import seed dynamically to avoid circular deps)
    const db = getClientForSchema(schemaName);
    try {
      const { seedPreviewSchema } = await import("../seed/index.js");
      await seedPreviewSchema(db, features);
    } catch (seedError) {
      console.error(`Seeding failed for ${schemaName}:`, seedError);
      // Clean up the schema since seeding failed
      await admin.$executeRawUnsafe(`SET search_path TO "public"`).catch(() => {});
      await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
      await evictClient(schemaName);
      throw new Error(`Seeding failed for schema ${schemaName}: ${seedError instanceof Error ? seedError.message : seedError}`);
    }

    return schemaName;
  } catch (error) {
    // Rollback: drop the partially-created schema
    await admin.$executeRawUnsafe(`SET search_path TO "public"`).catch(() => {});
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`).catch(() => {});
    await evictClient(schemaName);
    throw error;
  }
}

/**
 * Drop a preview schema and clean up its PrismaClient.
 */
export async function dropSchema(schemaName: string): Promise<void> {
  if (!SCHEMA_NAME_REGEX.test(schemaName)) {
    throw new Error(`Invalid schema name: ${schemaName}`);
  }

  const admin = getAdminClient();
  // DDL statement — parameterized queries not supported; schemaName validated by SCHEMA_NAME_REGEX above
  await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await evictClient(schemaName);
}

/**
 * List all preview schemas in the database.
 */
export async function listPreviewSchemas(): Promise<string[]> {
  const admin = getAdminClient();
  const schemas = await admin.$queryRaw<Array<{ schema_name: string }>>`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'preview_%'
    ORDER BY schema_name
  `;
  return schemas.map((s) => s.schema_name);
}
