import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, Plus, Users } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/instructor/profile-form";
import { pick } from "@/lib/i18n-helpers";

async function getCourses(instructorId: string) {
  try {
    return await prisma.course.findMany({
      where: { instructorId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: { select: { lectures: true, enrollments: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function InstructorHome() {
  const user = await requireRole("INSTRUCTOR");
  const t = await getTranslations("instructor");
  const locale = await getLocale();
  const courses = await getCourses(user.id);
  const profile = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: { name: true, image: true, bio: true },
    })
    .catch(() => null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("myCourses")}</p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="h-4 w-4" />
            {t("newCourse")}
          </Link>
        </Button>
      </div>

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

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("myCourses")}</p>
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
    </div>
  );
}
