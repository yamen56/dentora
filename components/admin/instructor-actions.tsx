"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = "PENDING" | "APPROVED" | "REJECTED" | null;

export function InstructorActions({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: Status;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const deleteButton = (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={deleting}
      onClick={() => setConfirmOpen(true)}
      aria-label={t("deleteUser")}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  const confirmDialog = (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteUserTitle")}</DialogTitle>
          <DialogDescription>{t("deleteUserDesc", { name })}</DialogDescription>
        </DialogHeader>
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {t("deleteInstructorWarn")}
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
          >
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={remove} disabled={deleting}>
            {deleting ? t("deleting") : t("deleteUser")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (current === "APPROVED") {
    return (
      <div className="flex items-center justify-end gap-2">
        <Badge variant="success">{t("approved")}</Badge>
        <Button
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => act("reject")}
        >
          {t("reject")}
        </Button>
        {deleteButton}
        {confirmDialog}
      </div>
    );
  }

  if (current === "REJECTED") {
    return (
      <div className="flex items-center justify-end gap-2">
        <Badge variant="destructive">{t("rejected")}</Badge>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => act("approve")}
        >
          {t("approve")}
        </Button>
        {deleteButton}
        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
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
      {deleteButton}
      {confirmDialog}
    </div>
  );
}
