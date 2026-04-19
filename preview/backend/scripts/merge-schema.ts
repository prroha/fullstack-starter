#!/usr/bin/env tsx
/**
 * Merge core + all module Prisma schemas into a single schema
 * for the preview backend. Run as part of the build process.
 *
 * Usage: tsx scripts/merge-schema.ts
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../..");

const CORE_SCHEMA_PATH = resolve(projectRoot, "core/backend/prisma/schema.prisma");
const OUTPUT_PATH = resolve(__dirname, "../prisma/schema.prisma");

const MODULE_SCHEMAS = [
  { name: "ecommerce", path: "modules/ecommerce/prisma/ecommerce.prisma" },
  { name: "lms", path: "modules/lms/prisma/lms.prisma" },
  { name: "booking", path: "modules/booking/prisma/booking.prisma" },
  { name: "helpdesk", path: "modules/helpdesk/prisma/helpdesk.prisma" },
  { name: "invoicing", path: "modules/invoicing/prisma/invoicing.prisma" },
  { name: "events", path: "modules/events/prisma/events.prisma" },
  { name: "tasks", path: "modules/tasks/prisma/tasks.prisma" },
];

function main() {
  console.log("Merging Prisma schemas for preview backend...");

  // Read core schema
  if (!existsSync(CORE_SCHEMA_PATH)) {
    console.error(`Core schema not found: ${CORE_SCHEMA_PATH}`);
    process.exit(1);
  }
  let merged = readFileSync(CORE_SCHEMA_PATH, "utf-8");

  // Extract and keep the generator + datasource blocks from core
  // Then append models/enums from each module schema
  const seenModels = new Set<string>();
  const seenEnums = new Set<string>();

  // Track models/enums from core
  const coreModels = merged.match(/^model\s+(\w+)/gm) || [];
  const coreEnums = merged.match(/^enum\s+(\w+)/gm) || [];
  coreModels.forEach((m) => seenModels.add(m.replace("model ", "")));
  coreEnums.forEach((e) => seenEnums.add(e.replace("enum ", "")));

  // Append module schemas
  for (const mod of MODULE_SCHEMAS) {
    const fullPath = resolve(projectRoot, mod.path);
    if (!existsSync(fullPath)) {
      console.warn(`Module schema not found (skipping): ${mod.path}`);
      continue;
    }

    const schema = readFileSync(fullPath, "utf-8");

    // Extract models and enums (skip generator/datasource blocks)
    const blocks = extractBlocks(schema);
    let addedCount = 0;

    for (const block of blocks) {
      if (block.type === "generator" || block.type === "datasource") continue;

      if (block.type === "model") {
        if (seenModels.has(block.name)) {
          console.warn(`  Duplicate model "${block.name}" in ${mod.name} — skipping`);
          continue;
        }
        seenModels.add(block.name);
        merged += `\n\n// From: ${mod.name}\n${block.content}`;
        addedCount++;
      } else if (block.type === "enum") {
        if (seenEnums.has(block.name)) {
          // Merge enum values instead of skipping
          const newValues = extractEnumValues(block.content);
          const existingValues = extractEnumValuesFromMerged(merged, block.name);
          const toAdd = newValues.filter((v) => !existingValues.has(v));
          if (toAdd.length > 0) {
            merged = mergeEnumValues(merged, block.name, toAdd);
            console.log(`  Merged ${toAdd.length} values into enum "${block.name}" from ${mod.name}: ${toAdd.join(", ")}`);
          } else {
            console.log(`  Duplicate enum "${block.name}" in ${mod.name} — all values already present`);
          }
          continue;
        }
        seenEnums.add(block.name);
        merged += `\n\n// From: ${mod.name}\n${block.content}`;
        addedCount++;
      }
    }

    console.log(`  ${mod.name}: ${addedCount} blocks added`);
  }

  // Write merged schema
  writeFileSync(OUTPUT_PATH, merged, "utf-8");
  console.log(`\nMerged schema written to: ${OUTPUT_PATH}`);
  console.log(`Total models: ${seenModels.size}, Total enums: ${seenEnums.size}`);
}

interface SchemaBlock {
  type: "model" | "enum" | "generator" | "datasource";
  name: string;
  content: string;
}

function extractEnumValues(enumBlock: string): string[] {
  const match = enumBlock.match(/\{([^}]+)\}/);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//"));
}

function extractEnumValuesFromMerged(schema: string, enumName: string): Set<string> {
  const regex = new RegExp(`enum\\s+${enumName}\\s*\\{([^}]+)\\}`);
  const match = schema.match(regex);
  if (!match) return new Set();
  return new Set(
    match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//"))
  );
}

function mergeEnumValues(schema: string, enumName: string, newValues: string[]): string {
  const regex = new RegExp(`(enum\\s+${enumName}\\s*\\{[^}]*)(\\})`);
  return schema.replace(regex, (_, before, close) => {
    const valuesStr = newValues.map((v) => `  ${v}`).join("\n");
    return `${before}\n${valuesStr}\n${close}`;
  });
}

function extractBlocks(schema: string): SchemaBlock[] {
  const blocks: SchemaBlock[] = [];
  const regex = /(model|enum|generator|datasource)\s+(\w+)\s*\{/g;
  let match;

  while ((match = regex.exec(schema)) !== null) {
    const type = match[1] as SchemaBlock["type"];
    const name = match[2];
    const startIdx = match.index;

    // Find matching closing brace
    let braceCount = 0;
    let endIdx = startIdx;
    for (let i = schema.indexOf("{", startIdx); i < schema.length; i++) {
      if (schema[i] === "{") braceCount++;
      if (schema[i] === "}") braceCount--;
      if (braceCount === 0) {
        endIdx = i + 1;
        break;
      }
    }

    blocks.push({
      type,
      name,
      content: schema.slice(startIdx, endIdx),
    });
  }

  return blocks;
}

main();
