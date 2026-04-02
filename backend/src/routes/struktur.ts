import { Hono } from 'hono'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { anggota, strukturPeriode } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { deleteFile, saveFile, validateImage } from '../lib/upload.js'

export const strukturRoutes = new Hono()

type StrukturTemplateNode = {
  role: string
  parentRole: string | null
  urutan: number
  divisi: string | null
  single: boolean
}

const STRUKTUR_TEMPLATE: StrukturTemplateNode[] = [
  { role: 'Ketua Kelompok Keilmuan', parentRole: null, urutan: 1, divisi: 'kepemimpinan', single: true },
  { role: 'Dosen / Anggota Kelompok Keilmuan', parentRole: 'Ketua Kelompok Keilmuan', urutan: 10, divisi: 'kepemimpinan', single: false },
  { role: 'Asisten Peneliti', parentRole: 'Ketua Kelompok Keilmuan', urutan: 20, divisi: 'anggota', single: true },
  { role: 'Koordinator Asisten', parentRole: 'Asisten Peneliti', urutan: 30, divisi: 'anggota', single: true },
  { role: 'Sekretaris', parentRole: 'Asisten Peneliti', urutan: 40, divisi: 'anggota', single: true },
  { role: 'Bendahara', parentRole: 'Asisten Peneliti', urutan: 50, divisi: 'anggota', single: true },
  { role: 'Divisi Penelitian dan Pengembangan', parentRole: 'Asisten Peneliti', urutan: 60, divisi: 'kolaborasi', single: true },
  { role: 'Koordinator Divisi Penelitian dan Pengembangan', parentRole: 'Divisi Penelitian dan Pengembangan', urutan: 61, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Penelitian dan Pengembangan', parentRole: 'Divisi Penelitian dan Pengembangan', urutan: 62, divisi: 'kolaborasi', single: false },
  { role: 'Divisi Pengabdian dan Pelatihan', parentRole: 'Asisten Peneliti', urutan: 70, divisi: 'kolaborasi', single: true },
  { role: 'Koordinator Divisi Pengabdian dan Pelatihan', parentRole: 'Divisi Pengabdian dan Pelatihan', urutan: 71, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Pengabdian dan Pelatihan', parentRole: 'Divisi Pengabdian dan Pelatihan', urutan: 72, divisi: 'kolaborasi', single: false },
  { role: 'Divisi Rumah Tangga', parentRole: 'Asisten Peneliti', urutan: 80, divisi: 'kolaborasi', single: true },
  { role: 'Koordinator Divisi Rumah Tangga', parentRole: 'Divisi Rumah Tangga', urutan: 81, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Rumah Tangga', parentRole: 'Divisi Rumah Tangga', urutan: 82, divisi: 'kolaborasi', single: false },
]

type StrukturRow = {
  id: number
  nama: string
  role: string
  divisi: string | null
  parentId: number | null
  periodeId: number | null
  photo: string | null
  urutan: number | null
}

type StrukturTreeNode = {
  id: number
  nama: string
  role: string
  divisi: string | null
  parentId: number | null
  periodeId: number | null
  photo: string | null
  urutan: number
  children: StrukturTreeNode[]
}

function normalizeRole(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parsePeriodeId(input: string | undefined): number | null {
  if (!input) return null
  const parsed = Number(input)
  return Number.isInteger(parsed) ? parsed : null
}

function getTemplateByRole(role: string): StrukturTemplateNode | null {
  const target = normalizeRole(role)
  return STRUKTUR_TEMPLATE.find((entry) => normalizeRole(entry.role) === target) ?? null
}

function getParentTemplate(role: string): StrukturTemplateNode | null {
  const template = getTemplateByRole(role)
  if (!template?.parentRole) return null
  return getTemplateByRole(template.parentRole)
}

function getLatestPeriode() {
  return db.select().from(strukturPeriode).orderBy(desc(strukturPeriode.id)).get()
}

function getActivePeriode() {
  return db.select().from(strukturPeriode).where(eq(strukturPeriode.isActive, true)).orderBy(desc(strukturPeriode.id)).get()
}

function ensureDefaultPeriode() {
  const latest = getLatestPeriode()
  if (latest) return latest
  return db
    .insert(strukturPeriode)
    .values({
      nama: 'Periode 1',
      isActive: true,
      createdAt: new Date(),
    })
    .returning()
    .get()
}

function getPeriodeOrDefault(periodeId: number | null) {
  if (periodeId !== null) {
    return db.select().from(strukturPeriode).where(eq(strukturPeriode.id, periodeId)).get() ?? null
  }
  const latest = getLatestPeriode()
  if (latest) return latest
  return ensureDefaultPeriode()
}

function validateRoleUniqueness(periodeId: number, role: string, exceptId?: number) {
  const template = getTemplateByRole(role)
  if (!template || !template.single) return null
  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periodeId)).all()
  const duplicate = rows.find(
    (row) => normalizeRole(row.role) === normalizeRole(role) && (exceptId ? row.id !== exceptId : true),
  )
  if (!duplicate) return null
  return `Role "${role}" hanya boleh 1 orang per periode`
}

function resolveParentIdOrError(periodeId: number, role: string, exceptId?: number): { parentId: number | null; error?: string } {
  const parentTemplate = getParentTemplate(role)
  if (!parentTemplate) return { parentId: null }
  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periodeId)).all()
  const parent = rows.find(
    (row) =>
      normalizeRole(row.role) === normalizeRole(parentTemplate.role) &&
      (exceptId ? row.id !== exceptId : true),
  )
  if (!parent) {
    return { parentId: null, error: `Parent role "${parentTemplate.role}" harus diisi lebih dulu` }
  }
  return { parentId: parent.id }
}

