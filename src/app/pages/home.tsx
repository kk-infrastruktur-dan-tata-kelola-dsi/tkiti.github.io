import { useEffect } from "react";
import { useLocation } from "react-router";
import { Hero } from "../components/hero";
import { TechMarquee } from "../components/tech-marquee";
import { Stats } from "../components/stats";
import { Activities } from "../components/activities";
import { History } from "../components/history";
import { Structure } from "../components/structure";
import { Gallery } from "../components/gallery";
import { Contact } from "../components/contact";
import { ImageCTA } from "../components/image-cta";
import { SEO } from "../components/seo";

export function Home() {
  const location = useLocation();

  useEffect(() => {
    const pathSectionMap: Record<string, string> = {
      "/sejarah": "sejarah",
      "/kegiatan": "kegiatan",
      "/struktur": "struktur",
      "/gallery": "gallery",
      "/kontak": "kontak",
    };

    const fromPath = pathSectionMap[location.pathname];
    const fromHash = location.hash?.replace("#", "");
    const target = fromPath || fromHash;
    if (!target) return;

    const timeout = setTimeout(() => {
      const element = document.getElementById(target);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: "smooth" });
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return (
    <>
      <SEO />
      <main className="relative pt-20">
        <div id="beranda" className="scroll-mt-20">
          <Hero />
          <TechMarquee />
          <Stats />
          <Activities />
        </div>
        <History />
        <Structure />
        <Gallery />
        <Contact />
        <ImageCTA />
      </main>
    </>
  );
}
