import { Hono } from 'hono'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { articles } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

export const articleRoutes = new Hono()

// In-memory rate limit untuk endpoint like
// key: "<ip>:<articleId>", value: timestamp terakhir like
const likeMap = new Map<string, number>()
const LIKE_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 jam

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

// GET /articles — published only, sort by createdAt desc
articleRoutes.get('/', (c) => {
  const rows = db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.createdAt))
    .all()

  return c.json({ success: true, data: rows })
})

// GET /articles/all — semua termasuk draft [AUTH]
// HARUS didaftarkan sebelum /:slug agar "all" tidak ditangkap sebagai slug
articleRoutes.get('/all', authMiddleware, (c) => {
  const rows = db.select().from(articles).orderBy(desc(articles.createdAt)).all()
  return c.json({ success: true, data: rows })
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
articleRoutes.delete('/:id', authMiddleware, (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select({ id: articles.id }).from(articles).where(eq(articles.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Artikel tidak ditemukan' }, 404)

  db.delete(articles).where(eq(articles.id, id)).run()

  return c.json({ success: true, message: 'Artikel berhasil dihapus' })
})
