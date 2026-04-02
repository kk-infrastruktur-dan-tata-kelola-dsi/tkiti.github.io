# copilot-instructions.md — Lab TKITI Landing Page

Baca file ini sebelum melakukan perubahan apapun pada codebase.

---

## Project Overview

Landing page untuk **Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi (TKITI)** — bagian dari **Departemen Sistem Informasi, Fakultas Teknologi Informasi, Universitas Andalas**.

Ini adalah landing page organisasi lab kampus, bukan personal profile. Konten mencakup: profil lab, kegiatan, sejarah, struktur organisasi, galeri dokumentasi, artikel, dan kontak.

---

## Tujuan Pengembangan

1. **Backend API** — Hono + TypeScript + SQLite untuk mengelola semua konten
2. **Admin CMS Panel** — UI shadcn/ui (clean white, support dark mode)
3. **Animasi & Interaksi** — Framer Motion scroll-reveal dan entrance animations
4. **Enhancement Visual** — Fix whitespace, marquee pakai logo SVG, polish layout
5. **Article Page** — Layout mirip Medium, fitur like dan share
6. **Lokalisasi (i18n)** — ID/EN via i18next
7. **SEO** — react-helmet-async, meta tags, OG image

---

## Tech Stack

### Frontend

| Kategori        | Tool / Library             | Keterangan                              |
|-----------------|----------------------------|-----------------------------------------|
| Framework       | React 18 + Vite            | Lovable export                          |
| Styling         | Tailwind CSS v3            | Utility-first                           |
| UI Components   | shadcn/ui (Radix UI)       | 46 komponen sudah ada, JANGAN diedit   |
| Animasi         | Framer Motion              | Akan ditambahkan                        |
| Routing         | React Router v6+           | `RouterProvider` sudah di App.tsx       |
| Lokalisasi      | i18next + react-i18next    | Akan ditambahkan                        |
| Package Manager | pnpm                       | Selalu gunakan pnpm, jangan npm/yarn    |
| Hosting         | GitHub Pages               | Static, custom domain tkiti.tech        |

### Backend

| Kategori        | Tool / Library             | Keterangan                              |
|-----------------|----------------------------|-----------------------------------------|
| Runtime         | Node.js (atau Bun)         | Bun lebih cepat jika tersedia           |
| Framework       | **Hono** + TypeScript      | Tercepat, TypeScript-first              |
| Database        | **SQLite**                 | Cukup untuk skala lab kampus            |
| SQLite Driver   | `better-sqlite3`           | Synchronous, performant                 |
| ORM             | **Drizzle ORM**            | Type-safe, schema-as-code               |
| Auth            | JWT via `jose`             | Stateless, untuk admin panel            |
| File Upload     | `busboy`                   | Upload foto ke disk lokal               |
| Container       | Docker + Docker Compose    | Build image lokal, deploy ke server     |
| Hosting         | Server sendiri (Proxmox)   | Via aaPanel + Cloudflare Zero Trust     |
| Domain Backend  | `api.tkiti.tech`           | Cloudflare Tunnel → server              |
| DBMS GUI        | DataGrip                   | Connect ke file `.db` langsung          |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│                                                                  │
│  GitHub Repo (main branch)                                       │
│       │                                                          │
│       ▼ push trigger                                             │
│  GitHub Actions                                                  │
│       │ pnpm install → pnpm build → deploy to gh-pages branch   │
│       ▼                                                          │
│  GitHub Pages (static hosting)                                   │
│       │                                                          │
│       ▼ DNS CNAME record                                         │
│  tkiti.tech  ──────────────────────────────────────────────────► │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                                                                  │
│  GitHub Repo (main branch)                                       │
│       │                                                          │
│       ▼ push trigger                                             │
│  GitHub Actions (Self-hosted Runner di server Proxmox)           │
│       │ docker compose build → docker compose up -d             │
│       │ image output: /www/wwwroot/tkiti-web-profile/           │
│       ▼                                                          │
│  Docker Container (Hono API)                                     │
│       │                                                          │
│       ▼ internal port                                            │
│  Cloudflare Zero Trust Tunnel                                    │
│       │                                                          │
│       ▼ public domain                                            │
│  api.tkiti.tech ───────────────────────────────────────────────► │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Struktur Repository

Satu monorepo, dua folder terpisah:

