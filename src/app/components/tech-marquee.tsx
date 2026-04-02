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
    className="marquee-item flex items-center gap-3 px-4 py-2 flex-shrink-0 transition-all duration-300 cursor-pointer"
    style={{
      background: "rgba(13, 14, 15, 0.6)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(62, 207, 178, 0.15)",
      borderRadius: "8px",
    }}
    title={tech.name}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.borderColor = "rgba(62, 207, 178, 0.35)";
      e.currentTarget.style.background = "rgba(97, 236, 205, 0.05)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(62, 207, 178, 0.15)";
      e.currentTarget.style.background = "rgba(13, 14, 15, 0.6)";
    }}
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
    <section
      className="py-6 overflow-hidden"
    >
      <div
        className="marquee-wrapper relative w-full"
        onMouseEnter={(e) => {
          const track = e.currentTarget.querySelector(".marquee-track") as HTMLElement;
          if (track) track.style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          const track = e.currentTarget.querySelector(".marquee-track") as HTMLElement;
          if (track) track.style.animationPlayState = "running";
        }}
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
          {/* Set 3 (extra buffer to prevent gaps) */}
          {technologies.map((tech, i) => (
            <TechItem key={`dup2-${i}`} tech={tech} />
          ))}
        </div>
      </div>

      <style>
        {`
          .marquee-wrapper {
            overflow: hidden;
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 40s linear infinite;
            will-change: transform;
          }
          .marquee-item {
            margin: 0 8px;
          }
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-100% / 3));
            }
          }
        `}
      </style>
    </section>
  );
}
