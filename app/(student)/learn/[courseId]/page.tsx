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
      lectures: { orderBy: { order: "asc" } },
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
    duration: l.duration,
  }));

  const watermark = `${dbUser?.name ?? user.name ?? ""}\n${dbUser?.phone ?? ""}`;

  return (
    <div className="container py-6">
      <LearnClient
        courseId={course.id}
        courseTitle={pick(locale, course.titleEn, course.titleAr)}
        lectures={lectures}
        lectureQuestions={lectureQuestions}
        courseQuestions={courseQuestions}
        initialCompleted={completed}
        watermark={watermark}
      />
    </div>
  );
}
