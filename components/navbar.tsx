import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getCurrentUser, roleHome } from "@/lib/auth-helpers";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const user = await getCurrentUser();
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Why Medicine">
            <Image
              src="/why-medicine-logo.png"
              alt="Why Medicine"
              width={641}
              height={161}
              priority
              className="h-11 w-auto dark:brightness-0 dark:invert"
            />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            <Link
              href="/courses"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("courses")}
            </Link>
            {user?.role === "STUDENT" && (
              <Link
                href="/dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("dashboard")}
              </Link>
            )}
            {user?.role === "INSTRUCTOR" && (
              <Link
                href="/instructor"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("instructor")}
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("admin")}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ModeToggle />
          {user ? (
            <UserMenu
              name={user.name ?? ""}
              email={user.email ?? ""}
              dashboardHref={roleHome(user.role)}
            />
          ) : (
            <div className="flex items-center gap-2 ps-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
