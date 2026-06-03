import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);

  // Block deletion if courses still use this category
  const inUse = await prisma.course.count({ where: { categoryId: params.id } });
  if (inUse > 0) return json({ error: "categoryInUse" }, 409);

  await prisma.category.delete({ where: { id: params.id } });
  return json({ ok: true });
}
