import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Eye, Pencil, ImageIcon, X } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Switch } from '@/app/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs'
import { Separator } from '@/app/components/ui/separator'
import { cn } from '@/app/components/ui/utils'
import { apiRequest, API_URL } from '@/app/lib/api'

type ArticleForm = {
  title: string
  slug: string
  excerpt: string
  author: string
  content: string
  thumbnail: string
  published: boolean
}

const EMPTY: ArticleForm = {
  title: '', slug: '', excerpt: '', author: '',
  content: '', thumbnail: '', published: false,
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Markdown sederhana → HTML (hanya untuk preview) */
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{3} (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2">$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul class="my-3 space-y-1">$1</ul>')
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
    .replace(/^(?!<[hbulcode])(.+)$/gm, (m) =>
      m.trim() ? `<p class="mb-4 leading-relaxed">${m}</p>` : '',
    )
}

export function AdminArticleEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState<ArticleForm>(EMPTY)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load artikel untuk mode edit
  useEffect(() => {
    if (isNew) return
    apiRequest<ArticleForm & { id: number }>(`/articles/all`)
      .then((res) => {
        if (!res.success || !res.data) return
        // /articles/all returns array, find by id
        const arr = res.data as unknown as (ArticleForm & { id: number })[]
        const article = arr.find((a) => a.id === Number(id))
        if (article) {
          setForm({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt ?? '',
            author: article.author ?? '',
            content: article.content,
            thumbnail: article.thumbnail ?? '',
            published: article.published,
          })
          if (article.thumbnail) setThumbnailPreview(article.thumbnail)
          setSlugManual(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id, isNew])

  function setField<K extends keyof ArticleForm>(key: K, val: ArticleForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'title' && !slugManual) {
        next.slug = titleToSlug(val as string)
      }
      return next
    })
  }

  function handleThumbnailFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setThumbnailPreview(url)
    // Simpan nama file sebagai placeholder; upload sebenarnya terjadi saat save
    // (TODO: upload ke endpoint gallery lalu set path)
    setField('thumbnail', file.name)
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Judul tidak boleh kosong'); return }
    if (!form.slug.trim()) { toast.error('Slug tidak boleh kosong'); return }
    if (!form.content.trim()) { toast.error('Konten tidak boleh kosong'); return }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        author: form.author.trim() || null,
        content: form.content,
        thumbnail: form.thumbnail.trim() || null,
        published: form.published,
      }

      const res = isNew
        ? await apiRequest('/articles', { method: 'POST', body: JSON.stringify(payload) })
        : await apiRequest(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) })

      if (!res.success) {
        toast.error(res.error ?? 'Gagal menyimpan')
        return
      }

      toast.success(isNew ? 'Artikel berhasil dibuat' : 'Artikel berhasil diperbarui')
      navigate('/admin/articles')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Memuat artikel...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link to="/admin/articles"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isNew ? 'Tulis Artikel Baru' : 'Edit Artikel'}
              </h1>
            {!isNew && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">/articles/{form.slug}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Published toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={form.published}
              onCheckedChange={(v) => setField('published', v)}
            />
            <Label htmlFor="published" className="text-sm text-gray-600 cursor-pointer">
              {form.published ? 'Published' : 'Draft'}
            </Label>
          </div>

          <Button onClick={handleSave} disabled={saving} className="min-w-20">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Kiri: Metadata ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Metadata
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">Judul <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Judul artikel"
                className="bg-white border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug" className="text-sm">Slug <span className="text-red-500">*</span></Label>
                {slugManual && (
                  <button
                    type="button"
                    className="text-xs text-blue-500 hover:underline"
                    onClick={() => {
                      setSlugManual(false)
                      setField('slug', titleToSlug(form.title))
                    }}
                  >
                    Reset dari judul
                  </button>
                )}
              </div>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => { setSlugManual(true); setField('slug', e.target.value) }}
                placeholder="slug-artikel"
                className="bg-white border-gray-200 font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="author" className="text-sm">Author</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setField('author', e.target.value)}
                placeholder="Nama penulis"
                className="bg-white border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="excerpt" className="text-sm">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setField('excerpt', e.target.value)}
                placeholder="Ringkasan singkat artikel..."
                rows={3}
                className="bg-white border-gray-200 resize-none text-sm"
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Thumbnail
            </p>

            {/* Preview */}
            {thumbnailPreview && (
              <div className="relative rounded-md overflow-hidden aspect-video bg-gray-100">
                <img
                  src={thumbnailPreview.startsWith('blob:')
                    ? thumbnailPreview
                    : (form.thumbnail.startsWith('http') ? form.thumbnail : `${API_URL}/${form.thumbnail.replace(/^\//, '')}`)}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setThumbnailPreview(''); setField('thumbnail', '') }}
                  className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5 hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            )}

            {/* Upload button */}
            <input
              type="file"
              ref={fileRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleThumbnailFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed"
              onClick={() => fileRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              {thumbnailPreview ? 'Ganti thumbnail' : 'Pilih gambar'}
            </Button>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · maks 5MB</p>
          </div>
        </div>

        {/* ── Kanan: Konten ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="write" className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="write" className="gap-1.5 text-sm">
                  <Pencil className="h-3.5 w-3.5" /> Tulis
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 text-sm">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
              </TabsList>
              <span className="text-xs text-gray-400 ml-auto">
                {form.content.length.toLocaleString()} karakter
              </span>
            </div>

            <TabsContent value="write" className="flex-1 m-0">
              <Textarea
                value={form.content}
                onChange={(e) => setField('content', e.target.value)}
                placeholder={`# Judul Artikel\n\nTulis konten dalam format Markdown...\n\n## Sub-judul\n\nParagraf pertama...`}
                className={cn(
                  'h-[600px] resize-none font-mono text-sm leading-relaxed',
                   'bg-white border-gray-200',
                   'focus-visible:ring-1 focus-visible:ring-zinc-300',
                 )}
              />
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0">
              <div
                className={cn(
                   'h-[600px] overflow-auto rounded-md border border-gray-200',
                   'bg-white p-5',
                   'prose prose-sm max-w-none',
                   'text-gray-800',
                 )}
              >
                {form.content.trim() ? (
                  <div
                    className="text-sm leading-relaxed"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                  />
                ) : (
                  <p className="text-gray-400 italic text-sm">Belum ada konten untuk dipreview.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Separator />

      {/* Bottom save bar */}
      <div className="flex items-center justify-between pb-4">
        <p className="text-xs text-gray-400">
          {isNew ? 'Artikel belum disimpan' : 'Terakhir diperbarui: lihat tabel artikel'}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/articles">Batal</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-24">
            {saving ? 'Menyimpan...' : (isNew ? 'Buat Artikel' : 'Simpan Perubahan')}
          </Button>
        </div>
      </div>
    </div>
  )
}
