"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { useReducedMotion } from "@/app/hooks/useReducedMotion";
import { useIsMobile } from "./use-mobile";

const NORMAL_LAYER_CONFIG = {
  bg: { count: 6, startI: 0, speedMult: 0.75, widthMult: 0.6, opMult: 0.45 },
  mid: { count: 6, startI: 6, speedMult: 0.55, widthMult: 1.0, opMult: 0.75 },
  fg: { count: 6, startI: 12, speedMult: 0.42, widthMult: 1.2, opMult: 0.92 },
} as const;

const COMPACT_LAYER_CONFIG = {
  bg: { count: 4, startI: 0, speedMult: 0.8, widthMult: 0.65, opMult: 0.4 },
  mid: { count: 4, startI: 5, speedMult: 0.62, widthMult: 0.95, opMult: 0.68 },
  fg: { count: 4, startI: 10, speedMult: 0.5, widthMult: 1.15, opMult: 0.85 },
} as const;

// Gaussian opacity: brightest at center, dimmer at edges
function gaussianOpacity(i: number, center: number, spread: number): number {
  const dist = Math.pow(i - center, 2) / (2 * spread * spread);
  return 0.1 + 0.65 * Math.exp(-dist);
}

// 8 paths per layer (down from 12), opacity-only animation (no pathLength)
function FloatingPaths({
  layer,
  density,
  reduceMotion,
}: {
  layer: "bg" | "mid" | "fg";
  density: "normal" | "compact";
  reduceMotion: boolean;
}) {
  const layerConfig =
    (density === "compact" ? COMPACT_LAYER_CONFIG : NORMAL_LAYER_CONFIG)[layer];

  const paths = useMemo(
    () =>
      Array.from({ length: layerConfig.count }, (_, j) => {
        const i = layerConfig.startI + j;
        const d = `M${-180 - i * 5} ${-189 + i * 6}C${-180 - i * 5} ${-189 + i * 6} ${-112 - i * 5} ${216 - i * 6} ${352 - i * 5} ${343 - i * 6}C${816 - i * 5} ${470 - i * 6} ${884 - i * 5} ${875 - i * 6} ${884 - i * 5} ${875 - i * 6}`;
        const op = gaussianOpacity(i, 10, 6.5) * layerConfig.opMult;
        return {
          id: i,
          d,
          width: (0.34 + i * 0.015) * layerConfig.widthMult,
          opMin: op * 0.28,
          opMax: op,
          duration: (16 + i * 0.45) * layerConfig.speedMult,
          delay: i * 0.12,
        };
      }),
    [
      layerConfig.count,
      layerConfig.startI,
      layerConfig.speedMult,
      layerConfig.widthMult,
      layerConfig.opMult,
    ],
  );

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'opacity' }}>
      <svg
        className="w-full h-full text-[#61ECCD]"
        viewBox="0 0 696 316"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        {paths.map((path) =>
          reduceMotion ? (
            <path
              key={`${layer}-${path.id}`}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeLinecap="round"
              opacity={path.opMax}
            />
          ) : (
            <motion.path
              key={`${layer}-${path.id}`}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeLinecap="round"
              animate={{ opacity: [path.opMin, path.opMax, path.opMin] }}
              transition={{
                duration: path.duration,
                delay: path.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ),
        )}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const density = isMobile ? "compact" : "normal";
  const layers = isMobile ? (["bg", "mid"] as const) : (["bg", "mid", "fg"] as const);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(97,236,205,0.05),transparent_52%)]" />
      {layers.map((layer) => (
        <FloatingPaths
          key={layer}
          layer={layer}
          density={density}
          reduceMotion={reduceMotion}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,9,0.05)_0%,rgba(7,8,9,0.12)_65%,rgba(7,8,9,0.4)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-48 z-10" style={{ background: 'linear-gradient(180deg, #070809 0%, #070809 50%, transparent 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070809] to-transparent z-10" />
    </div>
  );
}
