"use client";

import { useState } from "react";

export interface UploadResult {
  publicId: string;
  url: string;
  duration?: number;
}

type ResourceType = "video" | "image" | "raw";

export function useCloudinaryUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(
    file: File,
    resourceType: ResourceType,
  ): Promise<UploadResult> {
    setUploading(true);
    setProgress(0);
    try {
      // 1. Ask our server to sign the upload params
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourceType, folder: "dentora" }),
      });
      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || "signFailed");
      }
      const sign = await signRes.json();

      // 2. Upload directly to Cloudinary (file never touches our server)
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      form.append("type", sign.type);

      const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`;

      const result = await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              publicId: data.public_id,
              url: data.secure_url,
              duration: data.duration ? Math.round(data.duration) : undefined,
            });
          } else {
            reject(new Error("uploadFailed"));
          }
        };
        xhr.onerror = () => reject(new Error("uploadFailed"));
        xhr.send(form);
      });

      return result;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, progress };
}
