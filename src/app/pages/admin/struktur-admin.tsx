import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { GripVertical, Pencil, Plus, Save, Trash2, Upload, User } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { apiRequest, API_URL, toAbsoluteApiUrl } from '@/app/lib/api'

type Anggota = {
  id: number
  nama: string
  role: string
  divisi: string | null
  parentId: number | null
  photo: string | null
  urutan: number | null
}

type FormState = {
  nama: string
  role: string
  divisi: string
  parentId: string
  urutan: string
}

type TreeNode = Anggota & { children: TreeNode[] }

const EMPTY_FORM: FormState = { nama: '', role: '', divisi: '', parentId: '', urutan: '' }

const DIVISI_LABELS: Record<string, string> = {
  kepemimpinan: 'Kepemimpinan',
  anggota: 'Anggota',
  kolaborasi: 'Kolaborasi',
}

function sortNodes<T extends { urutan: number | null; id: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
}

function buildTree(items: Anggota[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }
  const roots: TreeNode[] = []
  for (const item of items) {
    const node = map.get(item.id)
    if (!node) continue
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortDeep = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.urutan ?? Number.MAX_SAFE_INTEGER) - (b.urutan ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
    for (const node of nodes) sortDeep(node.children)
  }
  sortDeep(roots)
  return roots
}

function collectReorderPayload(nodes: TreeNode[], parentId: number | null = null): Array<{ id: number; parentId: number | null; urutan: number }> {
  const result: Array<{ id: number; parentId: number | null; urutan: number }> = []
  nodes.forEach((node, index) => {
    result.push({ id: node.id, parentId, urutan: index + 1 })
    result.push(...collectReorderPayload(node.children, node.id))
  })
  return result
}

type BranchDirection = 'up' | 'down'

function moveWithinSiblings(list: Anggota[], id: number, direction: BranchDirection): Anggota[] {
  const target = list.find((node) => node.id === id)
  if (!target) return list
  const siblings = sortNodes(list.filter((node) => node.parentId === target.parentId))
  const currentIndex = siblings.findIndex((node) => node.id === id)
  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (currentIndex < 0 || swapIndex < 0 || swapIndex >= siblings.length) return list
  const current = siblings[currentIndex]
  const swapWith = siblings[swapIndex]
  return list.map((node) => {
    if (node.id === current.id) return { ...node, urutan: swapWith.urutan ?? swapIndex + 1 }
    if (node.id === swapWith.id) return { ...node, urutan: current.urutan ?? currentIndex + 1 }
    return node
  })
}

