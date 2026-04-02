import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'

import { authRoutes }    from './routes/auth.js'
import { contentRoutes } from './routes/content.js'
import { articleRoutes } from './routes/articles.js'
import { galleryRoutes } from './routes/gallery.js'
import { strukturRoutes } from './routes/struktur.js'

const app = new Hono()

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

// ─── Static files ─────────────────────────────────────────────────────────────
// Foto upload tersedia di /uploads/gallery/... dan /uploads/struktur/...
// root relatif terhadap process.cwd() → /app di Docker
app.use('/uploads/*', serveStatic({ root: './' }))
// Compatibility fallback: old records may store bare filenames without "uploads/articles/" prefix.
app.use('/*.jpg', serveStatic({ root: './uploads/articles' }))
app.use('/*.jpeg', serveStatic({ root: './uploads/articles' }))
app.use('/*.png', serveStatic({ root: './uploads/articles' }))
app.use('/*.webp', serveStatic({ root: './uploads/articles' }))
app.use('/*.gif', serveStatic({ root: './uploads/articles' }))
app.use('/*.svg', serveStatic({ root: './uploads/articles' }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/auth',     authRoutes)
app.route('/content',  contentRoutes)
app.route('/articles', articleRoutes)
app.route('/gallery',  galleryRoutes)
app.route('/struktur', strukturRoutes)

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ success: false, error: 'Route tidak ditemukan' }, 404))

// ─── Start server ─────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 5000

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
})

console.log(`Server running on port ${port}`)
