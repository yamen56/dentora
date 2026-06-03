"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pick } from "@/lib/i18n-helpers";

interface CourseOption {
  id: string;
  titleEn: string;
  titleAr: string;
}

export function EnrollStudentForm({ courses }: { courses: CourseOption[] }) {
  const t = useTranslations("applications");
  const locale = useLocale();
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!courseId || !email.trim()) {
      toast.error(t("fillAllFields"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/enrollments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, email: email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      toast.success(t("addSuccess", { name: data.studentName ?? "" }));
      setEmail("");
      router.refresh();
    } else if (data.error === "studentNotFound") {
      toast.error(t("studentNotFound"));
    } else if (data.error === "notAStudent") {
      toast.error(t("notAStudent"));
    } else if (data.error === "alreadyEnrolled") {
      toast.error(t("alreadyEnrolled"));
    } else {
      toast.error(t("actionFailed"));
    }
  }

  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noCoursesYet")}</p>;
  }

  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="space-y-1">
        <Label>{t("courseLabel")}</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {pick(locale, c.titleEn, c.titleAr)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t("emailLabel")}</Label>
        <Input
          type="email"
          placeholder="student@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        {t("addButton")}
      </Button>
    </div>
  );
}
