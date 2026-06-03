"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function CourseActions({
  courseId,
  isPublished,
}: {
  courseId: string;
  isPublished: boolean;
}) {
  const t = useTranslations("instructor");
  const tc = useTranslations("common");
  const router = useRouter();
  const [published, setPublished] = useState(isPublished);
  const [loading, setLoading] = useState(false);

  async function togglePublish(v: boolean) {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPublished: v }),
    });
    setLoading(false);
    if (res.ok) {
      setPublished(v);
      toast.success(t("publishToggled"));
      router.refresh();
    } else {
      toast.error("Could not update visibility.");
    }
  }

  async function del() {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("courseDeleted"));
      router.push("/instructor");
      router.refresh();
    } else {
      toast.error("Could not delete course.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={published}
          onCheckedChange={togglePublish}
          disabled={loading}
          id="publish"
        />
        <label htmlFor="publish" className="text-sm font-medium">
          {published ? t("published") : t("unpublished")}
        </label>
      </div>
      <Button variant="destructive" size="sm" onClick={del}>
        <Trash2 className="h-4 w-4" />
        {tc("delete")}
      </Button>
    </div>
  );
}
