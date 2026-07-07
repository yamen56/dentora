"use client";

import { useEffect, useRef } from "react";

type HeroGraphProps = {
  labels: { loose: string; connected: string };
};

/*
 * Hero signature: scattered, dim dots — loose memorized facts — get reached
 * one by one from a central concept, settle, light up, and end as a single
 * connected web of understanding. Plain canvas, no dependencies. Pauses when
 * off-screen and renders one static frame under prefers-reduced-motion.
 */

// Normalized coordinates (0..1); mirrored automatically for RTL.
// Index 0 is the hub; every other node lists the node that "explains" it.
const NODES: { x: number; y: number; parent: number }[] = [
  { x: 0.5, y: 0.48, parent: -1 },
  { x: 0.34, y: 0.36, parent: 0 },
  { x: 0.64, y: 0.32, parent: 0 },
  { x: 0.68, y: 0.58, parent: 0 },
  { x: 0.38, y: 0.62, parent: 0 },
  { x: 0.2, y: 0.24, parent: 1 },
  { x: 0.5, y: 0.18, parent: 2 },
  { x: 0.78, y: 0.2, parent: 2 },
  { x: 0.86, y: 0.42, parent: 3 },
  { x: 0.84, y: 0.72, parent: 3 },
  { x: 0.62, y: 0.8, parent: 3 },
  { x: 0.36, y: 0.84, parent: 4 },
  { x: 0.16, y: 0.7, parent: 4 },
  { x: 0.12, y: 0.46, parent: 1 },
  { x: 0.28, y: 0.1, parent: 5 },
  { x: 0.72, y: 0.08, parent: 7 },
];

// Extra connections that appear once the web has formed.
const CROSS_EDGES: [number, number][] = [
  [1, 4],
  [2, 3],
  [6, 7],
  [8, 9],
  [10, 11],
  [12, 13],
];

const REVEAL_START = 500;
const REVEAL_STEP = 160;
const EDGE_GROW = 450;
const CROSS_START = REVEAL_START + (NODES.length - 1) * REVEAL_STEP + EDGE_GROW;

type Pulse = { a: number; b: number; p: number };

