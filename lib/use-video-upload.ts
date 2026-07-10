"use client";

import { useState } from "react";

import { useCloudinaryUpload, type UploadResult } from "./use-cloudinary-upload";

/**
 * Video upload hook: prefers Bunny Stream (resumable TUS upload straight from
 * the browser), falls back to the Cloudinary flow when Bunny isn't configured
 * on the server. The result keeps the MediaValue shape the lecture form
 * already saves — for Bunny, publicId is "bunny:<guid>".
 */
export function useVideoUpload() {
  const cloudinary = useCloudinaryUpload();
  const [bunnyUploading, setBunnyUploading] = useState(false);
  const [bunnyProgress, setBunnyProgress] = useState(0);

  async function upload(file: File): Promise<UploadResult> {
    // Ask the server for Bunny upload auth; 503 means "not configured".
    const authRes = await fetch("/api/upload/bunny", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: file.name }),
    });

    if (authRes.status === 503) return cloudinary.upload(file, "video");
    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}));
      throw new Error(err.error || "uploadFailed");
    }
    const auth = (await authRes.json()) as {
      videoId: string;
      libraryId: string;
      signature: string;
      expiration: number;
    };

    setBunnyUploading(true);
    setBunnyProgress(0);
    try {
      const { Upload } = await import("tus-js-client");

      await new Promise<void>((resolve, reject) => {
        const tusUpload = new Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 8000, 15000],
          chunkSize: 1024 * 1024 * 20,
          headers: {
            AuthorizationSignature: auth.signature,
            AuthorizationExpire: String(auth.expiration),
            VideoId: auth.videoId,
            LibraryId: auth.libraryId,
          },
          metadata: { filetype: file.type, title: file.name },
          onError: (e) => reject(e),
          onProgress: (sent, total) => {
            setBunnyProgress(Math.round((sent / total) * 100));
          },
          onSuccess: () => resolve(),
        });
        tusUpload.start();
      });

      // Bunny probes duration during processing; poll briefly to backfill it.
      let duration: number | undefined;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const res = await fetch(
          `/api/upload/bunny?videoId=${encodeURIComponent(auth.videoId)}`,
        ).catch(() => null);
        if (res?.ok) {
          const info = (await res.json()) as { length: number };
          if (info.length > 0) {
            duration = Math.round(info.length);
            break;
          }
        }
      }

      return {
        publicId: `bunny:${auth.videoId}`,
        url: `bunny:${auth.videoId}`,
        duration,
      };
    } finally {
      setBunnyUploading(false);
    }
  }

  return {
    upload,
    uploading: bunnyUploading || cloudinary.uploading,
    progress: bunnyUploading ? bunnyProgress : cloudinary.progress,
  };
}
