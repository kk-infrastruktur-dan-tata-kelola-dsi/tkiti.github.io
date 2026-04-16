import { Hono } from 'hono'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { articles } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { deleteFile, saveFile, validateImage } from '../lib/upload.js'

export const articleRoutes = new Hono()

const SITE_NAME = 'Laboratorium TKITI'
const FRONTEND_SITE_URL = (process.env.FRONTEND_SITE_URL ?? process.env.FRONTEND_URL ?? 'https://tkiti.tech').replace(/\/$/, '')
const DEFAULT_SHARE_DESCRIPTION = 'Artikel dan tulisan terbaru dari tim laboratorium TKITI tentang infrastruktur teknologi informasi, riset, dan pengembangan.'
const DEFAULT_SHARE_IMAGE = `${FRONTEND_SITE_URL}/images/og-home.png`

// In-memory rate limit untuk endpoint like
// key: "<ip>:<articleId>", value: timestamp terakhir like
const likeMap = new Map<string, number>()
const LIKE_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 jam
const LIKE_MAP_CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 jam
const LIKE_MAP_MAX_SIZE = 10000 // Maximum entries before forced cleanup

// Auto-cleanup untuk menghapus expired entries dari memory
const likeMapCleanupInterval = setInterval(() => {
  const now = Date.now()
  let deleted = 0
  
  for (const [key, timestamp] of likeMap.entries()) {
    if (now - timestamp >= LIKE_COOLDOWN_MS) {
      likeMap.delete(key)
      deleted++
    }
  }
  
  if (deleted > 0) {
    console.log(`[LikeMap] Cleaned up ${deleted} expired entries. Remaining: ${likeMap.size}`)
  }
}, LIKE_MAP_CLEANUP_INTERVAL)

// Prevent cleanup from keeping process alive
if (typeof likeMapCleanupInterval.unref === 'function') {
  (likeMapCleanupInterval as NodeJS.Timeout).unref()
}

