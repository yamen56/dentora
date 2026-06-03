import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const tNav = await getTranslations("nav");

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-7xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground">{t("notFound")}</p>
      <Button asChild>
        <Link href="/">{tNav("home")}</Link>
      </Button>
    </div>
  );
}