function sortRowsByTemplate(rows: StrukturRow[]) {
  return [...rows].sort((a, b) => {
    const ta = getTemplateByRole(a.role)
    const tb = getTemplateByRole(b.role)
    const oa = ta?.urutan ?? 9999
    const ob = tb?.urutan ?? 9999
    if (oa !== ob) return oa - ob
    return a.id - b.id
  })
}

function buildTree(rows: StrukturRow[]): StrukturTreeNode[] {
  const sorted = sortRowsByTemplate(rows).map((row) => ({
    ...row,
    urutan: getTemplateByRole(row.role)?.urutan ?? row.urutan ?? 9999,
    children: [] as StrukturTreeNode[],
  }))

  const nodeById = new Map<number, StrukturTreeNode>()
  sorted.forEach((row) => nodeById.set(row.id, row))

  const roots: StrukturTreeNode[] = []
  for (const node of sorted) {
    if (node.parentId && nodeById.has(node.parentId)) {
      nodeById.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortDeep = (nodes: StrukturTreeNode[]) => {
    nodes.sort((a, b) => a.urutan - b.urutan || a.id - b.id)
    nodes.forEach((node) => sortDeep(node.children))
  }
  sortDeep(roots)
  return roots
}

// Periode
strukturRoutes.get('/periode', (c) => {
  const rows = db.select().from(strukturPeriode).orderBy(desc(strukturPeriode.id)).all()
  return c.json({ success: true, data: rows })
})

strukturRoutes.post('/periode', authMiddleware, async (c) => {
  const payload = await c.req.json<{ nama?: string; mulai?: string; selesai?: string }>().catch(() => null)
  const nama = payload?.nama?.trim() ?? ''
  if (!nama) return c.json({ success: false, error: 'Nama periode wajib diisi' }, 400)

  const inserted = db
    .insert(strukturPeriode)
    .values({
      nama,
      mulai: payload?.mulai?.trim() || null,
      selesai: payload?.selesai?.trim() || null,
      isActive: false,
      createdAt: new Date(),
    })
    .returning()
    .get()

  return c.json({ success: true, data: inserted }, 201)
})

strukturRoutes.put('/periode/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID periode tidak valid' }, 400)
  const found = db.select().from(strukturPeriode).where(eq(strukturPeriode.id, id)).get()
  if (!found) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 404)

  const payload = await c.req.json<{ nama?: string; mulai?: string; selesai?: string }>().catch(() => null)
  const nama = payload?.nama?.trim() ?? ''
  if (!nama) return c.json({ success: false, error: 'Nama periode wajib diisi' }, 400)

  const updated = db
    .update(strukturPeriode)
    .set({
      nama,
      mulai: payload?.mulai?.trim() || null,
      selesai: payload?.selesai?.trim() || null,
    })
    .where(eq(strukturPeriode.id, id))
    .returning()
    .get()

  return c.json({ success: true, data: updated })
})

