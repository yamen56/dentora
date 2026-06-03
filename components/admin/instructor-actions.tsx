"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Status = "PENDING" | "APPROVED" | "REJECTED" | null;

export function InstructorActions({
  id,
  status,
}: {
  id: string;
  status: Status;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch(`/api/admin/instructors/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (res.ok) {
      setCurrent(action === "approve" ? "APPROVED" : "REJECTED");
      toast.success(
        action === "approve" ? t("instructorApproved") : t("instructorRejected"),
      );
      router.refresh();
    } else {
      toast.error("Action failed.");
    }
  }

  if (current === "APPROVED") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="success">{t("approved")}</Badge>
        <Button
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => act("reject")}
        >
          {t("reject")}
        </Button>
      </div>
    );
  }

  if (current === "REJECTED") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive">{t("rejected")}</Badge>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => act("approve")}
        >
          {t("approve")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading} onClick={() => act("approve")}>
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => act("reject")}
      >
        {t("reject")}
      </Button>
    </div>
  );
}