function cleanupLikeMapIfNeeded(): void {
  // Force cleanup if map exceeds max size
  if (likeMap.size >= LIKE_MAP_MAX_SIZE) {
    const now = Date.now()
    let deleted = 0
    
    for (const [key, timestamp] of likeMap.entries()) {
      if (now - timestamp >= LIKE_COOLDOWN_MS) {
        likeMap.delete(key)
        deleted++
      }
    }
    
    // If still too large after cleaning expired, remove oldest entries
    if (likeMap.size >= LIKE_MAP_MAX_SIZE) {
      const sortedEntries = Array.from(likeMap.entries()).sort((a, b) => a[1] - b[1])
      const toDelete = sortedEntries.slice(0, Math.floor(LIKE_MAP_MAX_SIZE / 2))
      for (const [key] of toDelete) {
        likeMap.delete(key)
      }
      console.log(`[LikeMap] Force cleanup: removed ${toDelete.length + deleted} entries`)
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeDescription(value?: string | null): string {
  const cleaned = value?.replace(/\s+/g, ' ').trim()
  if (!cleaned) return DEFAULT_SHARE_DESCRIPTION
  if (cleaned.length <= 220) return cleaned
  return `${cleaned.slice(0, 217)}...`
}

function toAbsoluteShareImage(path: string | null | undefined, apiOrigin: string): string {
  if (!path) return DEFAULT_SHARE_IMAGE
  if (/^https?:\/\//i.test(path)) return path

  const normalized = path.trim().replace(/^\/+/, '')
  const encoded = normalized
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${apiOrigin}/${encoded}`
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

// GET /articles — published only, sort by createdAt desc
articleRoutes.get('/', (c) => {
  const limit = c.req.query('limit')
  const limitNum = limit ? parseInt(limit, 10) : undefined
  
  // Only select necessary columns for listing (exclude full content)
  const baseQuery = db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      subtitle: articles.excerpt,
      excerpt: articles.excerpt,
      category: articles.author,
      thumbnail_url: articles.thumbnail,
      thumbnail: articles.thumbnail,
      author_name: articles.author,
      author: articles.author,
      published_at: articles.createdAt,
      createdAt: articles.createdAt,
      likes: articles.likes,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.createdAt))
  
  const rows = limitNum && !isNaN(limitNum) && limitNum > 0
    ? baseQuery.limit(limitNum).all()
    : baseQuery.all()

  return c.json({ success: true, data: rows })
})

// GET /articles/all — semua termasuk draft [AUTH]
// HARUS didaftarkan sebelum /:slug agar "all" tidak ditangkap sebagai slug
articleRoutes.get('/all', authMiddleware, (c) => {
  const rows = db.select().from(articles).orderBy(desc(articles.createdAt)).all()
  return c.json({ success: true, data: rows })
})

// GET /articles/by-id/:id — ambil satu artikel berdasarkan ID [AUTH]
articleRoutes.get('/by-id/:id', authMiddleware, (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)
  
  const article = db.select().from(articles).where(eq(articles.id, id)).get()
  if (!article) return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)
  
  return c.json({ success: true, data: article })
})

// POST /articles/upload-thumbnail [AUTH]
// Multipart fields: file (required)
articleRoutes.post('/upload-thumbnail', authMiddleware, async (c) => {
  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }

  const file = body['file']
  if (!(file instanceof File)) {
    return c.json({ success: false, error: 'Field "file" (image) diperlukan' }, 400)
  }

  const validationError = validateImage(file)
  if (validationError) {
    return c.json({ success: false, error: validationError }, 422)
  }

  const path = await saveFile(file, 'articles')
  return c.json({ success: true, data: { path } }, 201)
})

// GET /articles/share/:slug
articleRoutes.get('/share/:slug', (c) => {
  const slug = c.req.param('slug')
  const article = db
    .select({
      slug: articles.slug,
      title: articles.title,
      excerpt: articles.excerpt,
      thumbnail: articles.thumbnail,
      published: articles.published,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.slug, slug))
    .get()

  const publicArticle = article?.published ? article : null

  const redirectUrl = publicArticle
    ? `${FRONTEND_SITE_URL}/article/${encodeURIComponent(publicArticle.slug)}`
    : `${FRONTEND_SITE_URL}/article`

  const ogTitle = publicArticle?.title
    ? `${publicArticle.title} | ${SITE_NAME}`
    : `${SITE_NAME} | Artikel`
  const ogDescription = normalizeDescription(publicArticle?.excerpt)
  const ogImage = toAbsoluteShareImage(publicArticle?.thumbnail, new URL(c.req.url).origin)
  const createdAt = publicArticle?.createdAt ? new Date(publicArticle.createdAt) : null
  const updatedAt = publicArticle?.updatedAt ? new Date(publicArticle.updatedAt) : null
  const publishedTime = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : null
  const modifiedTime = updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt.toISOString() : null

  c.header('X-Robots-Tag', 'noindex, nofollow')

  return c.html(
    `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(ogTitle)}</title>
    <meta name="description" content="${escapeHtml(ogDescription)}" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${escapeHtml(redirectUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:url" content="${escapeHtml(redirectUrl)}" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(`Thumbnail artikel: ${publicArticle?.title ?? SITE_NAME}`)}" />
    ${publishedTime ? `<meta property="article:published_time" content="${escapeHtml(publishedTime)}" />` : ''}
    ${modifiedTime ? `<meta property="article:modified_time" content="${escapeHtml(modifiedTime)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${escapeHtml(redirectUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(`Thumbnail artikel: ${publicArticle?.title ?? SITE_NAME}`)}" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" />
  </head>
  <body>
    <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
    <p>Mengarahkan ke <a href="${escapeHtml(redirectUrl)}">${escapeHtml(redirectUrl)}</a>...</p>
  </body>
</html>`,
  )
})

articleRoutes.get('/:slug', (c) => {
  const slug = c.req.param('slug')
  const article = db.select().from(articles).where(eq(articles.slug, slug)).get()

  if (!article) {
    return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)
  }

  // Jika draft, hanya bisa diakses via /articles/all (auth)
  if (!article.published) {
    return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)
  }

  return c.json({ success: true, data: article })
})

// POST /articles/:id/like — tanpa auth, rate limit per IP per artikel per 24 jam
articleRoutes.post('/:id/like', (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const article = db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).get()
  if (!article) return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)

  const ip = getClientIp(c)
  const rateKey = `${ip}:${id}`
  const lastLike = likeMap.get(rateKey)
  const now = Date.now()

  if (lastLike && now - lastLike < LIKE_COOLDOWN_MS) {
    const remainMs = LIKE_COOLDOWN_MS - (now - lastLike)
    const remainHours = Math.ceil(remainMs / 3_600_000)
    return c.json(
      { success: false, error: `Sudah like dalam 24 jam terakhir. Coba lagi dalam ${remainHours} jam.` },
      429,
    )
  }

  likeMap.set(rateKey, now)
  cleanupLikeMapIfNeeded()

  const updated = db
    .update(articles)
    .set({ likes: sql`${articles.likes} + 1` })
    .where(eq(articles.id, id))
    .returning({ likes: articles.likes })
    .get()

  return c.json({ success: true, data: { likes: updated?.likes ?? 0 } })
})

// POST /articles [AUTH]
articleRoutes.post('/', authMiddleware, async (c) => {
  let body: Partial<{
    slug: string
    title: string
    excerpt: string
    content: string
    thumbnail: string
    author: string
    published: boolean
  }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Body harus berupa JSON' }, 400)
  }

  if (!body.slug || !body.title || !body.content) {
    return c.json({ success: false, error: 'slug, title, dan content diperlukan' }, 400)
  }

  const now = new Date()

  try {
    const inserted = db
      .insert(articles)
      .values({
        slug: body.slug,
        title: body.title,
        excerpt: body.excerpt ?? null,
        content: body.content,
        thumbnail: body.thumbnail ?? null,
        author: body.author ?? null,
        published: body.published ?? false,
        likes: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get()

    return c.json({ success: true, data: inserted }, 201)
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE')) {
      return c.json({ success: false, error: `Slug "${body.slug}" sudah digunakan` }, 409)
    }
    throw err
  }
})

// PUT /articles/:id [AUTH]
articleRoutes.put('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  let body: Partial<{
    slug: string
    title: string
    excerpt: string
    content: string
    thumbnail: string
    author: string
    published: boolean
  }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Body harus berupa JSON' }, 400)
  }

  const existing = db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)

  const updated = db
    .update(articles)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning()
    .get()

  return c.json({ success: true, data: updated })
})

// DELETE /articles/:id [AUTH]
articleRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)

  const thumbnailPath = db.select({ thumbnail: articles.thumbnail }).from(articles).where(eq(articles.id, id)).get()?.thumbnail
  db.delete(articles).where(eq(articles.id, id)).run()
  
  // Await file deletion to prevent orphaned files
  if (thumbnailPath?.startsWith('uploads/')) {
    await deleteFile(thumbnailPath)
  }

  return c.json({ success: true, message: 'Artikel berhasil dihapus' })
})
