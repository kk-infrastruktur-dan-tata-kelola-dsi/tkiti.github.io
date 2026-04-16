import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../lib/api";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const DEFAULT_TITLE = "Lab TKITI — Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi";
const DEFAULT_DESCRIPTION = "Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi — Fokus pada riset, pengembangan, dan implementasi teknologi informasi di Departemen Sistem Informasi, Fakultas Teknologi Informasi, Universitas Andalas.";
const DEFAULT_IMAGE = `${import.meta.env.BASE_URL}images/og-home.png`;
const DEFAULT_IMAGE_ALT = "Tampilan awal website Laboratorium TKITI";
const FAVICON_IMAGE = `${import.meta.env.BASE_URL}images/logo.png`;
const DEFAULT_URL = SITE_URL;
const SITE_NAME = "Laboratorium TKITI";
const TWITTER_HANDLE = "@lab_TATI";

function detectImageMimeType(imageUrl: string): string {
  const cleanUrl = imageUrl.split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "image/jpeg";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".gif")) return "image/gif";
  if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
  return "image/png";
}

export function SEO({
  title,
  description,
  image,
  imageAlt,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
}: SEOProps) {
  const seoTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const seoDescription = description || DEFAULT_DESCRIPTION;
  const seoImage = image || DEFAULT_IMAGE;
  const isDefaultImage = !image;
  const seoUrl = url ? (url.startsWith("http") ? url : `${DEFAULT_URL}${url.startsWith("/") ? url : `/${url}`}`) : DEFAULT_URL;
  const fullImageUrl = seoImage.startsWith("http") ? seoImage : `${DEFAULT_URL}${seoImage}`;
  const imageMimeType = detectImageMimeType(fullImageUrl);
  const resolvedImageAlt = imageAlt || (type === "article" && title ? `Thumbnail artikel: ${title}` : DEFAULT_IMAGE_ALT);

  // JSON-LD Structured Data for Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Laboratorium TKITI",
    "alternateName": "Lab Tata Kelola & Infrastruktur Teknologi Informasi",
    "url": DEFAULT_URL,
    "logo": `${DEFAULT_URL}/images/logo.png`,
    "description": DEFAULT_DESCRIPTION,
    "parentOrganization": {
      "@type": "EducationalOrganization",
      "name": "Departemen Sistem Informasi",
      "parentOrganization": {
        "@type": "EducationalOrganization",
        "name": "Fakultas Teknologi Informasi",
        "parentOrganization": {
          "@type": "EducationalOrganization",
          "name": "Universitas Andalas"
        }
      }
    },
    "sameAs": [
      "https://instagram.com/lab_TATI",
      "https://linkedin.com/company/tkiti-unand",
      "https://github.com/tkiti-unand"
    ],
    "hasPart": [
      { "@type": "WebPage", "name": "Beranda", "url": `${DEFAULT_URL}/` },
      { "@type": "WebPage", "name": "Sejarah", "url": `${DEFAULT_URL}/sejarah` },
      { "@type": "WebPage", "name": "Kegiatan", "url": `${DEFAULT_URL}/kegiatan` },
      { "@type": "WebPage", "name": "Struktur", "url": `${DEFAULT_URL}/struktur` },
      { "@type": "WebPage", "name": "Gallery", "url": `${DEFAULT_URL}/gallery` },
      { "@type": "WebPage", "name": "Kontak", "url": `${DEFAULT_URL}/kontak` },
      { "@type": "WebPage", "name": "Article", "url": `${DEFAULT_URL}/article` }
    ]
  };

  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "TKITI Navigation",
    "itemListElement": [
      { "@type": "SiteNavigationElement", "position": 1, "name": "Beranda", "url": `${DEFAULT_URL}/` },
      { "@type": "SiteNavigationElement", "position": 2, "name": "Sejarah", "url": `${DEFAULT_URL}/sejarah` },
      { "@type": "SiteNavigationElement", "position": 3, "name": "Kegiatan", "url": `${DEFAULT_URL}/kegiatan` },
      { "@type": "SiteNavigationElement", "position": 4, "name": "Struktur", "url": `${DEFAULT_URL}/struktur` },
      { "@type": "SiteNavigationElement", "position": 5, "name": "Gallery", "url": `${DEFAULT_URL}/gallery` },
      { "@type": "SiteNavigationElement", "position": 6, "name": "Kontak", "url": `${DEFAULT_URL}/kontak` },
      { "@type": "SiteNavigationElement", "position": 7, "name": "Article", "url": `${DEFAULT_URL}/article` }
    ]
  };

  // JSON-LD Structured Data for Article (if applicable)
  const articleSchema = type === "article" ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": seoDescription,
    "image": fullImageUrl,
    "url": seoUrl,
    "author": author ? {
      "@type": "Person",
      "name": author
    } : undefined,
    "datePublished": publishedTime,
    "dateModified": modifiedTime,
    "publisher": {
      "@type": "EducationalOrganization",
      "name": "Laboratorium TKITI",
      "logo": {
        "@type": "ImageObject",
        "url": `${DEFAULT_URL}/images/logo.png`
      }
    }
  } : null;

  return (
    <Helmet>
      {/* Title */}
      <title>{seoTitle}</title>
      <meta name="title" content={seoTitle} />

      {/* Description */}
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content="TKITI, Laboratorium, Infrastruktur TI, Sistem Informasi, Universitas Andalas, Proxmox, Docker, Linux, Server, Jaringan" />
      <meta name="author" content={author || "Laboratorium TKITI"} />

      {/* Canonical URL */}
      <link rel="canonical" href={seoUrl} />

      {/* Robots */}
      <meta name="robots" content="index, follow" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:secure_url" content={fullImageUrl} />
      <meta property="og:image:type" content={imageMimeType} />
      <meta property="og:image:alt" content={resolvedImageAlt} />
      {isDefaultImage && <meta property="og:image:width" content="1200" />}
      {isDefaultImage && <meta property="og:image:height" content="630" />}
      <meta property="og:site_name" content={SITE_NAME} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={resolvedImageAlt} />
      {TWITTER_HANDLE && <meta name="twitter:creator" content={TWITTER_HANDLE} />}
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

      {/* Favicon */}
      <link rel="icon" type="image/png" href={FAVICON_IMAGE} />
      <link rel="apple-touch-icon" href={FAVICON_IMAGE} />

      {/* Theme Color */}
      <meta name="theme-color" content="#3ECFB2" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(siteNavigationSchema)}
      </script>
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}

      {/* Preconnect to Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
}
