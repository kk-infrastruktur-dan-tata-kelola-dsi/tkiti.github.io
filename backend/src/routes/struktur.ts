import { Hono } from 'hono'
import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { anggota, strukturMaster, strukturPeriode } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { deleteFile, saveFile, validateImage } from '../lib/upload.js'

export const strukturRoutes = new Hono()

type MasterNode = {
  id: number
  role: string
  parentRole: string | null
  urutan: number
  divisi: string | null
  single: boolean
}

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

type StrukturTreeNode = StrukturRow & { urutan: number; children: StrukturTreeNode[] }

const DEFAULT_MASTER: Array<Omit<MasterNode, 'id'>> = [
  { role: 'Ketua Kelompok Keilmuan', parentRole: null, urutan: 1, divisi: 'kepemimpinan', single: true },
  { role: 'Dosen / Anggota Kelompok Keilmuan', parentRole: 'Ketua Kelompok Keilmuan', urutan: 2, divisi: 'kepemimpinan', single: false },
  { role: 'Koordinator Asisten', parentRole: 'Dosen / Anggota Kelompok Keilmuan', urutan: 3, divisi: 'anggota', single: true },
  { role: 'Bendahara', parentRole: 'Koordinator Asisten', urutan: 4, divisi: 'anggota', single: true },
  { role: 'Sekretaris', parentRole: 'Koordinator Asisten', urutan: 5, divisi: 'anggota', single: true },
  { role: 'Koordinator Divisi Penelitian dan Pengembangan', parentRole: 'Koordinator Asisten', urutan: 6, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Penelitian dan Pengembangan', parentRole: 'Koordinator Divisi Penelitian dan Pengembangan', urutan: 7, divisi: 'kolaborasi', single: false },
  { role: 'Koordinator Divisi Pengabdian dan Pelatihan', parentRole: 'Koordinator Asisten', urutan: 8, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Pengabdian dan Pelatihan', parentRole: 'Koordinator Divisi Pengabdian dan Pelatihan', urutan: 9, divisi: 'kolaborasi', single: false },
  { role: 'Koordinator Divisi Rumah Tangga', parentRole: 'Koordinator Asisten', urutan: 10, divisi: 'kolaborasi', single: true },
  { role: 'Anggota Divisi Rumah Tangga', parentRole: 'Koordinator Divisi Rumah Tangga', urutan: 11, divisi: 'kolaborasi', single: false },
]

function normalizeRole(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parsePeriodeId(input: string | undefined): number | null {
  if (!input) return null
  const parsed = Number(input)
  return Number.isInteger(parsed) ? parsed : null
}

function ensureMasterSeeded() {
  const count = db.select().from(strukturMaster).all().length
  if (count > 0) return
  for (const row of DEFAULT_MASTER) {
    db.insert(strukturMaster).values(row).run()
  }
}

function getMasterRows(): MasterNode[] {
  ensureMasterSeeded()
  return db
    .select()
    .from(strukturMaster)
    .orderBy(asc(strukturMaster.urutan), asc(strukturMaster.id))
    .all()
    .map((row) => ({
      ...row,
      single: Boolean(row.single),
    }))
}

function getMasterByRole(role: string): MasterNode | null {
  const target = normalizeRole(role)
  return getMasterRows().find((row) => normalizeRole(row.role) === target) ?? null
}

function getParentMaster(role: string): MasterNode | null {
  const me = getMasterByRole(role)
  if (!me?.parentRole) return null
  return getMasterByRole(me.parentRole)
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
    .values({ nama: 'Periode 1', isActive: true, createdAt: new Date() })
    .returning()
    .get()
}

function getPeriodeOrDefault(periodeId: number | null) {
  if (periodeId !== null) return db.select().from(strukturPeriode).where(eq(strukturPeriode.id, periodeId)).get() ?? null
  return getLatestPeriode() ?? ensureDefaultPeriode()
}

function validateSingleRole(periodeId: number, role: string, exceptId?: number) {
  const master = getMasterByRole(role)
  if (!master?.single) return null
  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periodeId)).all()
  const duplicate = rows.find((row) => normalizeRole(row.role) === normalizeRole(role) && (exceptId ? row.id !== exceptId : true))
  return duplicate ? `Role "${role}" hanya boleh 1 orang per periode` : null
}

function resolveParentId(periodeId: number, role: string, exceptId?: number): { parentId: number | null; error?: string } {
  const parentMaster = getParentMaster(role)
  if (!parentMaster) return { parentId: null }
  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periodeId)).all()
  const parent = rows.find(
    (row) => normalizeRole(row.role) === normalizeRole(parentMaster.role) && (exceptId ? row.id !== exceptId : true),
  )
  if (!parent) return { parentId: null, error: `Parent role "${parentMaster.role}" harus diisi lebih dulu` }
  return { parentId: parent.id }
}

