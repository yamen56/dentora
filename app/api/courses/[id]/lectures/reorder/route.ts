import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Body: { order: string[] } — lecture ids in their new display order.
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const order: unknown = body?.order;
  if (!Array.isArray(order) || order.some((x) => typeof x !== "string")) {
    return json({ error: "validation" }, 400);
  }

  // Only reorder lectures that actually belong to this course
  const lectures = await prisma.lecture.findMany({
    where: { courseId: params.id },
    select: { id: true },
  });
  const validIds = new Set(lectures.map((l) => l.id));

  await prisma.$transaction(
    (order as string[])
      .filter((id) => validIds.has(id))
      .map((id, index) =>
        prisma.lecture.update({ where: { id }, data: { order: index } }),
      ),
  );

  return json({ ok: true });
}
