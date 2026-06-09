"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaUpload } from "@/components/instructor/media-upload";
import { initials } from "@/lib/utils";

export function ProfileForm({
  name,
  image,
  bio,
}: {
  name: string;
  image: string;
  bio: string;
}) {
  const t = useTranslations("instructor");
  const router = useRouter();
  const [img, setImg] = useState(image);
  const [bioText, setBioText] = useState(bio);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: img, bio: bioText }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t("profileSaved"));
      router.refresh();
    } else {
      toast.error(t("uploadFailed"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-20 w-20 shrink-0">
          {img && <AvatarImage src={img} alt={name} />}
          <AvatarFallback className="text-xl">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Label>{t("profilePhoto")}</Label>
          <MediaUpload
            resourceType="image"
            accept="image/*"
            value={img}
            onChange={(v) => setImg(v.url)}
            label={t("profilePhoto")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("bioLabel")}</Label>
        <Textarea
          id="bio"
          rows={4}
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
        />
      </div>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {t("saveProfile")}
      </Button>
    </div>
  );
}
