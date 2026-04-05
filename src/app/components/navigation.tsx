import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const [activeSection, setActiveSection] = useState<string>("beranda");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetTop = element.offsetTop - 80;
        setActiveSection(sectionId);
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    } else {
      navigate(`/${sectionId}`);
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

    if (sectionFromPath) {
      setActiveSection(sectionFromPath);
      return;
    }

    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    sectionsRef.current = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    const onScroll = () => {
      const marker = window.scrollY + 120;
      let current = "beranda";
      for (const section of sectionsRef.current) {
        if (marker >= section.offsetTop) current = section.id;
      }
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, navItems]);

  // Separate effect for navbar transparency
  useEffect(() => {
    if (location.pathname !== '/') {
      setScrolled(true);
      return;
    }
    setScrolled(false);
    const handleScroll = () => setScrolled(window.scrollY > 100);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const isOnHome = location.pathname === '/';
  const isTransparent = isOnHome && !scrolled;

  return (
    <nav
      className="fixed top-0 w-full z-50"
      style={isTransparent ? {
        background: 'transparent',
        backdropFilter: 'none',
        borderBottom: 'none',
        boxShadow: 'none',
        WebkitBackdropFilter: 'none',
      } : {
        background: 'rgba(7, 8, 9, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 1px 20px rgba(0, 0, 0, 0.5)',
        WebkitBackdropFilter: 'blur(16px)',
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
              background: mobileMenuOpen ? 'transparent' : '#61ECCD',
              transform: mobileMenuOpen ? 'rotate(45deg) translate(2px, 2px)' : 'none',
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: mobileMenuOpen ? 'transparent' : '#61ECCD',
              opacity: mobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all duration-300"
            style={{
              background: mobileMenuOpen ? 'transparent' : '#61ECCD',
              transform: mobileMenuOpen ? 'rotate(-45deg) translate(2px, -2px)' : 'none',
            }}
          />
        </button>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.slice(1).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleSectionClick(e, item.id)}
              className="relative uppercase tracking-[0.1em] transition-all duration-300 px-3 py-1.5"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                color: activeSection === item.id ? '#61ECCD' : 'rgba(227, 226, 227, 0.8)',
              }}
            >
              {item.label}
              {/* Active indicator — bottom dot */}
              {activeSection === item.id && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: '#61ECCD' }}
                />
              )}
            </a>
          ))}
          <Link
            to="/article"
            className="relative uppercase tracking-[0.1em] transition-all duration-300 px-3 py-1.5"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              color: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? '#61ECCD' : 'rgba(227, 226, 227, 0.8)',
            }}
          >
            Article
            {(location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ background: '#61ECCD' }}
              />
            )}
          </Link>
        </div>

        <button
          onClick={(e) => handleSectionClick(e as any, 'kontak')}
          className="hidden md:block px-5 py-2 font-bold tracking-[0.12em] hover:text-white outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            background: '#070809',
            color: 'rgba(227, 226, 227, 0.9)',
            borderRadius: '2px',
            border: '1px solid rgba(227, 226, 227, 0.3)',
            outline: 'none',
            boxShadow: 'none',
            transition: 'color 0.2s',
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
            borderColor: 'rgba(255, 255, 255, 0.08)',
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
                  color: activeSection === item.id ? '#61ECCD' : 'rgba(227, 226, 227, 0.8)',
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
                color: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? '#61ECCD' : 'rgba(227, 226, 227, 0.8)',
                borderColor: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.55)' : 'rgba(62, 207, 178, 0.22)',
                background: (location.pathname === '/article' || /^\/article\/[^/]+$/.test(location.pathname)) ? 'rgba(62, 207, 178, 0.10)' : 'rgba(7, 8, 9, 0.35)',
              }}
            >
              Article
            </Link>
            <button
              onClick={(e) => handleSectionClick(e as any, 'kontak')}
              className="mt-2 px-6 py-2 font-bold tracking-[0.15em] hover:text-white outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
                background: '#070809',
                color: 'rgba(227, 226, 227, 0.9)',
                borderRadius: '2px',
                border: '1px solid rgba(227, 226, 227, 0.3)',
                outline: 'none',
                boxShadow: 'none',
                transition: 'color 0.2s',
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
