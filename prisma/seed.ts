import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../lib/categories";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed categories
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameEn: c.nameEn, nameAr: c.nameAr },
      create: c,
    });
  }
  console.log(`✓ Seeded ${DEFAULT_CATEGORIES.length} categories`);

  // 2. Seed an admin (superuser)
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@dentora.app").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", isActive: true },
    create: {
      name: "Dentora Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✓ Admin ready: ${adminEmail} (password from SEED_ADMIN_PASSWORD)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
