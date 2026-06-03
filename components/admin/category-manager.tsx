"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pick } from "@/lib/i18n-helpers";

interface Cat {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
}

export function CategoryManager({ initial }: { initial: Cat[] }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [cats, setCats] = useState<Cat[]>(initial);
  const [form, setForm] = useState({ slug: "", nameEn: "", nameAr: "" });
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!form.slug || !form.nameEn || !form.nameAr) {
      toast.error("Please fill all fields.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setCats((c) => [...c, data.category]);
      setForm({ slug: "", nameEn: "", nameAr: "" });
      toast.success(t("categoryAdded"));
    } else if (data.error === "slugTaken") {
      toast.error("That slug already exists.");
    } else {
      toast.error("Could not add category.");
    }
  }

  async function del(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCats((c) => c.filter((x) => x.id !== id));
      toast.success(t("categoryRemoved"));
    } else if (data.error === "categoryInUse") {
      toast.error("This category is used by existing courses.");
    } else {
      toast.error("Could not remove category.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4 sm:items-end">
        <div className="space-y-1">
          <Label>{t("slug")}</Label>
          <Input
            value={form.slug}
            placeholder="oral-biology"
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>{t("nameEn")}</Label>
          <Input
            value={form.nameEn}
            onChange={(e) =>
              setForm((f) => ({ ...f, nameEn: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label>{t("nameAr")}</Label>
          <Input
            dir="rtl"
            value={form.nameAr}
            onChange={(e) =>
              setForm((f) => ({ ...f, nameAr: e.target.value }))
            }
          />
        </div>
        <Button onClick={add} disabled={loading}>
          <Plus className="h-4 w-4" />
          {t("addCategory")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 rounded-full border bg-card py-1 pe-1 ps-3 text-sm"
          >
            <span>{pick(locale, c.nameEn, c.nameAr)}</span>
            <span className="text-xs text-muted-foreground">/{c.slug}</span>
            <button
              onClick={() => del(c.id)}
              className="rounded-full p-1 text-destructive hover:bg-destructive/10"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
