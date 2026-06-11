import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// List my documents (instructor only).
export async function GET() {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return json({ error: "forbidden" }, 403);
  }

  const documents = await prisma.instructorDocument.findMany({
    where: { instructorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, dir: true, updatedAt: true },
  });
  return json({ documents });
}

// Create a new (empty) document.
export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "INSTRUCTOR" && user.role !== "ADMIN") {
    return json({ error: "forbidden" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "Untitled document";
  const dir = body?.dir === "rtl" ? "rtl" : "ltr";

  const document = await prisma.instructorDocument.create({
    data: { title, dir, instructorId: user.id },
  });
  return json({ document }, 201);
}
