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
