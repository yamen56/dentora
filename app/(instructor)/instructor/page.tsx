import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  Users,
} from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ProfileForm } from "@/components/instructor/profile-form";
import { DocumentsPanel } from "@/components/instructor/documents-panel";
import { StudentActions } from "@/components/instructor/student-actions";
import { pick } from "@/lib/i18n-helpers";

async function getData(instructorId: string) {
  try {
    const [courses, quizAttemptCount, enrollments, progress, recentQuiz] =
      await Promise.all([
        prisma.course.findMany({
          where: { instructorId },
          orderBy: { createdAt: "desc" },
          include: {
            category: true,
            _count: { select: { lectures: true, enrollments: true } },
          },
        }),
        prisma.quizAttempt.count({
          where: { course: { instructorId } },
        }),
        prisma.enrollment.findMany({
          where: { course: { instructorId } },
          orderBy: { enrolledAt: "desc" },
          take: 100,
          include: {
            user: { select: { name: true, email: true } },
            course: {
              select: {
                id: true,
                titleEn: true,
                titleAr: true,
                _count: { select: { lectures: true } },
              },
            },
          },
        }),
        prisma.lectureProgress.findMany({
          where: { lecture: { course: { instructorId } } },
          select: { userId: true, lecture: { select: { courseId: true } } },
        }),
        prisma.quizAttempt.findMany({
          where: { course: { instructorId } },
          orderBy: { submittedAt: "desc" },
          take: 8,
          include: {
            user: { select: { name: true } },
            course: { select: { titleEn: true, titleAr: true } },
          },
        }),
      ]);

    // completed-lecture count per (student, course)
    const doneMap = new Map<string, number>();
    for (const p of progress) {
      const key = `${p.userId}:${p.lecture.courseId}`;
      doneMap.set(key, (doneMap.get(key) ?? 0) + 1);
    }
    const students = enrollments.map((e) => {
      const total = e.course._count.lectures;
      const completed = Math.min(
        doneMap.get(`${e.userId}:${e.courseId}`) ?? 0,
        total,
      );
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: e.id,
        userName: e.user.name,
        userEmail: e.user.email,
        courseTitleEn: e.course.titleEn,
        courseTitleAr: e.course.titleAr,
        completed,
        total,
        pct,
        enrolledAt: e.enrolledAt,
      };
    });

    // Fetched separately so a missing table (pre-migration) degrades gracefully.
    const documents = await prisma.instructorDocument
      .findMany({
        where: { instructorId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      })
      .catch(() => []);
    return { courses, quizAttemptCount, documents, students, recentQuiz };
  } catch {
    return {
      courses: [],
      quizAttemptCount: 0,
      documents: [],
      students: [],
      recentQuiz: [],
    };
  }
}

export default async function InstructorHome() {
  const user = await requireRole("INSTRUCTOR");
  const t = await getTranslations("instructor");
  const td = await getTranslations("docs");
  const locale = await getLocale();
  const { courses, quizAttemptCount, documents, students, recentQuiz } =
    await getData(user.id);

  const fmtDate = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  );
  const profile = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: { name: true, image: true, bio: true },
    })
    .catch(() => null);

  const totalStudents = courses.reduce((s, c) => s + c._count.enrollments, 0);
  const publishedCount = courses.filter((c) => c.isPublished).length;

  const stats = [
    { icon: BookOpen, label: t("statsCourses"), value: courses.length },
    { icon: CheckCircle2, label: t("statsPublished"), value: publishedCount },
    { icon: Users, label: t("statsStudents"), value: totalStudents },
    {
      icon: ClipboardCheck,
      label: t("statsQuizAttempts"),
      value: quizAttemptCount,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("welcome", { name: profile?.name ?? user.name ?? "" })}
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="h-4 w-4" />
            {t("newCourse")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight sm:text-2xl">
                  {s.value}
                </p>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="courses">{t("myCourses")}</TabsTrigger>
          <TabsTrigger value="students">
            {t("students")}
            {students.length > 0 && (
              <Badge variant="secondary" className="ms-2">
                {students.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">{td("title")}</TabsTrigger>
          <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="pt-4">
          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("noCoursesYet")}</p>
                <Button asChild>
                  <Link href="/instructor/courses/new">
                    <Plus className="h-4 w-4" />
                    {t("createCourse")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <Link key={c.id} href={`/instructor/courses/${c.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-lg">
                          {pick(locale, c.titleEn, c.titleAr)}
                        </CardTitle>
                        <Badge variant={c.isPublished ? "success" : "secondary"}>
                          {c.isPublished ? t("published") : t("unpublished")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {c._count.lectures}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {c._count.enrollments}
                      </span>
                      <Badge variant="outline">
                        {pick(locale, c.category.nameEn, c.category.nameAr)}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("enrolledStudents")}</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground">{t("noStudents")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("quizStudent")}</TableHead>
                        <TableHead>{t("studentCourse")}</TableHead>
                        <TableHead className="min-w-[10rem]">
                          {t("studentProgress")}
                        </TableHead>
                        <TableHead className="text-end">
                          {t("studentJoined")}
                        </TableHead>
                        <TableHead className="text-end">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">{s.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.userEmail}
                            </div>
                          </TableCell>
                          <TableCell>
                            {pick(locale, s.courseTitleEn, s.courseTitleAr)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={s.pct} />
                              <p className="text-xs text-muted-foreground">
                                {s.pct}% · {s.completed}/{s.total}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-end text-sm text-muted-foreground">
                            {fmtDate.format(s.enrolledAt)}
                          </TableCell>
                          <TableCell className="text-end">
                            <StudentActions
                              enrollmentId={s.id}
                              name={s.userName}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {t("quizResults")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuiz.length === 0 ? (
                <p className="text-muted-foreground">{t("noQuizAttempts")}</p>
              ) : (
                <div className="divide-y">
                  {recentQuiz.map((a) => {
                    const pctScore =
                      a.totalQuestions > 0
                        ? Math.round((a.score / a.totalQuestions) * 100)
                        : 0;
                    return (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{a.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pick(locale, a.course.titleEn, a.course.titleAr)} ·{" "}
                            {a.lectureId
                              ? t("quizLecture")
                              : t("quizWholeCourse")}{" "}
                            · {fmtDate.format(a.submittedAt)}
                          </p>
                        </div>
                        <Badge
                          variant={pctScore >= 50 ? "success" : "destructive"}
                        >
                          {a.score}/{a.totalQuestions}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DocumentsPanel
            documents={documents.map((d) => ({
              id: d.id,
              title: d.title,
              updated: fmtDate.format(d.updatedAt),
            }))}
          />
        </TabsContent>

        <TabsContent value="profile" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("profile")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm
                name={profile?.name ?? user.name ?? ""}
                image={profile?.image ?? ""}
                bio={profile?.bio ?? ""}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
