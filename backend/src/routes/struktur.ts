import { Hono } from 'hono'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { anggota } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { saveFile, deleteFile, validateImage } from '../lib/upload.js'

export const strukturRoutes = new Hono()

type StrukturTemplateNode = {
  role: string
  parentRole: string | null
  urutan: number
  divisi: string | null
}

const STRUKTUR_TEMPLATE: StrukturTemplateNode[] = [
  { role: 'Ketua Kelompok Keilmuan', parentRole: null, urutan: 1, divisi: 'kepemimpinan' },
  { role: 'Dosen / Anggota Kelompok Keilmuan', parentRole: 'Ketua Kelompok Keilmuan', urutan: 1, divisi: 'kepemimpinan' },
  { role: 'Asisten Peneliti', parentRole: 'Ketua Kelompok Keilmuan', urutan: 2, divisi: 'anggota' },
  { role: 'Koordinator Asisten', parentRole: 'Asisten Peneliti', urutan: 1, divisi: 'anggota' },
  { role: 'Bendahara', parentRole: 'Asisten Peneliti', urutan: 2, divisi: 'anggota' },
  { role: 'Sekretaris', parentRole: 'Asisten Peneliti', urutan: 3, divisi: 'anggota' },
  { role: 'Divisi Penelitian dan Pengembangan', parentRole: 'Asisten Peneliti', urutan: 4, divisi: 'kolaborasi' },
  { role: 'Koordinator Divisi Penelitian dan Pengembangan', parentRole: 'Divisi Penelitian dan Pengembangan', urutan: 1, divisi: 'kolaborasi' },
  { role: 'Anggota Divisi Penelitian dan Pengembangan', parentRole: 'Divisi Penelitian dan Pengembangan', urutan: 2, divisi: 'kolaborasi' },
  { role: 'Divisi Pengabdian dan Pelatihan', parentRole: 'Asisten Peneliti', urutan: 5, divisi: 'kolaborasi' },
  { role: 'Koordinator Divisi Pengabdian dan Pelatihan', parentRole: 'Divisi Pengabdian dan Pelatihan', urutan: 1, divisi: 'kolaborasi' },
  { role: 'Anggota Divisi Pengabdian dan Pelatihan', parentRole: 'Divisi Pengabdian dan Pelatihan', urutan: 2, divisi: 'kolaborasi' },
  { role: 'Divisi Rumah Tangga', parentRole: 'Asisten Peneliti', urutan: 6, divisi: 'kolaborasi' },
  { role: 'Koordinator Divisi Rumah Tangga', parentRole: 'Divisi Rumah Tangga', urutan: 1, divisi: 'kolaborasi' },
  { role: 'Anggota Divisi Rumah Tangga', parentRole: 'Divisi Rumah Tangga', urutan: 2, divisi: 'kolaborasi' },
]

function normalizeRole(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getTemplateByRole(role: string): StrukturTemplateNode | null {
  const target = normalizeRole(role)
  return STRUKTUR_TEMPLATE.find((entry) => normalizeRole(entry.role) === target) ?? null
}

function resolveParentId(role: string, rows: Array<{ id: number; role: string }>): number | null {
  const template = getTemplateByRole(role)
  if (!template || !template.parentRole) return null
  const parentRoleNormalized = normalizeRole(template.parentRole)
  const parent = rows.find((row) => normalizeRole(row.role) === parentRoleNormalized)
  return parent?.id ?? null
}

// GET /struktur — list anggota (flat) sesuai urutan tree
strukturRoutes.get('/', (c) => {
  const rows = db
    .select()
    .from(anggota)
    .orderBy(asc(anggota.parentId), asc(anggota.urutan), asc(anggota.id))
    .all()

  return c.json({ success: true, data: rows })
})

// POST /struktur [AUTH]
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

  const template = getTemplateByRole(role)
  if (!template) {
    return c.json({ success: false, error: 'Role tidak ada dalam template struktur organisasi' }, 400)
  }

  const existing = db.select().from(anggota).all()
  const parentId = resolveParentId(role, existing.map((item) => ({ id: item.id, role: item.role })))
  const urutan = template.urutan
  const divisi = template.divisi

  let photo: string | null = null
  const photoFile = body['photo']
  if (photoFile instanceof File) {
    const validationError = validateImage(photoFile)
    if (validationError) return c.json({ success: false, error: validationError }, 422)
    photo = await saveFile(photoFile, 'struktur')
  }

  const inserted = db
    .insert(anggota)
    .values({ nama, role, divisi, photo, urutan, parentId })
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
    parentId: number | null
    urutan: number | null
    photo: string | null
  }> = {}

  if (typeof body['nama'] === 'string') {
    const trimmed = body['nama'].trim()
    if (!trimmed) return c.json({ success: false, error: 'Nama tidak boleh kosong' }, 400)
    updates.nama = trimmed
  }
  if (typeof body['role'] === 'string') {
    const nextRole = body['role'].trim()
    const template = getTemplateByRole(nextRole)
    if (!template) {
      return c.json({ success: false, error: 'Role tidak ada dalam template struktur organisasi' }, 400)
    }
    updates.role = nextRole
    updates.divisi = template.divisi
    updates.urutan = template.urutan
    const rows = db
      .select()
      .from(anggota)
      .all()
      .map((item) => ({
        id: item.id,
        role: item.id === id ? nextRole : item.role,
      }))
    updates.parentId = resolveParentId(nextRole, rows)
  }

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

// GET /struktur/template — daftar role tetap sesuai bagan organisasi
strukturRoutes.get('/template', (c) => {
  return c.json({ success: true, data: STRUKTUR_TEMPLATE })
})

// POST /struktur/reset [AUTH] — hapus seluruh anggota
strukturRoutes.post('/reset', authMiddleware, async (c) => {
  const rows = db.select().from(anggota).all()
  for (const row of rows) {
    if (row.photo) {
      await deleteFile(row.photo)
    }
  }
  db.delete(anggota).run()
  return c.json({ success: true, message: 'Semua data struktur berhasil dihapus' })
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
