"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useCloudinaryUpload } from "@/lib/use-cloudinary-upload";

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await upload(file, resourceType);
      onChange({ url: res.url, publicId: res.publicId, duration: res.duration });
      toast.success(t("lectureSaved"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "uploadFailed";
      toast.error(
        msg === "cloudinaryNotConfigured"
          ? "Cloudinary is not configured — paste a direct URL below instead."
          : "Upload failed. You can paste a direct URL below.",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? t("uploading") : label}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {uploading && <Progress value={progress} />}
      <Input
        placeholder="https://…"
        value={value}
        onChange={(e) => onChange({ url: e.target.value, publicId: "" })}
      />
      {value && !uploading && (
        <p className="flex items-center gap-1 truncate text-xs text-emerald-600">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{value}</span>
        </p>
      )}
    </div>
  );
}
