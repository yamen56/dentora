import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { isActiveSession } from "./auth-helpers";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function getApiUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;
  if (!user) return null;
  // Reject requests from a student device whose session has been superseded.
  if (!(await isActiveSession(user))) return null;
  return user;
}

/**
 * Load a course and assert the current user may manage it
 * (its instructor, or an admin). Returns either an error Response or the course.
 */
export async function loadOwnedCourse(courseId: string) {
  const user = await getApiUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) } as const;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: json({ error: "notFound" }, 404) } as const;

  if (course.instructorId !== user.id && user.role !== "ADMIN") {
    return { error: json({ error: "forbidden" }, 403) } as const;
  }
  return { user, course } as const;
}

export async function loadOwnedLecture(lectureId: string) {
  const user = await getApiUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) } as const;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!lecture) return { error: json({ error: "notFound" }, 404) } as const;

  if (lecture.course.instructorId !== user.id && user.role !== "ADMIN") {
    return { error: json({ error: "forbidden" }, 403) } as const;
  }
  return { user, lecture } as const;
}

export async function loadOwnedFlashcard(flashcardId: string) {
  const user = await getApiUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) } as const;

  const flashcard = await prisma.flashcard.findUnique({
    where: { id: flashcardId },
    include: { lecture: { select: { course: { select: { instructorId: true } } } } },
  });
  if (!flashcard) return { error: json({ error: "notFound" }, 404) } as const;

  if (
    flashcard.lecture.course.instructorId !== user.id &&
    user.role !== "ADMIN"
  ) {
    return { error: json({ error: "forbidden" }, 403) } as const;
  }
  return { user, flashcard } as const;
}

export async function loadOwnedQuestion(questionId: string) {
  const user = await getApiUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) } as const;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!question) return { error: json({ error: "notFound" }, 404) } as const;

  if (question.course.instructorId !== user.id && user.role !== "ADMIN") {
    return { error: json({ error: "forbidden" }, 403) } as const;
  }
  return { user, question } as const;
}
