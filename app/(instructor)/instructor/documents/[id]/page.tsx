import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { DocumentEditor } from "@/components/instructor/document-editor";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("INSTRUCTOR");

  const doc = await prisma.instructorDocument
    .findFirst({
      where: { id: params.id, instructorId: user.id },
    })
    .catch(() => null);

  if (!doc) notFound();

  return (
    <DocumentEditor
      doc={{
        id: doc.id,
        title: doc.title,
        content: (doc.content as object | null) ?? null,
        dir: doc.dir,
      }}
    />
  );
}
