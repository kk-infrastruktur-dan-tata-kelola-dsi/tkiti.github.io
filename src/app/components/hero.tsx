import { motion } from "motion/react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useContent } from "../hooks/useContent";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsMobile } from "./ui/use-mobile";
import { BackgroundPaths } from "@/app/components/ui/background-paths";
import tkiti3dSnippet from "@/app/assets/tkiti-3dsvg-snippet.txt?raw";

const SVG3D = lazy(() => import("3dsvg").then((m) => ({ default: m.SVG3D })));
const heroEase = [0.25, 0.46, 0.45, 0.94] as const;

function extractSvgMarkup(source: string): string {
  const start = source.indexOf("<svg");
  const end = source.indexOf("</svg>");
  if (start === -1 || end === -1 || end <= start) return "";
  return source.slice(start, end + "</svg>".length);
}

export function Hero() {
  const [show3D, setShow3D] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const { data } = useContent("hero");

  const svgMarkup = useMemo(() => extractSvgMarkup(tkiti3dSnippet), []);

  useEffect(() => {
    if (reduceMotion) {
      setShow3D(true);
      return;
    }
    const id = setTimeout(() => setShow3D(true), isMobile ? 1000 : 650);
    return () => clearTimeout(id);
  }, [isMobile, reduceMotion]);

  const subtitle =
    data["hero.subtitle"] ?? "SISTEM INFORMASI · UNIVERSITAS ANDALAS";
  const title = data["hero.title"] ?? "Laboratorium Tata Kelola &";
  const highlight =
    data["hero.highlight"] ?? "Infrastruktur Teknologi Informasi";
  const description =
    data["hero.description"] ??
    "Kelompok keahlian yang memetakan secara mendalam berbagai aspek infrastruktur teknologi informasi — dari perancangan jaringan, konfigurasi server, hingga deployment aplikasi dan layanan web.";
  const ctaPrimary = data["hero.cta_primary"] ?? "Mulai Eksplorasi";
  const ctaSecondary = data["hero.cta_secondary"] ?? "Pelajari Sejarah";

  return (
    <section
      className="relative flex min-h-[80vh] items-center overflow-hidden px-6 lg:px-16"
      style={{ background: "#070809" }}
    >
      <BackgroundPaths />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 py-20 lg:flex-row lg:gap-0">
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.12, ease: heroEase }}
            className="mb-4 tracking-[0.3em]"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "11px",
              color: "#61eccd",
            }}
          >
            {subtitle}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.24, ease: heroEase }}
            className="mb-6 font-bold tracking-tighter"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "clamp(30px, 4.2vw, 58px)",
              lineHeight: 1.1,
              color: "#e3e2e3",
            }}
          >
            {title} <br />
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ color: "#3ECFB2" }}
            >
              {highlight}
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.36, ease: heroEase }}
            className="mb-8 max-w-xl leading-relaxed"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "clamp(13px, 1.2vw, 16px)",
              color: "#bbcac4",
            }}
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.48, ease: heroEase }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <motion.button
              className="flex items-center justify-center gap-2 px-8 py-4 font-bold tracking-[0.15em] transition-all"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                background: "#3ECFB2",
                color: "#005446",
                borderRadius: "2px",
                boxShadow: "0 0 40px rgba(62, 207, 178, 0.1)",
              }}
              whileHover={{
                y: -3,
                boxShadow: "0 0 50px rgba(62, 207, 178, 0.25)",
              }}
              transition={{ duration: 0.25 }}
              onClick={() => navigate("/kegiatan")}
            >
              {ctaPrimary}
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </motion.button>

            <motion.button
              className="border px-8 py-4 tracking-[0.15em] transition-all"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                borderColor: "rgba(60, 74, 69, 0.3)",
                color: "#e3e2e3",
                borderRadius: "2px",
              }}
              whileHover={{ y: -3, backgroundColor: "#292a2b" }}
              transition={{ duration: 0.25 }}
              onClick={() => navigate("/sejarah")}
            >
              {ctaSecondary}
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          className="flex flex-1 items-center justify-center"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: heroEase }}
          style={{
            minHeight: isMobile ? 420 : 560,
            willChange: "opacity, transform",
          }}
        >
          <div
            style={{
              filter: "drop-shadow(0 0 34px rgba(62, 207, 178, 0.22))",
              width: "100%",
              maxWidth: isMobile ? 420 : 560,
              height: isMobile ? 420 : 560,
              overflow: "visible",
              contain: "layout paint style",
            }}
          >
            {show3D && svgMarkup ? (
              <Suspense fallback={null}>
                <SVG3D
                  svg={svgMarkup}
                  smoothness={0.1}
                  color="#3ECFB2"
                  material="rubber"
                  metalness={0}
                  roughness={0.9}
                  depth={isMobile ? 1.1 : 1.35}
                  animate={reduceMotion ? undefined : "spin"}
                  animateSpeed={isMobile ? 0.35 : 0.45}
                  zoom={isMobile ? 5.2 : 6}
                  width="100%"
                  height="100%"
                />
              </Suspense>
            ) : null}
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-[#070809] to-transparent" />
    </section>
  );
}
