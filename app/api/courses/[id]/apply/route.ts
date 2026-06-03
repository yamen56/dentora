import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { applicationSchema } from "@/lib/validations";

// A student applies for access to a course. Creates (or re-opens) a PENDING
// application that an admin or the course's instructor can later approve.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "STUDENT") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const parsed = applicationSchema.safeParse(body ?? {});
  if (!parsed.success) return json({ error: "validation" }, 400);
  const note = parsed.data.note?.trim() || null;

  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course || !course.isPublished) return json({ error: "notFound" }, 404);

  if (await isEnrolled(user.id, params.id)) {
    return json({ ok: true, alreadyEnrolled: true });
  }

  // Upsert: a fresh request, or re-open a previously rejected one.
  const application = await prisma.courseApplication.upsert({
    where: { userId_courseId: { userId: user.id, courseId: params.id } },
    update: { status: "PENDING", note, reviewedAt: null },
    create: { userId: user.id, courseId: params.id, note, status: "PENDING" },
    select: { id: true, status: true },
  });

  return json({ ok: true, application });
}
