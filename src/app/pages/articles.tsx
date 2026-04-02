import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { apiRequest, toAbsoluteApiUrl } from "../lib/api";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Heart } from "lucide-react";
import { SEO } from "../components/seo";

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
  return Math.ceil(words / 200);
}

function ArticleCard({ article }: { article: Article }) {
  const readingTime = calculateReadingTime(article.content ?? "");
  const authorName = article.author_name ?? article.author ?? "Admin TKITI";
  const publishedAt = article.published_at ?? article.createdAt ?? new Date().toISOString();
  const thumbnailRaw = article.thumbnail_url ?? article.thumbnail ?? null;
  const thumbnailUrl = toAbsoluteApiUrl(thumbnailRaw);
  const category = article.category ?? "Artikel";
  const authorAvatar = toAbsoluteApiUrl(article.author_avatar ?? null);

  return (
    <motion.article
      className="group cursor-pointer overflow-hidden rounded-xl border"
      style={{
        background: "rgba(13, 14, 15, 0.6)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(62, 207, 178, 0.15)",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, borderColor: "rgba(62, 207, 178, 0.3)" }}
    >
      <Link to={`/article/${article.slug}`}>
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden">
          {thumbnailUrl ? (
            <ImageWithFallback
              src={thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: "rgba(62, 207, 178, 0.1)",
              }}
            >
              <span
                className="material-symbols-outlined text-6xl opacity-30"
                style={{ color: "rgb(62, 207, 178)" }}
              >
                article
              </span>
            </div>
          )}

          {/* Category Badge */}
          <span
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: "rgba(62, 207, 178, 0.9)",
              color: "#005446",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {category}
          </span>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title */}
          <h3
            className="font-bold mb-2 line-clamp-2 group-hover:text-[rgb(62,207,178)] transition-colors"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "20px",
              lineHeight: 1.3,
              color: "#e3e2e3",
            }}
          >
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p
              className="text-sm mb-4 line-clamp-2"
              style={{
                color: "#889994",
                lineHeight: 1.6,
              }}
            >
              {article.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border" style={{ borderColor: "rgba(62, 207, 178, 0.2)" }}>
                <AvatarImage src={authorAvatar || undefined} alt={authorName} />
                <AvatarFallback
                  style={{
                    background: "rgba(62, 207, 178, 0.1)",
                    color: "rgb(62, 207, 178)",
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {String(authorName)
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="text-xs font-medium"
                  style={{
                    color: "#e3e2e3",
                  }}
                >
                  {authorName}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "#889994",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {formatDate(publishedAt)} · {readingTime} min
                </p>
              </div>
            </div>

            {/* Like Count */}
            <div
              className="flex items-center gap-1 text-xs"
              style={{
                color: "#889994",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              <Heart size={14} stroke="rgb(62, 207, 178)" />
              <span>{article.likes}</span>
            </div>
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
      <main className="min-h-screen pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="font-bold mb-3"
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: "clamp(32px, 5vw, 40px)",
              color: "#e3e2e3",
            }}
          >
            Artikel
          </h1>
          <p
            className="text-lg"
            style={{
              color: "#889994",
            }}
          >
            Tulisan terbaru dari tim laboratorium TKITI
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "rgba(13, 14, 15, 0.6)",
                  borderColor: "rgba(62, 207, 178, 0.15)",
                }}
              >
                <Skeleton className="h-48 w-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                  <Skeleton className="h-4 w-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                  <Skeleton className="h-4 w-2/3" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="w-8 h-8 rounded-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                      <Skeleton className="h-2 w-16" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-xl border"
            style={{
              background: "rgba(13, 14, 15, 0.6)",
              borderColor: "rgba(62, 207, 178, 0.15)",
            }}
          >
            <span
              className="material-symbols-outlined text-6xl mb-4 opacity-30"
              style={{ color: "rgb(62, 207, 178)" }}
            >
              article
            </span>
            <p
              className="text-lg mb-2"
              style={{
                color: "#e3e2e3",
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              Belum ada artikel
            </p>
            <p
              className="text-sm"
              style={{
                color: "#889994",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              Artikel akan segera hadir
            </p>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
