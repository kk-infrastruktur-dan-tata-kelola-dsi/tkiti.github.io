"use client";

import { motion } from "motion/react";

// Gaussian opacity: brightest at center (i=17), dimmer at edges (i=0,35)
function gaussianOpacity(i: number, center: number, spread: number): number {
  const minOp = 0.12;
  const maxOp = 0.75;
  const dist = Math.pow(i - center, 2) / (2 * spread * spread);
  return minOp + maxOp * Math.exp(-dist);
}

function FloatingPaths({
  position,
  layer,
}: {
  position: number;
  layer: "bg" | "mid" | "fg";
}) {
  const layerConfig = {
    bg: { count: 12, startI: 0, speedMult: 0.75, widthMult: 0.6, opMult: 0.5 },
    mid: { count: 12, startI: 12, speedMult: 0.55, widthMult: 1.0, opMult: 0.85 },
    fg: { count: 12, startI: 24, speedMult: 0.4, widthMult: 1.3, opMult: 1.0 },
  }[layer];

  const paths = Array.from({ length: layerConfig.count }, (_, j) => {
    const i = layerConfig.startI + j;
    // Single S-wave designed for 1920x1080, shifted +200px right
    const d = `M${-180 - i * 5 * position} ${-189 + i * 6}C${-180 - i * 5 * position} ${-189 + i * 6} ${-112 - i * 5 * position} ${216 - i * 6} ${352 - i * 5 * position} ${343 - i * 6}C${816 - i * 5 * position} ${470 - i * 6} ${884 - i * 5 * position} ${875 - i * 6} ${884 - i * 5 * position} ${875 - i * 6}`;
    return {
      id: i,
      d,
      width: (0.3 + i * 0.015) * layerConfig.widthMult,
      opacity: gaussianOpacity(i, 17, 10) * layerConfig.opMult,
      duration: (12 + i * 0.3) * layerConfig.speedMult,
      delay: i * 0.08,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-[#61ECCD]"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((path) => (
          <motion.path
            key={`${layer}-${path.id}`}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            strokeLinecap="round"
            initial={{ pathLength: 0.15, opacity: path.opacity * 0.25 }}
            animate={{
              pathLength: [0.15, 0.95, 0.15],
              opacity: [path.opacity * 0.25, path.opacity, path.opacity * 0.25],
            }}
            transition={{
              duration: path.duration,
              delay: path.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Teal glow shifted further down */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(97,236,205,0.06),transparent_50%)]" />
      {/* 3-layer parallax */}
      <FloatingPaths position={1} layer="bg" />
      <FloatingPaths position={-1} layer="bg" />
      <FloatingPaths position={1} layer="mid" />
      <FloatingPaths position={-1} layer="mid" />
      <FloatingPaths position={1} layer="fg" />
      <FloatingPaths position={-1} layer="fg" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,9,0.05)_0%,rgba(7,8,9,0.12)_65%,rgba(7,8,9,0.4)_100%)]" />
      {/* Solid dark cover behind navbar area, then fade to transparent */}
      <div className="absolute inset-x-0 top-0 h-48 z-10" style={{ background: 'linear-gradient(180deg, #070809 0%, #070809 50%, transparent 100%)' }} />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070809] to-transparent z-10" />
    </div>
  );
}
