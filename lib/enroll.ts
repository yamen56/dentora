import { prisma } from "./prisma";

/** Idempotently enroll a user in a course. */
export async function enrollUser(
  userId: string,
  courseId: string,
  opts: { source?: "APPLICATION" | "ADMIN" } = {},
) {
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: {
      userId,
      courseId,
      source: opts.source ?? "APPLICATION",
    },
  });
}

export async function isEnrolled(userId: string, courseId: string) {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return Boolean(e);
}

/** The current user's application for a course, if any. */
export async function getApplication(userId: string, courseId: string) {
  return prisma.courseApplication.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true },
  });
}
