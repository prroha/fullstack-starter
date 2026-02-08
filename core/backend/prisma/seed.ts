import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === "production";

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: "USER" | "ADMIN";
  environments: ("development" | "production")[];
}

const defaultUsers: SeedUser[] = [
  {
    email: "admin@proha.com",
    password: "Admin@123",
    name: "Admin User",
    role: "ADMIN",
    environments: ["development", "production"], // Created in all environments
  },
  {
    email: "user@user.com",
    password: "User@123",
    name: "Demo User",
    role: "USER",
    environments: ["development"], // Only in development
  },
];

async function main() {
  const env = isProduction ? "production" : "development";
  console.log(`🌱 Starting database seed (${env})...\n`);

  const usersToSeed = defaultUsers.filter((u) =>
    u.environments.includes(env as "development" | "production")
  );

  for (const user of usersToSeed) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      console.log(`⏭️  User ${user.email} already exists, skipping...`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role,
        isActive: true,
      },
    });

    console.log(`✅ Created ${user.role}: ${user.email}`);
  }

  console.log("\n🎉 Seed completed successfully!");

  if (!isProduction) {
    console.log("\n📋 Default credentials:");
    console.log("   Admin: admin@proha.com / Admin@123");
    console.log("   User:  user@user.com / User@123");
  } else {
    console.log("\n⚠️  Production: Change admin password immediately!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
