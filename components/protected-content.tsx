"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EyeOff } from "lucide-react";

/**
 * Protection wrapper for question banks (and any other steal-worthy text).
 *
 * A browser cannot truly block an OS screenshot, so this stacks the defences
 * that do work:
 *  - copy / cut / text selection / right-click / drag are blocked, so the
 *    text can't be lifted straight out of the page,
 *  - the content blacks out when the tab is backgrounded or loses focus, and
 *    on PrintScreen / Ctrl+P (defeats casual capture and print-to-PDF), and
 *  - a tiled, semi-transparent identity watermark sits over the content, so
 *    any photo of the screen carries the student's name and phone — the real,
 *    traceable deterrent, exactly like the video player.
 */
export function ProtectedContent({
  watermark,
  children,
}: {
  watermark?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("player");
  const [blackout, setBlackout] = useState(false);

  useEffect(() => {
    const onVisibility = () =>
      setBlackout(document.visibilityState === "hidden");
    const hide = () => setBlackout(true);
    const show = () => setBlackout(false);
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        ((e.ctrlKey || e.metaKey) &&
          ["p", "s", "c"].includes(e.key.toLowerCase()))
      ) {
        setBlackout(true);
        try {
          navigator.clipboard?.writeText("");
        } catch {
          /* ignore */
        }
        window.setTimeout(() => setBlackout(false), 1200);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  // Tiled diagonal watermark drawn as an inline SVG background.
  const lines = (watermark ?? "").split("\n").filter(Boolean);
  const svg = lines.length
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180">
        <text x="150" y="90" fill="rgba(120,120,120,0.16)" font-family="sans-serif"
              font-size="13" font-weight="600" text-anchor="middle"
              transform="rotate(-28 150 90)">
          ${lines
            .map(
              (l, i) =>
                `<tspan x="150" dy="${i === 0 ? 0 : 16}">${l.replace(
                  /[<>&"]/g,
                  "",
                )}</tspan>`,
            )
            .join("")}
        </text>
      </svg>`
    : null;

  return (
    <div
      className="relative select-none"
      onCopy={block}
      onCut={block}
      onContextMenu={block}
      onDragStart={block}
      // Selection is blocked in CSS; this also stops shift-click ranges.
      onMouseDown={(e) => {
        if (e.detail > 1) e.preventDefault();
      }}
    >
      {children}

      {svg && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
              svg,
            )}")`,
            backgroundRepeat: "repeat",
          }}
        />
      )}

      {blackout && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-lg bg-black text-center text-white/80">
          <EyeOff className="h-8 w-8" />
          <p className="px-6 text-sm">{t("contentHidden")}</p>
        </div>
      )}
    </div>
  );
}
