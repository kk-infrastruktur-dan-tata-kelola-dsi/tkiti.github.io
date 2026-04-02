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
  return (
    <>
      <SEO />
      <main className="relative pt-20">
        <Hero />
        <TechMarquee />
        <Stats />
        <Activities />
        <History />
        <Structure />
        <Gallery />
        <Contact />
        <ImageCTA />
      </main>
    </>
  );
}
