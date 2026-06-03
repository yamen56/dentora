import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { enrollUser } from "@/lib/enroll";
import { applicationReviewSchema } from "@/lib/validations";

// Approve or reject a course application.
// Allowed for an admin, or the instructor who owns the course.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
    return json({ error: "forbidden" }, 403);
  }

  const body = await req.json().catch(() => null);
  const parsed = applicationReviewSchema.safeParse(body);
  if (!parsed.success) return json({ error: "validation" }, 400);

  const application = await prisma.courseApplication.findUnique({
    where: { id: params.id },
    include: { course: { select: { instructorId: true } } },
  });
  if (!application) return json({ error: "notFound" }, 404);

  if (
    user.role !== "ADMIN" &&
    application.course.instructorId !== user.id
  ) {
    return json({ error: "forbidden" }, 403);
  }

  if (parsed.data.action === "approve") {
    await enrollUser(application.userId, application.courseId, {
      source: "APPLICATION",
    });
    await prisma.courseApplication.update({
      where: { id: application.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    return json({ ok: true, status: "APPROVED" });
  }

  await prisma.courseApplication.update({
    where: { id: application.id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  return json({ ok: true, status: "REJECTED" });
}
