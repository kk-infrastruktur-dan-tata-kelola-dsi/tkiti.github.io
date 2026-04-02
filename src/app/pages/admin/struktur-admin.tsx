import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Upload, User } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Badge } from '@/app/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/app/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/app/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/app/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { apiRequest } from '@/app/lib/api'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'

type Anggota = {
  id: number; nama: string; role: string
  divisi: string | null; photo: string | null; urutan: number | null
}

type FormState = {
  nama: string; role: string; divisi: string; urutan: string
}

const EMPTY_FORM: FormState = { nama: '', role: '', divisi: 'anggota', urutan: '' }

const DIVISI_MAP: Record<string, { label: string; color: string }> = {
  kepemimpinan: { label: 'Kepemimpinan', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  anggota: { label: 'Anggota', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
  kolaborasi: { label: 'Kolaborasi', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400' },
}

export function AdminStruktur() {
  const [items, setItems] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchData() {
    const res = await apiRequest<Anggota[]>('/struktur')
    if (res.success && res.data) setItems(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

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
      divisi: a.divisi ?? 'anggota',
      urutan: a.urutan?.toString() ?? '',
    })
    setPhotoFile(null)
    setPhotoPreview(a.photo ? `${API_URL}/${a.photo}` : '')
    setDialogOpen(true)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (form.urutan) fd.append('urutan', form.urutan)
    if (photoFile) fd.append('photo', photoFile)

    const url = editId ? `/struktur/${editId}` : '/struktur'
    const method = editId ? 'PUT' : 'POST'

    const res = await apiRequest<Anggota>(url, { method, body: fd })

    if (res.success) {
      toast.success(editId ? 'Anggota berhasil diperbarui' : 'Anggota berhasil ditambahkan')
      setDialogOpen(false)
      fetchData()
    } else {
      toast.error(res.error ?? 'Gagal menyimpan')
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    const res = await apiRequest(`/struktur/${id}`, { method: 'DELETE' })
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Anggota berhasil dihapus')
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.divisi === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Struktur Organisasi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{items.length} anggota</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah Anggota
        </Button>
      </div>

      {/* Filter */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-gray-100 dark:bg-zinc-800">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="kepemimpinan">Kepemimpinan</TabsTrigger>
          <TabsTrigger value="anggota">Anggota</TabsTrigger>
          <TabsTrigger value="kolaborasi">Kolaborasi</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
              <TableHead className="text-gray-600 dark:text-gray-400 w-12"></TableHead>
              <TableHead className="text-gray-600 dark:text-gray-400">Nama</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-400 hidden sm:table-cell">Role</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-400 w-32">Divisi</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-400 w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">Memuat...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">Belum ada anggota</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow key={a.id} className="border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900">
                <TableCell>
                  {a.photo ? (
                    <img src={`${API_URL}/${a.photo}`} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{a.nama}</p>
                </TableCell>
                <TableCell className="text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{a.role}</TableCell>
                <TableCell>
                  {a.divisi && DIVISI_MAP[a.divisi] ? (
                    <Badge className={`${DIVISI_MAP[a.divisi].color} border-0 text-xs`}>
                      {DIVISI_MAP[a.divisi].label}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus anggota?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{a.nama}</strong> akan dihapus permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(a.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
            <DialogDescription>Isi data anggota laboratorium</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Photo */}
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              <Button variant="outline" size="sm" className="gap-2 dark:border-zinc-700" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Upload foto
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Nama <span className="text-red-500">*</span></Label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Role <span className="text-red-500">*</span></Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Kepala Lab / Anggota / ..." className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Divisi</Label>
                <Select value={form.divisi} onValueChange={(v) => setForm({ ...form, divisi: v })}>
                  <SelectTrigger className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kepemimpinan">Kepemimpinan</SelectItem>
                    <SelectItem value="anggota">Anggota</SelectItem>
                    <SelectItem value="kolaborasi">Kolaborasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Urutan</Label>
                <Input type="number" value={form.urutan} onChange={(e) => setForm({ ...form, urutan: e.target.value })} placeholder="0" className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-zinc-700">Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : (editId ? 'Simpan' : 'Tambah')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
