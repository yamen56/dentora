"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Lightbulb,
  PartyPopper,
  RotateCcw,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string | null;
}

type Grade = "known" | "review";

export function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const t = useTranslations("flashcards");

  // The working order of card ids (supports shuffle + "review missed").
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [finished, setFinished] = useState(false);

  const byId = useMemo(() => {
    const m = new Map<string, Flashcard>();
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [cards]);

  const total = order.length;
  const current = byId.get(order[index]);
  const knownCount = Object.values(grades).filter((g) => g === "known").length;

  const resetCardState = useCallback(() => {
    setFlipped(false);
    setShowHint(false);
  }, []);

  const restart = useCallback(
    (ids?: string[]) => {
      setOrder(ids ?? cards.map((c) => c.id));
      setIndex(0);
      setGrades({});
      setFinished(false);
      resetCardState();
    },
    [cards, resetCardState],
  );

  const shuffle = useCallback(() => {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setIndex(0);
    setGrades({});
    setFinished(false);
    resetCardState();
  }, [order, resetCardState]);

  const advance = useCallback(() => {
    if (index >= total - 1) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      resetCardState();
    }
  }, [index, total, resetCardState]);

  const grade = useCallback(
    (g: Grade) => {
      if (!current) return;
      setGrades((prev) => ({ ...prev, [current.id]: g }));
      advance();
    },
    [current, advance],
  );

  const goBack = useCallback(() => {
    if (index === 0) return;
    setIndex((i) => i - 1);
    resetCardState();
  }, [index, resetCardState]);

  // Keyboard shortcuts: Space/Enter flip · ←/→ navigate · 1 review · 2 known
  useEffect(() => {
    if (finished) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowRight") {
        if (flipped) grade("known");
        else advance();
      } else if (e.code === "ArrowLeft") {
        goBack();
      } else if (e.key === "1" && flipped) {
        grade("review");
      } else if (e.key === "2" && flipped) {
        grade("known");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, finished, grade, advance, goBack]);

  if (cards.length === 0) return null;

  // ── Completion screen ──────────────────────────────────────────────
  if (finished) {
    const reviewIds = order.filter((id) => grades[id] !== "known");
    const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0;
    const great = pct >= 80;
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-secondary/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {great ? (
            <PartyPopper className="h-8 w-8 text-primary" />
          ) : (
            <Sparkles className="h-8 w-8 text-primary" />
          )}
        </div>
        <h3 className="text-2xl font-bold">
          {great ? t("celebrateGreat") : t("celebrateGood")}
        </h3>
        <p className="mt-1 text-muted-foreground">
          {t("resultLine", { known: knownCount, total })}
        </p>
        <div className="mx-auto mt-4 max-w-xs">
          <Progress value={pct} />
          <p className="mt-1 text-sm font-medium">{pct}%</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => restart()}>
            <RotateCcw className="h-4 w-4" />
            {t("studyAgain")}
          </Button>
          {reviewIds.length > 0 && (
            <Button variant="outline" onClick={() => restart(reviewIds)}>
              <Lightbulb className="h-4 w-4" />
              {t("reviewMissed", { count: reviewIds.length })}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const progressPct = Math.round(((index + (flipped ? 1 : 0)) / total) * 100);

  return (
    <div className="space-y-4">
      {/* Top bar: progress + controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {t("cardOf", { current: index + 1, total })}
            </span>
            <span className="text-muted-foreground">
              {t("knownSoFar", { known: knownCount })}
            </span>
          </div>
          <Progress value={progressPct} />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={shuffle}
          title={t("shuffle")}
        >
          <Shuffle className="h-4 w-4" />
          <span className="hidden sm:inline">{t("shuffle")}</span>
        </Button>
      </div>

      {/* The flip card */}
      <div className="[perspective:1400px]">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="group relative block w-full [transform-style:preserve-3d]"
          style={{ transition: "transform 0.5s" }}
          aria-label={t("flipHint")}
        >
          <div
            className={cn(
              "relative w-full transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            {/* Front */}
            <div className="flex min-h-[16rem] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center shadow-sm [backface-visibility:hidden] sm:min-h-[18rem]">
              <span className="absolute start-4 top-4 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {t("term")}
              </span>
              <p className="text-xl font-semibold sm:text-2xl">
                {current.front}
              </p>
              {current.hint && (
                <div className="absolute bottom-4 start-0 end-0 px-4">
                  {showHint ? (
                    <p className="flex items-center justify-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-3.5 w-3.5" />
                      {current.hint}
                    </p>
                  ) : (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.code === "Space") {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowHint(true);
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-amber-600"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      {t("showHint")}
                    </span>
                  )}
                </div>
              )}
              <span className="absolute bottom-4 end-4 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {t("tapToFlip")}
              </span>
            </div>

            {/* Back */}
            <div className="absolute inset-0 flex min-h-[16rem] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-card to-card p-8 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)] sm:min-h-[18rem]">
              <span className="absolute start-4 top-4 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-medium text-secondary">
                {t("answer")}
              </span>
              <p className="text-lg sm:text-xl">{current.back}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Action row */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400"
            onClick={() => grade("review")}
          >
            <X className="h-4 w-4" />
            {t("stillLearning")}
          </Button>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => grade("known")}
          >
            <Check className="h-4 w-4" />
            {t("gotIt")}
          </Button>
        </div>
      ) : (
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => setFlipped(true)}
        >
          {t("revealAnswer")}
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t("shortcuts")}
      </p>
    </div>
  );
}