```
tkiti/                                      ← root monorepo
│
├── frontend/                               ← React + Vite
│   ├── copilot-instructions.md                           ← file ini (taruh di root monorepo)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   │
│   ├── public/
│   │   ├── CNAME                           ← isi: tkiti.tech (untuk GitHub Pages custom domain)
│   │   ├── icons/                          ← logo SVG tech stack marquee
│   │   │   ├── react.svg
│   │   │   ├── typescript.svg
│   │   │   ├── proxmox.svg
│   │   │   ├── docker.svg
│   │   │   ├── linux.svg
│   │   │   └── nginx.svg
│   │   └── images/
│   │       └── og-image.jpg
│   │
│   └── src/
│       ├── main.tsx
│       ├── styles/index.css
│       └── app/
│           ├── App.tsx
│           ├── routes.tsx
│           ├── lib/
│           │   ├── api.ts                  ← fetch wrapper ke api.tkiti.tech
│           │   └── i18n.ts
│           ├── locales/
│           │   ├── id.json
│           │   └── en.json
│           ├── hooks/
│           │   ├── useContent.ts
│           │   └── useArticles.ts
│           ├── pages/
│           │   ├── Home.tsx
│           │   ├── ArticleList.tsx
│           │   ├── ArticleDetail.tsx
│           │   └── admin/
│           │       ├── Dashboard.tsx
│           │       ├── ContentPage.tsx
│           │       ├── GalleryPage.tsx
│           │       ├── ArticlesPage.tsx
│           │       └── StrukturPage.tsx
│           └── components/
│               ├── layout/
│               │   ├── Navbar.tsx
│               │   └── Footer.tsx
│               ├── sections/
│               │   ├── HeroSection.tsx
│               │   ├── KegiatanSection.tsx
│               │   ├── SejarahSection.tsx
│               │   ├── StrukturSection.tsx
│               │   ├── GallerySection.tsx
│               │   ├── ArticleSection.tsx
│               │   └── KontakSection.tsx
│               ├── article/
│               │   ├── ArticleCard.tsx
│               │   ├── ArticleContent.tsx
│               │   ├── LikeButton.tsx
│               │   ├── ShareButton.tsx
│               │   └── ReadingProgress.tsx
│               └── ui/                     ← shadcn, JANGAN DIEDIT
│
├── backend/                                ← Hono + TypeScript
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── migrations/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── content.ts
│   │   │   ├── gallery.ts
│   │   │   ├── articles.ts
│   │   │   └── struktur.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── lib/
│   │       └── jwt.ts
│   ├── uploads/                            ← di-mount via Docker volume
│   │   ├── gallery/
│   │   └── articles/
│   ├── data/                               ← SQLite file, di-mount via Docker volume
│   │   └── tkiti.db
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
│
└── .github/
    └── workflows/
        ├── frontend.yml                    ← GitHub Actions untuk GitHub Pages
        └── backend.yml                     ← GitHub Actions untuk self-hosted runner
```

---

## Pipeline Frontend — GitHub Actions → GitHub Pages

File: `.github/workflows/frontend.yml`

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'        # hanya trigger jika ada perubahan di folder frontend

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: latest

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        working-directory: frontend
        run: pnpm install --frozen-lockfile

      - name: Build
        working-directory: frontend
        run: pnpm build
        env:
          VITE_API_URL: https://api.tkiti.tech

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: frontend/dist
          cname: tkiti.tech                 # custom domain
```

---

## Pipeline Backend — Self-hosted Runner → Docker Compose

File: `.github/workflows/backend.yml`

```yaml
name: Deploy Backend to Self-hosted Server

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'         # hanya trigger jika ada perubahan di folder backend

jobs:
  build-and-deploy:
    runs-on: self-hosted      # runner di server Proxmox

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Copy files to deployment directory
        run: |
          rsync -av --delete \
            --exclude='data/' \
            --exclude='uploads/' \
            backend/ /www/wwwroot/tkiti-web-profile/

      - name: Build and restart Docker Compose
        working-directory: /www/wwwroot/tkiti-web-profile
        run: |
          docker compose build --no-cache
          docker compose up -d --remove-orphans

      - name: Clean up old Docker images
        run: docker image prune -f

      - name: Health check
        run: |
          sleep 5
          curl -f https://api.tkiti.tech/health || exit 1
