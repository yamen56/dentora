import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HeartPulse,
  Layers,
  LineChart,
  Microscope,
  Brain,
  PlayCircle,
  Search,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CourseCard } from "@/components/course-card";
import { HeroGraph } from "@/components/hero-graph";
import { categoryName } from "@/lib/i18n-helpers";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const categoryIcons = [
  Brain,
  Stethoscope,
  Microscope,
  HeartPulse,
  BookOpen,
  ClipboardCheck,
];

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
    prisma.category
      .findMany({
        orderBy: { nameEn: "asc" },
        include: {
          _count: {
            select: { courses: { where: { isPublished: true } } },
          },
        },
      })
      .catch(() => []),
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
    { icon: Layers, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: ShieldCheck, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: TrendingUp, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: ClipboardCheck, title: t("feature4Title"), desc: t("feature4Desc") },
    { icon: Stethoscope, title: t("feature5Title"), desc: t("feature5Desc") },
    { icon: Users, title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const insideItems = [
    { icon: PlayCircle, title: t("inside1Title"), desc: t("inside1Desc") },
    { icon: FileText, title: t("inside2Title"), desc: t("inside2Desc") },
    { icon: ClipboardCheck, title: t("inside3Title"), desc: t("inside3Desc") },
    { icon: TrendingUp, title: t("inside4Title"), desc: t("inside4Desc") },
  ];

  const usmleItems = [
    { icon: GraduationCap, title: t("usmle1Title"), desc: t("usmle1Desc") },
    { icon: Layers, title: t("usmle2Title"), desc: t("usmle2Desc") },
    { icon: Brain, title: t("usmle3Title"), desc: t("usmle3Desc") },
  ];

  const instructorBenefits = [
    { icon: Upload, title: t("teach1Title"), desc: t("teach1Desc") },
    { icon: ShieldCheck, title: t("teach2Title"), desc: t("teach2Desc") },
    { icon: LineChart, title: t("teach3Title"), desc: t("teach3Desc") },
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

  const faqs = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`faq${i}Q`),
    a: t(`faq${i}A`),
  }));

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/40 to-background">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(60% 60% at 50% 0%, hsl(var(--primary)/0.14), transparent)",
          }}
        />
        <div className="container grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-start">
            <Badge variant="secondary" className="px-4 py-1">
              {t("heroBadge")}
            </Badge>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {t("heroTitle1")}
              <span className="block text-primary">
                {t("heroTitleAccent")}
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg">
                <Link href="/courses">
                  {t("browseCourses")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">{t("heroJoin")}</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t("heroNote")}</p>
          </div>

          {/* Knowledge graph: two curricula weaving into one source */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="relative h-[430px] overflow-hidden rounded-2xl border bg-card shadow-lg">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(70% 70% at 72% 50%, hsl(var(--primary)/0.06), transparent)",
                }}
              />
              <HeroGraph
                labels={{
                  uni: t("heroGraphUni"),
                  step1: t("heroGraphStep1"),
                  one: t("heroGraphOne"),
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto — the no-memorization rule, stated once, loudly */}
      <section className="border-b bg-foreground text-background">
        <div className="container py-14 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-background/60 rtl:tracking-normal">
            {t("manifestoKicker")}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-2xl font-bold leading-snug sm:text-3xl">
            {t("manifestoLine")}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-background/70">
            {t("manifestoSub")}
          </p>
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
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">{t("featuresTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("featuresSubtitle")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Inside every course */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">{t("insideTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("insideSubtitle")}</p>
            <div className="mt-8 space-y-6">
              {insideItems.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz mock */}
          <div
            className="mx-auto hidden w-full max-w-md lg:block"
            aria-hidden="true"
          >
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">
                    {t("insideMockTitle")}
                  </p>
                </div>
                <Badge variant="outline">2 / 10</Badge>
              </div>
              <p className="mt-5 font-medium">{t("insideMockQ")}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 px-4 py-3 text-sm font-medium">
                  <span>{t("insideMockA1")}</span>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
                  {t("insideMockA2")}
                </div>
                <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
                  {t("insideMockA3")}
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <div className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  {t("insideMockNext")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USMLE bridge — the Step 1 breakdown at the end of every lecture */}
      <section className="relative overflow-hidden border-t bg-accent/30 py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(55% 55% at 85% 15%, hsl(var(--primary)/0.10), transparent)",
          }}
        />
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <div className="lg:order-last">
            <Badge variant="secondary" className="px-3 py-1">
              {t("usmleBadge")}
            </Badge>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              {t("usmleTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("usmleSubtitle")}</p>
            <div className="mt-8 space-y-6">
              {usmleItems.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coverage map: two curricula merged into one source */}
          <div className="mx-auto w-full max-w-md lg:order-first">
            <div className="rounded-2xl border bg-card p-6 shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border bg-background p-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold leading-snug">
                    {t("coverageUni")}
                  </p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <GraduationCap className="h-5 w-5 text-secondary" />
                  <p className="mt-2 text-sm font-semibold leading-snug">
                    {t("coverageStep1")}
                  </p>
                </div>
              </div>

              <svg
                viewBox="0 0 200 36"
                preserveAspectRatio="none"
                className="mx-auto h-9 w-full text-border"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M50 0 C 50 22, 100 14, 100 36"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M150 0 C 150 22, 100 14, 100 36"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-semibold">{t("coverageMerged")}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("coverageMergedDesc")}
                </p>
              </div>

              <svg
                viewBox="0 0 200 24"
                preserveAspectRatio="none"
                className="mx-auto h-6 w-full text-border"
                aria-hidden="true"
                fill="none"
              >
                <path d="M100 0 V 24" stroke="currentColor" strokeWidth="1.5" />
              </svg>

              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("coverageExamUni")}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <span>{t("coverageExamBoard")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-t py-16">
          <div className="container">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold">{t("categoriesTitle")}</h2>
              <p className="mt-2 text-muted-foreground">
                {t("categoriesSubtitle")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((c, i) => {
                const Icon = categoryIcons[i % categoryIcons.length];
                return (
                  <Link
                    key={c.id}
                    href={`/courses?category=${c.slug}`}
                    className="group"
                  >
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {categoryName(locale, c)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("categoryCourses", { count: c._count.courses })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured courses */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
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
        </div>
      </section>

      {/* How it works */}
      <section className="border-t py-16">
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
        <section className="border-t bg-muted/30 py-16">
          <div className="container">
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
          </div>
        </section>
      )}

      {/* For instructors */}
      <section className="border-t bg-accent/40 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold">{t("teachTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("teachSubtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {instructorBenefits.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border bg-card p-6 text-card-foreground"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/register">
                {t("teachCta")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t py-16">
        <div className="container max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold">{t("faqTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("faqSubtitle")}</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(50% 80% at 80% 0%, hsl(0 0% 100%/0.25), transparent), radial-gradient(40% 60% at 10% 100%, hsl(0 0% 100%/0.15), transparent)",
              }}
            />
            <div className="relative">
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
        </div>
      </section>
    </div>
  );
}
