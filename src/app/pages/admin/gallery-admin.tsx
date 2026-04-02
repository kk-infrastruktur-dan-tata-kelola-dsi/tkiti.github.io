import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { cn } from '@/app/components/ui/utils'
import { apiRequest, API_URL } from '@/app/lib/api'

type GalleryItem = {
  id: number; src: string; caption: string | null
  tanggal: string | null; urutan: number | null
}

export function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Upload form state
  const [caption, setCaption] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [urutan, setUrutan] = useState('')

  async function fetchGallery() {
    const res = await apiRequest<GalleryItem[]>('/gallery')
    if (res.success && res.data) setItems(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchGallery() }, [])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      if (caption) formData.append('caption', caption)
      if (tanggal) formData.append('tanggal', tanggal)
      if (urutan) formData.append('urutan', urutan)

      const res = await apiRequest<GalleryItem>('/gallery', {
        method: 'POST',
        body: formData,
      })

      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!])
        toast.success(`"${file.name}" berhasil diupload`)
      } else {
        toast.error(res.error ?? `Gagal upload "${file.name}"`)
      }
    }

    setCaption('')
    setTanggal('')
    setUrutan('')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: number) {
    const res = await apiRequest(`/gallery/${id}`, { method: 'DELETE' })
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Foto berhasil dihapus')
    } else {
      toast.error(res.error ?? 'Gagal menghapus')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }, [caption, tanggal, urutan])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Gallery</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {items.length} foto dokumentasi
        </p>
      </div>

      {/* Upload area */}
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Caption</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Keterangan foto"
                className="bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Tanggal</Label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Urutan</Label>
              <Input
                type="number"
                value={urutan}
                onChange={(e) => setUrutan(e.target.value)}
                placeholder="0"
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400',
              )}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">
              {uploading ? 'Mengupload...' : 'Drag & drop foto atau klik untuk browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · maks 5MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Gallery grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Memuat gallery...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Belum ada foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-lg overflow-hidden border border-gray-200 bg-white aspect-square"
            >
              <img
                src={item.src.startsWith('http') ? item.src : `${API_URL}/${item.src.replace(/^\//, '')}`}
                alt={item.caption ?? ''}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                <div className="w-full p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                  {item.caption && (
                    <p className="text-xs text-white truncate mb-1">{item.caption}</p>
                  )}
                  {item.tanggal && (
                    <p className="text-xs text-white/60">{item.tanggal}</p>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus foto?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Foto ini akan dihapus permanen dari gallery dan disk.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleDelete(item.id)}
                    >
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
  )
}
