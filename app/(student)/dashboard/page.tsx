import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  GraduationCap,
  PlayCircle,
  TrendingUp,
} from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CourseCard } from "@/components/course-card";
import { pick } from "@/lib/i18n-helpers";

async function getData(userId: string) {
  try {
    const [enrollments, applications, quizAttempts] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId },
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            include: {
              category: true,
              instructor: { select: { name: true } },
              _count: { select: { lectures: true } },
            },
          },
        },
      }),
      prisma.courseApplication.findMany({
        where: { userId, status: { in: ["PENDING", "REJECTED"] } },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, titleEn: true, titleAr: true } },
        },
      }),
      prisma.quizAttempt.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          course: { select: { titleEn: true, titleAr: true } },
          // lectureId only — lecture title isn't needed for the summary row
        },
      }),
    ]);

    const courseIds = enrollments.map((e) => e.courseId);
    const progress = courseIds.length
      ? await prisma.lectureProgress.findMany({
          where: { userId, lecture: { courseId: { in: courseIds } } },
          select: { lecture: { select: { courseId: true } } },
        })
      : [];

    const completedMap = new Map<string, number>();
    for (const p of progress) {
      const cid = p.lecture.courseId;
      completedMap.set(cid, (completedMap.get(cid) ?? 0) + 1);
    }

    const quizCount = await prisma.quizAttempt
      .count({ where: { userId } })
      .catch(() => quizAttempts.length);

    // Recommend a few published courses the student hasn't enrolled in / applied to.
    const excludeIds = [
      ...enrollments.map((e) => e.courseId),
      ...applications.map((a) => a.course.id),
    ];
    const recommended = await prisma.course.findMany({
      where: {
        isPublished: true,
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        category: true,
        instructor: { select: { name: true } },
        _count: { select: { lectures: true, enrollments: true } },
      },
    });

    return {
      enrollments,
      applications,
      quizAttempts,
      quizCount,
      completedMap,
      recommended,
    };
  } catch {
    return {
      enrollments: [],
      applications: [],
      quizAttempts: [],
      quizCount: 0,
      completedMap: new Map<string, number>(),
      recommended: [],
    };
  }
}

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const t = await getTranslations("dashboard");
  const tq = await getTranslations("quiz");
  const locale = await getLocale();
  const {
    enrollments,
    applications,
    quizAttempts,
    quizCount,
    completedMap,
    recommended,
  } = await getData(user.id);

  const fmtDate = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium" },
  );

  // Per-course progress + aggregates for the stats row
  const courseProgress = enrollments.map((e) => {
    const total = e.course._count.lectures;
    const completed = Math.min(completedMap.get(e.courseId) ?? 0, total);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { enrollment: e, total, completed, pct };
  });

  const lecturesDone = courseProgress.reduce((s, c) => s + c.completed, 0);
  const avgProgress = courseProgress.length
    ? Math.round(
        courseProgress.reduce((s, c) => s + c.pct, 0) / courseProgress.length,
      )
    : 0;

  // "Jump back in" = most recent course that isn't finished (enrollments are
  // already ordered newest-first, so the first match is the freshest).
  const resume = courseProgress.find((c) => c.pct < 100);

  const stats = [
    { icon: BookOpen, label: t("statsEnrolled"), value: enrollments.length },
    { icon: CheckCircle2, label: t("statsLecturesDone"), value: lecturesDone },
    {
      icon: TrendingUp,
      label: t("statsAvgProgress"),
      value: `${avgProgress}%`,
    },
    { icon: ClipboardCheck, label: t("statsQuizzes"), value: quizCount },
  ];

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t("welcome", { name: user.name ?? "" })}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
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

      {resume && (
        <Card className="overflow-hidden border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <PlayCircle className="h-4 w-4" />
                {t("jumpBackIn")}
              </div>
              <h3 className="truncate text-lg font-semibold">
                {pick(
                  locale,
                  resume.enrollment.course.titleEn,
                  resume.enrollment.course.titleAr,
                )}
              </h3>
              <div className="max-w-md space-y-1">
                <Progress value={resume.pct} />
                <p className="text-xs text-muted-foreground">
                  {t("progress", { percent: resume.pct })} · {resume.completed}/
                  {resume.total}
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/learn/${resume.enrollment.courseId}`}>
                {resume.completed > 0 ? t("continue") : t("start")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {applications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              {t("applicationsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("applicationsDesc")}
            </p>
            <div className="divide-y">
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/courses/${a.course.id}`}
                      className="font-medium hover:underline"
                    >
                      {pick(locale, a.course.titleEn, a.course.titleAr)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {t("appliedOn", { date: fmtDate.format(a.createdAt) })}
                    </p>
                  </div>
                  <Badge
                    variant={a.status === "PENDING" ? "warning" : "destructive"}
                  >
                    {a.status === "PENDING"
                      ? t("applicationPending")
                      : t("applicationRejected")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-xl font-semibold">{t("enrolledCourses")}</h2>
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t("noCourses")}</p>
              <Button asChild>
                <Link href="/courses">{t("browseCourses")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courseProgress.map(({ enrollment: e, total, completed, pct }) => {
              const title = pick(locale, e.course.titleEn, e.course.titleAr);
              const done = total > 0 && completed >= total;
              return (
                <Card key={e.id} className="overflow-hidden">
                  <div className="relative aspect-video w-full bg-muted">
                    {e.course.thumbnail ? (
                      <Image
                        src={e.course.thumbnail}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                        <GraduationCap className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    {done && (
                      <div className="absolute end-2 top-2">
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("completed")}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <h3 className="line-clamp-2 min-h-[2.5rem] font-semibold">
                      {title}
                    </h3>
                    <div className="space-y-1">
                      <Progress value={pct} />
                      <p className="text-xs text-muted-foreground">
                        {t("progress", { percent: pct })} · {completed}/{total}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button asChild className="w-full">
                      <Link href={`/learn/${e.courseId}`}>
                        {done ? t("review") : t("continue")}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {quizAttempts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              {t("recentQuizzes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {quizAttempts.map((a) => {
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
                      <p className="truncate font-medium">
                        {pick(locale, a.course.titleEn, a.course.titleAr)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.lectureId ? tq("lectureQuiz") : tq("courseQuiz")} ·{" "}
                        {fmtDate.format(a.submittedAt)}
                      </p>
                    </div>
                    <Badge variant={pctScore >= 50 ? "success" : "destructive"}>
                      {tq("scoreOf", {
                        score: a.score,
                        total: a.totalQuestions,
                      })}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {recommended.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">{t("exploreTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("exploreDesc")}</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  id: c.id,
                  titleEn: c.titleEn,
                  titleAr: c.titleAr,
                  thumbnail: c.thumbnail,
                  language: c.language,
                  difficulty: c.difficulty,
                  category: c.category,
                  instructor: c.instructor,
                  _count: c._count,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
