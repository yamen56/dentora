import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { cloudinaryConfigured, signedDeliveryUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// Server-side proxy for the lecture PDF. The original file URL never reaches
// the browser — we stream the bytes through this authenticated endpoint.
export async function GET(
  _req: Request,
  { params }: { params: { lectureId: string } },
) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: params.lectureId },
    include: { course: { select: { instructorId: true, isPublished: true } } },
  });
  if (!lecture) return json({ error: "notFound" }, 404);

  // Free-preview lectures of published courses are readable without an account.
  const isPublicPreview = lecture.isPreview && lecture.course.isPublished;

  const user = await getApiUser();
  if (!user && !isPublicPreview) return json({ error: "unauthorized" }, 401);

  if (user) {
    const isOwner =
      lecture.course.instructorId === user.id || user.role === "ADMIN";
    const allowed =
      isOwner ||
      lecture.isPreview ||
      (await isEnrolled(user.id, lecture.courseId));
    if (!allowed) return json({ error: "forbidden" }, 403);
  }

  let source: string | null = null;
  if (lecture.pdfPublicId && cloudinaryConfigured) {
    source = signedDeliveryUrl(lecture.pdfPublicId, "raw", 60 * 60);
  } else if (lecture.pdfUrl) {
    source = lecture.pdfUrl;
  }
  if (!source) return json({ error: "noPdf" }, 404);

  const upstream = await fetch(source);
  if (!upstream.ok) return json({ error: "fetchFailed" }, 502);
  const buf = await upstream.arrayBuffer();

  return new Response(buf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": "inline",
      "cache-control": "private, no-store",
    },
  });
}
