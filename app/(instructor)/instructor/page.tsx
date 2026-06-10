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
import { ProfileForm } from "@/components/instructor/profile-form";
import { pick } from "@/lib/i18n-helpers";

async function getData(instructorId: string) {
  try {
    const [courses, quizAttemptCount] = await Promise.all([
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
    ]);
    return { courses, quizAttemptCount };
  } catch {
    return { courses: [], quizAttemptCount: 0 };
  }
}

export default async function InstructorHome() {
  const user = await requireRole("INSTRUCTOR");
  const t = await getTranslations("instructor");
  const locale = await getLocale();
  const { courses, quizAttemptCount } = await getData(user.id);
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
