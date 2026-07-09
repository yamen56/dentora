// Runs before `prisma db push` on every deploy (see package.json "vercel-build").
//
// Applies the manual pre-migration SQL that `prisma db push` can't do on its
// own — currently, backfilling Flashcard.courseId before it becomes a required
// column. Every statement is written to be idempotent, so this is safe to run
// on every deploy (including the first deploy where the column already exists,
// and every deploy after the backfill is complete).
//
// Uses the Postgres client bundled with Prisma's engine via a direct pg-less
// query: we go through Prisma's own $executeRawUnsafe so we need no extra deps.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(__dirname, "..", "prisma", "manual-migrations");

async function main() {
  let files = [];
  try {
    files = readdirSync(sqlDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
  } catch {
    console.log("[predeploy] no manual-migrations directory, skipping");
    return;
  }
  if (files.length === 0) {
    console.log("[predeploy] no manual migrations to run");
    return;
  }

  const prisma = new PrismaClient();
  try {
    for (const file of files) {
      const sql = readFileSync(join(sqlDir, file), "utf8");
      // Split on semicolons at end of line; ignore blank/comment-only chunks.
      const statements = sql
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => s && !s.split("\n").every((l) => l.trim().startsWith("--")));
      console.log(`[predeploy] ${file}: ${statements.length} statement(s)`);
      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
    }
    console.log("[predeploy] done");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[predeploy] failed:", err);
  process.exit(1);
});
