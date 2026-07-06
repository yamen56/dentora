import { json, loadOwnedFlashcard } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { flashcardSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedFlashcard(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = flashcardSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const flashcard = await prisma.flashcard.update({
    where: { id: params.id },
    data: {
      front: d.front.trim(),
      back: d.back.trim(),
      hint: d.hint?.trim() || null,
    },
  });

  return json({ flashcard });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedFlashcard(params.id);
  if ("error" in res) return res.error;

  await prisma.flashcard.delete({ where: { id: params.id } });
  return json({ ok: true });
}
