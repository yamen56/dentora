"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UserActions({
  id,
  name,
  role,
  isActive,
}: {
  id: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  isActive: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      toast.error(t("actionFailed"));
    }
  }

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setConfirmOpen(false);
      toast.success(t("userDeleted"));
      router.refresh();
    } else {
      toast.error(t("deleteFailed"));
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={active ? "outline" : "default"}
        disabled={loading}
        onClick={toggle}
      >
        {active ? t("deactivate") : t("activate")}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        aria-label={t("deleteUser")}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteUserTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteUserDesc", { name })}
            </DialogDescription>
          </DialogHeader>
          {role === "INSTRUCTOR" && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {t("deleteInstructorWarn")}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? t("deleting") : t("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
