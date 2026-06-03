import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => ({}) as { isPublished?: boolean });
  const isPublished =
    typeof body.isPublished === "boolean"
      ? body.isPublished
      : !res.course.isPublished;

  const course = await prisma.course.update({
    where: { id: params.id },
    data: { isPublished },
  });

  return json({ course });
}