export function HeroGraph({ labels }: HeroGraphProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rtl = document.documentElement.dir === "rtl";
    const mx = (x: number) => (rtl ? 1 - x : x);

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      return {
        primary: cs.getPropertyValue("--primary").trim() || "351 86% 44%",
        secondary: cs.getPropertyValue("--secondary").trim() || "275 58% 44%",
        line: cs.getPropertyValue("--muted-foreground").trim() || "46 8% 42%",
      };
    };
    let colors = readColors();

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let reduced = false;
    let time = 0;

    // edgeP[i] is the growth of the edge feeding node i (i >= 1). An edge only
    // starts growing once its scheduled time arrives AND its parent is lit, so
    // the reveal always cascades outward without jumps.
    const edgeStart = NODES.map((_, i) => REVEAL_START + (i - 1) * REVEAL_STEP);
    const edgeP = NODES.map(() => 0);
    const crossP = CROSS_EDGES.map(() => 0);
    const lit = NODES.map(() => 0);
    const settle = NODES.map(() => 0);
    let pulses: Pulse[] = [];
    let pulseIn = 1600;

    const finished = () => crossP.every((p) => p >= 1);

    const finishState = () => {
      time = CROSS_START;
      edgeP.fill(1);
      crossP.fill(1);
      lit.fill(1);
      settle.fill(1);
      pulses = [];
    };

    const resetAssembly = () => {
      time = 0;
      edgeP.fill(0);
      crossP.fill(0);
      lit.fill(0);
      settle.fill(0);
      pulses = [];
      pulseIn = 1600;
    };

    const nodePos = (i: number): [number, number] => {
      // Unsettled facts drift; understanding holds them still.
      const jitter = (1 - settle[i]) * 3;
      const jx = jitter * Math.sin(time / 610 + i * 2.1);
      const jy = jitter * Math.cos(time / 730 + i * 1.3);
      return [mx(NODES[i].x) * w + jx, NODES[i].y * h + jy];
    };

    const dot = (x: number, y: number, r: number, hsl: string, a: number) => {
      if (a <= 0 || r <= 0) return;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hsl} / ${Math.min(a, 1)})`;
      ctx.fill();
    };

    const drawFrame = (dt: number) => {
      time += dt;

      // Hub lights first, on its own.
      if (time > 400) lit[0] = Math.min(1, lit[0] + dt / 350);
      for (let i = 1; i < NODES.length; i++) {
        if (time >= edgeStart[i] && lit[NODES[i].parent] >= 1) {
          edgeP[i] = Math.min(1, edgeP[i] + dt / EDGE_GROW);
        }
        if (edgeP[i] >= 1) lit[i] = Math.min(1, lit[i] + dt / 350);
      }
      CROSS_EDGES.forEach(([a, b], i) => {
        if (time >= CROSS_START + i * 150 && lit[a] >= 1 && lit[b] >= 1) {
          crossP[i] = Math.min(1, crossP[i] + dt / 400);
        }
      });
      for (let i = 0; i < NODES.length; i++) {
        if (lit[i] > 0) settle[i] = Math.min(1, settle[i] + dt / 450);
      }

      // Idle pulses: understanding keeps traveling the web.
      if (finished() && !reduced) {
        pulseIn -= dt;
        if (pulseIn <= 0) {
          const i = 1 + Math.floor(Math.random() * (NODES.length - 1));
          pulses.push({ a: NODES[i].parent, b: i, p: 0 });
          pulseIn = 1300 + Math.random() * 1200;
        }
        for (const pu of pulses) pu.p += dt / 800;
        pulses = pulses.filter((pu) => pu.p < 1);
      }

      // Draw
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w, h) / 420;
      ctx.lineWidth = Math.max(1, s);

      // Tree edges
      for (let i = 1; i < NODES.length; i++) {
        const p = edgeP[i];
        if (p <= 0) continue;
        const [ax, ay] = nodePos(NODES[i].parent);
        const [bx, by] = nodePos(i);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
        ctx.strokeStyle = `hsl(${colors.line} / ${0.35 * p})`;
        ctx.stroke();
      }

      // Cross edges, once the tree is up
      CROSS_EDGES.forEach(([a, b], i) => {
        const p = crossP[i];
        if (p <= 0) return;
        const [ax, ay] = nodePos(a);
        const [bx, by] = nodePos(b);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
        ctx.strokeStyle = `hsl(${colors.line} / ${0.25 * p})`;
        ctx.stroke();
      });

      // Traveling pulses
      for (const pu of pulses) {
        const [ax, ay] = nodePos(pu.a);
        const [bx, by] = nodePos(pu.b);
        const col = pu.b % 2 === 0 ? colors.primary : colors.secondary;
        const fade = Math.sin(pu.p * Math.PI);
        dot(ax + (bx - ax) * pu.p, ay + (by - ay) * pu.p, 2.2 * s, col, 0.8 * fade);
      }

      // Nodes: dim scattered facts → lit, settled understanding
      for (let i = 0; i < NODES.length; i++) {
        const [x, y] = nodePos(i);
        const a = lit[i];
        if (a < 1) {
          dot(x, y, 2.5 * s, colors.line, 0.35 * (1 - a));
        }
        if (a > 0) {
          const col = i % 2 === 0 ? colors.primary : colors.secondary;
          const pulse = reduced ? 1 : 1 + 0.08 * Math.sin(time / 900 + i * 1.7);
          const r = (i === 0 ? 4.4 : 3.2) * s * pulse;
          dot(x, y, r * 3, col, 0.07 * a);
          dot(x, y, r, col, 0.6 * a);
        }
      }
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const loop = (ts: number) => {
      if (!last) last = ts;
      const dt = Math.min(ts - last, 50);
      last = ts;
      drawFrame(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible && !reduced) raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) drawFrame(0);
    };

    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPref = () => {
      reduced = rmq.matches;
      if (reduced) {
        stop();
        finishState();
        drawFrame(0);
      } else {
        resetAssembly();
        start();
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const mo = new MutationObserver(() => {
      colors = readColors();
      if (reduced) drawFrame(0);
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    resize();
    applyMotionPref();
    rmq.addEventListener("change", applyMotionPref);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      rmq.removeEventListener("change", applyMotionPref);
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
      <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        {labels.loose}
      </span>
      <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
        {labels.connected}
      </span>
    </div>
  );
}
