import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CourseForm } from "@/components/instructor/course-form";
import { LectureManager } from "@/components/instructor/lecture-manager";
import { QuestionManager } from "@/components/instructor/question-manager";
import { FlashcardManager } from "@/components/instructor/flashcard-manager";
import { CourseActions } from "@/components/instructor/course-actions";
import { StudentActions } from "@/components/instructor/student-actions";
import { pick } from "@/lib/i18n-helpers";

export default async function ManageCoursePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("INSTRUCTOR");
  const t = await getTranslations("instructor");
  const tf = await getTranslations("flashcards");
  const locale = await getLocale();

  const course = await prisma.course
    .findFirst({
      where: { id: params.id, instructorId: user.id },
      include: {
        category: true,
        lectures: { orderBy: { order: "asc" } },
        questions: { orderBy: { createdAt: "asc" } },
        enrollments: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
                university: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
        _count: { select: { enrollments: true, lectures: true } },
      },
    })
    .catch(() => null);

  if (!course) notFound();

  const categories = await prisma.category
    .findMany({ orderBy: { nameEn: "asc" } })
    .catch(() => []);

  const flashcards = await prisma.flashcard
    .findMany({
      where: { courseId: course.id },
      orderBy: [{ lectureId: "asc" }, { order: "asc" }],
      select: { id: true, front: true, back: true, hint: true, lectureId: true },
    })
    .catch(
      () =>
        [] as {
          id: string;
          front: string;
          back: string;
          hint: string | null;
          lectureId: string | null;
        }[],
    );

  // Completion analytics
  const lectureIds = course.lectures.map((l) => l.id);
  const progressGroups = lectureIds.length
    ? await prisma.lectureProgress
        .groupBy({
          by: ["lectureId"],
          where: { lectureId: { in: lectureIds } },
          _count: { _all: true },
        })
        .catch(() => [] as { lectureId: string; _count: { _all: number } }[])
    : [];
  const progressMap = new Map(
    progressGroups.map((g) => [g.lectureId, g._count._all]),
  );
  const enrollCount = course._count.enrollments;

  // Quiz analytics
  const quizAttempts = await prisma.quizAttempt
    .findMany({
      where: { courseId: course.id },
      orderBy: { submittedAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    })
    .catch(() => []);
  const scored = quizAttempts.filter((a) => a.totalQuestions > 0);
  const avgQuizPct = scored.length
    ? Math.round(
        scored.reduce((s, a) => s + a.score / a.totalQuestions, 0) /
          scored.length *
          100,
      )
    : null;
  const lectureTitleMap = new Map(course.lectures.map((l) => [l.id, l.title]));

  const fmtDate = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  );

  const formCourse = {
    id: course.id,
    titleEn: course.titleEn,
    titleAr: course.titleAr,
    descriptionEn: course.descriptionEn,
    descriptionAr: course.descriptionAr,
    categoryId: course.categoryId,
    language: course.language,
    // Map any legacy level to the current options the form supports.
    difficulty: (course.difficulty === "COMPLETE" ? "COMPLETE" : "INTENSIVE") as
      | "INTENSIVE"
      | "COMPLETE",
    thumbnail: course.thumbnail ?? "",
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/instructor">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("myCourses")}
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {pick(locale, course.titleEn, course.titleAr)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pick(locale, course.category.nameEn, course.category.nameAr)}
          </p>
        </div>
        <CourseActions courseId={course.id} isPublished={course.isPublished} />
      </div>

      <Tabs defaultValue="lectures">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="details">{t("courseDetails")}</TabsTrigger>
          <TabsTrigger value="lectures">{t("lectures")}</TabsTrigger>
          <TabsTrigger value="questions">{t("questions")}</TabsTrigger>
          <TabsTrigger value="flashcards">{tf("title")}</TabsTrigger>
          <TabsTrigger value="students">{t("students")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <CourseForm categories={categories} course={formCourse} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lectures" className="pt-4">
          <LectureManager
            courseId={course.id}
            initialLectures={course.lectures}
          />
        </TabsContent>

        <TabsContent value="questions" className="pt-4">
          <QuestionManager
            courseId={course.id}
            lectures={course.lectures.map((l) => ({
              id: l.id,
              title: l.title,
            }))}
            initialQuestions={course.questions.map((q) => ({
              id: q.id,
              type: q.type,
              questionText: q.questionText,
              options: (q.options as string[] | null) ?? null,
              correctAnswer: q.correctAnswer,
              points: q.points,
              lectureId: q.lectureId,
            }))}
          />
        </TabsContent>

        <TabsContent value="flashcards" className="pt-4">
          <FlashcardManager
            courseId={course.id}
            lectures={course.lectures.map((l) => ({
              id: l.id,
              title: l.title,
            }))}
            initialFlashcards={flashcards}
          />
        </TabsContent>

        <TabsContent value="students" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("enrolledStudents")} ({enrollCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {course.enrollments.length === 0 ? (
                <p className="text-muted-foreground">{t("noStudents")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead className="text-end">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {course.enrollments.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {e.user.name}
                        </TableCell>
                        <TableCell>{e.user.email}</TableCell>
                        <TableCell>{e.user.phone ?? "-"}</TableCell>
                        <TableCell>{e.user.university ?? "-"}</TableCell>
                        <TableCell className="text-end">
                          <StudentActions
                            enrollmentId={e.id}
                            name={e.user.name}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("totalEnrollments")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{enrollCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("lectures")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{course.lectures.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("questions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{course.questions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("avgQuizScore")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {avgQuizPct === null ? "-" : `${avgQuizPct}%`}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("perLectureCompletion")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.lectures.length === 0 ? (
                <p className="text-muted-foreground">{t("noLectures")}</p>
              ) : (
                course.lectures.map((l) => {
                  const completed = progressMap.get(l.id) ?? 0;
                  const pct =
                    enrollCount > 0
                      ? Math.round((completed / enrollCount) * 100)
                      : 0;
                  return (
                    <div key={l.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{l.title}</span>
                        <span className="text-muted-foreground">
                          {completed}/{enrollCount} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("quizResults")}</CardTitle>
            </CardHeader>
            <CardContent>
              {quizAttempts.length === 0 ? (
                <p className="text-muted-foreground">{t("noQuizAttempts")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("quizStudent")}</TableHead>
                      <TableHead>{t("quizScope")}</TableHead>
                      <TableHead>{t("quizScore")}</TableHead>
                      <TableHead className="text-end">
                        {t("quizDate")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizAttempts.map((a) => {
                      const pct =
                        a.totalQuestions > 0
                          ? Math.round((a.score / a.totalQuestions) * 100)
                          : 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="font-medium">{a.user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {a.user.email}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[14rem] truncate">
                            {a.lectureId
                              ? lectureTitleMap.get(a.lectureId) ??
                                t("quizLecture")
                              : t("quizWholeCourse")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={pct >= 50 ? "success" : "destructive"}
                            >
                              {a.score}/{a.totalQuestions}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-end text-sm text-muted-foreground">
                            {fmtDate.format(a.submittedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
