"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function UserActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !active }),
    });
    setLoading(false);
    if (res.ok) {
      setActive(!active);
      router.refresh();
    } else {
      toast.error("Action failed.");
    }
  }

  return (
    <Button
      size="sm"
      variant={active ? "outline" : "default"}
      disabled={loading}
      onClick={toggle}
    >
      {active ? t("deactivate") : t("activate")}
    </Button>
  );
}
