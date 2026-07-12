import { json, loadOwnedCourse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { lectureSchema } from "@/lib/validations";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedCourse(params.id);
  if ("error" in res) return res.error;

  const body = await req.json().catch(() => null);
  const parsed = lectureSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const d = parsed.data;

  const count = await prisma.lecture.count({ where: { courseId: params.id } });

  const lecture = await prisma.lecture.create({
    data: {
      courseId: params.id,
      title: d.title,
      description: d.description ? d.description : null,
      videoUrl: d.videoUrl ? d.videoUrl : null,
      videoPublicId: d.videoPublicId ? d.videoPublicId : null,
      pdfUrl: d.pdfUrl ? d.pdfUrl : null,
      pdfPublicId: d.pdfPublicId ? d.pdfPublicId : null,
      duration: d.duration,
      isPreview: d.isPreview ?? false,
      examPeriod: d.examPeriod ?? null,
      order: count,
    },
  });

  return json({ lecture }, 201);
}
