import { Hono } from 'hono'
import { eq, asc, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { anggota } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { saveFile, deleteFile, validateImage } from '../lib/upload.js'

export const strukturRoutes = new Hono()

// GET /struktur — list semua anggota, sort: kepemimpinan → anggota → kolaborasi, lalu urutan
strukturRoutes.get('/', (c) => {
  const rows = db
    .select()
    .from(anggota)
    .orderBy(
      sql`CASE ${anggota.divisi}
        WHEN 'kepemimpinan' THEN 1
        WHEN 'anggota'      THEN 2
        WHEN 'kolaborasi'   THEN 3
        ELSE 4
      END`,
      asc(anggota.urutan),
      asc(anggota.id),
    )
    .all()

  return c.json({ success: true, data: rows })
})

// POST /struktur [AUTH]
// Multipart fields: nama, role, divisi (optional), urutan (optional), photo (optional)
strukturRoutes.post('/', authMiddleware, async (c) => {
  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }

  const nama = typeof body['nama'] === 'string' ? body['nama'].trim() : ''
  const role = typeof body['role'] === 'string' ? body['role'].trim() : ''

  if (!nama || !role) {
    return c.json({ success: false, error: 'Field "nama" dan "role" diperlukan' }, 400)
  }

  const divisi = typeof body['divisi'] === 'string' ? body['divisi'] : null
  const urutan = typeof body['urutan'] === 'string' ? Number(body['urutan']) : null

  let photo: string | null = null
  const photoFile = body['photo']
  if (photoFile instanceof File) {
    const validationError = validateImage(photoFile)
    if (validationError) return c.json({ success: false, error: validationError }, 422)
    photo = await saveFile(photoFile, 'struktur')
  }

  const inserted = db
    .insert(anggota)
    .values({ nama, role, divisi, photo, urutan })
    .returning()
    .get()

  return c.json({ success: true, data: inserted }, 201)
})

// PUT /struktur/:id [AUTH]
strukturRoutes.put('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select().from(anggota).where(eq(anggota.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Anggota tidak ditemukan' }, 404)

  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }

  const updates: Partial<{
    nama: string
    role: string
    divisi: string | null
    urutan: number | null
    photo: string | null
  }> = {}

  if (typeof body['nama'] === 'string') updates.nama = body['nama'].trim()
  if (typeof body['role'] === 'string') updates.role = body['role'].trim()
  if (typeof body['divisi'] === 'string') updates.divisi = body['divisi']
  if (typeof body['urutan'] === 'string') updates.urutan = Number(body['urutan'])

  // Jika ada foto baru, hapus foto lama dan simpan yang baru
  const photoFile = body['photo']
  if (photoFile instanceof File) {
    const validationError = validateImage(photoFile)
    if (validationError) return c.json({ success: false, error: validationError }, 422)

    if (existing.photo) await deleteFile(existing.photo)
    updates.photo = await saveFile(photoFile, 'struktur')
  }

  const updated = db
    .update(anggota)
    .set(updates)
    .where(eq(anggota.id, id))
    .returning()
    .get()

  return c.json({ success: true, data: updated })
})

// DELETE /struktur/:id [AUTH]
strukturRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select().from(anggota).where(eq(anggota.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Anggota tidak ditemukan' }, 404)

  db.delete(anggota).where(eq(anggota.id, id)).run()
  if (existing.photo) await deleteFile(existing.photo)

  return c.json({ success: true, message: 'Anggota berhasil dihapus' })
})
