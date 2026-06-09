"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, BookOpen, GraduationCap, Star, Users } from "lucide-react";

import type { Difficulty } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { pick } from "@/lib/i18n-helpers";

export interface CourseCardData {
  id: string;
  titleEn: string;
  titleAr: string;
  thumbnail: string | null;
  language: "EN" | "AR";
  difficulty: Difficulty;
  category: { nameEn: string; nameAr: string };
  instructor: { name: string };
  _count?: { lectures: number; enrollments: number };
}

export function CourseCard({
  course,
  href,
}: {
  course: CourseCardData;
  href?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("courses");
  const td = useTranslations("difficulty");
  const tl = useTranslations("language");

  const title = pick(locale, course.titleEn, course.titleAr);
  const category = pick(locale, course.category.nameEn, course.category.nameAr);

  return (
    <Link href={href ?? `/courses/${course.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <GraduationCap className="h-12 w-12 text-primary/40" />
            </div>
          )}
          <div className="absolute start-2 top-2 flex gap-1">
            <Badge variant="secondary">{category}</Badge>
          </div>
          <div className="absolute end-2 top-2">
            <Badge variant="outline" className="bg-background/80 backdrop-blur">
              {tl(course.language)}
            </Badge>
          </div>
        </div>

        <CardContent className="space-y-2 p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] font-semibold leading-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("by")} {course.instructor.name}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course._count && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {course._count.lectures}
              </span>
            )}
            {course._count && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course._count.enrollments}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              4.8
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <Badge variant="outline">{td(course.difficulty)}</Badge>
          <span className="flex items-center gap-1 text-sm font-medium text-primary">
            {t("viewCourse")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
