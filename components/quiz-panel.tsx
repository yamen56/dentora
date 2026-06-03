"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface QuizQuestion {
  id: string;
  type: "MCQ" | "SHORT";
  questionText: string;
  options: string[] | null;
  points: number;
}

interface QResult {
  questionId: string;
  correct: boolean;
  correctAnswer: string;
}

export function QuizPanel({
  courseId,
  lectureId,
  questions,
}: {
  courseId: string;
  lectureId: string | null;
  questions: QuizQuestion[];
}) {
  const t = useTranslations("quiz");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    totalQuestions: number;
    results: QResult[];
  } | null>(null);

  if (questions.length === 0) {
    return <p className="text-muted-foreground">{t("noQuestions")}</p>;
  }

  const resultMap = result
    ? new Map(result.results.map((r) => [r.questionId, r]))
    : null;

  async function submit() {
    if (Object.keys(answers).length < questions.length) {
      toast.error(t("answeredAll"));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, lectureId, answers }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      toast.error("Could not submit the quiz.");
      return;
    }
    setResult(data);
    toast.success(t("submitted"));
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const r = resultMap?.get(q.id);
        return (
          <Card key={q.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">
                {i + 1}. {q.questionText}
              </p>
              {r &&
                (r.correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                ))}
            </div>

            {q.type === "MCQ" ? (
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) =>
                  setAnswers((a) => ({ ...a, [q.id]: v }))
                }
                disabled={Boolean(result)}
              >
                {q.options?.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`${q.id}-${idx}`} />
                    <Label htmlFor={`${q.id}-${idx}`} className="font-normal">
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                value={answers[q.id] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                placeholder={t("shortAnswerPlaceholder")}
                disabled={Boolean(result)}
              />
            )}

            {r && !r.correct && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t("correct")}: {r.correctAnswer}
              </p>
            )}
          </Card>
        );
      })}

      {result ? (
        <div className="flex items-center justify-between rounded-lg border bg-accent/40 p-4">
          <p className="font-semibold">
            {t("yourScore")}:{" "}
            {t("scoreOf", { score: result.score, total: result.total })}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
          >
            {t("retake")}
          </Button>
        </div>
      ) : (
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("submitQuiz")}
        </Button>
      )}
    </div>
  );
}
