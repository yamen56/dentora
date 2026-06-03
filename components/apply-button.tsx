"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AppStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export function ApplyButton({
  courseId,
  isEnrolled,
  isLoggedIn,
  isStudent,
  applicationStatus,
}: {
  courseId: string;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  isStudent: boolean;
  applicationStatus: AppStatus;
}) {
  const t = useTranslations("course");
  const tc = useTranslations("courses");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<AppStatus>(applicationStatus);

  if (isEnrolled) {
    return (
      <Button asChild className="w-full">
        <Link href={`/learn/${courseId}`}>{tc("goToCourse")}</Link>
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button asChild className="w-full">
        <Link href={`/login?callbackUrl=/courses/${courseId}`}>
          {t("loginToApply")}
        </Link>
      </Button>
    );
  }

  if (!isStudent) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t("studentsOnly")}
      </p>
    );
  }

  if (status === "PENDING") {
    return (
      <div className="space-y-2">
        <Button className="w-full" variant="secondary" disabled>
          <Clock className="me-2 h-4 w-4" />
          {t("applicationPending")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("applicationPendingHint")}
        </p>
      </div>
    );
  }

  async function apply() {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ note: note.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      if (data.alreadyEnrolled) {
        router.push(`/learn/${courseId}`);
        return;
      }
      setStatus("PENDING");
      toast.success(t("applicationSubmitted"));
      router.refresh();
    } else {
      toast.error(t("applicationError"));
    }
  }

  return (
    <div className="space-y-2">
      {status === "REJECTED" && (
        <p className="text-sm font-medium text-destructive">
          {t("applicationRejected")}
        </p>
      )}
      <Textarea
        rows={3}
        placeholder={t("applyNotePlaceholder")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button onClick={apply} className="w-full" disabled={loading}>
        {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {t("applyForAccess")}
      </Button>
    </div>
  );
}
