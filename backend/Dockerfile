# ─── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifest dulu — layer cache: install hanya re-run jika lockfile berubah
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ─── Stage 2: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Hanya prod deps — devDependencies (tsc, tsx, drizzle-kit) tidak ikut
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Ambil compiled output dari stage builder (tidak ada TypeScript source di prod image)
COPY --from=builder /app/dist ./dist

# Buat mount point sebelum Docker mount volume (hindari direktori root-owned)
RUN mkdir -p /app/data /app/uploads/gallery /app/uploads/articles /app/uploads/struktur

EXPOSE 5000

CMD ["node", "dist/index.js"]
