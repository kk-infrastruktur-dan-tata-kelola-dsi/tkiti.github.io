import { Hono } from 'hono'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client.js'
import { gallery } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { saveFile, deleteFile, validateImage } from '../lib/upload.js'

export const galleryRoutes = new Hono()

// GET /gallery — semua foto, sort by urutan asc, lalu id asc
galleryRoutes.get('/', (c) => {
  const rows = db.select().from(gallery).orderBy(asc(gallery.urutan), asc(gallery.id)).all()
  return c.json({ success: true, data: rows })
})

// POST /gallery [AUTH] — upload foto baru
// Multipart fields: file (required), caption (optional), tanggal (optional), urutan (optional)
galleryRoutes.post('/', authMiddleware, async (c) => {
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

  const src = await saveFile(file, 'gallery')

  const caption = typeof body['caption'] === 'string' ? body['caption'] : null
  const tanggal = typeof body['tanggal'] === 'string' ? body['tanggal'] : null
  const urutan = typeof body['urutan'] === 'string' ? Number(body['urutan']) : null

  const inserted = db
    .insert(gallery)
    .values({ src, caption, tanggal, urutan })
    .returning()
    .get()

  return c.json({ success: true, data: inserted }, 201)
})

// DELETE /gallery/:id [AUTH] — hapus dari DB dan file dari disk
galleryRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select().from(gallery).where(eq(gallery.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Foto tidak ditemukan' }, 404)

  db.delete(gallery).where(eq(gallery.id, id)).run()
  await deleteFile(existing.src)

  return c.json({ success: true, message: 'Foto berhasil dihapus' })
})
