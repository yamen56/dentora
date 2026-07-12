import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, FileText, GraduationCap, Lock, PlayCircle, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getApplication, isEnrolled } from "@/lib/enroll";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyButton } from "@/components/apply-button";
import { LecturePreviewDialog } from "@/components/lecture-preview-dialog";
import { pick } from "@/lib/i18n-helpers";
import { formatDuration, jsonLdString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const locale = await getLocale();
  const course = await prisma.course
    .findFirst({
      where: { id: params.id, isPublished: true },
      select: {
        titleEn: true,
        titleAr: true,
        descriptionEn: true,
        descriptionAr: true,
        thumbnail: true,
      },
    })
    .catch(() => null);
  if (!course) return {};

  const title = pick(locale, course.titleEn, course.titleAr);
  const description = pick(
    locale,
    course.descriptionEn,
    course.descriptionAr,
  ).slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/courses/${params.id}` },
    openGraph: {
      title,
      description,
      url: `/courses/${params.id}`,
      ...(course.thumbnail ? { images: [course.thumbnail] } : {}),
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = await getLocale();
  const t = await getTranslations("course");
  const tc = await getTranslations("courses");
  const td = await getTranslations("difficulty");
  const tl = await getTranslations("language");

  const course = await prisma.course
    .findFirst({
      where: { id: params.id, isPublished: true },
      include: {
        category: true,
        instructor: { select: { name: true, bio: true } },
        lectures: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            duration: true,
            isPreview: true,
            examPeriod: true,
            videoUrl: true,
            pdfUrl: true,
          },
        },
        _count: {
          select: { lectures: true, enrollments: true, questions: true },
        },
      },
    })
    .catch(() => null);

  if (!course) notFound();

  const user = await getCurrentUser();
  const isStudent = user?.role === "STUDENT";
  const enrolled =
    user && isStudent ? await isEnrolled(user.id, course.id) : false;
  const application =
    user && isStudent && !enrolled
      ? await getApplication(user.id, course.id)
      : null;

  const totalDuration = course.lectures.reduce((s, l) => s + l.duration, 0);
  const title = pick(locale, course.titleEn, course.titleAr);
  const description = pick(locale, course.descriptionEn, course.descriptionAr);

  // Curriculum grouped by exam section, in exam order; unassigned last.
  const tp = await getTranslations("examPeriod");
  const periodOrder = ["FIRST", "SECOND", "MID", "FINAL", null] as const;
  const indexed = course.lectures.map((lecture, index) => ({ lecture, index }));
  const lectureGroups = periodOrder
    .map((period) => ({
      period,
      lectures: indexed.filter(({ lecture }) => lecture.examPeriod === period),
    }))
    .filter((g) => g.lectures.length > 0);
  // No headers when nothing is assigned yet — identical to the old layout.
  const showGroupHeaders =
    lectureGroups.length > 1 || lectureGroups[0]?.period != null;

  const previewWatermark = user
    ? [user.name, user.email].filter(Boolean).join("\n")
    : `Why Medicine\n${t("preview")}`;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://dentora-delta.vercel.app";
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: title,
    description: description.slice(0, 300),
    url: `${siteUrl}/courses/${course.id}`,
    ...(course.thumbnail ? { image: course.thumbnail } : {}),
    provider: {
      "@type": "EducationalOrganization",
      name: "Why Medicine",
      url: siteUrl,
    },
    instructor: { "@type": "Person", name: course.instructor.name },
    inLanguage: course.language === "AR" ? "ar" : "en",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      category: "Application-based enrollment",
    },
  };

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(courseJsonLd) }}
      />
      {/* Main */}
      <div className="space-y-6 lg:col-span-2">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {pick(locale, course.category.nameEn, course.category.nameAr)}
            </Badge>
            <Badge variant="outline">{tl(course.language)}</Badge>
            <Badge variant="outline">{td(course.difficulty)}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {tc("by")} {course.instructor.name}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course._count.lectures} {t("lecturesTab")}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course._count.enrollments}
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1">
                <PlayCircle className="h-4 w-4" />
                {formatDuration(totalDuration)}
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
            <TabsTrigger value="lectures">{t("lecturesTab")}</TabsTrigger>
            <TabsTrigger value="questions">{t("questionsTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold">{t("aboutCourse")}</h2>
            <p className="whitespace-pre-line text-muted-foreground">
              {description}
            </p>
            {course.instructor.bio && (
              <div className="pt-4">
                <h3 className="font-semibold">{t("instructor")}</h3>
                <p className="text-sm text-muted-foreground">
                  {course.instructor.bio}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="lectures" className="pt-4">
            <div className="space-y-2">
              {course.lectures.length === 0 ? (
                <p className="text-muted-foreground">{t("courseContent")}</p>
              ) : (
                lectureGroups.map((group) => (
                  <div key={group.period ?? "NONE"} className="space-y-2">
                    {showGroupHeaders && (
                      <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground rtl:tracking-normal">
                        {tp(group.period ?? "NONE")}
                      </p>
                    )}
                    {group.lectures.map(({ lecture: l, index: i }) => {
                      const open = enrolled || l.isPreview;
                      const row = (
                        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
                          <span className="w-6 text-center text-sm text-muted-foreground">
                            {i + 1}
                          </span>
                          {open ? (
                            <PlayCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="flex-1 truncate">{l.title}</span>
                          {l.pdfUrl && (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          {l.isPreview && !enrolled && (
                            <Badge variant="outline">{t("preview")}</Badge>
                          )}
                          {l.duration > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(l.duration)}
                            </span>
                          )}
                        </div>
                      );
                      // Preview lectures with a video play in place — even for
                      // visitors without an account.
                      return l.isPreview && l.videoUrl ? (
                        <LecturePreviewDialog
                          key={l.id}
                          lectureId={l.id}
                          title={l.title}
                          watermark={previewWatermark}
                        >
                          {row}
                        </LecturePreviewDialog>
                      ) : (
                        <div key={l.id}>{row}</div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="pt-4">
            <p className="text-muted-foreground">
              {course._count.questions} {t("questionsTab")} ·{" "}
              {enrolled ? t("courseContent") : t("enrollToAccess")}
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div>
        <Card className="sticky top-20 overflow-hidden">
          <div className="relative aspect-video w-full bg-muted">
            {course.thumbnail ? (
              <Image
                src={course.thumbnail}
                alt={title}
                fill
                sizes="400px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
                <GraduationCap className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>
          <CardContent className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold">{t("accessTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {enrolled ? t("youHaveAccess") : t("accessSubtitle")}
              </p>
            </div>
            <ApplyButton
              courseId={course.id}
              isEnrolled={enrolled}
              isLoggedIn={Boolean(user)}
              isStudent={isStudent}
              applicationStatus={application?.status ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
