-- Runs before `prisma db push` on every deploy (see package.json "vercel-build").
-- Flashcard is gaining a required `courseId` column (mirroring Question) so it
-- can attach to a whole course, not just a single lecture. `prisma db push`
-- cannot add a NOT NULL column to a populated table on its own, so this
-- backfills it manually first. Safe to run repeatedly: both statements are
-- no-ops once every row has a courseId.
ALTER TABLE "Flashcard" ADD COLUMN IF NOT EXISTS "courseId" TEXT;

UPDATE "Flashcard" f
SET "courseId" = l."courseId"
FROM "Lecture" l
WHERE f."lectureId" = l."id" AND f."courseId" IS NULL;
