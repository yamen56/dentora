"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight, FileText, Lock, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  LecturePreviewDialog,
  type PreviewQuestion,
} from "@/components/lecture-preview-dialog";
import type { Flashcard } from "@/components/flashcard-deck";
import { cn, formatDuration } from "@/lib/utils";

export type CurriculumExamPeriod = "FIRST" | "SECOND" | "MID" | "FINAL";

export interface CurriculumLecture {
  id: string;
  title: string;
  duration: number;
  isPreview: boolean;
  hasPdf: boolean;
  hasVideo: boolean;
  examPeriod: CurriculumExamPeriod | null;
  /** enrolled in the course, or a free preview */
  open: boolean;
  /** badge shown only for non-enrolled viewers */
  showPreviewBadge: boolean;
}

export interface PreviewContent {
  flashcards: Flashcard[];
  questions: PreviewQuestion[];
}

const PERIOD_ORDER = ["FIRST", "SECOND", "MID", "FINAL", null] as const;

/**
 * Course curriculum. Each exam section is a collapsible header — click it (or
 * its chevron) to show/hide that exam's lectures. Free-preview lectures open
 * the full preview dialog. Courses with no sections assigned render as one
 * plain list, exactly as before.
 */
export function CourseCurriculum({
  lectures,
  previews,
}: {
  lectures: CurriculumLecture[];
  previews: Record<string, PreviewContent>;
}) {
  const t = useTranslations("course");
  const tp = useTranslations("examPeriod");

  const hasSections = lectures.some((l) => l.examPeriod != null);

  const groups = useMemo(() => {
    const indexed = lectures.map((lecture, index) => ({ lecture, index }));
    if (!hasSections) {
      return [{ period: null as CurriculumExamPeriod | null, items: indexed }];
    }
    return PERIOD_ORDER.map((period) => ({
      period,
      items: indexed.filter(({ lecture }) => lecture.examPeriod === period),
    })).filter((g) => g.items.length > 0);
  }, [lectures, hasSections]);

  // All sections start expanded; collapsing is per-section.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const keyOf = (p: CurriculumExamPeriod | null) => p ?? "NONE";
  const toggle = (p: CurriculumExamPeriod | null) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      const k = keyOf(p);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  function lectureRow(l: CurriculumLecture, i: number) {
    const row = (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <span className="w-6 text-center text-sm text-muted-foreground">
          {i + 1}
        </span>
        {l.open ? (
          <PlayCircle className="h-4 w-4 text-primary" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1 truncate">{l.title}</span>
        {l.hasPdf && <FileText className="h-4 w-4 text-muted-foreground" />}
        {l.showPreviewBadge && <Badge variant="outline">{t("preview")}</Badge>}
        {l.duration > 0 && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(l.duration)}
          </span>
        )}
      </div>
    );
    const preview = previews[l.id];
    const openable =
      l.isPreview &&
      preview &&
      (l.hasVideo ||
        l.hasPdf ||
        preview.flashcards.length > 0 ||
        preview.questions.length > 0);
    return openable ? (
      <LecturePreviewDialog
        key={l.id}
        lectureId={l.id}
        title={l.title}
        hasVideo={l.hasVideo}
        hasPdf={l.hasPdf}
        flashcards={preview.flashcards}
        questions={preview.questions}
      >
        {row}
      </LecturePreviewDialog>
    ) : (
      <div key={l.id}>{row}</div>
    );
  }

  // No exam sections on this course — plain list, no headers.
  if (!hasSections) {
    return (
      <div className="space-y-2">
        {groups[0].items.map(({ lecture, index }) => lectureRow(lecture, index))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const open = !collapsed.has(keyOf(group.period));
        return (
          <div
            key={keyOf(group.period)}
            className="overflow-hidden rounded-xl border bg-muted/30"
          >
            <button
              type="button"
              onClick={() => toggle(group.period)}
              aria-expanded={open}
              className="flex w-full items-center gap-2 p-3 text-start transition-colors hover:bg-muted/60"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform rtl:rotate-180",
                  open && "rotate-90 rtl:rotate-90",
                )}
              />
              <span className="flex-1 font-semibold">
                {tp(group.period ?? "NONE")}
              </span>
              <Badge variant="secondary">
                {t("lectureCount", { count: group.items.length })}
              </Badge>
            </button>
            {open && (
              <div className="space-y-2 p-3 pt-0">
                {group.items.map(({ lecture, index }) =>
                  lectureRow(lecture, index),
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
