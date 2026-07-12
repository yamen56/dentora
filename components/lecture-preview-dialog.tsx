"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

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

/**
 * Makes a free-preview lecture row on the course page playable — including
 * for visitors with no account (the media API allows published previews
 * anonymously). The row markup is passed through untouched as children so
 * the curriculum keeps its exact layout.
 */
export function LecturePreviewDialog({
  lectureId,
  title,
  watermark,
  children,
}: {
  lectureId: string;
  title: string;
  watermark: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pe-6">{title}</DialogTitle>
          </DialogHeader>
          <VideoPlayer lectureId={lectureId} watermark={watermark} />
        </DialogContent>
      </Dialog>
    </>
  );
}
