"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, MonitorDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InstallGuideDialog, useInstallState } from "@/components/install-app";

type MobileNavProps = {
  links: { href: string; label: string }[];
  login: { href: string; label: string } | null;
};

export function MobileNav({ links, login }: MobileNavProps) {
  const t = useTranslations("nav");
  const install = useInstallState();
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {links.map((l) => (
            <DropdownMenuItem key={l.href} asChild>
              <Link href={l.href}>{l.label}</Link>
            </DropdownMenuItem>
          ))}
          {login && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={login.href}>{login.label}</Link>
              </DropdownMenuItem>
            </>
          )}
          {install.visible && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => install.install(() => setGuideOpen(true))}
              >
                <MonitorDown className="me-2 h-4 w-4" />
                {t("installApp")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Outside the dropdown so it survives the menu closing */}
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        isIOS={install.isIOS}
      />
    </>
  );
}
