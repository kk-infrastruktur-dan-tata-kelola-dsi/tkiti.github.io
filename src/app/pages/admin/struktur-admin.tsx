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
  periodeId: number | null
  photo: string | null
  urutan: number | null
}

type TemplateNode = {
  role: string
  parentRole: string | null
  urutan: number
  divisi: string | null
}

type Periode = {
  id: number
  nama: string
  mulai: string | null
  selesai: string | null
  isActive: boolean
}

type FormState = { nama: string; role: string }
const EMPTY_FORM: FormState = { nama: '', role: '' }

type PeriodeForm = { nama: string; mulai: string; selesai: string }
const EMPTY_PERIODE_FORM: PeriodeForm = { nama: '', mulai: '', selesai: '' }

export function AdminStruktur() {
  const [items, setItems] = useState<Anggota[]>([])
  const [template, setTemplate] = useState<TemplateNode[]>([])
  const [periodes, setPeriodes] = useState<Periode[]>([])
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [periodeDialogOpen, setPeriodeDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [periodeForm, setPeriodeForm] = useState<PeriodeForm>(EMPTY_PERIODE_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [creatingPeriode, setCreatingPeriode] = useState(false)
  const [activatingPeriodeId, setActivatingPeriodeId] = useState<number | null>(null)
  const [resetting, setResetting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const activePeriode = useMemo(() => periodes.find((p) => p.isActive) ?? null, [periodes])
  const effectivePeriodeId = selectedPeriodeId ?? activePeriode?.id ?? null
  const roleOptions = useMemo(() => template.map((node) => node.role), [template])

  async function fetchData(targetPeriodeId?: number | null) {
    const [resPeriode, resTemplate] = await Promise.all([
      apiRequest<Periode[]>('/struktur/periode'),
      apiRequest<TemplateNode[]>('/struktur/template'),
    ])

    let periodeList: Periode[] = []
    if (resPeriode.success && resPeriode.data) {
      periodeList = resPeriode.data
      setPeriodes(periodeList)
    }
    if (resTemplate.success && resTemplate.data) setTemplate(resTemplate.data)

    const active = periodeList.find((p) => p.isActive) ?? null
    const finalPeriodeId = targetPeriodeId ?? selectedPeriodeId ?? active?.id ?? null
    if (finalPeriodeId !== null) {
      const resItems = await apiRequest<Anggota[]>(`/struktur?periodeId=${finalPeriodeId}`)
      if (resItems.success && resItems.data) setItems(resItems.data)
      setSelectedPeriodeId(finalPeriodeId)
    } else {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData(null)
  }, [])

  async function changePeriode(id: number) {
    setSelectedPeriodeId(id)
    const resItems = await apiRequest<Anggota[]>(`/struktur?periodeId=${id}`)
    if (resItems.success && resItems.data) setItems(resItems.data)
  }

  async function createPeriode() {
    if (!periodeForm.nama.trim()) {
      toast.error('Nama periode wajib diisi')
      return
    }
    setCreatingPeriode(true)
    const res = await apiRequest<Periode>('/struktur/periode', {
      method: 'POST',
      body: JSON.stringify({
        nama: periodeForm.nama.trim(),
        mulai: periodeForm.mulai || null,
        selesai: periodeForm.selesai || null,
      }),
    })
    if (res.success && res.data) {
      toast.success('Periode berhasil dibuat')
      setPeriodeDialogOpen(false)
      setPeriodeForm(EMPTY_PERIODE_FORM)
      await fetchData(res.data.id)
    } else {
      toast.error(res.error ?? 'Gagal membuat periode')
    }
    setCreatingPeriode(false)
  }

  async function activatePeriode(id: number) {
    setActivatingPeriodeId(id)
    const res = await apiRequest(`/struktur/periode/${id}/activate`, { method: 'PUT' })
    if (res.success) {
      toast.success('Periode aktif berhasil diubah')
      await fetchData(id)
    } else {
      toast.error(res.error ?? 'Gagal mengaktifkan periode')
    }
    setActivatingPeriodeId(null)
  }

  function openNew() {
    if (!effectivePeriodeId) {
      toast.error('Buat periode terlebih dahulu')
      return
    }
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
    if (!effectivePeriodeId) {
      toast.error('Periode tidak valid')
      return
    }
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
    fd.append('periodeId', String(effectivePeriodeId))
    if (photoFile) fd.append('photo', photoFile)

    const url = editId ? `/struktur/${editId}` : '/struktur'
    const method = editId ? 'PUT' : 'POST'
    const res = await apiRequest<Anggota>(url, { method, body: fd })

    if (res.success) {
      toast.success(editId ? 'Anggota diperbarui' : 'Anggota ditambahkan')
      setDialogOpen(false)
      await fetchData(effectivePeriodeId)
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

  async function handleResetPeriode() {
    if (!effectivePeriodeId) return
    setResetting(true)
    const res = await apiRequest('/struktur/reset', {
      method: 'POST',
      body: JSON.stringify({ periodeId: effectivePeriodeId }),
    })
    if (res.success) {
      toast.success('Data struktur periode berhasil dihapus')
      await fetchData(effectivePeriodeId)
    } else {
      toast.error(res.error ?? 'Gagal reset struktur periode')
    }
    setResetting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Struktur Organisasi (Periode)</h1>
          <p className="mt-0.5 text-sm text-gray-500">Pilih periode, atur mana yang aktif, lalu isi nama per role template.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPeriodeDialogOpen(true)}>
            + Buat Periode
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600" disabled={resetting || !effectivePeriodeId}>
                {resetting ? 'Resetting...' : 'Reset Struktur Periode Ini'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus struktur untuk periode ini?</AlertDialogTitle>
                <AlertDialogDescription>Data anggota pada periode terpilih akan dihapus.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleResetPeriode}>
                  Hapus
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
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Daftar Periode</h2>
        <div className="space-y-2">
          {periodes.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada periode.</p>
          ) : (
            periodes.map((periode) => (
              <div key={periode.id} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => changePeriode(periode.id)}
                >
                  <p className="text-sm font-semibold text-gray-900">{periode.nama}</p>
                  <p className="text-xs text-gray-500">
                    {periode.mulai ?? '-'} s/d {periode.selesai ?? '-'}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  {periode.isActive ? <Badge>Aktif</Badge> : <Badge variant="secondary">Arsip</Badge>}
                  {!periode.isActive && (
                    <Button size="sm" variant="outline" disabled={activatingPeriodeId === periode.id} onClick={() => activatePeriode(periode.id)}>
                      {activatingPeriodeId === periode.id ? 'Mengaktifkan...' : 'Jadikan Aktif'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
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
        <h2 className="mb-3 text-sm font-semibold text-gray-700">
          Data Anggota Periode: {periodes.find((p) => p.id === effectivePeriodeId)?.nama ?? '-'} ({items.length})
        </h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Memuat data...</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Belum ada data struktur pada periode ini.</p>
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
            <DialogDescription>Pilih role dari template. Parent dan urutan ditentukan otomatis.</DialogDescription>
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

      <Dialog open={periodeDialogOpen} onOpenChange={setPeriodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Periode Kepengurusan</DialogTitle>
            <DialogDescription>Contoh nama: Periode 2024/2025</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nama Periode</Label>
              <Input value={periodeForm.nama} onChange={(e) => setPeriodeForm((prev) => ({ ...prev, nama: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Mulai</Label>
                <Input type="date" value={periodeForm.mulai} onChange={(e) => setPeriodeForm((prev) => ({ ...prev, mulai: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Selesai</Label>
                <Input type="date" value={periodeForm.selesai} onChange={(e) => setPeriodeForm((prev) => ({ ...prev, selesai: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodeDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={createPeriode} disabled={creatingPeriode}>
              {creatingPeriode ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

