import { json, loadOwnedEnrollment } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Remove a student from a course (the course's instructor, or an admin).
// Deletes only the enrollment — the student's account and other courses are
// untouched. Their progress/quiz rows for this course are left as historical
// records unless the student is later re-added.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await loadOwnedEnrollment(params.id);
  if ("error" in res) return res.error;

  await prisma.enrollment.delete({ where: { id: params.id } });
  return json({ ok: true });
}
