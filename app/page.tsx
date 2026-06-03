import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Globe,
  PlayCircle,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseCard } from "@/components/course-card";
import { categoryName } from "@/lib/i18n-helpers";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [
    courses,
    categories,
    instructors,
    courseCount,
    instructorCount,
    enrollmentCount,
    lectureCount,
  ] = await Promise.all([
    prisma.course
      .findMany({
        where: { isPublished: true },
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          instructor: { select: { name: true } },
          _count: { select: { lectures: true, enrollments: true } },
        },
      })
      .catch(() => []),
    prisma.category.findMany({ orderBy: { nameEn: "asc" } }).catch(() => []),
    prisma.user
      .findMany({
        where: {
          role: "INSTRUCTOR",
          instructorStatus: "APPROVED",
          isActive: true,
        },
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          bio: true,
          image: true,
          _count: { select: { courses: { where: { isPublished: true } } } },
        },
      })
      .catch(() => []),
    prisma.course.count({ where: { isPublished: true } }).catch(() => 0),
    prisma.user
      .count({ where: { role: "INSTRUCTOR", instructorStatus: "APPROVED" } })
      .catch(() => 0),
    prisma.enrollment.count().catch(() => 0),
    prisma.lecture.count().catch(() => 0),
  ]);

  return {
    courses,
    categories,
    instructors,
    stats: { courseCount, instructorCount, enrollmentCount, lectureCount },
  };
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const { courses, categories, instructors, stats } = await getHomeData();

  const features = [
    { icon: Globe, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: ShieldCheck, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: TrendingUp, title: t("feature3Title"), desc: t("feature3Desc") },
  ];

  const steps = [
    { icon: Search, title: t("step1Title"), desc: t("step1Desc") },
    { icon: UserCheck, title: t("step2Title"), desc: t("step2Desc") },
    { icon: PlayCircle, title: t("step3Title"), desc: t("step3Desc") },
  ];

  const statItems = [
    { icon: BookOpen, label: t("statsCourses"), value: stats.courseCount },
    {
      icon: GraduationCap,
      label: t("statsInstructors"),
      value: stats.instructorCount,
    },
    { icon: Users, label: t("statsStudents"), value: stats.enrollmentCount },
    { icon: PlayCircle, label: t("statsLectures"), value: stats.lectureCount },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary)/0.12), transparent)",
          }}
        />
        <div className="container flex flex-col items-center gap-6 py-24 text-center">
          <Badge variant="secondary" className="px-4 py-1">
            {tc("tagline")}
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/courses">
                {t("browseCourses")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">{t("becomeInstructor")}</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{t("heroNote")}</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="container grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <s.icon className="mb-2 h-6 w-6 text-primary" />
              <span className="text-3xl font-bold">{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t("featuresTitle")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-6 text-card-foreground transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-t bg-muted/30 py-16">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">{t("categoriesTitle")}</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link key={c.id} href={`/courses?category=${c.slug}`}>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    {categoryName(locale, c)}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured courses */}
      <section className="container py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("popularCourses")}</h2>
          <Button asChild variant="ghost">
            <Link href="/courses">
              {t("viewAll")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
        {courses.length === 0 ? (
          <p className="text-muted-foreground">{tc("comingSoon")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold">{t("howTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("howSubtitle")}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center text-center">
                <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <s.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -end-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold">{s.title}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors */}
      {instructors.length > 0 && (
        <section className="container py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">{t("instructorsTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("instructorsSubtitle")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {instructors.map((ins) => (
              <div
                key={ins.id}
                className="flex flex-col items-center rounded-xl border bg-card p-6 text-center text-card-foreground transition-shadow hover:shadow-md"
              >
                <Avatar className="h-20 w-20">
                  {ins.image && <AvatarImage src={ins.image} alt={ins.name} />}
                  <AvatarFallback className="text-lg">
                    {initials(ins.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 font-semibold">{ins.name}</h3>
                <p className="mt-1 text-xs text-primary">
                  {t("instructorCourses", { count: ins._count.courses })}
                </p>
                {ins.bio && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {ins.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              {t("ctaSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/courses">
                  {t("browseCourses")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/register">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
