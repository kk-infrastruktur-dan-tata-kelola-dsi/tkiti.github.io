import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const [activeSection, setActiveSection] = useState<string>("beranda");

  const navItems = useMemo(
    () => [
      { label: "Beranda", id: "beranda" },
      { label: "Sejarah", id: "sejarah" },
      { label: "Kegiatan", id: "kegiatan" },
      { label: "Struktur", id: "struktur" },
      { label: "Gallery", id: "gallery" },
      { label: "Kontak", id: "kontak" },
    ],
    [],
  );

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();

    // If we're already on the home page, just scroll to the section
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop - 80; // Account for fixed navbar height
        setActiveSection(sectionId);
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    } else {
      // If we're on a different page, navigate to home first, then scroll
      navigate(`/${sectionId}`);
      // Don't set activeSection here - let the useEffect handle it after navigation
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

  useEffect(() => {
    const pathSectionMap: Record<string, string> = {
      "/": "beranda",
      "/sejarah": "sejarah",
      "/kegiatan": "kegiatan",
      "/struktur": "struktur",
      "/gallery": "gallery",
      "/kontak": "kontak",
    };
    const sectionFromPath = pathSectionMap[location.pathname];

    // If we're on a section page, set that section as active
    if (sectionFromPath) {
      setActiveSection(sectionFromPath);
      return;
    }

    // Clear active section on non-home, non-section pages (e.g. /article, /article/:slug)
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    // Only on home page: listen to scroll to determine active section
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    const onScroll = () => {
      const marker = window.scrollY + 120;
      let current = "beranda"; // Default to beranda when at top
      for (const section of sections) {
        if (marker >= section.offsetTop) current = section.id;
      }
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, navItems]);

  return (
    <nav 
      className="fixed top-0 w-full z-50 border-b"
      style={{
        background: 'rgba(7, 8, 9, 0.6)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(62, 207, 178, 0.15)',
        boxShadow: '0 0 40px rgba(62, 207, 178, 0.1)',
      }}
    >
      <div className="flex justify-between items-center px-8 h-20 max-w-full mx-auto">
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            if (location.pathname !== '/') {
              navigate('/');
              setTimeout(() => {
                const element = document.getElementById('beranda');
                if (element) {
                  const offsetTop = element.offsetTop - 80;
                  window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                  });
                }
              }, 100);
            } else {
              const element = document.getElementById('beranda');
              if (element) {
                const offsetTop = element.offsetTop - 80;
                window.scrollTo({
                  top: offsetTop,
                  behavior: 'smooth'
                });
              }
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <img
            src={logoSrc}
            alt="TKITI Logo"
            className="h-10 w-auto"
          />
        </a>

        <div className="hidden md:flex items-center gap-12">
          {navItems.slice(1).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleSectionClick(e, item.id)}
              className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] transition-colors duration-300"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '14px',
                color: activeSection === item.id ? '#3ECFB2' : 'rgba(227, 226, 227, 0.6)',
              }}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/article"
            className="uppercase tracking-[0.15em] hover:text-[#3ECFB2] transition-colors duration-300"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '14px',
              color: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? '#3ECFB2' : 'rgba(227, 226, 227, 0.6)',
            }}
          >
            Article
          </Link>
        </div>

        <button 
          onClick={(e) => handleSectionClick(e as any, 'kontak')}
          className="px-6 py-2 font-bold tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            background: '#3ECFB2',
            color: '#00382e',
            borderRadius: '2px',
          }}
        >
          HUBUNGI KAMI
        </button>
      </div>
    </nav>
  );
}
