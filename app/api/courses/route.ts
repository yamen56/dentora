import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";

// Create a course (instructor only).
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  // Validate the category exists
  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
  });
  if (!category) return json({ error: "invalidCategory" }, 400);

  const course = await prisma.course.create({
    data: {
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      descriptionEn: d.descriptionEn,
      descriptionAr: d.descriptionAr,
      categoryId: d.categoryId,
      language: d.language,
      difficulty: d.difficulty,
      thumbnail: d.thumbnail ? d.thumbnail : null,
      instructorId: user.id,
    },
  });

  return json({ course }, 201);
}
