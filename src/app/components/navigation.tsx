import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const [activeSection, setActiveSection] = useState<string>("beranda");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Cache section elements to avoid repeated DOM queries
  const sectionsRef = useRef<HTMLElement[]>([]);

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
    setMobileMenuOpen(false);

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

    // Only on home page: cache section elements and listen to scroll
    sectionsRef.current = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    const onScroll = () => {
      const marker = window.scrollY + 120;
      let current = "beranda"; // Default to beranda when at top
      for (const section of sectionsRef.current) {
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
      <div className="flex justify-between items-center px-4 md:px-8 h-20 max-w-full mx-auto">
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
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

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: mobileMenuOpen ? 'transparent' : '#3ECFB2',
              transform: mobileMenuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: mobileMenuOpen ? 'transparent' : '#3ECFB2',
              opacity: mobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: mobileMenuOpen ? 'transparent' : '#3ECFB2',
              transform: mobileMenuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
            }}
          />
        </button>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-3">
          {navItems.slice(1).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleSectionClick(e, item.id)}
              className="uppercase tracking-[0.12em] transition-colors duration-300 rounded-full border px-4 py-1.5"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: activeSection === item.id ? '#3ECFB2' : 'rgba(227, 226, 227, 0.72)',
                borderColor: activeSection === item.id ? 'rgba(62, 207, 178, 0.55)' : 'rgba(62, 207, 178, 0.22)',
                background: activeSection === item.id ? 'rgba(62, 207, 178, 0.10)' : 'rgba(7, 8, 9, 0.35)',
              }}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/article"
            className="uppercase tracking-[0.12em] transition-colors duration-300 rounded-full border px-4 py-1.5"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? '#3ECFB2' : 'rgba(227, 226, 227, 0.72)',
              borderColor: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.55)' : 'rgba(62, 207, 178, 0.22)',
              background: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.10)' : 'rgba(7, 8, 9, 0.35)',
            }}
          >
            Article
          </Link>
        </div>

        <button
          onClick={(e) => handleSectionClick(e as any, 'kontak')}
          className="hidden md:block px-6 py-2 font-bold tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all"
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

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: 'rgba(7, 8, 9, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(62, 207, 178, 0.15)',
          }}
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleSectionClick(e, item.id)}
                className="uppercase tracking-[0.12em] transition-colors duration-300 rounded-full border px-4 py-2 text-center"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: activeSection === item.id ? '#3ECFB2' : 'rgba(227, 226, 227, 0.72)',
                  borderColor: activeSection === item.id ? 'rgba(62, 207, 178, 0.55)' : 'rgba(62, 207, 178, 0.22)',
                  background: activeSection === item.id ? 'rgba(62, 207, 178, 0.10)' : 'rgba(7, 8, 9, 0.35)',
                }}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/article"
              onClick={() => setMobileMenuOpen(false)}
              className="uppercase tracking-[0.12em] transition-colors duration-300 rounded-full border px-4 py-2 text-center"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                color: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? '#3ECFB2' : 'rgba(227, 226, 227, 0.72)',
                borderColor: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.55)' : 'rgba(62, 207, 178, 0.22)',
                background: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.10)' : 'rgba(7, 8, 9, 0.35)',
              }}
            >
              Article
            </Link>
            <button
              onClick={(e) => handleSectionClick(e as any, 'kontak')}
              className="mt-2 px-6 py-2 font-bold tracking-[0.15em] hover:brightness-110 active:scale-95 transition-all"
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
        </div>
      )}
    </nav>
  );
}
