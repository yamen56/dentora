import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { flashcardSchema } from "@/lib/validations";

// Create a flashcard on a course (instructor who owns it, or admin).
// lectureId null => attached to the whole course.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = flashcardSchema.safeParse(body);
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

  const last = await prisma.flashcard.findFirst({
    where: { courseId: params.id, lectureId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const flashcard = await prisma.flashcard.create({
    data: {
      courseId: params.id,
      lectureId,
      front: d.front.trim(),
      back: d.back.trim(),
      hint: d.hint?.trim() || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  return json({ flashcard }, 201);
}
