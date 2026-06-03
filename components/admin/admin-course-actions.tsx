"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminCourseActions({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const t = useTranslations("instructor");
  const tc = useTranslations("common");
  const router = useRouter();
  const [published, setPublished] = useState(isPublished);
  const [loading, setLoading] = useState(false);

  async function togglePublish() {
    setLoading(true);
    const res = await fetch(`/api/courses/${id}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isPublished: !published }),
    });
    setLoading(false);
    if (res.ok) {
      setPublished(!published);
      router.refresh();
    } else {
      toast.error("Action failed.");
    }
  }

  async function del() {
    if (!window.confirm("Delete this course permanently?")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("courseDeleted"));
      router.refresh();
    } else {
      toast.error("Action failed.");
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={togglePublish}
      >
        {published ? t("unpublish") : t("publish")}
      </Button>
      <Button size="sm" variant="destructive" onClick={del}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">{tc("delete")}</span>
      </Button>
    </div>
  );
}
