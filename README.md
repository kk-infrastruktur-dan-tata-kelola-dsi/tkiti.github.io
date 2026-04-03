# Lab TKITI — Web Profile

Landing page dan sistem manajemen konten untuk **Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi (TKITI)**, Departemen Sistem Informasi, Fakultas Teknologi Informasi, **Universitas Andalas**.

**Live site:** [tkiti.tech](https://tkiti.tech)

---

## Fitur

- **Landing page** dengan desain dark theme, glassmorphism, dan animasi scroll (Framer Motion)
- **Struktur organisasi** interaktif — klik anggota untuk melihat detail jabatan dan divisi
- **Galeri dokumentasi** kegiatan laboratorium
- **Artikel** dengan layout editorial, fitur like dan share
- **Admin CMS panel** untuk mengelola seluruh konten (teks, galeri, artikel, struktur)
- **Responsive** — mendukung tampilan mobile, tablet, dan desktop
- **SEO-friendly** — meta tags, Open Graph, dan custom domain

---

## Tech Stack

### Frontend

| Kategori      | Teknologi                  |
|---------------|----------------------------|
| Framework     | React 18 + TypeScript      |
| Build tool    | Vite 6                     |
| Styling       | Tailwind CSS v4            |
| UI components | shadcn/ui (Radix UI)       |
| Animasi       | Framer Motion / Motion     |
| Routing       | React Router v7            |
| Package mgr   | pnpm                       |
| Hosting       | GitHub Pages               |

### Backend

| Kategori      | Teknologi                  |
|---------------|----------------------------|
| Framework     | Hono + TypeScript          |
| Database      | SQLite + Drizzle ORM       |
| Auth          | JWT (jose)                 |
| Container     | Docker + Docker Compose    |
| API domain    | `api.tkiti.tech`           |

---

## Struktur Repository

```
tkiti-web-profile/
├── frontend/                 ← React + Vite (landing page + admin CMS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   ← UI sections & reusable components
│   │   │   ├── pages/        ← Page routes (home, articles, admin)
│   │   │   ├── hooks/        ← Custom hooks (useContent, useArticles)
│   │   │   ├── lib/          ← API client, utilities
│   │   │   └── ...
│   │   └── styles/           ← Tailwind, theme, fonts
│   ├── public/               ← Static assets (logo, images)
│   └── vite.config.ts
│
├── backend/                  ← Hono API + Docker
│   ├── src/
│   │   ├── index.ts          ← Entry point
│   │   ├── db/               ← Schema, migrations, client
│   │   └── routes/           ← API route handlers
│   ├── Dockerfile
│   └── docker-compose.yml
│
└── .github/workflows/        ← CI/CD pipelines
    ├── frontend.yml          ← Deploy ke GitHub Pages
    └── backend.yml           ← Deploy ke self-hosted server
```

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm** (`corepack enable` atau `npm i -g pnpm`)

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Development server berjalan di `http://localhost:5173`.

### Backend

```bash
cd backend

# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

---

## Deployment

### Frontend → GitHub Pages

Setiap push ke branch `main` yang mengubah folder `frontend/` akan memicu GitHub Actions untuk build dan deploy ke GitHub Pages. Custom domain dikonfigurasi via `CNAME` (tkiti.tech).

### Backend → Self-hosted Server

Push ke branch `main` yang mengubah folder `backend/` memicu pipeline di self-hosted runner (server Proxmox): build Docker image → `docker compose up -d`. API diakses publik via Cloudflare Zero Trust Tunnel (`api.tkiti.tech`).

---

## Design System

### Warna

| Token              | Value                      | Penggunaan              |
|--------------------|----------------------------|-------------------------|
| Background         | `#070809`                  | Base page background    |
| Accent (teal)      | `#3ECFB2` / `#61eccd`      | Links, highlights, CTA  |
| Accent dim         | `rgba(62, 207, 178, 0.2)`  | Borders, subtle dividers|
| Text primary       | `#e3e2e3`                  | Headings, body text     |
| Text muted         | `rgba(227, 226, 227, 0.6)`| Secondary text          |

### Typography

| Elemen        | Font Family          |
|---------------|----------------------|
| Headings      | Space Grotesk        |
| Section labels| JetBrains Mono       |
| Body          | DM Sans              |
| Code / mono   | JetBrains Mono       |

### Section Label Convention

Section labels menggunakan format monospace uppercase: `//KEGIATAN_LAB`, `[01_SEJARAH]`, `//STRUCTURE_COL`, `//GALLERY`, `//KONTAK`

---

## API Endpoints

| Method   | Path                      | Auth | Deskripsi                    |
|----------|---------------------------|------|------------------------------|
| `GET`    | `/health`                 | —    | Health check                 |
| `POST`   | `/auth/login`             | —    | Login, return JWT            |
| `GET`    | `/content/:section`       | —    | Konten per section           |
| `PUT`    | `/content/:key`           | ✅   | Update konten                |
| `GET`    | `/gallery`                | —    | Daftar foto galeri           |
| `POST`   | `/gallery`                | ✅   | Upload foto                  |
| `DELETE` | `/gallery/:id`            | ✅   | Hapus foto                   |
| `GET`    | `/articles`               | —    | Artikel published            |
| `GET`    | `/articles/:slug`         | —    | Detail artikel               |
| `POST`   | `/articles/:id/like`      | —    | Tambah like (rate limited)   |
| `GET`    | `/struktur`               | —    | Struktur organisasi          |
| `POST`   | `/struktur`               | ✅   | Tambah anggota               |
| `PUT`    | `/struktur/:id`           | ✅   | Update anggota               |
| `DELETE` | `/struktur/:id`           | ✅   | Hapus anggota                |

---

## Commands

```bash
# Frontend
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm preview          # Preview production build

# Backend
pnpm dev              # Start dev server (tsx watch)
pnpm build            # Compile TypeScript
pnpm drizzle-kit generate   # Generate migration
pnpm drizzle-kit migrate    # Run migrations
pnpm drizzle-kit studio     # Open DB GUI (localhost:4983)

# Docker (server)
docker compose build --no-cache
docker compose up -d
docker compose logs -f
```

---

## License

UI components dari [shadcn/ui](https://ui.shadcn.com/) digunakan di bawah lisensi [MIT](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

Foto dokumentasi digunakan sesuai kebijakan laboratorium.
