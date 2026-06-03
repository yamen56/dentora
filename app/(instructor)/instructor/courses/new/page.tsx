import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/instructor/course-form";
import { Button } from "@/components/ui/button";

export default async function NewCoursePage() {
  await requireRole("INSTRUCTOR");
  const t = await getTranslations("instructor");
  const categories = await prisma.category
    .findMany({ orderBy: { nameEn: "asc" } })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/instructor">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("myCourses")}
        </Link>
      </Button>
      <h1 className="text-3xl font-bold">{t("createCourse")}</h1>
      <CourseForm categories={categories} />
    </div>
  );
}
