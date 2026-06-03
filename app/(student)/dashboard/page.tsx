import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { GraduationCap } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { pick } from "@/lib/i18n-helpers";

async function getEnrollments(userId: string) {
  try {
    const enrollments = await prisma.enrollment.findMany({
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
    });

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
    return { enrollments, completedMap };
  } catch {
    return { enrollments: [], completedMap: new Map<string, number>() };
  }
}

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const { enrollments, completedMap } = await getEnrollments(user.id);

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

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
          {enrollments.map((e) => {
            const total = e.course._count.lectures;
            const completed = completedMap.get(e.courseId) ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const title = pick(locale, e.course.titleEn, e.course.titleAr);
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
                    <Link href={`/learn/${e.courseId}`}>{t("continue")}</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
