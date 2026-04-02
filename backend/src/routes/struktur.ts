import { Hono } from 'hono'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { anggota } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { saveFile, deleteFile, validateImage } from '../lib/upload.js'

export const strukturRoutes = new Hono()

type StrukturReorderItem = {
  id: number
  parentId: number | null
  urutan: number
}

function parseNullableInteger(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isInteger(parsed) ? parsed : null
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

  const divisi = typeof body['divisi'] === 'string' ? body['divisi'].trim() || null : null
  const urutan = parseNullableInteger(body['urutan'])
  const parentId = parseNullableInteger(body['parentId'])

  if (parentId !== null) {
    const parentExists = db.select().from(anggota).where(eq(anggota.id, parentId)).get()
    if (!parentExists) {
      return c.json({ success: false, error: 'Parent tidak ditemukan' }, 400)
    }
  }

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

// PUT /struktur/reorder [AUTH]
strukturRoutes.put('/reorder', authMiddleware, async (c) => {
  const payload = await c.req.json<{ nodes?: StrukturReorderItem[] }>().catch(() => null)
  const nodes = payload?.nodes

  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return c.json({ success: false, error: 'Payload nodes wajib diisi' }, 400)
  }

  const rows = db.select().from(anggota).all()
  const existingIds = new Set(rows.map((row) => row.id))
  if (nodes.some((node) => !existingIds.has(node.id))) {
    return c.json({ success: false, error: 'Ada node dengan ID tidak valid' }, 400)
  }

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  for (const node of nodes) {
    if (!Number.isInteger(node.urutan) || node.urutan < 1) {
      return c.json({ success: false, error: 'Urutan harus bilangan bulat >= 1' }, 400)
    }
    if (node.parentId !== null && !existingIds.has(node.parentId)) {
      return c.json({ success: false, error: 'Parent ID tidak valid' }, 400)
    }
    if (node.parentId === node.id) {
      return c.json({ success: false, error: 'Parent tidak boleh diri sendiri' }, 400)
    }
  }

  for (const node of nodes) {
    let parentId = node.parentId
    const visited = new Set<number>([node.id])
    while (parentId !== null) {
      if (visited.has(parentId)) {
        return c.json({ success: false, error: 'Struktur tree tidak valid (loop terdeteksi)' }, 400)
      }
      visited.add(parentId)
      parentId = nodeMap.get(parentId)?.parentId ?? null
    }
  }

  db.transaction((tx) => {
    for (const node of nodes) {
      tx.update(anggota).set({ parentId: node.parentId, urutan: node.urutan }).where(eq(anggota.id, node.id)).run()
    }
  })

  return c.json({ success: true, message: 'Urutan struktur berhasil diperbarui' })
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

  if (typeof body['nama'] === 'string') updates.nama = body['nama'].trim()
  if (typeof body['role'] === 'string') updates.role = body['role'].trim()
  if (typeof body['divisi'] === 'string') updates.divisi = body['divisi'].trim() || null
  if (typeof body['urutan'] === 'string') updates.urutan = parseNullableInteger(body['urutan'])
  if (typeof body['parentId'] === 'string') {
    const parsedParentId = parseNullableInteger(body['parentId'])
    if (parsedParentId === id) {
      return c.json({ success: false, error: 'Parent tidak boleh diri sendiri' }, 400)
    }
    if (parsedParentId !== null) {
      const parentExists = db.select().from(anggota).where(eq(anggota.id, parsedParentId)).get()
      if (!parentExists) {
        return c.json({ success: false, error: 'Parent tidak ditemukan' }, 400)
      }
    }
    updates.parentId = parsedParentId
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
