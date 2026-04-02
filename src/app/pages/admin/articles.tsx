import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, Heart,
} from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/app/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { apiRequest } from '@/app/lib/api'

type Article = {
  id: number
  slug: string
  title: string
  author: string | null
  published: boolean
  likes: number
  createdAt: string | null
  updatedAt: string | null
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'published' | 'draft'>('all')

  async function fetchArticles() {
    setLoading(true)
    const res = await apiRequest<Article[]>('/articles/all')
    if (res.success && res.data) setArticles(res.data)
    setLoading(false)
  }

  useEffect(() => { fetchArticles() }, [])

  async function handleDelete(id: number) {
    const res = await apiRequest(`/articles/${id}`, { method: 'DELETE' })
    if (res.success) {
      toast.success('Artikel berhasil dihapus')
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } else {
      toast.error(res.error ?? 'Gagal menghapus artikel')
    }
  }

  async function handleTogglePublish(article: Article) {
    const res = await apiRequest(`/articles/${article.id}`, {
      method: 'PUT',
      body: JSON.stringify({ published: !article.published }),
    })
    if (res.success) {
      toast.success(article.published ? 'Artikel di-unpublish' : 'Artikel dipublish')
      setArticles((prev) =>
        prev.map((a) => a.id === article.id ? { ...a, published: !a.published } : a),
      )
    } else {
      toast.error(res.error ?? 'Gagal update status')
    }
  }

  const filtered = articles
    .filter((a) => {
      if (tab === 'published') return a.published
      if (tab === 'draft') return !a.published
      return true
    })
    .filter((a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.author ?? '').toLowerCase().includes(search.toLowerCase()),
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Artikel</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {articles.length} artikel total
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/articles/new">
            <Plus className="h-4 w-4" />
            Tulis Artikel
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari judul atau author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white border-gray-200"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
              <TableRow className="border-gray-200 bg-gray-50">
                <TableHead className="text-gray-600">Judul</TableHead>
                <TableHead className="text-gray-600 hidden sm:table-cell">Author</TableHead>
                <TableHead className="text-gray-600 hidden md:table-cell">Tanggal</TableHead>
                <TableHead className="text-gray-600 hidden lg:table-cell w-16 text-right">Likes</TableHead>
                <TableHead className="text-gray-600 w-28">Status</TableHead>
                <TableHead className="text-gray-600 w-32 text-right">Aksi</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  {search ? 'Tidak ada artikel yang cocok' : 'Belum ada artikel'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((article) => (
                <TableRow key={article.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell>
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{article.slug}</p>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm hidden sm:table-cell">
                    {article.author ?? '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm hidden md:table-cell">
                    {formatDate(article.createdAt)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    <span className="flex items-center justify-end gap-1 text-sm text-gray-500">
                      <Heart className="h-3.5 w-3.5" />
                      {article.likes}
                    </span>
                  </TableCell>
                  <TableCell>
                    {article.published ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Toggle publish */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-700"
                        title={article.published ? 'Unpublish' : 'Publish'}
                        onClick={() => handleTogglePublish(article)}
                      >
                        {article.published
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-gray-700"
                        title="Edit"
                        asChild
                      >
                        <Link to={`/admin/articles/${article.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>

                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus artikel?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>{article.title}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDelete(article.id)}
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
