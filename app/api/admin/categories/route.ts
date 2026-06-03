import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { categorySchema } from "@/lib/validations";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return json({ category }, 201);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return json({ error: "slugTaken" }, 409);
    }
    return json({ error: "server" }, 500);
  }
}
