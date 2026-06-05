"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Link2, Loader2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCloudinaryUpload } from "@/lib/use-cloudinary-upload";
import { cn } from "@/lib/utils";

export interface MediaValue {
  url: string;
  publicId: string;
  duration?: number;
}

export function MediaUpload({
  resourceType,
  accept,
  value,
  onChange,
  label,
}: {
  resourceType: "video" | "image" | "raw";
  accept: string;
  value: string;
  onChange: (v: MediaValue) => void;
  label: string;
}) {
  const t = useTranslations("instructor");
  const { upload, uploading, progress } = useCloudinaryUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);

  async function doUpload(file: File) {
    try {
      const res = await upload(file, resourceType);
      setFileName(file.name);
      onChange({ url: res.url, publicId: res.publicId, duration: res.duration });
      toast.success(t("uploadComplete"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "uploadFailed";
      toast.error(
        msg === "cloudinaryNotConfigured"
          ? t("uploadNotConfigured")
          : t("uploadFailed"),
      );
      setShowLink(true);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  }

  const hasFile = Boolean(value) && !uploading;

  return (
    <div className="space-y-2">
      {/* Drop zone / uploading */}
      {!hasFile && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            uploading && "pointer-events-none opacity-90",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {t("uploading")} {progress}%
              </p>
              <Progress value={progress} className="w-full max-w-xs" />
            </>
          ) : (
            <>
              <UploadCloud className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{t("dropHint")}</p>
            </>
          )}
        </div>
      )}

      {/* Uploaded state */}
      {hasFile && (
        <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="flex-1 truncate text-sm">
            {fileName ?? t("fileAttached")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {t("replaceFile")}
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />

      {/* Optional: paste a direct link (fallback / external files) */}
      {!showLink ? (
        <button
          type="button"
          onClick={() => setShowLink(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Link2 className="h-3 w-3" />
          {t("pasteLinkInstead")}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            placeholder="https://…"
            value={value}
            onChange={(e) => onChange({ url: e.target.value, publicId: "" })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowLink(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
