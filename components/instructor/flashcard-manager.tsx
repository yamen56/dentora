"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Layers, Lightbulb, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface FlashcardRow {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  lectureId: string | null;
}

interface LectureLite {
  id: string;
  title: string;
}

const WHOLE_COURSE = "__course__";

export function FlashcardManager({
  courseId,
  lectures,
  initialFlashcards,
}: {
  courseId: string;
  lectures: LectureLite[];
  initialFlashcards: FlashcardRow[];
}) {
  const t = useTranslations("flashcards");
  const [cards, setCards] = useState<FlashcardRow[]>(initialFlashcards);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    front: "",
    back: "",
    hint: "",
    lectureId: WHOLE_COURSE,
  });

  const byLecture = useMemo(() => {
    const map = new Map<string, FlashcardRow[]>();
    for (const c of cards) {
      const key = c.lectureId ?? WHOLE_COURSE;
      (map.get(key) ?? map.set(key, []).get(key)!).push(c);
    }
    return map;
  }, [cards]);

  // Section order: whole-course bucket first, then each lecture that has cards.
  const sections = useMemo(() => {
    const list: { id: string; title: string; cards: FlashcardRow[] }[] = [];
    const courseCards = byLecture.get(WHOLE_COURSE);
    if (courseCards && courseCards.length > 0) {
      list.push({ id: WHOLE_COURSE, title: t("wholeCourse"), cards: courseCards });
    }
    for (const l of lectures) {
      const list2 = byLecture.get(l.id);
      if (list2 && list2.length > 0) {
        list.push({ id: l.id, title: l.title, cards: list2 });
      }
    }
    return list;
  }, [byLecture, lectures, t]);

  function openNew() {
    setEditingId(null);
    setForm({
      front: "",
      back: "",
      hint: "",
      lectureId: WHOLE_COURSE,
    });
    setOpen(true);
  }

  function openEdit(c: FlashcardRow) {
    setEditingId(c.id);
    setForm({
      front: c.front,
      back: c.back,
      hint: c.hint ?? "",
      lectureId: c.lectureId ?? WHOLE_COURSE,
    });
    setOpen(true);
  }

  async function save() {
    if (form.front.trim().length < 1 || form.back.trim().length < 1) {
      toast.error(t("needBothSides"));
      return;
    }

    const lectureId = form.lectureId === WHOLE_COURSE ? null : form.lectureId;
    const payload = {
      front: form.front.trim(),
      back: form.back.trim(),
      hint: form.hint.trim(),
      lectureId,
    };

    setSaving(true);
    const url = editingId
      ? `/api/flashcards/${editingId}`
      : `/api/courses/${courseId}/flashcards`;
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error(t("saveFailed"));
      return;
    }
    const saved: FlashcardRow = {
      id: data.flashcard.id,
      front: data.flashcard.front,
      back: data.flashcard.back,
      hint: data.flashcard.hint,
      lectureId: data.flashcard.lectureId ?? null,
    };
    setCards((prev) =>
      editingId
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved],
    );
    toast.success(t("saved"));
    setOpen(false);
  }

  async function remove(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success(t("deleted"));
    } else {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("managerHint")}</p>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          {t("addCard")}
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          {t("noCards")}
        </p>
      ) : (
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{s.title}</h3>
                <Badge variant="secondary">{s.cards.length}</Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {s.cards.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium">{c.front}</p>
                      <p className="text-sm text-muted-foreground">{c.back}</p>
                      {c.hint && (
                        <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <Lightbulb className="h-3 w-3" />
                          {c.hint}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("editCard") : t("addCard")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("attachTo")}</Label>
              <Select
                value={form.lectureId}
                onValueChange={(v) => setForm((f) => ({ ...f, lectureId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WHOLE_COURSE}>
                    {t("wholeCourse")}
                  </SelectItem>
                  {lectures.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("front")}</Label>
              <Textarea
                rows={2}
                placeholder={t("frontPlaceholder")}
                value={form.front}
                onChange={(e) =>
                  setForm((f) => ({ ...f, front: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("back")}</Label>
              <Textarea
                rows={3}
                placeholder={t("backPlaceholder")}
                value={form.back}
                onChange={(e) =>
                  setForm((f) => ({ ...f, back: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("hint")}{" "}
                <span className="text-muted-foreground">({t("optional")})</span>
              </Label>
              <Input
                placeholder={t("hintPlaceholder")}
                value={form.hint}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hint: e.target.value }))
                }
              />
            </div>

            <Button onClick={save} className="w-full" disabled={saving}>
              {saving ? t("saving") : t("saveCard")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
