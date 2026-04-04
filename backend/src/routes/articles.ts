import { Hono } from 'hono'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { articles } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { deleteFile, saveFile, validateImage } from '../lib/upload.js'

export const articleRoutes = new Hono()

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
  let query = db
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
  
  if (limitNum && !isNaN(limitNum) && limitNum > 0) {
    query = query.limit(limitNum)
  }
  
  const rows = query.all()

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

// GET /articles/:slug
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
