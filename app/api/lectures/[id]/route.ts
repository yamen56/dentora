import { json, loadOwnedLecture } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { lectureSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedLecture(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = lectureSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const lecture = await prisma.lecture.update({
    where: { id: params.id },
    data: {
      title: d.title,
      description: d.description ? d.description : null,
      videoUrl: d.videoUrl ? d.videoUrl : null,
      videoPublicId: d.videoPublicId ? d.videoPublicId : null,
      pdfUrl: d.pdfUrl ? d.pdfUrl : null,
      pdfPublicId: d.pdfPublicId ? d.pdfPublicId : null,
      duration: d.duration,
      isPreview: d.isPreview ?? false,
    },
  });

  return json({ lecture });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedLecture(params.id);
  if ("error" in res) return res.error;

  await prisma.lecture.delete({ where: { id: params.id } });
  return json({ ok: true });
}
