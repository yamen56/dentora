import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Approve or reject an instructor account. Body: { action: "approve" | "reject" }
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "ADMIN") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject") {
    return json({ error: "validation" }, 400);
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || target.role !== "INSTRUCTOR") {
    return json({ error: "notFound" }, 404);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      instructorStatus: action === "approve" ? "APPROVED" : "REJECTED",
      isActive: action === "approve" ? true : target.isActive,
    },
  });

  return json({ ok: true, instructorStatus: updated.instructorStatus });
}
