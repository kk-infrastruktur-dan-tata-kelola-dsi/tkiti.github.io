import { Hono } from 'hono'
import { like, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { content } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

export const contentRoutes = new Hono()

// GET /content/:section
// Ambil semua key yang diawali "<section>." dan kembalikan sebagai object.
// Contoh: GET /content/hero → { "hero.title": "...", "hero.subtitle": "..." }
contentRoutes.get('/:section', (c) => {
  const section = c.req.param('section') as string

  const rows = db
    .select()
    .from(content)
    .where(like(content.key, `${section}.%`))
    .all()

  const data = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return c.json({ success: true, data })
})

// PUT /content/:key  [AUTH]
// Upsert satu key. Body: { "value": "..." }
contentRoutes.put('/:key', authMiddleware, async (c) => {
  const key = c.req.param('key') as string

  let body: { value?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Body harus berupa JSON' }, 400)
  }

  if (typeof body.value !== 'string') {
    return c.json({ success: false, error: 'Field "value" diperlukan' }, 400)
  }

  const value = body.value

  db.insert(content)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: content.key,
      set: { value, updatedAt: new Date() },
    })
    .run()

  return c.json({ success: true, message: `Content "${key}" berhasil diperbarui` })
})
