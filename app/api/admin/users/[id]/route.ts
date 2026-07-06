import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Activate / deactivate a user account. Body: { isActive: boolean }
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);
  if (params.id === user.id) return json({ error: "cannotModifySelf" }, 400);

  const body = await req.json().catch(() => null);
  if (typeof body?.isActive !== "boolean") {
    return json({ error: "validation" }, 400);
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { isActive: body.isActive },
  });
  return json({ ok: true });
}

// Permanently delete a user account. Cascades (see schema onDelete: Cascade)
// remove their enrollments, applications, progress, quiz attempts, documents —
// and, for instructors, all of their courses and lectures.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);
  if (params.id === user.id) return json({ error: "cannotModifySelf" }, 400);

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { role: true },
  });
  if (!target) return json({ error: "notFound" }, 404);
  // Guard against removing another admin account through the API.
  if (target.role === "ADMIN") return json({ error: "cannotDeleteAdmin" }, 400);

  await prisma.user.delete({ where: { id: params.id } });
  return json({ ok: true });
}
