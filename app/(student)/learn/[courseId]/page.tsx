import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { LearnClient } from "@/components/learn-client";
import type { QuizQuestion } from "@/components/quiz-panel";
import { pick } from "@/lib/i18n-helpers";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await requireRole("STUDENT");
  const locale = await getLocale();

  if (!(await isEnrolled(user.id, params.courseId))) {
    redirect(`/courses/${params.courseId}`);
  }

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      lectures: {
        orderBy: { order: "asc" },
        include: { flashcards: { orderBy: { order: "asc" } } },
      },
      // Course-wide flashcards (not tied to any single lecture).
      flashcards: {
        where: { lectureId: null },
        orderBy: { order: "asc" },
      },
      questions: true,
    },
  });
  if (!course) notFound();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, phone: true },
  });

  const lectureIds = course.lectures.map((l) => l.id);
  const progress = lectureIds.length
    ? await prisma.lectureProgress.findMany({
        where: { userId: user.id, lectureId: { in: lectureIds } },
        select: { lectureId: true },
      })
    : [];
  const completed = progress.map((p) => p.lectureId);

  // Strip correctAnswer before sending questions to the client
  const lectureQuestions: Record<string, QuizQuestion[]> = {};
  const courseQuestions: QuizQuestion[] = [];
  for (const q of course.questions) {
    const safe: QuizQuestion = {
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: (q.options as string[] | null) ?? null,
      points: q.points,
    };
    if (q.lectureId) {
      (lectureQuestions[q.lectureId] ??= []).push(safe);
    } else {
      courseQuestions.push(safe);
    }
  }

  const lectures = course.lectures.map((l) => ({
    id: l.id,
    title: l.title,
    hasVideo: Boolean(l.videoUrl || l.videoPublicId),
    hasPdf: Boolean(l.pdfUrl || l.pdfPublicId),
    hasFlashcards: l.flashcards.length > 0,
    duration: l.duration,
  }));

  const lectureFlashcards: Record<
    string,
    { id: string; front: string; back: string; hint: string | null }[]
  > = {};
  for (const l of course.lectures) {
    if (l.flashcards.length > 0) {
      lectureFlashcards[l.id] = l.flashcards.map((f) => ({
        id: f.id,
        front: f.front,
        back: f.back,
        hint: f.hint,
      }));
    }
  }

  // Flashcards that cover the whole course, plus every lecture's cards combined,
  // so a student can study the entire course deck in one place.
  const courseWideCards = course.flashcards.map((f) => ({
    id: f.id,
    front: f.front,
    back: f.back,
    hint: f.hint,
  }));
  const courseFlashcards = [
    ...courseWideCards,
    ...course.lectures.flatMap((l) => lectureFlashcards[l.id] ?? []),
  ];

  const watermark = `${dbUser?.name ?? user.name ?? ""}\n${dbUser?.phone ?? ""}`;

  return (
    <div className="container py-6">
      <LearnClient
        courseId={course.id}
        courseTitle={pick(locale, course.titleEn, course.titleAr)}
        lectures={lectures}
        lectureQuestions={lectureQuestions}
        lectureFlashcards={lectureFlashcards}
        courseQuestions={courseQuestions}
        courseFlashcards={courseFlashcards}
        initialCompleted={completed}
        watermark={watermark}
      />
    </div>
  );
}
