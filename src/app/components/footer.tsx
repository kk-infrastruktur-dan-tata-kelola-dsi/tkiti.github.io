import { Separator } from "./ui/separator";
import { Map } from "./ui/map";
import { useLocation, useNavigate } from "react-router";
import { Github, Linkedin, Mail, Instagram, MapPin } from "lucide-react";
import { useContent } from "../hooks/useContent";

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data } = useContent("footer");

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();

    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({ top: offsetTop, behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - 80;
          window.scrollTo({ top: offsetTop, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const links = [
    { name: "SEJARAH", href: "#sejarah", id: "sejarah" },
    { name: "KEGIATAN", href: "#kegiatan", id: "kegiatan" },
    { name: "STRUKTUR", href: "#struktur", id: "struktur" },
    { name: "GALLERY", href: "#gallery", id: "gallery" },
    { name: "KONTAK", href: "#kontak", id: "kontak" },
  ];

  const socialLinks = [
    { icon: Mail, href: data["footer.email_link"] ?? "mailto:tkiti@ft.unand.ac.id", label: "Email" },
    { icon: Instagram, href: data["footer.instagram_link"] ?? "https://instagram.com/lab_TATI", label: "Instagram" },
    { icon: Linkedin, href: data["footer.linkedin_link"] ?? "https://linkedin.com/company/tkiti-unand", label: "LinkedIn" },
    { icon: Github, href: data["footer.github_link"] ?? "https://github.com/tkiti-unand", label: "GitHub" },
  ];

  const footerBrand = data["footer.brand"] ?? "TKITI";
  const footerDescription = data["footer.description"] ?? "Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi";
  const footerBadge = data["footer.badge"] ?? "[ SISTEM INFORMASI · UNAND ]";
  const footerEmail = data["footer.email"] ?? "tkiti@ft.unand.ac.id";
  const footerAddress = data["footer.address"] ?? "Gedung Teknologi Informasi, Lantai 2";
  const footerAddress2 = data["footer.address2"] ?? "Departemen Sistem Informasi, Universitas Andalas";
  const footerCopyright = data["footer.copyright"] ?? "© 2024 LABORATORIUM TKITI — DEPARTEMEN SISTEM INFORMASI";
  const footerPrivacy = data["footer.privacy"] ?? "PRIVACY";
  const footerTerms = data["footer.terms"] ?? "TERMS";

  return (
    <footer
      className="relative w-full border-t"
      style={{
        background: "rgba(7, 8, 9, 0.95)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(62, 207, 178, 0.15)",
      }}
    >
      <div className="mx-auto max-w-7xl px-8 py-16">
        <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div
                className="mb-4 font-bold tracking-[0.3em]"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "28px",
                  color: "#3ECFB2",
                }}
              >
                {footerBrand}
              </div>
              <p
                className="mb-6 leading-relaxed"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "13px",
                  color: "rgba(227, 226, 227, 0.5)",
                  lineHeight: "1.7",
                }}
              >
                {footerDescription}
              </p>
              <div
                className="inline-block px-3 py-2 text-xs font-bold tracking-wider"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  background: "rgba(62, 207, 178, 0.1)",
                  border: "1px solid rgba(62, 207, 178, 0.3)",
                  color: "#3ECFB2",
                }}
              >
                {footerBadge}
              </div>
            </div>

            <div>
              <h3
                className="mb-6 font-bold uppercase tracking-wider"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "14px",
                  color: "#e3e2e3",
                }}
              >
                Quick Links
              </h3>
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleSectionClick(e, link.id)}
                    className="w-fit uppercase tracking-[0.15em] transition-all duration-300 hover:translate-x-1 hover:text-[#3ECFB2]"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "12px",
                      color: "rgba(227, 226, 227, 0.5)",
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3
                className="mb-6 font-bold uppercase tracking-wider"
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: "14px",
                  color: "#e3e2e3",
                }}
              >
                Resources
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="/article"
                  className="w-fit uppercase tracking-[0.15em] transition-all duration-300 hover:translate-x-1 hover:text-[#3ECFB2]"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px",
                    color: "rgba(227, 226, 227, 0.5)",
                  }}
                >
                  ARTICLES
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="group relative h-[300px] overflow-hidden"
              style={{
                background: "rgba(13, 14, 15, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(62, 207, 178, 0.2)",
              }}
            >
              <Map center={[-0.915475, 100.460229]} zoom={15} className="h-full w-full" showMarker markerColor="#3ECFB2" />
              <div
                className="absolute bottom-4 left-4 right-16 max-w-[280px] px-4 py-3"
                style={{
                  background: "rgba(7, 8, 9, 0.9)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(62, 207, 178, 0.3)",
                }}
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} style={{ color: "#3ECFB2", flexShrink: 0 }} />
                  <div>
                    <p
                      className="mb-1 font-bold"
                      style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        fontSize: "12px",
                        color: "#3ECFB2",
                      }}
                    >
                      LABORATORIUM TKITI
                    </p>
                    <p
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "11px",
                        color: "rgba(227, 226, 227, 0.7)",
                        lineHeight: "1.5",
                      }}
                    >
                      {footerAddress}
                      <br />
                      {footerAddress2}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex flex-col gap-2">
                <a
                  href={`mailto:${footerEmail}`}
                  className="group flex items-center gap-2 transition-colors hover:text-[#3ECFB2]"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: "12px",
                    color: "rgba(227, 226, 227, 0.6)",
                  }}
                >
                  <Mail size={14} className="group-hover:text-[#3ECFB2]" />
                  {footerEmail}
                </a>
              </div>

              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3 transition-transform duration-300 hover:scale-110"
                    aria-label={social.label}
                    style={{
                      background: "rgba(62, 207, 178, 0.1)",
                      border: "1px solid rgba(62, 207, 178, 0.2)",
                    }}
                  >
                    <social.icon
                      className="transition-colors group-hover:text-[#3ECFB2]"
                      size={18}
                      style={{ color: "rgba(227, 226, 227, 0.5)" }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" style={{ background: "rgba(62, 207, 178, 0.15)" }} />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p
            className="text-center uppercase tracking-[0.15em] md:text-left"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "11px",
              color: "rgba(227, 226, 227, 0.4)",
            }}
          >
            {footerCopyright}
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="uppercase tracking-[0.15em] transition-colors duration-300 hover:text-[#3ECFB2]"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "11px",
                color: "rgba(227, 226, 227, 0.4)",
              }}
            >
              {footerPrivacy}
            </a>
            <a
              href="#"
              className="uppercase tracking-[0.15em] transition-colors duration-300 hover:text-[#3ECFB2]"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "11px",
                color: "rgba(227, 226, 227, 0.4)",
              }}
            >
              {footerTerms}
            </a>
          </div>
        </div>
      </div>

      <div
        className="h-1 w-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(62, 207, 178, 0.3), transparent)",
        }}
      />
    </footer>
  );
}

