import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { quizSubmitSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (user.role !== "STUDENT") return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const parsed = quizSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "validation", issues: parsed.error.flatten() }, 400);
  }
  const { courseId, lectureId, answers } = parsed.data;

  if (!(await isEnrolled(user.id, courseId))) {
    return json({ error: "forbidden" }, 403);
  }

  const questions = await prisma.question.findMany({
    where: { courseId, ...(lectureId ? { lectureId } : {}) },
  });
  if (questions.length === 0) return json({ error: "noQuestions" }, 400);

  let score = 0;
  let totalPoints = 0;
  const results = questions.map((q) => {
    totalPoints += q.points;
    const given = (answers[q.id] ?? "").trim();
    const correct =
      q.type === "MCQ"
        ? given === q.correctAnswer
        : given.toLowerCase() === q.correctAnswer.trim().toLowerCase();
    if (correct) score += q.points;
    return { questionId: q.id, correct, correctAnswer: q.correctAnswer };
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      courseId,
      lectureId: lectureId ?? null,
      answers,
      score,
      totalQuestions: questions.length,
    },
  });

  return json({
    score,
    total: totalPoints,
    totalQuestions: questions.length,
    results,
    attemptId: attempt.id,
  });
}
