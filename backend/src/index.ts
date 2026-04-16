import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { join, normalize } from 'node:path'
import sharp from 'sharp'

import { authRoutes }    from './routes/auth.js'
import { contentRoutes } from './routes/content.js'
import { articleRoutes } from './routes/articles.js'
import { galleryRoutes } from './routes/gallery.js'
import { strukturRoutes } from './routes/struktur.js'

const app = new Hono()
const uploadsRoot = join(process.cwd(), 'uploads')
const MAX_IMAGE_DIMENSION = 2400
const DEFAULT_IMAGE_QUALITY = 76

function parseImageDimension(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined
  return Math.min(parsed, MAX_IMAGE_DIMENSION)
}

function parseImageQuality(raw: string | undefined): number {
  if (!raw) return DEFAULT_IMAGE_QUALITY
  const parsed = Number(raw)
  if (!Number.isInteger(parsed)) return DEFAULT_IMAGE_QUALITY
  return Math.max(40, Math.min(90, parsed))
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

app.use(
  '*',
  cors({
    origin: [frontendUrl, 'http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ─── Caching Headers ──────────────────────────────────────────────────────────
// Add Cache-Control headers to GET requests for better performance
app.use('*', async (c: any, next: any) => {
  await next()
  
  // Only cache GET requests (not auth or admin endpoints)
  if (
    c.req.method === 'GET' &&
    !c.req.path.startsWith('/auth') &&
    !c.req.path.startsWith('/content/') &&
    !c.req.header('Authorization') &&
    !c.res.headers.has('Cache-Control')
  ) {
    // Cache for 5 minutes with stale-while-revalidate for 10 minutes
    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  }
})

// ─── Static files ─────────────────────────────────────────────────────────────
// Foto upload tersedia di /uploads/gallery/... dan /uploads/struktur/...
// root relatif terhadap process.cwd() → /app di Docker
app.get('/uploads/*', async (c, next) => {
  const width = parseImageDimension(c.req.query('w'))
  const height = parseImageDimension(c.req.query('h'))
  if (!width && !height) return next()

  const requestedRelativePath = normalize(c.req.path.replace(/^\/+/, '')).replace(/\\/g, '/')
  if (!requestedRelativePath.startsWith('uploads/')) {
    return c.json({ success: false, error: 'Path gambar tidak valid' }, 400)
  }

  const absolutePath = join(process.cwd(), requestedRelativePath)
  if (!absolutePath.startsWith(uploadsRoot)) {
    return c.json({ success: false, error: 'Path gambar tidak valid' }, 400)
  }

  const quality = parseImageQuality(c.req.query('q'))

  try {
    const transformed = await sharp(absolutePath, { failOn: 'none' })
      .rotate()
      .resize({
        width,
        height,
        fit: width && height ? 'cover' : 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 4,
      })
      .toBuffer()
    const imagePayload = new Uint8Array(transformed.byteLength)
    imagePayload.set(transformed)

    return c.body(imagePayload, 200, {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    })
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return c.json({ success: false, error: 'Gambar tidak ditemukan' }, 404)
    }
    throw error
  }
})

app.use('/uploads/*', serveStatic({ root: './' }))
// Compatibility fallback: old records may store bare filenames without "uploads/articles/" prefix.
app.use('/*.jpg', serveStatic({ root: './uploads/articles' }))
app.use('/*.jpeg', serveStatic({ root: './uploads/articles' }))
app.use('/*.png', serveStatic({ root: './uploads/articles' }))
app.use('/*.webp', serveStatic({ root: './uploads/articles' }))
app.use('/*.gif', serveStatic({ root: './uploads/articles' }))
app.use('/*.svg', serveStatic({ root: './uploads/articles' }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c: any) => c.json({ status: 'ok' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/auth',     authRoutes)
app.route('/content',  contentRoutes)
app.route('/articles', articleRoutes)
app.route('/gallery',  galleryRoutes)
app.route('/struktur', strukturRoutes)

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c: any) => c.json({ success: false, error: 'Route tidak ditemukan' }, 404))

// ─── Start server ─────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 5000

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
})

console.log(`Server running on port ${port}`)
