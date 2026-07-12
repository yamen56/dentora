"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Lock, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  LecturePreviewDialog,
  type PreviewQuestion,
} from "@/components/lecture-preview-dialog";
import type { Flashcard } from "@/components/flashcard-deck";
import { formatDuration } from "@/lib/utils";

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
 * Course curriculum list. Groups lectures under exam-section headers with a
 * toggle to flatten back to one list; free-preview lectures open the full
 * preview dialog. Row layout is the original curriculum row, unchanged.
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
  const [grouped, setGrouped] = useState(true);

  const hasSections = lectures.some((l) => l.examPeriod != null);

  const groups = useMemo(() => {
    const indexed = lectures.map((lecture, index) => ({ lecture, index }));
    if (!grouped || !hasSections) {
      return [{ period: null as CurriculumExamPeriod | null, items: indexed }];
    }
    return PERIOD_ORDER.map((period) => ({
      period,
      items: indexed.filter(({ lecture }) => lecture.examPeriod === period),
    })).filter((g) => g.items.length > 0);
  }, [lectures, grouped, hasSections]);

  const showHeaders = grouped && hasSections;

  return (
    <div className="space-y-2">
      {hasSections && (
        <div className="flex items-center justify-end gap-2 pb-1">
          <Switch
            id="group-by-exam"
            checked={grouped}
            onCheckedChange={setGrouped}
          />
          <Label
            htmlFor="group-by-exam"
            className="text-xs font-normal text-muted-foreground"
          >
            {tp("groupToggle")}
          </Label>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.period ?? "NONE"} className="space-y-2">
          {showHeaders && (
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground rtl:tracking-normal">
              {tp(group.period ?? "NONE")}
            </p>
          )}
          {group.items.map(({ lecture: l, index: i }) => {
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
                {l.hasPdf && (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                {l.showPreviewBadge && (
                  <Badge variant="outline">{t("preview")}</Badge>
                )}
                {l.duration > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(l.duration)}
                  </span>
                )}
              </div>
            );
            const preview = previews[l.id];
            const openable =
              l.isPreview && preview && (l.hasVideo || l.hasPdf ||
                preview.flashcards.length > 0 || preview.questions.length > 0);
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
          })}
        </div>
      ))}
    </div>
  );
}
