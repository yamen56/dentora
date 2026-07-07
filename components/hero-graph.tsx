"use client";

import { useEffect, useRef } from "react";

type HeroGraphProps = {
  labels: { uni: string; step1: string; one: string };
};

/*
 * Hero signature: two particle streams — university lectures (crimson) and
 * official Step 1 material (violet) — flow in and assemble into a single
 * connected knowledge graph. Plain canvas, no dependencies. Pauses when
 * off-screen and renders one static frame under prefers-reduced-motion.
 */

// Normalized coordinates (0..1); mirrored automatically for RTL.
const NODES: [number, number][] = [
  [0.56, 0.22],
  [0.72, 0.16],
  [0.87, 0.26],
  [0.5, 0.4],
  [0.66, 0.36],
  [0.83, 0.44],
  [0.57, 0.55],
  [0.74, 0.57],
  [0.9, 0.62],
  [0.52, 0.71],
  [0.68, 0.75],
  [0.85, 0.78],
  [0.71, 0.46],
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 4],
  [1, 4],
  [2, 5],
  [4, 12],
  [3, 4],
  [3, 6],
  [5, 12],
  [12, 7],
  [12, 6],
  [5, 8],
  [7, 8],
  [6, 9],
  [6, 10],
  [7, 10],
  [9, 10],
  [10, 11],
  [8, 11],
];

// Stream origins: index 0 = university (primary), 1 = Step 1 (secondary).
const SOURCES: [number, number][] = [
  [0.08, 0.24],
  [0.08, 0.76],
];

type Particle = {
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  p: number;
  dur: number;
  delay: number;
  stream: 0 | 1;
  node: number;
  ambient: boolean;
};

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

    const arrived = NODES.map(() => false);
    const lit = NODES.map(() => 0);
    const flash = NODES.map(() => 0);
    const edgeP = EDGES.map(() => 0);
    let particles: Particle[] = [];
    let ambientIn = 1200;

    const makeParticle = (node: number, delay: number, ambient: boolean): Particle => {
      const stream = (node % 2) as 0 | 1;
      const [sx, sy] = SOURCES[stream];
      const [tx, ty] = NODES[node];
      const dist = Math.hypot(tx - sx, ty - sy);
      return {
        sx,
        sy,
        cx: 0.34,
        cy: (sy + ty) / 2 + (node % 2 ? 0.07 : -0.07),
        tx,
        ty,
        p: 0,
        dur: ambient ? 1500 : 900 + dist * 700,
        delay,
        stream,
        node,
        ambient,
      };
    };

    const resetAssembly = () => {
      particles = NODES.map((_, i) => makeParticle(i, 250 + i * 140, false));
    };

    const finishState = () => {
      particles = [];
      arrived.fill(true);
      lit.fill(1);
      flash.fill(0);
      edgeP.fill(1);
    };

    const bez = (pt: Particle, q: number): [number, number] => {
      const u = 1 - q;
      return [
        u * u * pt.sx + 2 * u * q * pt.cx + q * q * pt.tx,
        u * u * pt.sy + 2 * u * q * pt.cy + q * q * pt.ty,
      ];
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

      // Advance particles
      for (const pt of particles) {
        if (pt.delay > 0) {
          pt.delay -= dt;
          continue;
        }
        pt.p += dt / pt.dur;
        if (pt.p >= 1) {
          flash[pt.node] = 1;
          if (!pt.ambient) arrived[pt.node] = true;
        }
      }
      particles = particles.filter((pt) => pt.p < 1);

      for (let i = 0; i < NODES.length; i++) {
        if (arrived[i]) lit[i] = Math.min(1, lit[i] + dt / 450);
        flash[i] = Math.max(0, flash[i] - dt / 600);
      }
      EDGES.forEach(([a, b], i) => {
        if (lit[a] > 0.55 && lit[b] > 0.55) {
          edgeP[i] = Math.min(1, edgeP[i] + dt / 500);
        }
      });

      // Ambient flow once the graph has assembled
      if (arrived.every(Boolean) && !reduced) {
        ambientIn -= dt;
        if (ambientIn <= 0) {
          const node = Math.floor(Math.random() * NODES.length);
          particles.push(makeParticle(node, 0, true));
          ambientIn = 900 + Math.random() * 1100;
        }
      }

      // Draw
      ctx.clearRect(0, 0, w, h);
      const s = Math.min(w, h) / 420;

      SOURCES.forEach(([x, y], i) => {
        const col = i === 0 ? colors.primary : colors.secondary;
        const pulse = reduced ? 1 : 1 + 0.15 * Math.sin(time / 700 + i * 2);
        dot(mx(x) * w, y * h, 9 * s, col, 0.1);
        dot(mx(x) * w, y * h, 3.5 * s * pulse, col, 0.9);
      });

      ctx.lineWidth = Math.max(1, s);
      EDGES.forEach(([a, b], i) => {
        const p = edgeP[i];
        if (p <= 0) return;
        const ax = mx(NODES[a][0]) * w;
        const ay = NODES[a][1] * h;
        const bx = mx(NODES[b][0]) * w;
        const by = NODES[b][1] * h;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (bx - ax) * p, ay + (by - ay) * p);
        ctx.strokeStyle = `hsl(${colors.line} / ${0.35 * p})`;
        ctx.stroke();
      });

      for (const pt of particles) {
        if (pt.delay > 0) continue;
        const col = pt.stream === 0 ? colors.primary : colors.secondary;
        for (let k = 0; k < 3; k++) {
          const q = pt.p - k * 0.04;
          if (q <= 0) continue;
          const [x, y] = bez(pt, q);
          const base = pt.ambient ? 0.45 : 0.85;
          dot(mx(x) * w, y * h, (2.4 - k * 0.6) * s, col, base * (1 - k * 0.3));
        }
      }

      NODES.forEach(([x, y], i) => {
        const a = lit[i];
        if (a <= 0) return;
        const col = i % 2 === 0 ? colors.primary : colors.secondary;
        const pulse = reduced ? 1 : 1 + 0.08 * Math.sin(time / 900 + i * 1.7);
        const r = (i === 12 ? 4.4 : 3.2) * s * pulse;
        dot(mx(x) * w, y * h, r * 3, col, 0.07 * a + flash[i] * 0.15);
        dot(mx(x) * w, y * h, r, col, 0.6 * a + flash[i] * 0.35);
      });
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
      <span className="absolute start-3 top-[10%] inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {labels.uni}
      </span>
      <span className="absolute bottom-[10%] start-3 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
        {labels.step1}
      </span>
      <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-secondary" />
        {labels.one}
      </span>
    </div>
  );
}
