"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ApplicationActions({ id }: { id: string }) {
  const t = useTranslations("applications");
  const router = useRouter();
  const [loading, setLoading] = useState<null | "approve" | "reject">(null);
  const [done, setDone] = useState<null | "APPROVED" | "REJECTED">(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    const res = await fetch(`/api/applications/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    if (res.ok) {
      setDone(action === "approve" ? "APPROVED" : "REJECTED");
      toast.success(
        action === "approve" ? t("approveSuccess") : t("rejectSuccess"),
      );
      router.refresh();
    } else {
      toast.error(t("actionFailed"));
    }
  }

  if (done === "APPROVED") {
    return <Badge variant="success">{t("approved")}</Badge>;
  }
  if (done === "REJECTED") {
    return <Badge variant="destructive">{t("rejected")}</Badge>;
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" disabled={Boolean(loading)} onClick={() => act("approve")}>
        {loading === "approve" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={Boolean(loading)}
        onClick={() => act("reject")}
      >
        <X className="h-4 w-4" />
        {t("reject")}
      </Button>
    </div>
  );
}
