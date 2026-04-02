import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  BookOpen, Users, ImageIcon, TrendingUp,
  Eye, EyeOff, Heart,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/app/components/ui/table'
import { Button } from '@/app/components/ui/button'
import { apiRequest } from '@/app/lib/api'

type Article = {
  id: number; slug: string; title: string; author: string | null
  published: boolean; likes: number; createdAt: string | null
}
type StatsData = { articles: number; anggota: number; gallery: number }

export function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({ articles: 0, anggota: 0, gallery: 0 })
  const [recent, setRecent] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [artRes, strRes, galRes] = await Promise.all([
        apiRequest<Article[]>('/articles/all'),
        apiRequest<{ id: number }[]>('/struktur'),
        apiRequest<{ id: number }[]>('/gallery'),
      ])

      const articles = artRes.data ?? []
      setStats({
        articles: articles.length,
        anggota: (strRes.data ?? []).length,
        gallery: (galRes.data ?? []).length,
      })
      setRecent(articles.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total Artikel', value: stats.articles, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Anggota', value: stats.anggota, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Foto Gallery', value: stats.gallery, icon: ImageIcon, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Likes', value: recent.reduce((s, a) => s + a.likes, 0), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ringkasan konten Lab TKITI
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-gray-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {c.label}
                </span>
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '—' : c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent articles */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-gray-800">
              Artikel Terbaru
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/admin/articles">Lihat semua</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-500">Judul</TableHead>
                <TableHead className="text-gray-500 hidden sm:table-cell">Author</TableHead>
                <TableHead className="text-gray-500 w-16 text-right hidden sm:table-cell">Likes</TableHead>
                <TableHead className="text-gray-500 w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">Memuat...</TableCell></TableRow>
              ) : recent.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-400">Belum ada artikel</TableCell></TableRow>
              ) : recent.map((a) => (
                <TableRow key={a.id} className="border-gray-200">
                  <TableCell>
                    <Link to={`/admin/articles/${a.id}`} className="font-medium text-gray-900 hover:underline line-clamp-1">
                      {a.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 hidden sm:table-cell">
                    {a.author ?? '—'}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1 text-sm text-gray-500">
                      <Heart className="h-3 w-3" /> {a.likes}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.published ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                        <Eye className="h-3 w-3" /> Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <EyeOff className="h-3 w-3" /> Draft
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
