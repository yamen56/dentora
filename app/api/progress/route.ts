import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";

// Toggle a lecture's completion state for the current student.
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "STUDENT") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const lectureId = body?.lectureId;
  if (typeof lectureId !== "string") return json({ error: "validation" }, 400);

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: { id: true, courseId: true },
  });
  if (!lecture) return json({ error: "notFound" }, 404);

  if (!(await isEnrolled(user.id, lecture.courseId))) {
    return json({ error: "forbidden" }, 403);
  }

  const existing = await prisma.lectureProgress.findUnique({
    where: { userId_lectureId: { userId: user.id, lectureId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.lectureProgress.delete({ where: { id: existing.id } });
    return json({ completed: false });
  }

  await prisma.lectureProgress.create({
    data: { userId: user.id, lectureId },
  });
  return json({ completed: true });
}
