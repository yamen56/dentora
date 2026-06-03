import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const course = await prisma.course.update({
    where: { id: params.id },
    data: {
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      descriptionEn: d.descriptionEn,
      descriptionAr: d.descriptionAr,
      categoryId: d.categoryId,
      language: d.language,
      difficulty: d.difficulty,
      thumbnail: d.thumbnail ? d.thumbnail : null,
    },
  });

  return json({ course });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  await prisma.course.delete({ where: { id: params.id } });
  return json({ ok: true });
}
