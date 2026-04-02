import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { apiRequest, toAbsoluteApiUrl } from "../lib/api";
import { ReadingProgressBar } from "../components/reading-progress-bar";
import { LikeButton } from "../components/like-button";
import { ShareButton } from "../components/share-button";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SEO } from "../components/seo";

import "highlight.js/styles/atom-one-dark.css";

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

function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await apiRequest<{ success: boolean; data?: Article }>(
          `/articles/${slug}`
        );
        if (res.success && res.data) {
          setArticle(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch article:", e);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (loading) {
    return (
      <article className="min-h-screen pt-24 px-6">
        <div className="max-w-[680px] mx-auto space-y-6">
          <Skeleton className="h-8 w-32" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
          <Skeleton className="h-12 w-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
          <Skeleton className="h-6 w-3/4" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
          <div className="flex items-center gap-3 py-4">
            <Skeleton className="w-10 h-10 rounded-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
              <Skeleton className="h-3 w-24" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded-xl" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
            <Skeleton className="h-4 w-full" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
            <Skeleton className="h-4 w-3/4" style={{ background: "rgba(62, 207, 178, 0.1)" }} />
          </div>
        </div>
      </article>
    );
  }

  if (!article) {
    return (
      <article className="min-h-screen pt-24 px-6 flex items-center justify-center">
        <p
          className="text-center"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: "#bbcac4",
          }}
        >
          Artikel tidak ditemukan.
        </p>
      </article>
    );
  }

  const readingTime = calculateReadingTime(article.content ?? "");
  const authorName = article.author_name ?? article.author ?? "Admin TKITI";
  const publishedAt = article.published_at ?? article.createdAt ?? new Date().toISOString();
  const category = article.category ?? "Artikel";
  const thumbnailRaw = article.thumbnail_url ?? article.thumbnail ?? null;
  const thumbnailUrl = toAbsoluteApiUrl(thumbnailRaw);
  const authorAvatar = toAbsoluteApiUrl(article.author_avatar ?? null);

  return (
    <>
      <SEO
        title={article.title}
        description={article.subtitle || article.excerpt || ""}
        image={thumbnailUrl || undefined}
        url={`/article/${article.slug}`}
        type="article"
        publishedTime={publishedAt}
        author={authorName}
      />
      <article className="min-h-screen pt-24 px-6">
      <ReadingProgressBar />

      {/* Floating Like Button (Desktop) */}
      <div className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50">
        <LikeButton articleId={article.id} initialLikes={article.likes} />
      </div>

      <div className="max-w-[680px] mx-auto">
        {/* Category Badge */}
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{
            background: "rgba(62, 207, 178, 0.1)",
            color: "rgb(62, 207, 178)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {category}
        </span>

        {/* Title */}
        <h1
          className="font-bold mb-4"
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(32px, 5vw, 40px)",
            lineHeight: 1.2,
            color: "#e3e2e3",
          }}
        >
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p
            className="text-lg mb-6"
            style={{
              color: "#889994",
              lineHeight: 1.6,
            }}
          >
            {article.subtitle}
          </p>
        )}

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="w-10 h-10 border" style={{ borderColor: "rgba(62, 207, 178, 0.2)" }}>
            <AvatarImage src={authorAvatar || undefined} alt={authorName} crossOrigin="anonymous" />
            <AvatarFallback
              style={{
                background: "rgba(62, 207, 178, 0.1)",
                color: "rgb(62, 207, 178)",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "14px",
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
              className="text-sm font-medium"
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
              {formatDate(publishedAt)} · {readingTime} min baca
            </p>
          </div>
        </div>

        {/* Separator */}
        <div
          className="h-[1px] w-full mb-8"
          style={{
            background: "rgba(62, 207, 178, 0.15)",
          }}
        />

        {/* Hero Thumbnail */}
        {thumbnailUrl && (
          <div className="mb-10">
            <ImageWithFallback
              src={thumbnailUrl}
              alt={article.title}
              className="w-full h-auto rounded-xl object-cover"
              style={{
                aspectRatio: "16/9",
              }}
            />
          </div>
        )}

        {/* Article Content */}
        <div
          className="prose-custom mb-12"
          style={{
            fontFamily: "Lora, serif",
            fontSize: "19px",
            lineHeight: 1.8,
            color: "#d0d6d4",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  {...props}
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#e3e2e3",
                    marginTop: "48px",
                    marginBottom: "24px",
                    lineHeight: 1.3,
                  }}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  {...props}
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#e3e2e3",
                    marginTop: "40px",
                    marginBottom: "20px",
                    lineHeight: 1.3,
                  }}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  {...props}
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#e3e2e3",
                    marginTop: "32px",
                    marginBottom: "16px",
                    lineHeight: 1.4,
                  }}
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-6" />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  {...props}
                  style={{
                    borderLeft: "3px solid rgb(62, 207, 178)",
                    paddingLeft: "16px",
                    fontStyle: "italic",
                    color: "#a8b5b0",
                    margin: "32px 0",
                  }}
                />
              ),
              code: ({ node, inline, ...props }: { node?: any; inline?: boolean; className?: string; children?: any }) => {
                if (inline) {
                  return (
                    <code
                      {...props}
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        background: "rgba(62, 207, 178, 0.1)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.85em",
                        color: "rgb(62, 207, 178)",
                      }}
                    />
                  );
                }
                return <code {...props} />;
              },
              pre: ({ node, ...props }) => (
                <pre
                  {...props}
                  className="my-6 rounded-lg overflow-x-auto"
                  style={{
                    background: "#1e1e2e",
                    padding: "20px",
                  }}
                />
              ),
              img: ({ node, ...props }) => (
                <figure className="my-8">
                  <ImageWithFallback
                    src={toAbsoluteApiUrl((props.src as string) ?? null) ?? (props.src as string)}
                    alt={props.alt as string}
                    className="w-full h-auto rounded-lg"
                  />
                  {props.alt && (
                    <figcaption
                      className="text-center mt-3 text-sm"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        color: "#889994",
                      }}
                    >
                      {props.alt}
                    </figcaption>
                  )}
                </figure>
              ),
              ul: ({ node, ...props }) => (
                <ul {...props} className="mb-6 pl-6 list-disc" />
              ),
              ol: ({ node, ...props }) => (
                <ol {...props} className="mb-6 pl-6 list-decimal" />
              ),
              li: ({ node, ...props }) => (
                <li {...props} className="mb-2" />
              ),
              strong: ({ node, ...props }) => (
                <strong {...props} style={{ color: "#e3e2e3", fontWeight: 600 }} />
              ),
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  style={{
                    color: "rgb(62, 207, 178)",
                    textDecoration: "underline",
                    transition: "color 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgb(97, 236, 205)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(62, 207, 178)")}
                />
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Like and Share Section */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t"
          style={{
            borderColor: "rgba(62, 207, 178, 0.15)",
          }}
        >
          <div className="lg:hidden">
            <LikeButton articleId={article.id} initialLikes={article.likes} />
          </div>
          <ShareButton title={article.title} />
        </div>
      </div>
    </article>
    </>
  );
}
