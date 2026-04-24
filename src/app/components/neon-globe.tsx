import { useEffect, useRef } from "react";
import { geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import { mesh } from "topojson-client";

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
const FG = "#3ECFB2";
const CFG = { glow: 1.16, halo: 81, pulse: 0.44, speed: 1.6, whirl: 0.68 } as const;

const graticule = geoGraticule10();
let worldCache: { borders: GeoJSON.MultiLineString; outline: GeoJSON.MultiLineString } | null = null;

function hexA(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

async function loadWorld() {
  if (worldCache) return worldCache;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topo: any = await fetch(WORLD_URL).then(r => r.json());
  worldCache = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    borders: mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outline: mesh(topo, topo.objects.countries, (a: any, b: any) => a === b),
  };
  return worldCache;
}

export function NeonGlobe({ size = 400 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d", { alpha: true })!;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const R = size * 0.32;
    const C = size / 2;
    const K = size / 400;

    const proj = geoOrthographic().scale(R).translate([C, C]).clipAngle(90).precision(0.6);
    const pathFn = geoPath(proj, ctx);

    // Pre-render halo to offscreen canvas
    const halo = document.createElement("canvas");
    halo.width = size * dpr;
    halo.height = size * dpr;
    const hx = halo.getContext("2d")!;
    hx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hPx = CFG.halo * K;
    const grad = hx.createRadialGradient(C, C, R * 0.8, C, C, R + hPx);
    grad.addColorStop(0, hexA(FG, 0.38));
    grad.addColorStop(0.35, hexA(FG, 0.18));
    grad.addColorStop(1, hexA(FG, 0));
    hx.fillStyle = grad;
    hx.beginPath();
    hx.arc(C, C, R + hPx, 0, Math.PI * 2);
    hx.fill();

    const parts = Array.from({ length: 36 }, () => ({
      rN: 1.15 + Math.random() * 0.36,
      theta: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.5,
      len: 0.3 + Math.random() * 0.9,
      ecc: 0.88 + Math.random() * 0.2,
      tilt: Math.random() * Math.PI,
      phase: Math.random() * Math.PI * 2,
    }));

    let world: typeof worldCache = null;
    const t0 = performance.now();
    let last = 0;

    function tick(now: number) {
      if (now - last >= 15) {
        last = now;
        const t = (now - t0) / 1000;
        const pulse = 1 + CFG.pulse * 0.45 * Math.sin(t * 1.8);
        const glow = CFG.glow * pulse;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = Math.min(1, glow);
        ctx.drawImage(halo, 0, 0);
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Whirl particles
        const n = Math.floor(parts.length * CFG.whirl);
        ctx.save();
        ctx.translate(C, C);
        ctx.lineCap = "round";
        for (let i = 0; i < n; i++) {
          const p = parts[i];
          const a0 = p.theta + t * p.speed * (CFG.speed * 0.8 + 0.3);
          const fade = 0.45 + 0.55 * Math.sin(t * 0.6 + p.phase);
          const alpha = 0.4 * fade * CFG.glow;
          if (alpha < 0.02) continue;
          ctx.save();
          ctx.rotate(p.tilt);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.rN * R, p.rN * R * p.ecc, 0, a0, a0 + p.len);
          ctx.lineWidth = 1.2 * K;
          ctx.strokeStyle = hexA(FG, alpha);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        // Globe surface fill
        proj.rotate([(-40 + t * CFG.speed * 12) % 360, -18, 0]);
        ctx.fillStyle = hexA(FG, 0.06);
        ctx.beginPath();
        ctx.arc(C, C, R, 0, Math.PI * 2);
        ctx.fill();

        // Graticule
        ctx.lineWidth = 0.5 * K;
        ctx.strokeStyle = hexA(FG, 0.18);
        ctx.beginPath();
        pathFn(graticule);
        ctx.stroke();

        // Country outlines
        if (world) {
          ctx.save();
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.shadowColor = FG;
          ctx.shadowBlur = 10 * glow * K;
          ctx.lineWidth = 1.1 * K;
          ctx.strokeStyle = hexA(FG, 0.98);
          ctx.beginPath();
          pathFn(world.borders);
          pathFn(world.outline);
          ctx.stroke();
          ctx.restore();
        }

        // Globe rim
        ctx.save();
        ctx.lineWidth = 1.2 * K;
        ctx.strokeStyle = hexA(FG, 0.9);
        ctx.shadowColor = FG;
        ctx.shadowBlur = 6 * glow * K;
        ctx.beginPath();
        ctx.arc(C, C, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    loadWorld().then(w => { world = w; });
    rafRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(rafRef.current); };
  }, [size]);

  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: size, height: size }}
      />
    </div>
  );
}
