"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EyeOff } from "lucide-react";

/**
 * Best-effort capture deterrents for protected content. The browser cannot
 * truly block screenshots or screen recording, so this:
 *  - blacks out the content when the tab is backgrounded or loses focus
 *    (defeats casual "record another window / switch tabs" capture), and
 *  - blocks right-click, drag and text selection (save-image / copy).
 * The identity watermark remains the real, traceable protection. Genuine
 * capture-blocking only exists in the native mobile apps (OS-level).
 */
export function CaptureGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("player");
  const [blackout, setBlackout] = useState(false);

  useEffect(() => {
    const hide = () => setBlackout(true);
    const show = () => setBlackout(false);
    const onVisibility = () =>
      setBlackout(document.visibilityState === "hidden");
    const onKey = (e: KeyboardEvent) => {
      // Best effort: flash the blackout on PrintScreen / Ctrl+P and try to wipe
      // any captured image from the clipboard. Cannot stop the OS screenshot.
      if (
        e.key === "PrintScreen" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p")
      ) {
        setBlackout(true);
        try {
          navigator.clipboard?.writeText("");
        } catch {
          /* ignore */
        }
        window.setTimeout(() => setBlackout(false), 1500);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("keyup", onKey);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className="relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
      {blackout && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-lg bg-black text-center text-white/80">
          <EyeOff className="h-8 w-8" />
          <p className="px-6 text-sm">{t("contentHidden")}</p>
        </div>
      )}
    </div>
  );
}
