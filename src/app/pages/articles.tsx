import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SEO } from "../components/seo";
import { apiRequest, toAbsoluteApiUrl } from "../lib/api";

type Article = {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  author_name?: string;
  author?: string | null;
  author_avatar?: string | null;
  published_at?: string;
  createdAt?: string | null;
  likes: number;
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 220);
}

function ArticleListItem({ article }: { article: Article }) {
  const authorName = article.author_name ?? article.author ?? "Admin TKITI";
  const publishedAt = article.published_at ?? article.createdAt ?? new Date().toISOString();
  const thumbnailUrl = toAbsoluteApiUrl(article.thumbnail_url ?? article.thumbnail ?? null);
  const authorAvatar = toAbsoluteApiUrl(article.author_avatar ?? null);
  const readingTime = calculateReadingTime(article.content ?? "");
  const excerpt = article.excerpt ?? article.subtitle ?? "";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.35 }}
      className="border-b pb-8"
      style={{ borderColor: "rgba(227, 226, 227, 0.14)" }}
    >
      <Link to={`/article/${article.slug}`} className="group block">
        <div className="grid gap-5 md:grid-cols-[1fr_240px] md:items-start">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={authorAvatar || undefined} alt={authorName} crossOrigin="anonymous" />
                <AvatarFallback style={{ background: "rgba(62, 207, 178, 0.16)", color: "#3ECFB2", fontSize: 11 }}>
                  {String(authorName)
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm" style={{ color: "#e3e2e3" }}>
                {authorName}
              </span>
              <span className="text-xs" style={{ color: "rgba(227, 226, 227, 0.5)" }}>
                · {formatDate(publishedAt)}
              </span>
            </div>

            <h2
              className="mb-2 text-2xl font-semibold leading-tight group-hover:text-[#3ECFB2] transition-colors"
              style={{ fontFamily: "Space Grotesk, sans-serif", color: "#f2f3f3" }}
            >
              {article.title}
            </h2>
            {excerpt && (
              <p className="mb-4 line-clamp-3 text-[15px] leading-7" style={{ color: "rgba(227, 226, 227, 0.72)" }}>
                {excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(227, 226, 227, 0.5)" }}>
              <span>{readingTime} min baca</span>
              <span>·</span>
              <span>{article.category ?? "Artikel"}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Heart size={12} color="#3ECFB2" />
                {article.likes}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg">
            {thumbnailUrl ? (
              <ImageWithFallback
                src={thumbnailUrl}
                alt={article.title}
                className="h-[170px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-[170px] w-full items-center justify-center bg-[#101314] text-sm text-[#6da99a]">
                TKITI Article
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await apiRequest<{ success: boolean; data?: Article[] }>("/articles");
        if (res.success && res.data) {
          setArticles(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch articles:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, []);

  return (
    <>
      <SEO
        title="Artikel"
        description="Artikel dan tulisan terbaru dari tim laboratorium TKITI tentang infrastruktur teknologi informasi, riset, dan pengembangan"
        url="/article"
      />

      <main className="min-h-screen px-6 pb-20 pt-28">
        <div className="mx-auto max-w-[860px]">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-sm hover:opacity-80"
            style={{ color: "#89bdb1", fontFamily: "JetBrains Mono, monospace" }}
          >
            <ArrowLeft size={14} />
            Kembali ke beranda
          </Link>

          <header className="mb-10 border-b pb-8" style={{ borderColor: "rgba(227, 226, 227, 0.14)" }}>
            <h1 className="mb-3 text-5xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#f3f4f4" }}>
              Article
            </h1>
            <p className="max-w-2xl text-[17px] leading-8" style={{ color: "rgba(227, 226, 227, 0.72)" }}>
              Insight, catatan riset, dan pembelajaran infrastruktur teknologi informasi dari tim Laboratorium TKITI.
            </p>
          </header>

          {loading ? (
            <div className="space-y-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="grid gap-5 border-b pb-8 md:grid-cols-[1fr_240px]" style={{ borderColor: "rgba(227, 226, 227, 0.14)" }}>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/2" style={{ background: "rgba(62, 207, 178, 0.15)" }} />
                    <Skeleton className="h-8 w-4/5" style={{ background: "rgba(62, 207, 178, 0.15)" }} />
                    <Skeleton className="h-5 w-full" style={{ background: "rgba(62, 207, 178, 0.15)" }} />
                    <Skeleton className="h-5 w-2/3" style={{ background: "rgba(62, 207, 178, 0.15)" }} />
                  </div>
                  <Skeleton className="h-[170px] w-full rounded-lg" style={{ background: "rgba(62, 207, 178, 0.15)" }} />
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <section className="space-y-8">
              {articles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </section>
          ) : (
            <div className="rounded-xl border px-6 py-14 text-center" style={{ borderColor: "rgba(227, 226, 227, 0.14)" }}>
              <p className="mb-2 text-xl" style={{ color: "#e3e2e3", fontFamily: "Space Grotesk, sans-serif" }}>
                Belum ada artikel
              </p>
              <p style={{ color: "rgba(227, 226, 227, 0.64)" }}>Artikel akan segera dipublikasikan.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

