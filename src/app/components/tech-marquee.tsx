import {
  siProxmox,
  siLinux,
  siDocker,
  siNginx,
  siNodedotjs,
  siTypescript,
  siReact,
  siPython,
  siGit,
  siUbuntu,
  siCloudflare,
} from "simple-icons";

const technologies = [
  { name: "Proxmox", svg: siProxmox.svg, color: `#${siProxmox.hex}` },
  { name: "Linux", svg: siLinux.svg, color: `#${siLinux.hex}` },
  { name: "Docker", svg: siDocker.svg, color: `#${siDocker.hex}` },
  { name: "Nginx", svg: siNginx.svg, color: `#${siNginx.hex}` },
  { name: "Node.js", svg: siNodedotjs.svg, color: `#${siNodedotjs.hex}` },
  { name: "TypeScript", svg: siTypescript.svg, color: `#${siTypescript.hex}` },
  { name: "React", svg: siReact.svg, color: `#${siReact.hex}` },
  { name: "Python", svg: siPython.svg, color: `#${siPython.hex}` },
  { name: "Git", svg: siGit.svg, color: `#${siGit.hex}` },
  { name: "Ubuntu", svg: siUbuntu.svg, color: `#${siUbuntu.hex}` },
  { name: "Cloudflare", svg: siCloudflare.svg, color: `#${siCloudflare.hex}` },
];

function applyColor(svgString: string, color: string): string {
  return svgString.replace(
    /<svg([^>]*)>/,
    `<svg$1 fill="${color}">`
  );
}

const TechItem = ({ tech }: { tech: typeof technologies[0] }) => (
  <div
    className="marquee-item flex items-center gap-3 px-4 py-2 flex-shrink-0 cursor-pointer"
    title={tech.name}
  >
    <div
      className="flex items-center justify-center"
      style={{ width: "28px", height: "28px" }}
      dangerouslySetInnerHTML={{
        __html: applyColor(tech.svg, tech.color),
      }}
    />
    <span
      className="text-xs font-medium whitespace-nowrap"
      style={{
        fontFamily: "JetBrains Mono, monospace",
        color: "#e3e2e3",
      }}
    >
      {tech.name}
    </span>
  </div>
);

export function TechMarquee() {
  return (
    <section className="relative bg-[#070809]" style={{ overflow: 'visible', zIndex: 5 }}>
      <div style={{ paddingTop: '48px', paddingBottom: '32px', overflow: 'visible' }}>
        <div
          className="marquee-wrapper relative w-full"
          style={{ overflow: 'hidden', paddingTop: '8px', marginTop: '-8px' }}
        >
          <div className="marquee-track flex items-center">
            {/* Set 1 */}
            {technologies.map((tech, i) => (
              <TechItem key={i} tech={tech} />
            ))}
            {/* Set 2 (duplicate for seamless loop) */}
            {technologies.map((tech, i) => (
              <TechItem key={`dup1-${i}`} tech={tech} />
            ))}
          </div>
        </div>
        {/* Fade masks — items appear/disappear from darkness */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#070809] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#070809] to-transparent z-10" />
      </div>

      <style>{`
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 60s linear infinite;
          will-change: transform;
        }
        .marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }
        .marquee-item {
          margin: 0 8px;
          transition: all 0.3s ease;
          background: rgba(13, 14, 15, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(62, 207, 178, 0.15);
          border-radius: 8px;
        }
        .marquee-item:hover {
          transform: translateY(-6px);
          border-color: rgba(62, 207, 178, 0.35);
          background: rgba(97, 236, 205, 0.05);
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 2));
          }
        }
      `}</style>
    </section>
  );
}