export function AdminStruktur() {
  const [items, setItems] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingTree, setSavingTree] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const sortedItems = useMemo(() => sortNodes(items), [items])
  const tree = useMemo(() => buildTree(sortedItems), [sortedItems])

  async function fetchData() {
    const res = await apiRequest<Anggota[]>('/struktur')
    if (res.success && res.data) setItems(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview('')
    setDialogOpen(true)
  }

  function openEdit(a: Anggota) {
    setEditId(a.id)
    setForm({
      nama: a.nama,
      role: a.role,
      divisi: a.divisi ?? '',
      parentId: a.parentId ? String(a.parentId) : '',
      urutan: a.urutan ? String(a.urutan) : '',
    })
    setPhotoFile(null)
    setPhotoPreview(toAbsoluteApiUrl(a.photo) ?? '')
    setDialogOpen(true)
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.role.trim()) {
      toast.error('Nama dan role wajib diisi')
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('nama', form.nama.trim())
    fd.append('role', form.role.trim())
    fd.append('divisi', form.divisi)
    fd.append('parentId', form.parentId)
    fd.append('urutan', form.urutan)
    if (photoFile) fd.append('photo', photoFile)

    const url = editId ? `/struktur/${editId}` : '/struktur'
    const method = editId ? 'PUT' : 'POST'
    const res = await apiRequest<Anggota>(url, { method, body: fd })

    if (res.success) {
      toast.success(editId ? 'Anggota diperbarui' : 'Anggota ditambahkan')
      setDialogOpen(false)
      await fetchData()
    } else {
      toast.error(res.error ?? 'Gagal menyimpan')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const hasChildren = items.some((item) => item.parentId === id)
    if (hasChildren) {
      toast.error('Tidak bisa menghapus node yang masih punya anak')
      return
    }
    const res = await apiRequest(`/struktur/${id}`, { method: 'DELETE' })
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Anggota dihapus')
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
  }

  async function saveTreeOrder(nextItems: Anggota[]) {
    setSavingTree(true)
    const payload = collectReorderPayload(buildTree(sortNodes(nextItems)))
    const res = await apiRequest('/struktur/reorder', {
      method: 'PUT',
      body: JSON.stringify({ nodes: payload }),
    })
    if (!res.success) {
      toast.error(res.error ?? 'Gagal menyimpan urutan')
      await fetchData()
    } else {
      toast.success('Struktur berhasil disimpan')
      setItems((prev) =>
        prev.map((item) => {
          const updated = payload.find((p) => p.id === item.id)
          if (!updated) return item
          return { ...item, parentId: updated.parentId, urutan: updated.urutan }
        }),
      )
    }
    setSavingTree(false)
  }

  async function applyDrop(targetId: number | null) {
    if (draggingId === null) return
    const dragged = items.find((item) => item.id === draggingId)
    if (!dragged) return
    if (targetId === draggingId) return

    if (targetId !== null) {
      let cursor = items.find((item) => item.id === targetId)
      while (cursor) {
        if (cursor.parentId === draggingId) {
          toast.error('Tidak bisa menjadikan anak sebagai parent')
          return
        }
        cursor = cursor.parentId ? items.find((item) => item.id === cursor!.parentId) : undefined
      }
    }

    const siblings = sortNodes(items.filter((item) => item.parentId === targetId && item.id !== draggingId))
    const reorderedSiblings = siblings.map((item, index) => ({ ...item, urutan: index + 1 }))
    const nextDragged: Anggota = { ...dragged, parentId: targetId, urutan: reorderedSiblings.length + 1 }
    const nextItems = items.map((item) => {
      const siblingUpdated = reorderedSiblings.find((s) => s.id === item.id)
      if (siblingUpdated) return siblingUpdated
      if (item.id === nextDragged.id) return nextDragged
      return item
    })
    setItems(nextItems)
    await saveTreeOrder(nextItems)
  }

  async function moveNode(id: number, direction: BranchDirection) {
    const nextItems = moveWithinSiblings(items, id, direction)
    if (nextItems === items) return
    setItems(nextItems)
    await saveTreeOrder(nextItems)
  }

  const parentCandidates = sortedItems.filter((item) => item.id !== editId)

  function NodeRow({ node, depth }: { node: TreeNode; depth: number }) {
    const photoUrl = toAbsoluteApiUrl(node.photo)
    const divisiLabel = node.divisi ? (DIVISI_LABELS[node.divisi] ?? node.divisi) : 'Tanpa divisi'

    return (
      <div className="space-y-2">
        <div
          className="flex items-center gap-3 rounded-md border bg-white px-3 py-2"
          style={{ marginLeft: depth * 20 }}
          draggable
          onDragStart={() => setDraggingId(node.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async () => {
            await applyDrop(node.id)
            setDraggingId(null)
          }}
        >
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700"
            onClick={async () => moveNode(node.id, 'up')}
            title="Naikkan urutan"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700"
            onClick={async () => moveNode(node.id, 'down')}
            title="Turunkan urutan"
          >
            <GripVertical className="h-4 w-4 rotate-180" />
          </button>
          {photoUrl ? (
            <img src={photoUrl} alt={node.nama} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
              <User className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{node.nama}</p>
            <p className="truncate text-xs text-gray-500">{node.role}</p>
          </div>
          <Badge variant="secondary">{divisiLabel}</Badge>
          <Button variant="ghost" size="icon" onClick={() => openEdit(node)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" title="Hapus">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
                <AlertDialogDescription>{node.nama} akan dihapus permanen.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(node.id)}>
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {node.children.map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Struktur Organisasi</h1>
          <p className="mt-0.5 text-sm text-gray-500">{items.length} anggota</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" disabled={savingTree}>
            <Save className="h-4 w-4" /> {savingTree ? 'Menyimpan...' : 'Auto-save aktif'}
          </Button>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Tambah Anggota
          </Button>
        </div>
      </div>

      <div
        className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async () => {
          await applyDrop(null)
          setDraggingId(null)
        }}
      >
        <p className="text-xs text-gray-500">
          Drag & drop node untuk mengubah parent (tree). Lepaskan di area kosong untuk jadikan root.
        </p>
        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Memuat struktur...</p>
        ) : tree.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Belum ada data struktur.</p>
        ) : (
          tree.map((node) => <NodeRow key={node.id} node={node} depth={0} />)
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
            <DialogDescription>Role bebas/custom, parent menentukan posisi dalam tree organisasi.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-16 w-16 rounded-full border border-gray-200 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload foto
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input value={form.nama} onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Role (Custom)</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Kepala Lab / Dosen Kelompok Keilmuan / Ketua Divisi / ..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Divisi</Label>
                <Input
                  value={form.divisi}
                  onChange={(e) => setForm((prev) => ({ ...prev, divisi: e.target.value }))}
                  placeholder="opsional"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={form.urutan}
                  onChange={(e) => setForm((prev) => ({ ...prev, urutan: e.target.value }))}
                  placeholder="otomatis jika kosong"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Parent (ID)</Label>
              <Input
                value={form.parentId}
                onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                placeholder={parentCandidates.length ? `contoh: ${parentCandidates[0].id}` : 'kosongkan untuk root'}
              />
              <p className="text-xs text-gray-500">Kosongkan untuk node paling atas. Kandidat parent: {parentCandidates.map((p) => p.id).join(', ') || '-'}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

