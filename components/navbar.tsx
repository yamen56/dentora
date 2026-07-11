import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { getCurrentUser, roleHome } from "@/lib/auth-helpers";
import { InstallAppButton } from "@/components/install-app";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const user = await getCurrentUser();
  const t = await getTranslations("nav");

  const links = [
    { href: "/courses", label: t("courses") },
    ...(user?.role === "STUDENT"
      ? [{ href: "/dashboard", label: t("dashboard") }]
      : []),
    ...(user?.role === "INSTRUCTOR"
      ? [{ href: "/instructor", label: t("instructor") }]
      : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: t("admin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="Why Medicine">
            <Image
              src="/why-medicine-logo.png"
              alt="Why Medicine"
              width={1443}
              height={623}
              priority
              className="h-14 w-auto dark:hidden sm:h-16"
            />
            <Image
              src="/why-medicine-logo-white.png"
              alt="Why Medicine"
              width={1443}
              height={623}
              className="hidden h-14 w-auto dark:block sm:h-16"
            />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <InstallAppButton />
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
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          )}
          <MobileNav
            links={links}
            login={user ? null : { href: "/login", label: t("login") }}
          />
        </div>
      </div>
    </header>
  );
}
