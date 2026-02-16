/**
 * Global Test Setup
 *
 * Runs once before all test files.
 * Sets up the test database and applies migrations.
 */

import { execSync } from "child_process";
import path from "path";

const TEST_DATABASE_NAME = "fullstack_test";

/**
 * Build the test DATABASE_URL from the dev one, swapping the DB name.
 */
function getTestDatabaseUrl(): string {
  // If explicitly set, use it
  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  // Derive from dev DATABASE_URL by replacing the DB name
  const devUrl = process.env.DATABASE_URL || "postgresql://postgres:localpass@localhost:5433/fullstack_dev";
  const url = new URL(devUrl);
  url.pathname = `/${TEST_DATABASE_NAME}`;
  return url.toString();
}

export async function setup(): Promise<void> {
  const testDatabaseUrl = getTestDatabaseUrl();
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";

  const prismaDir = path.resolve(import.meta.dirname, "../../../prisma");

  // Create the test database if it doesn't exist
  const baseUrl = new URL(testDatabaseUrl);
  baseUrl.pathname = "/postgres"; // Connect to default DB
  try {
    execSync(
      `echo "SELECT 'CREATE DATABASE ${TEST_DATABASE_NAME}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${TEST_DATABASE_NAME}')\\gexec" | psql "${baseUrl.toString()}"`,
      { stdio: "pipe" }
    );
  } catch {
    // psql might not be available; try creating via prisma directly
    // If the DB already exists, migrate deploy will work fine
  }

  // Apply migrations to test database
  try {
    execSync(`npx prisma migrate deploy --schema="${prismaDir}/schema.prisma"`, {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: "pipe",
      cwd: path.resolve(import.meta.dirname, "../../.."),
    });
  } catch (_error) {
    // If migrate deploy fails, try db push (works even without migrations)
    execSync(`npx prisma db push --schema="${prismaDir}/schema.prisma" --skip-generate`, {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: "pipe",
      cwd: path.resolve(import.meta.dirname, "../../.."),
    });
  }

  console.warn(`[test-setup] Test database ready: ${TEST_DATABASE_NAME}`);
}

export async function teardown(): Promise<void> {
  // Nothing to clean up globally — each test file cleans its own data
}
