import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

async function loadOwnedDocument(id: string) {
  const user = await getApiUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) } as const;

  const document = await prisma.instructorDocument.findUnique({
    where: { id },
  });
  if (!document) return { error: json({ error: "notFound" }, 404) } as const;

  if (document.instructorId !== user.id && user.role !== "ADMIN") {
    return { error: json({ error: "forbidden" }, 403) } as const;
  }
  return { user, document } as const;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const result = await loadOwnedDocument(params.id);
  if ("error" in result) return result.error;
  return json({ document: result.document });
}

// Save title/content/direction.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const result = await loadOwnedDocument(params.id);
  if ("error" in result) return result.error;

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "validation" }, 400);

  const data: {
    title?: string;
    content?: object;
    dir?: string;
  } = {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim().slice(0, 200);
  }
  // Tiptap document JSON — stored as-is, only rendered back into the editor.
  if (body.content && typeof body.content === "object") {
    data.content = body.content;
  }
  if (body.dir === "rtl" || body.dir === "ltr") {
    data.dir = body.dir;
  }

  const document = await prisma.instructorDocument.update({
    where: { id: result.document.id },
    data,
  });
  return json({ document: { id: document.id, updatedAt: document.updatedAt } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const result = await loadOwnedDocument(params.id);
  if ("error" in result) return result.error;

  await prisma.instructorDocument.delete({
    where: { id: result.document.id },
  });
  return json({ ok: true });
}
