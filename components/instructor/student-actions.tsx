"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Lets an instructor remove a student from one of their courses.
// `enrollmentId` is the Enrollment row id; deleting it unenrolls the student.
export function StudentActions({
  enrollmentId,
  name,
}: {
  enrollmentId: string;
  name: string;
}) {
  const t = useTranslations("instructor");
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function remove() {
    setRemoving(true);
    const res = await fetch(`/api/enrollments/${enrollmentId}`, {
      method: "DELETE",
    });
    setRemoving(false);
    if (res.ok) {
      setConfirmOpen(false);
      toast.success(t("studentRemoved"));
      router.refresh();
    } else {
      toast.error(t("removeStudentFailed"));
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        aria-label={t("removeStudent")}
      >
        <UserMinus className="h-4 w-4" />
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeStudentTitle")}</DialogTitle>
            <DialogDescription>
              {t("removeStudentDesc", { name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={removing}
            >
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={removing}>
              {removing ? t("removingStudent") : t("removeStudent")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
