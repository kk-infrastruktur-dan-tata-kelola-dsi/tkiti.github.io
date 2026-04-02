import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Upload, User } from 'lucide-react'
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
import { apiRequest, toAbsoluteApiUrl } from '@/app/lib/api'

type Anggota = {
  id: number
  nama: string
  role: string
  divisi: string | null
  parentId: number | null
  photo: string | null
  urutan: number | null
}

type TemplateNode = {
  role: string
  parentRole: string | null
  urutan: number
  divisi: string | null
}

type FormState = {
  nama: string
  role: string
}

const EMPTY_FORM: FormState = { nama: '', role: '' }

export function AdminStruktur() {
  const [items, setItems] = useState<Anggota[]>([])
  const [template, setTemplate] = useState<TemplateNode[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const roleOptions = useMemo(() => template.map((node) => node.role), [template])

  async function fetchData() {
    const [resItems, resTemplate] = await Promise.all([
      apiRequest<Anggota[]>('/struktur'),
      apiRequest<TemplateNode[]>('/struktur/template'),
    ])
    if (resItems.success && resItems.data) setItems(resItems.data)
    if (resTemplate.success && resTemplate.data) setTemplate(resTemplate.data)
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

  function openEdit(item: Anggota) {
    setEditId(item.id)
    setForm({ nama: item.nama, role: item.role })
    setPhotoFile(null)
    setPhotoPreview(toAbsoluteApiUrl(item.photo) ?? '')
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
    if (!roleOptions.includes(form.role.trim())) {
      toast.error('Role harus dipilih dari template struktur')
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append('nama', form.nama.trim())
    fd.append('role', form.role.trim())
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
      toast.error('Tidak bisa hapus node yang masih punya anak')
      return
    }
    const res = await apiRequest(`/struktur/${id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Anggota dihapus')
      setItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
  }

  async function handleReset() {
    setResetting(true)
    const res = await apiRequest('/struktur/reset', { method: 'POST' })
    if (res.success) {
      toast.success('Semua struktur berhasil dihapus')
      await fetchData()
    } else {
      toast.error(res.error ?? 'Gagal reset struktur')
    }
    setResetting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Struktur Organisasi (Template Tetap)</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Role mengikuti template organisasi. Tidak ada drag-drop & tidak ada input priority manual.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600" disabled={resetting}>
                {resetting ? 'Resetting...' : 'Reset Semua Struktur'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus semua data struktur?</AlertDialogTitle>
                <AlertDialogDescription>
                  Semua anggota pada struktur organisasi akan dihapus dari database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReset}>
                  Hapus Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Tambah Anggota
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Template Role (Fixed Tree)</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {template.map((node) => (
            <div key={node.role} className="rounded border border-gray-100 px-3 py-2 text-sm">
              <p className="font-medium text-gray-900">{node.role}</p>
              <p className="text-xs text-gray-500">Parent: {node.parentRole ?? 'ROOT'} · Urutan: {node.urutan}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Data Anggota ({items.length})</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Memuat data...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Belum ada data struktur.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded border border-gray-100 px-3 py-2">
                {item.photo ? (
                  <img src={toAbsoluteApiUrl(item.photo) ?? ''} alt={item.nama} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.nama}</p>
                  <p className="truncate text-xs text-gray-500">{item.role}</p>
                </div>
                <Badge variant="secondary">parent: {item.parentId ?? 'root'}</Badge>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
                      <AlertDialogDescription>{item.nama} akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(item.id)}>
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
            <DialogDescription>
              Pilih role sesuai template organisasi. Parent dan urutan akan diatur otomatis.
            </DialogDescription>
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
              <Label>Role</Label>
              <Input
                list="role-template-options"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Pilih role dari template"
              />
              <datalist id="role-template-options">
                {roleOptions.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
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