function sortRowsByMaster(rows: StrukturRow[]) {
  const master = getMasterRows()
  const orderMap = new Map(master.map((row) => [normalizeRole(row.role), row.urutan]))
  return [...rows].sort((a, b) => {
    const oa = orderMap.get(normalizeRole(a.role)) ?? 9999
    const ob = orderMap.get(normalizeRole(b.role)) ?? 9999
    return oa - ob || a.id - b.id
  })
}

function buildTree(rows: StrukturRow[]): StrukturTreeNode[] {
  const master = getMasterRows()
  const orderMap = new Map(master.map((row) => [normalizeRole(row.role), row.urutan]))
  const sorted = sortRowsByMaster(rows).map((row) => ({
    ...row,
    urutan: orderMap.get(normalizeRole(row.role)) ?? row.urutan ?? 9999,
    children: [] as StrukturTreeNode[],
  }))
  const map = new Map<number, StrukturTreeNode>()
  sorted.forEach((row) => map.set(row.id, row))
  const roots: StrukturTreeNode[] = []
  for (const row of sorted) {
    if (row.parentId && map.has(row.parentId)) map.get(row.parentId)!.children.push(row)
    else roots.push(row)
  }
  const sortDeep = (nodes: StrukturTreeNode[]) => {
    nodes.sort((a, b) => a.urutan - b.urutan || a.id - b.id)
    nodes.forEach((node) => sortDeep(node.children))
  }
  sortDeep(roots)
  return roots
}

// Periode CRUD
strukturRoutes.get('/periode', (c) => c.json({ success: true, data: db.select().from(strukturPeriode).orderBy(desc(strukturPeriode.id)).all() }))

strukturRoutes.post('/periode', authMiddleware, async (c) => {
  const payload = await c.req.json<{ nama?: string; mulai?: string; selesai?: string }>().catch(() => null)
  const nama = payload?.nama?.trim() ?? ''
  if (!nama) return c.json({ success: false, error: 'Nama periode wajib diisi' }, 400)
  const inserted = db
    .insert(strukturPeriode)
    .values({ nama, mulai: payload?.mulai?.trim() || null, selesai: payload?.selesai?.trim() || null, isActive: false, createdAt: new Date() })
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
    .set({ nama, mulai: payload?.mulai?.trim() || null, selesai: payload?.selesai?.trim() || null })
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
    if (latest) db.update(strukturPeriode).set({ isActive: true }).where(eq(strukturPeriode.id, latest.id)).run()
  }
  return c.json({ success: true, message: 'Periode berhasil dihapus' })
})

// Master CRUD
strukturRoutes.get('/master', (c) => c.json({ success: true, data: getMasterRows() }))

strukturRoutes.post('/master', authMiddleware, async (c) => {
  const payload = await c.req.json<{ role?: string; parentRole?: string | null; urutan?: number; divisi?: string | null; single?: boolean }>().catch(() => null)
  const role = payload?.role?.trim() ?? ''
  if (!role) return c.json({ success: false, error: 'Role wajib diisi' }, 400)
  const existing = getMasterByRole(role)
  if (existing) return c.json({ success: false, error: 'Role master sudah ada' }, 409)
  if (payload?.parentRole && normalizeRole(payload.parentRole) === normalizeRole(role)) {
    return c.json({ success: false, error: 'Parent role tidak boleh sama dengan role' }, 400)
  }
  const inserted = db
    .insert(strukturMaster)
    .values({
      role,
      parentRole: payload?.parentRole?.trim() || null,
      urutan: Number.isInteger(payload?.urutan) ? Number(payload!.urutan) : getMasterRows().length + 1,
      divisi: payload?.divisi?.trim() || null,
      single: Boolean(payload?.single),
    })
    .returning()
    .get()
  return c.json({ success: true, data: inserted }, 201)
})

strukturRoutes.put('/master/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID master tidak valid' }, 400)
  const found = db.select().from(strukturMaster).where(eq(strukturMaster.id, id)).get()
  if (!found) return c.json({ success: false, error: 'Master role tidak ditemukan' }, 404)
  const payload = await c.req.json<{ role?: string; parentRole?: string | null; urutan?: number; divisi?: string | null; single?: boolean }>().catch(() => null)
  const role = payload?.role?.trim() ?? found.role
  const parentRole = payload?.parentRole?.trim() || null
  if (!role) return c.json({ success: false, error: 'Role wajib diisi' }, 400)
  if (parentRole && normalizeRole(parentRole) === normalizeRole(role)) return c.json({ success: false, error: 'Parent role tidak boleh sama' }, 400)

  const duplicate = getMasterRows().find((row) => normalizeRole(row.role) === normalizeRole(role) && row.id !== id)
  if (duplicate) return c.json({ success: false, error: 'Role master sudah ada' }, 409)

  const updated = db
    .update(strukturMaster)
    .set({
      role,
      parentRole,
      urutan: Number.isInteger(payload?.urutan) ? Number(payload!.urutan) : found.urutan,
      divisi: payload?.divisi?.trim() || null,
      single: typeof payload?.single === 'boolean' ? payload.single : found.single,
    })
    .where(eq(strukturMaster.id, id))
    .returning()
    .get()

  const affectedMembers = db.select().from(anggota).where(eq(anggota.role, found.role)).all()
  for (const member of affectedMembers) {
    db.update(anggota).set({ role: updated.role, divisi: updated.divisi, urutan: updated.urutan }).where(eq(anggota.id, member.id)).run()
  }

  return c.json({ success: true, data: updated })
})

