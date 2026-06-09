import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations";

// Update the signed-in user's own profile (photo + bio).
export async function PATCH(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return json({ error: "validation" }, 400);
  const d = parsed.data;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      image: d.image ? d.image : null,
      bio: d.bio ? d.bio : null,
    },
    select: { image: true, bio: true },
  });

  return json({ ok: true, ...updated });
}
