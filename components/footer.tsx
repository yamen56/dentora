import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");
  const year = new Date().getFullYear();

  const explore = [
    { href: "/", label: t("home") },
    { href: "/courses", label: t("browseCourses") },
  ];
  const account = [
    { href: "/register", label: t("createAccount") },
    { href: "/login", label: t("logIn") },
    { href: "/register", label: t("teachOnPlatform") },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span>{tc("appName")}</span>
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("blurb")}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("explore")}</h3>
          <ul className="space-y-2 text-sm">
            {explore.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">{t("account")}</h3>
          <ul className="space-y-2 text-sm">
            {account.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>{t("copyright", { year })}</p>
          <p>{tc("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
