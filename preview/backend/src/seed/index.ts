import { PrismaClient } from "@prisma/client";
import { seedCore } from "./core.seed.js";
import { seedEcommerce } from "./ecommerce.seed.js";
import { seedLms } from "./lms.seed.js";
import { seedBooking } from "./booking.seed.js";
import { seedHelpdesk } from "./helpdesk.seed.js";
import { seedInvoicing } from "./invoicing.seed.js";
import { seedEvents } from "./events.seed.js";
import { seedTasks } from "./tasks.seed.js";

/**
 * Seed a preview schema with demo data based on enabled features.
 * Called during schema provisioning.
 */
export async function seedPreviewSchema(
  db: PrismaClient,
  enabledFeatures: string[],
): Promise<void> {
  // Always seed core data (admin + sample users)
  await seedCore(db);

  const features = new Set(enabledFeatures);
  const moduleSeeds: Promise<void>[] = [];

  // Seed module data based on selected features
  if ([...features].some((f) => f.startsWith("ecommerce")))
    moduleSeeds.push(seedEcommerce(db));
  if ([...features].some((f) => f.startsWith("lms")))
    moduleSeeds.push(seedLms(db));
  if ([...features].some((f) => f.startsWith("booking")))
    moduleSeeds.push(seedBooking(db));
  if ([...features].some((f) => f.startsWith("helpdesk")))
    moduleSeeds.push(seedHelpdesk(db));
  if ([...features].some((f) => f.startsWith("invoicing")))
    moduleSeeds.push(seedInvoicing(db));
  if ([...features].some((f) => f.startsWith("events")))
    moduleSeeds.push(seedEvents(db));
  if ([...features].some((f) => f.startsWith("tasks")))
    moduleSeeds.push(seedTasks(db));

  await Promise.all(moduleSeeds);
}
