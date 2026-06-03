import { json, loadOwnedQuestion } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedQuestion(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const question = await prisma.question.update({
    where: { id: params.id },
    data: {
      type: d.type,
      questionText: d.questionText,
      options: d.type === "MCQ" ? (d.options ?? []) : undefined,
      correctAnswer: d.correctAnswer,
      points: d.points,
      lectureId: d.lectureId ?? null,
    },
  });

  return json({ question });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedQuestion(params.id);
  if ("error" in res) return res.error;

  await prisma.question.delete({ where: { id: params.id } });
  return json({ ok: true });
}