strukturRoutes.put('/periode/:id/activate', authMiddleware, (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID periode tidak valid' }, 400)
  const found = db.select().from(strukturPeriode).where(eq(strukturPeriode.id, id)).get()
  if (!found) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 404)

  db.transaction((tx) => {
    tx.update(strukturPeriode).set({ isActive: false }).run()
    tx.update(strukturPeriode).set({ isActive: true }).where(eq(strukturPeriode.id, id)).run()
  })

  return c.json({ success: true, message: 'Periode aktif berhasil diubah' })
})

strukturRoutes.delete('/periode/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID periode tidak valid' }, 400)
  const found = db.select().from(strukturPeriode).where(eq(strukturPeriode.id, id)).get()
  if (!found) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 404)

  const rows = db.select().from(anggota).where(eq(anggota.periodeId, id)).all()
  for (const row of rows) {
    if (row.photo) await deleteFile(row.photo)
  }

  db.transaction((tx) => {
    tx.delete(anggota).where(eq(anggota.periodeId, id)).run()
    tx.delete(strukturPeriode).where(eq(strukturPeriode.id, id)).run()
  })

  const active = getActivePeriode()
  if (!active) {
    const latest = getLatestPeriode()
    if (latest) {
      db.update(strukturPeriode).set({ isActive: true }).where(eq(strukturPeriode.id, latest.id)).run()
    }
  }

  return c.json({ success: true, message: 'Periode berhasil dihapus' })
})

// Template
strukturRoutes.get('/template', (c) => c.json({ success: true, data: STRUKTUR_TEMPLATE }))

// Struktur data by periode (flat + tree)
strukturRoutes.get('/', (c) => {
  const reqPeriodeId = parsePeriodeId(c.req.query('periodeId'))
  const periode = getPeriodeOrDefault(reqPeriodeId)
  if (!periode) return c.json({ success: true, data: [], tree: [], meta: { periodeId: null } })

  const rows = db
    .select()
    .from(anggota)
    .where(eq(anggota.periodeId, periode.id))
    .orderBy(asc(anggota.parentId), asc(anggota.urutan), asc(anggota.id))
    .all() as StrukturRow[]

  const sortedRows = sortRowsByTemplate(rows)
  const tree = buildTree(rows)
  return c.json({
    success: true,
    data: sortedRows,
    tree,
    meta: { periodeId: periode.id, activePeriodeId: getActivePeriode()?.id ?? null },
  })
})

