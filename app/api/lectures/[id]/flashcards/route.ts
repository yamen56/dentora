import { json, loadOwnedLecture } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { flashcardSchema } from "@/lib/validations";

// Create a flashcard on a lecture (instructor who owns it, or admin).
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedLecture(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = flashcardSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const last = await prisma.flashcard.findFirst({
    where: { lectureId: params.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const flashcard = await prisma.flashcard.create({
    data: {
      lectureId: params.id,
      front: d.front.trim(),
      back: d.back.trim(),
      hint: d.hint?.trim() || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  return json({ flashcard }, 201);
}
