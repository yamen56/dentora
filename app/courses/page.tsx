import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { CourseFilters } from "@/components/course-filters";
import { CourseCard } from "@/components/course-card";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  category?: string;
  language?: string;
  difficulty?: string;
}

async function getData(sp: SearchParams) {
  const where: Prisma.CourseWhereInput = { isPublished: true };

  if (sp.category) where.category = { slug: sp.category };
  if (sp.language === "EN" || sp.language === "AR") where.language = sp.language;
  if (
    sp.difficulty === "BEGINNER" ||
    sp.difficulty === "INTERMEDIATE" ||
    sp.difficulty === "ADVANCED"
  ) {
    where.difficulty = sp.difficulty;
  }

  if (sp.q) {
    where.OR = [
      { titleEn: { contains: sp.q, mode: "insensitive" } },
      { titleAr: { contains: sp.q } },
      { descriptionEn: { contains: sp.q, mode: "insensitive" } },
      { descriptionAr: { contains: sp.q } },
    ];
  }

  try {
    const [courses, categories] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          instructor: { select: { name: true } },
          _count: { select: { lectures: true, enrollments: true } },
        },
      }),
      prisma.category.findMany({ orderBy: { nameEn: "asc" } }),
    ]);
    return { courses, categories };
  } catch {
    return { courses: [], categories: [] };
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations("courses");
  const { courses, categories } = await getData(searchParams);

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">{t("catalogTitle")}</h1>
        <p className="text-muted-foreground">{t("catalogSubtitle")}</p>
      </div>

      <CourseFilters categories={categories} />

      {courses.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          {t("noCourses")}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
