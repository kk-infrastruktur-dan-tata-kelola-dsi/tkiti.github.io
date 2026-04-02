"use client";

import { motion } from "motion/react";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.7 + i * 0.04,
    opacity: 0.18 + i * 0.015,
    duration: 20 + i * 0.35,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.map((path) => (
          <motion.path
            key={`${position}-${path.id}`}
            d={path.d}
            stroke="#3ECFB2"
            strokeWidth={path.width}
            strokeOpacity={path.opacity}
            initial={{ pathLength: 0.2, opacity: path.opacity * 0.7 }}
            animate={{
              pathLength: 1,
              opacity: [path.opacity * 0.6, path.opacity, path.opacity * 0.6],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function BackgroundPaths() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#070809]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(62,207,178,0.2),transparent_60%)]" />
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  );
}

