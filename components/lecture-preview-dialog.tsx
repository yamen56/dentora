"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlashcardDeck, type Flashcard } from "@/components/flashcard-deck";
import { ProtectedContent } from "@/components/protected-content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VideoPlayer = dynamic(
  () =>
    import("@/components/watermark-video-player").then(
      (m) => m.WatermarkVideoPlayer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
      </div>
    ),
  },
);

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export interface PreviewQuestion {
  id: string;
  type: "MCQ" | "SHORT";
  questionText: string;
  options: string[] | null;
  correctAnswer: string;
}

/**
 * Quiz for preview lectures, graded locally — visitors have no session, so
 * the enrolled /api/quiz/submit flow doesn't apply and nothing is recorded.
 * Grading mirrors that endpoint (MCQ exact, SHORT case-insensitive).
 */
function PreviewQuiz({ questions }: { questions: PreviewQuestion[] }) {
  const t = useTranslations("quiz");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);

  const results = graded
    ? new Map(
        questions.map((q) => {
          const given = (answers[q.id] ?? "").trim();
          const correct =
            q.type === "MCQ"
              ? given === q.correctAnswer
              : given.toLowerCase() === q.correctAnswer.trim().toLowerCase();
          return [q.id, correct] as const;
        }),
      )
    : null;
  const score = results
    ? [...results.values()].filter(Boolean).length
    : 0;

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const correct = results?.get(q.id);
        return (
          <Card key={q.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">
                {i + 1}. {q.questionText}
              </p>
              {graded &&
                (correct ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                ))}
            </div>
            {q.type === "MCQ" && q.options ? (
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(v) =>
                  setAnswers((a) => ({ ...a, [q.id]: v }))
                }
                disabled={graded}
              >
                {q.options.map((o) => (
                  <div key={o} className="flex items-center gap-2">
                    <RadioGroupItem value={o} id={`${q.id}-${o}`} />
                    <Label htmlFor={`${q.id}-${o}`} className="font-normal">
                      {o}
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
                disabled={graded}
              />
            )}
            {graded && !correct && (
              <p className="text-sm text-muted-foreground">
                {t("correct")}: {q.correctAnswer}
              </p>
            )}
          </Card>
        );
      })}
      {graded ? (
        <p className="text-center font-semibold">
          {score} / {questions.length}
        </p>
      ) : (
        <Button className="w-full" onClick={() => setGraded(true)}>
          {t("submitQuiz")}
        </Button>
      )}
    </div>
  );
}

/**
 * The full free-preview experience for one lecture — video, document,
 * flashcards, and quiz, exactly like the enrolled learn view but with no
 * watermark, so a visitor can feel the real product before applying. The
 * media API allows published previews without a session. The row markup is
 * passed through untouched as children so the curriculum keeps its layout.
 */
export function LecturePreviewDialog({
  lectureId,
  title,
  hasVideo,
  hasPdf,
  flashcards,
  questions,
  children,
}: {
  lectureId: string;
  title: string;
  hasVideo: boolean;
  hasPdf: boolean;
  flashcards: Flashcard[];
  questions: PreviewQuestion[];
  children: ReactNode;
}) {
  const t = useTranslations("player");
  const tf = useTranslations("flashcards");
  const tq = useTranslations("quiz");
  const [open, setOpen] = useState(false);

  const tabs = [
    ...(hasVideo ? ["video"] : []),
    ...(hasPdf ? ["pdf"] : []),
    ...(flashcards.length > 0 ? ["flashcards"] : []),
    ...(questions.length > 0 ? ["quiz"] : []),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg text-start transition-shadow hover:shadow-md"
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate pe-6">{title}</DialogTitle>
          </DialogHeader>
          {tabs.length === 0 ? null : (
            <Tabs defaultValue={tabs[0]}>
              {tabs.length > 1 && (
                <TabsList className="mb-2">
                  {tabs.includes("video") && (
                    <TabsTrigger value="video">Video</TabsTrigger>
                  )}
                  {tabs.includes("pdf") && (
                    <TabsTrigger value="pdf">
                      {t("lectureMaterials")}
                    </TabsTrigger>
                  )}
                  {tabs.includes("flashcards") && (
                    <TabsTrigger value="flashcards">{tf("title")}</TabsTrigger>
                  )}
                  {tabs.includes("quiz") && (
                    <TabsTrigger value="quiz">{tq("title")}</TabsTrigger>
                  )}
                </TabsList>
              )}
              {tabs.includes("video") && (
                <TabsContent value="video">
                  {/* Empty watermark — previews are the clean, full experience */}
                  <VideoPlayer lectureId={lectureId} watermark="" />
                </TabsContent>
              )}
              {tabs.includes("pdf") && (
                <TabsContent value="pdf">
                  <PdfViewer lectureId={lectureId} watermark="" />
                </TabsContent>
              )}
              {tabs.includes("flashcards") && (
                <TabsContent value="flashcards">
                  <FlashcardDeck cards={flashcards} />
                </TabsContent>
              )}
              {tabs.includes("quiz") && (
                <TabsContent value="quiz">
                  {/* No watermark (previews stay clean) but still copy-proof */}
                  <ProtectedContent>
                    <PreviewQuiz questions={questions} />
                  </ProtectedContent>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
