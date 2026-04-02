import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useContent } from "../hooks/useContent";
import { BackgroundPaths } from "@/app/components/ui/background-paths";

const heroEase = [0.25, 0.46, 0.45, 0.94] as const;

export function Hero() {
  const navigate = useNavigate();
  const { data } = useContent("hero");
  const subtitle = data["hero.subtitle"] ?? "SISTEM INFORMASI · UNIVERSITAS ANDALAS";
  const title = data["hero.title"] ?? "Laboratorium Tata Kelola &";
  const highlight = data["hero.highlight"] ?? "Infrastruktur Teknologi Informasi";
  const description =
    data["hero.description"] ??
    "Kelompok keahlian yang memetakan secara mendalam berbagai aspek infrastruktur teknologi informasi — dari perancangan jaringan, konfigurasi server, hingga deployment aplikasi dan layanan web.";
  const ctaPrimary = data["hero.cta_primary"] ?? "Mulai Eksplorasi";
  const ctaSecondary = data["hero.cta_secondary"] ?? "Pelajari Sejarah";

  return (
    <section className="relative flex flex-col items-center justify-center px-6 text-center overflow-hidden min-h-[70vh] py-12">
      <BackgroundPaths />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: heroEase }}
          className="tracking-[0.3em] mb-4"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            color: '#61eccd',
          }}
        >
          {subtitle}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.24, ease: heroEase }}
          className="font-bold tracking-tighter mb-6"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 'clamp(40px, 7vw, 80px)',
            lineHeight: 1.1,
            color: '#e3e2e3',
          }}
        >
          {title} <br />
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{ color: '#3ECFB2' }}
          >
            {highlight}
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.36, ease: heroEase }}
          className="max-w-2xl mx-auto mb-8 leading-relaxed"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#bbcac4',
          }}
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.48, ease: heroEase }}
          className="flex flex-col md:flex-row gap-4 justify-center"
        >
          <motion.button
            className="px-8 py-4 font-bold tracking-[0.15em] flex items-center gap-2 justify-center transition-all"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: '#3ECFB2',
              color: '#005446',
              borderRadius: '2px',
              boxShadow: '0 0 40px rgba(62, 207, 178, 0.1)',
            }}
            whileHover={{ y: -3, boxShadow: '0 0 50px rgba(62, 207, 178, 0.25)' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate("/kegiatan")}
          >
            {ctaPrimary}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>

          <motion.button
            className="border px-8 py-4 tracking-[0.15em] transition-all"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              borderColor: 'rgba(60, 74, 69, 0.3)',
              color: '#e3e2e3',
              borderRadius: '2px',
            }}
            whileHover={{ y: -3, backgroundColor: '#292a2b' }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate("/sejarah")}
          >
            {ctaSecondary}
          </motion.button>
        </motion.div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#070809] to-transparent" />
    </section>
  );
}
