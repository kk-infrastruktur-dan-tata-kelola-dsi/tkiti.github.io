import { createBrowserRouter } from "react-router";
import { Navigation } from "./components/navigation";
import { Footer } from "./components/footer";
import { Home } from "./pages/home";
import { Articles } from "./pages/articles";
import { ArticleDetail } from "./pages/article-detail";
import { AdminLogin } from "./pages/admin/login";
import { AdminLayout } from "./pages/admin/layout";
import { AdminDashboard } from "./pages/admin/dashboard";
import { AdminContent } from "./pages/admin/content";
import { AdminArticles } from "./pages/admin/articles";
import { AdminArticleEditor } from "./pages/admin/articles-editor";
import { AdminGallery } from "./pages/admin/gallery-admin";
import { AdminStruktur } from "./pages/admin/struktur-admin";

const isGitHubPagesHost = window.location.hostname.endsWith("github.io");
const repoSegment = window.location.pathname.split("/")[1];
const basename = isGitHubPagesHost && repoSegment ? `/${repoSegment}` : "/";

function BaseShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden selection:bg-[#3ECFB2] selection:text-[#00382e]"
      style={{
        color: '#e3e2e3',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Scanline Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02]"
        style={{
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
          backgroundSize: '100% 2px, 3px 100%',
        }}
      />

      {/* Background Blobs */}
      <div
        className="fixed w-[600px] h-[600px] rounded-full opacity-40 blur-[120px] pointer-events-none"
        style={{
          background: 'rgba(57, 73, 83, 0.3)',
          bottom: '10%',
          left: '-10%',
          zIndex: -1,
        }}
      />

      <Navigation />
      {children}
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BaseShell>
      {children}
      <Footer />
    </BaseShell>
  );
}

function ArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <BaseShell>
      {children}
    </BaseShell>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout><Home /></Layout>,
    },
    {
      path: "/article",
      element: <ArticleLayout><Articles /></ArticleLayout>,
    },
    {
      path: "/article/:slug",
      element: <ArticleLayout><ArticleDetail /></ArticleLayout>,
    },
    {
      path: "/sejarah",
      element: <Layout><Home /></Layout>,
    },
    {
      path: "/kegiatan",
      element: <Layout><Home /></Layout>,
    },
    {
      path: "/struktur",
      element: <Layout><Home /></Layout>,
    },
    {
      path: "/gallery",
      element: <Layout><Home /></Layout>,
    },
    {
      path: "/kontak",
      element: <Layout><Home /></Layout>,
    },

    // ─── Admin routes (layout & theme terpisah dari landing page) ───────────────
    {
      path: "/admin/login",
      element: <AdminLogin />,
    },
    {
      path: "/admin",
      element: <AdminLayout />,
      children: [
        { index: true, element: <AdminDashboard /> },
        { path: "content", element: <AdminContent /> },
        { path: "articles", element: <AdminArticles /> },
        { path: "articles/new", element: <AdminArticleEditor /> },
        { path: "articles/:id", element: <AdminArticleEditor /> },
        { path: "gallery", element: <AdminGallery /> },
        { path: "struktur", element: <AdminStruktur /> },
      ],
    },
  ],
  { basename }
);
