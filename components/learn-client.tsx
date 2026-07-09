"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { QuizPanel, type QuizQuestion } from "@/components/quiz-panel";
import { FlashcardDeck, type Flashcard } from "@/components/flashcard-deck";
import { CaptureGuard } from "@/components/capture-guard";
import { cn } from "@/lib/utils";

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

export interface LecturePlay {
  id: string;
  title: string;
  hasVideo: boolean;
  hasPdf: boolean;
  hasFlashcards: boolean;
  duration: number;
}

const COURSE_QUIZ = "__course_quiz__";
const COURSE_FLASHCARDS = "__course_flashcards__";

export function LearnClient({
  courseId,
  courseTitle,
  lectures,
  lectureQuestions,
  lectureFlashcards,
  courseQuestions,
  courseFlashcards,
  initialCompleted,
  watermark,
}: {
  courseId: string;
  courseTitle: string;
  lectures: LecturePlay[];
  lectureQuestions: Record<string, QuizQuestion[]>;
  lectureFlashcards: Record<string, Flashcard[]>;
  courseQuestions: QuizQuestion[];
  courseFlashcards: Flashcard[];
  initialCompleted: string[];
  watermark: string;
}) {
  const t = useTranslations("player");
  const tq = useTranslations("quiz");
  const tf = useTranslations("flashcards");
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(initialCompleted),
  );
  const [currentId, setCurrentId] = useState<string>(
    lectures[0]?.id ?? COURSE_QUIZ,
  );

  const currentIndex = lectures.findIndex((l) => l.id === currentId);
  const current = currentIndex >= 0 ? lectures[currentIndex] : null;
  const pct =
    lectures.length > 0
      ? Math.round((completed.size / lectures.length) * 100)
      : 0;

  async function toggleComplete(id: string) {
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lectureId: id }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setCompleted((prev) => {
      const n = new Set(prev);
      if (data.completed) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  const tabs = useMemo(() => {
    if (!current) return [] as string[];
    const list: string[] = [];
    if (current.hasVideo) list.push("video");
    if (current.hasPdf) list.push("pdf");
    if ((lectureFlashcards[current.id]?.length ?? 0) > 0) list.push("flashcards");
    if ((lectureQuestions[current.id]?.length ?? 0) > 0) list.push("quiz");
    return list;
  }, [current, lectureQuestions, lectureFlashcards]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Sidebar / playlist */}
      <aside className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {courseTitle}
          </Link>
        </Button>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t("progress")}</span>
            <span className="text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>

        <div className="space-y-1 rounded-lg border p-2">
          {lectures.map((l, i) => {
            const done = completed.has(l.id);
            return (
              <button
                key={l.id}
                onClick={() => setCurrentId(l.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-start text-sm transition-colors hover:bg-accent",
                  currentId === l.id && "bg-accent font-medium",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="me-auto truncate">
                  {i + 1}. {l.title}
                </span>
                {l.hasVideo && <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                {l.hasPdf && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                {l.hasFlashcards && <Layers className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}

          {courseFlashcards.length > 0 && (
            <button
              onClick={() => setCurrentId(COURSE_FLASHCARDS)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md p-2 text-start text-sm transition-colors hover:bg-accent",
                currentId === COURSE_FLASHCARDS && "bg-accent font-medium",
              )}
            >
              <Layers className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{tf("courseFlashcards")}</span>
            </button>
          )}

          {courseQuestions.length > 0 && (
            <button
              onClick={() => setCurrentId(COURSE_QUIZ)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md p-2 text-start text-sm transition-colors hover:bg-accent",
                currentId === COURSE_QUIZ && "bg-accent font-medium",
              )}
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{tq("courseQuiz")}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <section className="min-w-0 space-y-4">
        {currentId === COURSE_FLASHCARDS ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">{tf("courseFlashcards")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {tf("courseFlashcardsHint")}
            </p>
            <FlashcardDeck cards={courseFlashcards} />
          </div>
        ) : currentId === COURSE_QUIZ ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{tq("courseQuiz")}</h2>
            <QuizPanel
              courseId={courseId}
              lectureId={null}
              questions={courseQuestions}
            />
          </div>
        ) : current ? (
          <div key={current.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{current.title}</h2>
              <Button
                variant={completed.has(current.id) ? "secondary" : "default"}
                size="sm"
                onClick={() => toggleComplete(current.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {completed.has(current.id) ? t("completed") : t("markComplete")}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">{t("watermarkNote")}</p>

            {tabs.length === 0 ? (
              <p className="rounded-lg border p-8 text-center text-muted-foreground">
                {t("noVideo")}
              </p>
            ) : (
              <Tabs defaultValue={tabs[0]}>
                <TabsList>
                  {current.hasVideo && (
                    <TabsTrigger value="video">Video</TabsTrigger>
                  )}
                  {current.hasPdf && (
                    <TabsTrigger value="pdf">{t("lectureMaterials")}</TabsTrigger>
                  )}
                  {(lectureFlashcards[current.id]?.length ?? 0) > 0 && (
                    <TabsTrigger value="flashcards">
                      <Layers className="h-4 w-4" />
                      {tf("title")}
                    </TabsTrigger>
                  )}
                  {(lectureQuestions[current.id]?.length ?? 0) > 0 && (
                    <TabsTrigger value="quiz">{tq("title")}</TabsTrigger>
                  )}
                </TabsList>

                {current.hasVideo && (
                  <TabsContent value="video" className="pt-4">
                    <CaptureGuard>
                      <VideoPlayer
                        lectureId={current.id}
                        watermark={watermark}
                      />
                    </CaptureGuard>
                  </TabsContent>
                )}
                {current.hasPdf && (
                  <TabsContent value="pdf" className="pt-4">
                    <CaptureGuard>
                      <PdfViewer lectureId={current.id} watermark={watermark} />
                    </CaptureGuard>
                  </TabsContent>
                )}
                {(lectureFlashcards[current.id]?.length ?? 0) > 0 && (
                  <TabsContent value="flashcards" className="pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {tf("studyTitle")}
                      </h3>
                    </div>
                    <FlashcardDeck cards={lectureFlashcards[current.id] ?? []} />
                  </TabsContent>
                )}
                {(lectureQuestions[current.id]?.length ?? 0) > 0 && (
                  <TabsContent value="quiz" className="pt-4">
                    <QuizPanel
                      courseId={courseId}
                      lectureId={current.id}
                      questions={lectureQuestions[current.id] ?? []}
                    />
                  </TabsContent>
                )}
              </Tabs>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex <= 0}
                onClick={() => setCurrentId(lectures[currentIndex - 1].id)}
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t("prevLecture")}
              </Button>
              <Button
                size="sm"
                disabled={currentIndex >= lectures.length - 1}
                onClick={() => setCurrentId(lectures[currentIndex + 1].id)}
              >
                {t("nextLecture")}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