```

---

## Docker Configuration

### `backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

# Create directories for volumes
RUN mkdir -p /app/data /app/uploads/gallery /app/uploads/articles

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### `backend/docker-compose.yml`

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tkiti-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"    # bind ke localhost saja, Cloudflare Tunnel yang expose ke publik
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://tkiti.tech
      - PORT=3000
    volumes:
      - ./data:/app/data           # SQLite file persisten
      - ./uploads:/app/uploads     # foto upload persisten
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### `.env.example` (backend)

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=ganti_dengan_secret_yang_kuat_minimal_32_karakter
FRONTEND_URL=https://tkiti.tech
```

---

## Cloudflare Tunnel

Tunnel sudah terpasang di server. Yang perlu dikonfigurasi di Cloudflare dashboard:

```
Tunnel route:
  Public hostname : api.tkiti.tech
  Service         : http://localhost:3000
```

Tidak perlu konfigurasi tambahan di sisi kode — backend cukup listen di `127.0.0.1:3000`, Cloudflare Tunnel yang handle HTTPS dan routing ke publik.

---

## Vite Config (Frontend)

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                  // GitHub Pages dengan custom domain: base = '/'
})
```

> **Catatan penting**: Karena frontend menggunakan custom domain (`tkiti.tech`) bukan subpath, `base` cukup `/`. Kalau tidak pakai custom domain (misal `username.github.io/tkiti`), baru perlu `base: '/tkiti/'`.

---

## SPA Routing Fix — GitHub Pages

GitHub Pages tidak support SPA routing secara native. Perlu dua file:

### `frontend/public/404.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Redirect ke index.html dengan path disimpan di sessionStorage
      var path = window.location.pathname;
      sessionStorage.setItem('redirect', path);
      window.location.replace('/');
    </script>
  </head>
</html>
```

### Tambahkan di `frontend/index.html` (sebelum `</head>`)

```html
<script>
  // Restore path dari sessionStorage setelah redirect dari 404.html
  var redirect = sessionStorage.getItem('redirect');
  if (redirect) {
    sessionStorage.removeItem('redirect');
    window.history.replaceState(null, null, redirect);
  }
</script>
```

---

## Design System (Dari Live Site)

### Warna — Landing Page

```css
--color-bg-primary:   #070809;
--color-accent:       rgb(62, 207, 178);
--color-accent-dim:   rgba(62, 207, 178, 0.2);
--color-text-primary: rgb(227, 226, 227);
--color-text-muted:   rgba(227, 226, 227, 0.6);
```

### Typography — Landing Page

```
Display/Heading : Space Grotesk
Section Label   : JetBrains Mono  ← identitas utama, jangan ubah
Body            : Inter → ganti ke DM Sans atau Plus Jakarta Sans
```

### Section Label Convention

```
//KEGIATAN_LAB   [01_SEJARAH]   //STRUCTURE_COL   //GALLERY   //KONTAK
```

### Admin Panel

Terpisah dari gaya dark landing page:
- Background putih, support dark mode via Tailwind `dark:` class
- Komponen: shadcn `Sidebar`, `Card`, `Table`, `Form`, `Dialog`, `Sonner`
- Tone: clean, professional — mirip Vercel dashboard

---

## Struktur Halaman Landing Page

### Navbar
- Logo: **TKITI**
- Links: Sejarah · Kegiatan · Struktur · Gallery · Article · Kontak
- CTA: **"Hubungi Kami"** (teal solid)

### Sections

| Section  | Label             | Status    | Catatan                           |
|----------|-------------------|-----------|-----------------------------------|
| Hero     | —                 | ✅ Ada    | Enhancement layout                |
| Kegiatan | `//KEGIATAN_LAB`  | ✅ Ada    | 6 capability cards                |
| Sejarah  | `[01_SEJARAH]`    | ✅ Ada    | 3 era timeline                    |
| Struktur | `//STRUCTURE_COL` | ⚠️ Sparse | Grid foto anggota                 |
| Gallery  | `//GALLERY`       | ⚠️ Sparse | Grid foto dokumentasi             |
| Article  | —                 | 🆕 Baru  | Layout Medium + like + share      |
| Kontak   | `//KONTAK`        | ✅ Ada    | —                                 |

