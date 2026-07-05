import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../lib/categories";

const prisma = new PrismaClient();

// Dental-era default categories, obsolete after the medical rebrand. These are
// pruned on seed ONLY when they hold no courses — a category with content
// attached is always preserved, so this can never delete real data.
const OBSOLETE_CATEGORY_SLUGS = [
  "oral-pathology",
  "prosthodontics",
  "orthodontics",
  "endodontics",
  "periodontics",
  "oral-surgery",
  "dental-materials",
  "pediatric-dentistry",
];

async function main() {
  // 1. Seed / update the default medical categories (idempotent upsert).
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameEn: c.nameEn, nameAr: c.nameAr },
      create: c,
    });
  }
  console.log(`✓ Seeded ${DEFAULT_CATEGORIES.length} categories`);

  // 1b. Remove leftover dental categories that carry no courses. Guarded so a
  // failure here never aborts a deploy build.
  try {
    const removed = await prisma.category.deleteMany({
      where: {
        slug: { in: OBSOLETE_CATEGORY_SLUGS },
        courses: { none: {} },
      },
    });
    if (removed.count > 0) {
      console.log(`✓ Pruned ${removed.count} obsolete dental categories`);
    }
  } catch (e) {
    console.warn("⚠ Skipping obsolete-category prune:", e);
  }

  // 2. Seed an admin (superuser) — only when an admin email is available.
  // On Vercel builds we skip this unless SEED_ADMIN_EMAIL is explicitly set,
  // so a production deploy never creates a default weak-password admin.
  const onVercel = !!process.env.VERCEL;
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || (onVercel ? "" : "admin@whymedicine.app")
  ).toLowerCase();

  if (!adminEmail) {
    console.log("• Skipping admin seed (no SEED_ADMIN_EMAIL on this build)");
  } else {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN", isActive: true },
      create: {
        name: "Why Medicine Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log(`✓ Admin ready: ${adminEmail} (password from SEED_ADMIN_PASSWORD)`);
  }
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
