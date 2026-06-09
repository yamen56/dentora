"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTIES } from "@/lib/constants";
import { pick } from "@/lib/i18n-helpers";

interface Cat {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
}

export function CourseFilters({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations("courses");
  const locale = useLocale();
  const [q, setQ] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    if (!value || value === "all") sp.delete(key);
    else sp.set(key, value);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setParam("q", q.trim());
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
      <form onSubmit={onSearch} className="relative flex-1 md:min-w-[240px]">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-9"
        />
      </form>

      <Select
        value={params.get("category") ?? "all"}
        onValueChange={(v) => setParam("category", v)}
      >
        <SelectTrigger className="md:w-44">
          <SelectValue placeholder={t("allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allCategories")}</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.slug}>
              {pick(locale, c.nameEn, c.nameAr)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("difficulty") ?? "all"}
        onValueChange={(v) => setParam("difficulty", v)}
      >
        <SelectTrigger className="md:w-40">
          <SelectValue placeholder={t("allDifficulties")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allDifficulties")}</SelectItem>
          {DIFFICULTIES.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {pick(locale, d.labelEn, d.labelAr)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
