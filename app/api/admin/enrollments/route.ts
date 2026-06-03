import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enrollUser, isEnrolled } from "@/lib/enroll";
import { adminEnrollSchema } from "@/lib/validations";

// Admin directly grants a student access to a course (by email).
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const parsed = adminEnrollSchema.safeParse(body);
  if (!parsed.success) return json({ error: "validation" }, 400);
  const { courseId, email } = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return json({ error: "courseNotFound" }, 404);

  const student = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true, name: true },
  });
  if (!student) return json({ error: "studentNotFound" }, 404);
  if (student.role !== "STUDENT") return json({ error: "notAStudent" }, 400);

  if (await isEnrolled(student.id, courseId)) {
    return json({ error: "alreadyEnrolled" }, 409);
  }

  await enrollUser(student.id, courseId, { source: "ADMIN" });

  // If they had a pending application, mark it approved.
  await prisma.courseApplication
    .updateMany({
      where: { userId: student.id, courseId, status: "PENDING" },
      data: { status: "APPROVED", reviewedAt: new Date() },
    })
    .catch(() => {});

  return json({ ok: true, studentName: student.name });
}
