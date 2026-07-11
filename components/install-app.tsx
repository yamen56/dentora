"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MonitorDown, Share, SquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * "Install app" affordance for the PWA.
 *
 * Android/desktop Chrome fire `beforeinstallprompt`; we stash it and replay it
 * from the button, which shows the browser's native install sheet. iOS never
 * exposes a programmatic install, so there the button opens a short
 * "Share → Add to Home Screen" walkthrough. Hidden when already running
 * installed (standalone) or when the platform offers neither path.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  // Module-level so the event isn't lost if it fires before React mounts.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("whymed:installable"));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event("whymed:installable"));
  });
}

export function useInstallState() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const update = () => setCanPrompt(Boolean(deferredPrompt));
    update();
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        // iPadOS 13+ reports as Mac but has touch
        (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 1),
    );
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true,
    );
    window.addEventListener("whymed:installable", update);
    return () => window.removeEventListener("whymed:installable", update);
  }, []);

  const visible = !standalone && (canPrompt || isIOS);

  async function install(openGuide: () => void) {
    if (deferredPrompt) {
      const p = deferredPrompt;
      deferredPrompt = null;
      setCanPrompt(false);
      await p.prompt().catch(() => openGuide());
    } else {
      openGuide();
    }
  }

  return { visible, isIOS, install };
}

export function InstallGuideDialog({
  open,
  onOpenChange,
  isIOS,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isIOS: boolean;
}) {
  const t = useTranslations("install");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {isIOS ? (
            <>
              <p className="flex items-center gap-2">
                <Share className="h-4 w-4 shrink-0 text-primary" />
                {t("ios1")}
              </p>
              <p className="flex items-center gap-2">
                <SquarePlus className="h-4 w-4 shrink-0 text-primary" />
                {t("ios2")}
              </p>
            </>
          ) : (
            <p>{t("genericHint")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Compact navbar button (desktop). */
export function InstallAppButton() {
  const t = useTranslations("nav");
  const { visible, isIOS, install } = useInstallState();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!visible) return null;
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hidden md:inline-flex"
        onClick={() => install(() => setGuideOpen(true))}
      >
        <MonitorDown className="me-1.5 h-4 w-4" />
        {t("installApp")}
      </Button>
      <InstallGuideDialog
        open={guideOpen}
        onOpenChange={setGuideOpen}
        isIOS={isIOS}
      />
    </>
  );
}

