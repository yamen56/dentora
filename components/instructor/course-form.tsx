"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUpload } from "@/components/instructor/media-upload";
import { courseFormSchema, type CourseFormValues } from "@/lib/validations";
import { DIFFICULTIES, LANGUAGES } from "@/lib/constants";
import { pick } from "@/lib/i18n-helpers";

interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
}

export function CourseForm({
  categories,
  course,
}: {
  categories: Category[];
  course?: CourseFormValues & { id: string };
}) {
  const t = useTranslations("instructor");
  const tc = useTranslations("courses");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(course);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course ?? {
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      categoryId: categories[0]?.id ?? "",
      language: "EN",
      difficulty: "BEGINNER",
      thumbnail: "",
    },
  });

  const thumbnail = watch("thumbnail") ?? "";

  async function onSubmit(values: CourseFormValues) {
    const payload = { ...values };
    const url = isEdit ? `/api/courses/${course!.id}` : "/api/courses";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error("Could not save course. Please check the fields.");
      return;
    }
    toast.success(t("courseSaved"));
    const id = isEdit ? course!.id : data.course.id;
    router.push(`/instructor/courses/${id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titleEn">Title (English)</Label>
          <Input id="titleEn" {...register("titleEn")} />
          {errors.titleEn && (
            <p className="text-xs text-destructive">Required (min 3 chars)</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="titleAr">العنوان (بالعربية)</Label>
          <Input id="titleAr" dir="rtl" {...register("titleAr")} />
          {errors.titleAr && (
            <p className="text-xs text-destructive">مطلوب (3 أحرف على الأقل)</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="descriptionEn">Description (English)</Label>
          <Textarea id="descriptionEn" rows={4} {...register("descriptionEn")} />
          {errors.descriptionEn && (
            <p className="text-xs text-destructive">Required (min 10 chars)</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionAr">الوصف (بالعربية)</Label>
          <Textarea
            id="descriptionAr"
            dir="rtl"
            rows={4}
            {...register("descriptionAr")}
          />
          {errors.descriptionAr && (
            <p className="text-xs text-destructive">مطلوب (10 أحرف على الأقل)</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{tc("category")}</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {pick(locale, c.nameEn, c.nameAr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>{tc("language")}</Label>
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {pick(locale, l.labelEn, l.labelAr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>{tc("difficulty")}</Label>
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {pick(locale, d.labelEn, d.labelAr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("thumbnail")}</Label>
        <MediaUpload
          resourceType="image"
          accept="image/*"
          value={thumbnail}
          onChange={(v) => setValue("thumbnail", v.url)}
          label={t("thumbnail")}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {isEdit ? t("courseDetails") : t("createCourse")}
        </Button>
      </div>
    </form>
  );
}
