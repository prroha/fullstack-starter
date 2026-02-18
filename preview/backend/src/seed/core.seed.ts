import { PrismaClient } from "@prisma/client";

// Pre-computed bcrypt hash of "Preview123!" (salt rounds 12)
const ADMIN_PASSWORD_HASH =
  "$2a$12$LJ3m4ys3Rl8I9GZ2YWbS5.Vp9K2QdU7EjPTnYlZJ1KDm3rFEyWmGm";
const USER_PASSWORD_HASH =
  "$2a$12$LJ3m4ys3Rl8I9GZ2YWbS5.Vp9K2QdU7EjPTnYlZJ1KDm3rFEyWmGm";

export async function seedCore(db: PrismaClient): Promise<void> {
  // Admin user
  await db.user.create({
    data: {
      email: "admin@preview.local",
      passwordHash: ADMIN_PASSWORD_HASH,
      name: "Preview Admin",
      role: "ADMIN",
      emailVerified: true,
      isActive: true,
    },
  });

  // Sample users
  await Promise.all([
    db.user.create({
      data: {
        email: "alice@preview.local",
        name: "Alice Johnson",
        passwordHash: USER_PASSWORD_HASH,
        role: "USER",
        emailVerified: true,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: "bob@preview.local",
        name: "Bob Smith",
        passwordHash: USER_PASSWORD_HASH,
        role: "USER",
        emailVerified: true,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: "carol@preview.local",
        name: "Carol Williams",
        passwordHash: USER_PASSWORD_HASH,
        role: "USER",
        emailVerified: true,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: "dave@preview.local",
        name: "Dave Brown",
        passwordHash: USER_PASSWORD_HASH,
        role: "USER",
        emailVerified: true,
        isActive: true,
      },
    }),
    db.user.create({
      data: {
        email: "eve@preview.local",
        name: "Eve Davis",
        passwordHash: USER_PASSWORD_HASH,
        role: "USER",
        emailVerified: true,
        isActive: true,
      },
    }),
  ]);
}
