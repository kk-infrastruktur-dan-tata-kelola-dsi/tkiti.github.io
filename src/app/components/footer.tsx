import { Separator } from "./ui/separator";
import { Map } from "./ui/map";
import { useLocation, useNavigate } from "react-router";
import { Github, Linkedin, Mail, Instagram, MapPin, Phone } from "lucide-react";

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
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
    { icon: Mail, href: "mailto:labtisi.si@gmail.com", label: "Email" },
    { icon: Instagram, href: "https://instagram.com/lab_TATI", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/company/tkiti-unand", label: "LinkedIn" },
    { icon: Github, href: "https://github.com/tkiti-unand", label: "GitHub" },
  ];

  return (
    <footer 
      className="w-full border-t relative"
      style={{
        background: 'rgba(7, 8, 9, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(62, 207, 178, 0.15)',
      }}
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left Side - Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Column */}
            <div>
              <div 
                className="font-bold tracking-[0.3em] mb-4"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '28px',
                  color: '#3ECFB2',
                }}
              >
                TKITI
              </div>
              <p 
                className="mb-6 leading-relaxed"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  color: 'rgba(227, 226, 227, 0.5)',
                  lineHeight: '1.7',
                }}
              >
                Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi
              </p>
              <div
                className="inline-block px-3 py-2 text-xs font-bold tracking-wider"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(62, 207, 178, 0.1)',
                  border: '1px solid rgba(62, 207, 178, 0.3)',
                  color: '#3ECFB2',
                }}
              >
                [ SISTEM INFORMASI · UNAND ]
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 
                className="font-bold mb-6 uppercase tracking-wider"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '14px',
                  color: '#e3e2e3',
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
                    className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] hover:translate-x-1 transition-all duration-300 w-fit"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: 'rgba(227, 226, 227, 0.5)',
                    }}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Resources Column */}
            <div>
              <h3 
                className="font-bold mb-6 uppercase tracking-wider"
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '14px',
                  color: '#e3e2e3',
                }}
              >
                Resources
              </h3>
              <div className="flex flex-col gap-3">
                <a
                  href="/article"
                  className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] hover:translate-x-1 transition-all duration-300 w-fit"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'rgba(227, 226, 227, 0.5)',
                  }}
                >
                  ARTICLES
                </a>
                <a
                  href="#"
                  className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] hover:translate-x-1 transition-all duration-300 w-fit"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'rgba(227, 226, 227, 0.5)',
                  }}
                >
                  DOCUMENTATION
                </a>
                <a
                  href="#"
                  className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] hover:translate-x-1 transition-all duration-300 w-fit"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'rgba(227, 226, 227, 0.5)',
                  }}
                >
                  RESEARCH
                </a>
                <a
                  href="#"
                  className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] hover:translate-x-1 transition-all duration-300 w-fit"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'rgba(227, 226, 227, 0.5)',
                  }}
                >
                  TUTORIALS
                </a>
              </div>
            </div>
          </div>

          {/* Right Side - Map & Contact */}
          <div className="space-y-6">
            {/* Map Container */}
            <div
              className="relative h-[300px] overflow-hidden group"
              style={{
                background: 'rgba(13, 14, 15, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(62, 207, 178, 0.2)',
              }}
            >
              <Map
                center={[-0.915475, 100.460229]}
                zoom={15}
                className="h-full w-full"
                showMarker={true}
                markerColor="#3ECFB2"
              />

              {/* Overlay Info - positioned bottom-left to avoid zoom controls */}
              <div
                className="absolute bottom-4 left-4 right-16 px-4 py-3 max-w-[280px]"
                style={{
                  background: 'rgba(7, 8, 9, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(62, 207, 178, 0.3)',
                }}
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} style={{ color: '#3ECFB2', flexShrink: 0 }} />
                  <div>
                    <p
                      className="font-bold mb-1"
                      style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '12px',
                        color: '#3ECFB2',
                      }}
                    >
                      LABORATORIUM TKITI
                    </p>
                    <p
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: 'rgba(227, 226, 227, 0.7)',
                        lineHeight: '1.5',
                      }}
                    >
                      Fakultas Teknologi Informasi<br />
                      Universitas Andalas<br />
                      Departemen Sistem Informasi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info & Social */}
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
              {/* Contact Details */}
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:labtisi.si@gmail.com"
                  className="flex items-center gap-2 hover:text-[#3ECFB2] transition-colors group"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'rgba(227, 226, 227, 0.6)',
                  }}
                >
                  <Mail size={14} className="group-hover:text-[#3ECFB2]" />
                  labtisi.si@gmail.com
                </a>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3 hover:scale-110 transition-transform duration-300"
                    aria-label={social.label}
                    style={{
                      background: 'rgba(62, 207, 178, 0.1)',
                      border: '1px solid rgba(62, 207, 178, 0.2)',
                    }}
                  >
                    <social.icon 
                      className="group-hover:text-[#3ECFB2] transition-colors" 
                      size={18}
                      style={{ color: 'rgba(227, 226, 227, 0.5)' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" style={{ background: 'rgba(62, 207, 178, 0.15)' }} />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p 
            className="uppercase tracking-[0.15em] text-center md:text-left"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: 'rgba(227, 226, 227, 0.4)',
            }}
          >
            © 2024 LABORATORIUM TKITI — DEPARTEMEN SISTEM INFORMASI
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] transition-colors duration-300"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: 'rgba(227, 226, 227, 0.4)',
              }}
            >
              PRIVACY
            </a>
            <a
              href="#"
              className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] transition-colors duration-300"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: 'rgba(227, 226, 227, 0.4)',
              }}
            >
              TERMS
            </a>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div 
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(62, 207, 178, 0.3), transparent)',
        }}
      />
    </footer>
  );
}