"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

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
import { QUESTION_TYPES } from "@/lib/constants";
import { pick } from "@/lib/i18n-helpers";

export interface QuestionRow {
  id: string;
  type: "MCQ" | "SHORT";
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
  points: number;
  lectureId: string | null;
}

interface LectureLite {
  id: string;
  title: string;
}

const WHOLE_COURSE = "__course__";

const emptyForm = {
  type: "MCQ" as "MCQ" | "SHORT",
  questionText: "",
  options: ["", ""],
  correctIndex: 0,
  correctAnswerText: "",
  points: 1,
  lectureId: WHOLE_COURSE,
};

export function QuestionManager({
  courseId,
  lectures,
  initialQuestions,
}: {
  courseId: string;
  lectures: LectureLite[];
  initialQuestions: QuestionRow[];
}) {
  const t = useTranslations("instructor");
  const locale = useLocale();
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  }

  function openEdit(q: QuestionRow) {
    setEditingId(q.id);
    setForm({
      type: q.type,
      questionText: q.questionText,
      options: q.options && q.options.length ? q.options : ["", ""],
      correctIndex:
        q.type === "MCQ" && q.options
          ? Math.max(0, q.options.indexOf(q.correctAnswer))
          : 0,
      correctAnswerText: q.type === "SHORT" ? q.correctAnswer : "",
      points: q.points,
      lectureId: q.lectureId ?? WHOLE_COURSE,
    });
    setOpen(true);
  }

  function lectureLabel(id: string | null) {
    if (!id) return t("wholeCourse");
    return lectures.find((l) => l.id === id)?.title ?? t("wholeCourse");
  }

  async function save() {
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    const correctAnswer =
      form.type === "MCQ"
        ? (form.options[form.correctIndex] ?? "").trim()
        : form.correctAnswerText.trim();

    if (form.questionText.trim().length < 3) {
      toast.error("Please enter the question text.");
      return;
    }
    if (form.type === "MCQ" && (options.length < 2 || !correctAnswer)) {
      toast.error("Add at least 2 options and select the correct one.");
      return;
    }
    if (form.type === "SHORT" && !correctAnswer) {
      toast.error("Please enter the expected answer.");
      return;
    }

    const payload = {
      type: form.type,
      questionText: form.questionText.trim(),
      options: form.type === "MCQ" ? options : undefined,
      correctAnswer,
      points: form.points,
      lectureId: form.lectureId === WHOLE_COURSE ? null : form.lectureId,
    };

    setSaving(true);
    const url = editingId
      ? `/api/questions/${editingId}`
      : `/api/courses/${courseId}/questions`;
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save question.");
      return;
    }
    const saved: QuestionRow = data.question;
    setQuestions((prev) =>
      editingId ? prev.map((q) => (q.id === saved.id ? saved : q)) : [...prev, saved],
    );
    toast.success(t("questionSaved"));
    setOpen(false);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this question?")) return;
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success(t("questionDeleted"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          {t("addQuestion")}
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          {t("noQuestions")}
        </p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-start gap-3 rounded-lg border bg-card p-3"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{q.questionText}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{q.type}</Badge>
                  <Badge variant="outline">{lectureLabel(q.lectureId)}</Badge>
                  <span>
                    {q.points} {t("points")}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => remove(q.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addQuestion")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("questionType")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as "MCQ" | "SHORT" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((qt) => (
                      <SelectItem key={qt.value} value={qt.value}>
                        {pick(locale, qt.labelEn, qt.labelAr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("attachTo")}</Label>
                <Select
                  value={form.lectureId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, lectureId: v }))
                  }
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
            </div>

            <div className="space-y-2">
              <Label>{t("questionText")}</Label>
              <Textarea
                rows={2}
                value={form.questionText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, questionText: e.target.value }))
                }
              />
            </div>

            {form.type === "MCQ" ? (
              <div className="space-y-2">
                <Label>{t("options")}</Label>
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      title={t("correctAnswer")}
                      onClick={() =>
                        setForm((f) => ({ ...f, correctIndex: idx }))
                      }
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        form.correctIndex === idx
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-input"
                      }`}
                    >
                      {form.correctIndex === idx && <Check className="h-4 w-4" />}
                    </button>
                    <Input
                      value={opt}
                      placeholder={`${t("options")} ${idx + 1}`}
                      onChange={(e) =>
                        setForm((f) => {
                          const options = [...f.options];
                          options[idx] = e.target.value;
                          return { ...f, options };
                        })
                      }
                    />
                    {form.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setForm((f) => {
                            const options = f.options.filter(
                              (_, i) => i !== idx,
                            );
                            const correctIndex =
                              f.correctIndex >= options.length
                                ? 0
                                : f.correctIndex;
                            return { ...f, options, correctIndex };
                          })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, options: [...f.options, ""] }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("addOption")}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("correctAnswer")}</Label>
                <Input
                  value={form.correctAnswerText}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      correctAnswerText: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("points")}</Label>
              <Input
                type="number"
                min={1}
                className="w-28"
                value={form.points}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    points: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
            </div>

            <Button onClick={save} className="w-full" disabled={saving}>
              {saving ? "Saving…" : "Save question"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
