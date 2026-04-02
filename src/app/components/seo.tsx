import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const DEFAULT_TITLE = "Lab TKITI — Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi";
const DEFAULT_DESCRIPTION = "Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi — Fokus pada riset, pengembangan, dan implementasi teknologi informasi di Departemen Sistem Informasi, Fakultas Teknologi Informasi, Universitas Andalas.";
const DEFAULT_IMAGE = `${import.meta.env.BASE_URL}images/logo.png`;
const DEFAULT_URL = "https://tkiti.unand.ac.id";
const SITE_NAME = "Laboratorium TKITI";
const TWITTER_HANDLE = "@lab_TATI";

export function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
}: SEOProps) {
  const seoTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const seoDescription = description || DEFAULT_DESCRIPTION;
  const seoImage = image || DEFAULT_IMAGE;
  const seoUrl = url || DEFAULT_URL;
  const fullImageUrl = seoImage.startsWith("http") ? seoImage : `${DEFAULT_URL}${seoImage}`;

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
      <meta property="og:site_name" content={SITE_NAME} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={seoUrl} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      {TWITTER_HANDLE && <meta name="twitter:creator" content={TWITTER_HANDLE} />}
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

      {/* Favicon */}
      <link rel="icon" type="image/png" href={DEFAULT_IMAGE} />
      <link rel="apple-touch-icon" href={DEFAULT_IMAGE} />

      {/* Theme Color */}
      <meta name="theme-color" content="#3ECFB2" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
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