strukturRoutes.delete('/master/:id', authMiddleware, (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID master tidak valid' }, 400)
  const found = db.select().from(strukturMaster).where(eq(strukturMaster.id, id)).get()
  if (!found) return c.json({ success: false, error: 'Master role tidak ditemukan' }, 404)
  const hasChildrenMaster = db.select().from(strukturMaster).where(eq(strukturMaster.parentRole, found.role)).get()
  if (hasChildrenMaster) return c.json({ success: false, error: 'Role master masih punya child role' }, 400)
  const hasMembers = db.select().from(anggota).where(eq(anggota.role, found.role)).get()
  if (hasMembers) return c.json({ success: false, error: 'Role master masih dipakai anggota' }, 400)
  db.delete(strukturMaster).where(eq(strukturMaster.id, id)).run()
  return c.json({ success: true, message: 'Role master berhasil dihapus' })
})

// Compatibility template endpoint
strukturRoutes.get('/template', (c) => c.json({ success: true, data: getMasterRows() }))

// Struktur by periode
strukturRoutes.get('/', (c) => {
  const periode = getPeriodeOrDefault(parsePeriodeId(c.req.query('periodeId')))
  if (!periode) return c.json({ success: true, data: [], tree: [], meta: { periodeId: null } })
  const rows = db.select().from(anggota).where(eq(anggota.periodeId, periode.id)).orderBy(asc(anggota.parentId), asc(anggota.urutan), asc(anggota.id)).all() as StrukturRow[]
  return c.json({
    success: true,
    data: sortRowsByMaster(rows),
    tree: buildTree(rows),
    meta: { periodeId: periode.id, activePeriodeId: getActivePeriode()?.id ?? null },
  })
})

// Anggota CRUD
strukturRoutes.post('/', authMiddleware, async (c) => {
  let body: Record<string, string | File>
  try {
    body = await c.req.parseBody()
  } catch {
    return c.json({ success: false, error: 'Gagal parse form data' }, 400)
  }
  const nama = typeof body['nama'] === 'string' ? body['nama'].trim() : ''
  const role = typeof body['role'] === 'string' ? body['role'].trim() : ''
  const periode = getPeriodeOrDefault(typeof body['periodeId'] === 'string' ? parsePeriodeId(body['periodeId']) : null)
  if (!nama || !role) return c.json({ success: false, error: 'Field "nama" dan "role" diperlukan' }, 400)
  if (!periode) return c.json({ success: false, error: 'Periode tidak ditemukan' }, 400)
  const master = getMasterByRole(role)
  if (!master) return c.json({ success: false, error: 'Role tidak ada dalam struktur master' }, 400)
  const singleError = validateSingleRole(periode.id, master.role)
  if (singleError) return c.json({ success: false, error: singleError }, 409)
  const { parentId, error } = resolveParentId(periode.id, master.role)
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
    .values({ nama, role: master.role, divisi: master.divisi, photo, urutan: master.urutan, parentId, periodeId: periode.id })
    .returning()
    .get()
  return c.json({ success: true, data: inserted }, 201)
})

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
  const master = getMasterByRole(nextRole)
  if (!master) return c.json({ success: false, error: 'Role tidak ada dalam struktur master' }, 400)
  const singleError = validateSingleRole(periodeId, master.role, id)
  if (singleError) return c.json({ success: false, error: singleError }, 409)
  const { parentId, error } = resolveParentId(periodeId, master.role, id)
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
    .set({ nama: nextNama, role: master.role, divisi: master.divisi, parentId, urutan: master.urutan, photo })
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
  for (const row of rows) if (row.photo) await deleteFile(row.photo)
  db.delete(anggota).where(eq(anggota.periodeId, periode.id)).run()
  return c.json({ success: true, message: 'Data struktur periode berhasil dihapus' })
})

strukturRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) return c.json({ success: false, error: 'ID tidak valid' }, 400)
  const existing = db.select().from(anggota).where(eq(anggota.id, id)).get()
  if (!existing) return c.json({ success: false, error: 'Anggota tidak ditemukan' }, 404)
  const periodeId = existing.periodeId ?? ensureDefaultPeriode().id
  const hasChild = db.select().from(anggota).where(and(eq(anggota.parentId, id), eq(anggota.periodeId, periodeId))).get()
  if (hasChild) return c.json({ success: false, error: 'Tidak bisa hapus node yang masih punya anak' }, 400)
  db.delete(anggota).where(eq(anggota.id, id)).run()
  if (existing.photo) await deleteFile(existing.photo)
  return c.json({ success: true, message: 'Anggota berhasil dihapus' })
})

