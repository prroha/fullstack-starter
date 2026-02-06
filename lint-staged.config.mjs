/**
 * Lint-Staged Configuration
 * Runs linters on staged files before commit
 */

export default {
  // ==========================================================================
  // Backend (Express + TypeScript)
  // ==========================================================================
  "backend/**/*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
  ],
  "backend/**/*.{json,md}": [
    "prettier --write",
  ],

  // ==========================================================================
  // Web (Next.js + TypeScript)
  // ==========================================================================
  "web/**/*.{ts,tsx,js,jsx}": [
    "eslint --fix --max-warnings=0",
  ],
  "web/**/*.{json,md,css,scss}": [
    "prettier --write",
  ],

  // ==========================================================================
  // Mobile (Flutter/Dart)
  // ==========================================================================
  "mobile/**/*.dart": (filenames) => [
    `dart format ${filenames.join(" ")}`,
    `dart analyze ${filenames.map(f => f.replace(/\/[^/]+$/, "")).filter((v, i, a) => a.indexOf(v) === i).join(" ")} || true`,
  ],

  // ==========================================================================
  // Root level files
  // ==========================================================================
  "*.{json,md,yml,yaml}": [
    "prettier --write",
  ],

  // ==========================================================================
  // Prisma Schema
  // ==========================================================================
  "backend/prisma/schema.prisma": [
    "npx prisma format",
  ],
};
