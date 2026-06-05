"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Renders a lecture PDF on a <canvas> with PDF.js. The original file URL is
 * never exposed — bytes are streamed through /api/media/.../pdf. Each rendered
 * page is stamped with a tiled, diagonal, semi-transparent identity watermark.
 */
export function PdfViewer({
  lectureId,
  watermark,
}: {
  lectureId: string;
  watermark: string;
}) {
  const t = useTranslations("player");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load the document once
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const task = pdfjs.getDocument({
          url: `/api/media/lecture/${lectureId}/pdf`,
          withCredentials: true,
        });
        const pdf = await task.promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setPage(1);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lectureId]);

  // Render the current page (and watermark) whenever page/scale changes
  useEffect(() => {
    let cancelled = false;
    async function render() {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const task = pdfPage.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;
        drawWatermark(ctx, canvas.width, canvas.height, watermark);
      } catch {
        /* render cancelled or failed — ignore */
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [page, scale, watermark, numPages]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border text-muted-foreground">
        {t("noPdf")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("page")} {page} {t("of")} {numPages || "…"}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= numPages}
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a
              href={`/api/media/lecture/${lectureId}/pdf/download`}
              download
            >
              <Download className="h-4 w-4" />
              {t("downloadPdf")}
            </a>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex max-h-[75vh] justify-center overflow-auto rounded-lg border bg-muted/30 p-2">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="max-w-full shadow" />
        )}
      </div>
    </div>
  );
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  watermark: string,
) {
  const text = watermark.split("\n").filter(Boolean).join("  ·  ");
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#0f172a";
  const fontSize = Math.max(14, Math.round(w * 0.022));
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.translate(-w / 2, -h / 2);
  const stepX = Math.max(220, w / 2);
  const stepY = Math.max(120, h / 5);
  for (let y = -h * 0.2; y < h * 1.3; y += stepY) {
    for (let x = -w * 0.2; x < w * 1.3; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}