### Marquee Tech Stack
Ganti teks → logo SVG (`simple-icons`), warna teal, height 28px, infinite scroll smooth.

### Footer
```
Gedung Teknologi Informasi, Lantai 2
Departemen Sistem Informasi
Fakultas Teknologi Informasi, Universitas Andalas
Jl. Universitas Andalas, Padang, Sumatera Barat

Map: OpenStreetMap — koordinat FTI Unand (Lat: -0.9139, Lng: 100.4570)
Email   : tkiti@ft.unand.ac.id
Instagram: @lab_TATI
LinkedIn : Lab TKITI
Jam     : Senin–Jumat 08.00–17.00
```

---

## Database Schema

```typescript
// backend/src/db/schema.ts

export const content = sqliteTable('content', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

export const anggota = sqliteTable('anggota', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  role: text('role').notNull(),
  divisi: text('divisi'),       // 'kepemimpinan' | 'anggota' | 'kolaborasi'
  photo: text('photo'),
  urutan: integer('urutan'),
})

export const gallery = sqliteTable('gallery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  src: text('src').notNull(),
  caption: text('caption'),
  tanggal: text('tanggal'),
  urutan: integer('urutan'),
})

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),   // Markdown
  thumbnail: text('thumbnail'),
  author: text('author'),
  published: integer('published', { mode: 'boolean' }).default(false),
  likes: integer('likes').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
})
```

---

## API Endpoints

```
GET    /health                        ← health check (untuk Docker healthcheck)

POST   /auth/login                    ← return JWT

GET    /content/:section              ← konten per section
PUT    /content/:key                  ← update [AUTH]

GET    /gallery
POST   /gallery                       ← upload foto [AUTH] multipart/form-data
DELETE /gallery/:id                   ← [AUTH]

GET    /articles                      ← published only
GET    /articles/all                  ← semua termasuk draft [AUTH]
GET    /articles/:slug
POST   /articles/:id/like             ← no auth, rate limit per IP
POST   /articles                      ← [AUTH]
PUT    /articles/:id                  ← [AUTH]
DELETE /articles/:id                  ← [AUTH]

GET    /struktur
POST   /struktur                      ← [AUTH]
PUT    /struktur/:id                  ← [AUTH]
DELETE /struktur/:id                  ← [AUTH]
```

---

## Article Page Spec

- Max-width konten: 680px, center aligned
- Font body: `Lora` (serif), 19px, line-height 1.8
- Reading progress bar: fixed top, teal, ikuti scroll
- Estimated reading time di header
- Render Markdown: `react-markdown` + `remark-gfm` + `rehype-highlight`
- **Like**: optimistic update, POST ke `/articles/:id/like`, rate limit IP di backend
- **Share**: `navigator.share()` → fallback copy URL ke clipboard + Sonner toast
- Share ke WhatsApp dan Twitter/X via URL scheme

---

## Visual Issues yang Harus Diperbaiki

1. Whitespace berlebihan antar section — audit padding/min-height
2. Tidak ada animasi — Framer Motion scroll-reveal
3. Marquee tech stack — ganti teks dengan logo SVG
4. Struktur & Gallery section masih sparse
5. Body font Inter — ganti ke DM Sans

---

## Konvensi Kode

- TypeScript strict di frontend dan backend
- Function components + hooks, tidak ada class components
- `PascalCase.tsx` komponen, `camelCase.ts` utils/hooks
- Gunakan `cn()` dari `src/app/components/ui/utils.ts`
- Jangan edit `src/app/components/ui/` — pakai `pnpm dlx shadcn@latest add`
- i18n key convention: `section.elemen`

### Framer Motion Pattern

```tsx
export const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
}
```

---

## Commands

```bash
# Frontend
pnpm dev
pnpm build
pnpm preview

# Dependencies frontend
pnpm add framer-motion react-i18next i18next i18next-browser-languagedetector
pnpm add react-markdown remark-gfm rehype-highlight
pnpm add react-helmet-async

# Backend
pnpm add hono better-sqlite3 drizzle-orm jose busboy
pnpm add -D drizzle-kit typescript @types/better-sqlite3 @types/node tsx

# Drizzle
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm drizzle-kit studio            # web UI alternatif DataGrip (localhost:4983)

# Docker (dijalankan dari server via self-hosted runner)
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```