// Create anggota
strukturRoutes.post('/', authMiddleware, async (c) => {
  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }

  const nama = typeof body['nama'] === 'string' ? body['nama'].trim() : ''
  const role = typeof body['role'] === 'string' ? body['role'].trim() : ''
  const reqPeriodeId = typeof body['periodeId'] === 'string' ? parsePeriodeId(body['periodeId']) : null
  const periode = getPeriodeOrDefault(reqPeriodeId)

  if (!nama || !role) return c.json({ success: false, error: 'Field "nama" dan "role" diperlukan' }, 400)
  if (!periode) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 400)

  const template = getTemplateByRole(role)
  if (!template) return c.json({ success: false, error: 'Role tidak ada dalam template struktur organisasi' }, 400)

  const duplicateError = validateRoleUniqueness(periode.id, role)
  if (duplicateError) return c.json({ success: false, error: duplicateError }, 409)

  const { parentId, error } = resolveParentIdOrError(periode.id, role)
  if (error) return c.json({ success: false, error }, 400)

  let photo: string | null = null
  const photoFile = body['photo']
  if (photoFile instanceof File) {
    const validationError = validateImage(photoFile)
    if (validationError) return c.json({ success: false, error: validationError }, 422)
    photo = await saveFile(photoFile, 'struktur')
  }

  const inserted = db
    .insert(anggota)
    .values({
      nama,
      role: template.role,
      divisi: template.divisi,
      photo,
      urutan: template.urutan,
      parentId,
      periodeId: periode.id,
    })
    .returning()
    .get()

  return c.json({ success: true, data: inserted }, 201)
})

// Update anggota
strukturRoutes.put('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)
  const existing = db.select().from(anggota).where(eq(anggota.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Anggota tidak ditemukan' }, 404)

  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }

  const nextNama = typeof body['nama'] === 'string' ? body['nama'].trim() : existing.nama
  const nextRole = typeof body['role'] === 'string' ? body['role'].trim() : existing.role
  if (!nextNama || !nextRole) return c.json({ success: false, error: 'Nama dan role wajib diisi' }, 400)

  const periodeId = existing.periodeId ?? ensureDefaultPeriode().id
  const template = getTemplateByRole(nextRole)
  if (!template) return c.json({ success: false, error: 'Role tidak ada dalam template struktur organisasi' }, 400)

  const duplicateError = validateRoleUniqueness(periodeId, nextRole, id)
  if (duplicateError) return c.json({ success: false, error: duplicateError }, 409)

  const { parentId, error } = resolveParentIdOrError(periodeId, nextRole, id)
  if (error) return c.json({ success: false, error }, 400)

  let photo = existing.photo
  const photoFile = body['photo']
  if (photoFile instanceof File) {
    const validationError = validateImage(photoFile)
    if (validationError) return c.json({ success: false, error: validationError }, 422)
    if (existing.photo) await deleteFile(existing.photo)
    photo = await saveFile(photoFile, 'struktur')
  }

  const updated = db
    .update(anggota)
    .set({
      nama: nextNama,
      role: template.role,
      divisi: template.divisi,
      parentId,
      urutan: template.urutan,
      photo,
    })
    .where(eq(anggota.id, id))
    .returning()
    .get()

  return c.json({ success: true, data: updated })
})

strukturRoutes.post('/reset', authMiddleware, async (c) => {
  const payload = await c.req.json<{ periodeId?: number }>().catch((): { periodeId?: number } => ({}))
  const reqPeriodeId = Number.isInteger(payload.periodeId) ? payload.periodeId! : null
  const periode = getPeriodeOrDefault(reqPeriodeId)
  if (!periode) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 404)

  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periode.id)).all()
  for (const row of rows) {
    if (row.photo) await deleteFile(row.photo)
  }
  db.delete(anggota).where(eq(anggota.periodeId, periode.id)).run()
  return c.json({ success: true, message: 'Data struktur periode berhasil dihapus' })
})

strukturRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)

  const existing = db.select().from(anggota).where(eq(anggota.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Anggota tidak ditemukan' }, 404)
  const periodeId = existing.periodeId ?? ensureDefaultPeriode().id

  const hasChild = db
    .select()
    .from(anggota)
    .where(and(eq(anggota.parentId, id), eq(anggota.periodeId, periodeId)))
    .get()
  if (hasChild) return c.json({ success: false, error: 'Tidak bisa hapus node yang masih punya anak' }, 400)

  db.delete(anggota).where(eq(anggota.id, id)).run()
  if (existing.photo) await deleteFile(existing.photo)
  return c.json({ success: true, message: 'Anggota berhasil dihapus' })
})

