"use client";

import { useEffect, useRef, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { useTranslations } from "next-intl";

/**
 * Video player with a browser-layer moving watermark.
 *
 * The student's name + phone are painted onto a <canvas> that is appended into
 * Plyr's own container element, so it stays visible in fullscreen and cannot be
 * cropped out. The canvas is redrawn every second (so clearing it via devtools
 * is futile) and repositioned every 5–8 seconds.
 */
export function WatermarkVideoPlayer({
  lectureId,
  watermark,
}: {
  lectureId: string;
  watermark: string;
}) {
  const t = useTranslations("player");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const posRef = useRef({ x: 0.1, y: 0.1 });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load signed URL + initialise Plyr
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/media/lecture/${lectureId}/video`);
        if (!res.ok) {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (cancelled || !videoRef.current || playerRef.current) return;

        const url: string = data.url;
        const videoEl = videoRef.current;

        // Bunny Stream delivers HLS; browsers without native HLS need hls.js.
        if (url.includes(".m3u8")) {
          if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
            videoEl.src = url;
          } else {
            const { default: Hls } = await import("hls.js");
            if (cancelled || !videoRef.current) return;
            if (Hls.isSupported()) {
              const hls = new Hls();
              hlsRef.current = hls;
              hls.loadSource(url);
              hls.attachMedia(videoEl);
            } else {
              setError(true);
              setLoading(false);
              return;
            }
          }
        } else {
          videoEl.src = url;
        }

        const player = new Plyr(videoRef.current, {
          speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] },
          controls: [
            "play-large",
            "play",
            "progress",
            "current-time",
            "mute",
            "volume",
            "settings",
            "fullscreen",
          ],
          settings: ["speed"],
        });
        playerRef.current = player;

        // Move the watermark canvas inside Plyr's container so it is part of
        // the element that goes fullscreen.
        const container = player.elements.container;
        if (container && canvasRef.current) {
          container.style.position = "relative";
          container.appendChild(canvasRef.current);
          resizeCanvas();
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [lectureId]);

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    canvas.width = parent.clientWidth || 640;
    canvas.height = parent.clientHeight || 360;
  }

  // Keep the canvas sized to the player
  useEffect(() => {
    const onResize = () => resizeCanvas();
    const ro = new ResizeObserver(onResize);
    const parent = canvasRef.current?.parentElement;
    if (parent) ro.observe(parent);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Draw + move the watermark
  useEffect(() => {
    const lines = watermark.split("\n").filter(Boolean);

    function draw() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = 0.28;
      const fontSize = Math.max(13, Math.round(canvas.width * 0.016));
      ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;
      const x = posRef.current.x * canvas.width;
      const y = posRef.current.y * canvas.height;
      lines.forEach((line, i) => {
        const yy = y + i * (fontSize + 4);
        ctx.strokeText(line, x, yy);
        ctx.fillText(line, x, yy);
      });
      ctx.restore();
    }

    function reposition() {
      posRef.current = {
        x: 0.04 + Math.random() * 0.55,
        y: 0.05 + Math.random() * 0.7,
      };
    }

    reposition();
    draw();
    const redraw = setInterval(draw, 1000);
    const move = setInterval(
      () => {
        reposition();
        draw();
      },
      5000 + Math.random() * 3000,
    );
    return () => {
      clearInterval(redraw);
      clearInterval(move);
    };
  }, [watermark]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="w-full" playsInline />
      <canvas
        ref={canvasRef}
        className="whymed-watermark-layer"
        style={{
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          zIndex: 2147483646,
        }}
      />
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          {/* loading state */}
        </div>
      )}
      {error && (
        <div className="flex aspect-video w-full items-center justify-center text-sm text-white/70">
          {t("noVideo")}
        </div>
      )}
    </div>
  );
}
