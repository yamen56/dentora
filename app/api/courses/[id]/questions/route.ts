import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const lectureId = d.lectureId ?? null;
  if (lectureId) {
    const lecture = await prisma.lecture.findFirst({
      where: { id: lectureId, courseId: params.id },
      select: { id: true },
    });
    if (!lecture) return json({ error: "invalidLecture" }, 400);
  }

  const question = await prisma.question.create({
    data: {
      courseId: params.id,
      type: d.type,
      questionText: d.questionText,
      options: d.type === "MCQ" ? (d.options ?? []) : undefined,
      correctAnswer: d.correctAnswer,
      points: d.points,
      lectureId,
    },
  });

  return json({ question }, 201);
}
