import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { cloudinaryConfigured, signedDeliveryUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// Returns a short-lived signed delivery URL for the lecture video.
// The permanent Cloudinary URL is never exposed — only this expiring one.
export async function GET(
  _req: Request,
  { params }: { params: { lectureId: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const lecture = await prisma.lecture.findUnique({
    where: { id: params.lectureId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!lecture) return json({ error: "notFound" }, 404);

  const isOwner =
    lecture.course.instructorId === user.id || user.role === "ADMIN";
  const allowed =
    isOwner || lecture.isPreview || (await isEnrolled(user.id, lecture.courseId));
  if (!allowed) return json({ error: "forbidden" }, 403);

  if (lecture.videoPublicId && cloudinaryConfigured) {
    return json({
      url: signedDeliveryUrl(lecture.videoPublicId, "video", 60 * 60),
    });
  }
  if (lecture.videoUrl) return json({ url: lecture.videoUrl });
  return json({ error: "noVideo" }, 404);
}
