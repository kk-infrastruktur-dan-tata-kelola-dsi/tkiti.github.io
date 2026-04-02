import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card'
import { apiRequest } from '@/app/lib/api'

type SectionConfig = {
  key: string
  label: string
  fields: { name: string; label: string; type: 'text' | 'textarea' }[]
}

const SECTIONS: SectionConfig[] = [
  {
    key: 'hero',
    label: 'Hero',
    fields: [
      { name: 'hero.subtitle', label: 'Subtitle (label atas)', type: 'text' },
      { name: 'hero.title', label: 'Judul utama', type: 'text' },
      { name: 'hero.highlight', label: 'Teks highlight (warna teal)', type: 'text' },
      { name: 'hero.description', label: 'Deskripsi', type: 'textarea' },
      { name: 'hero.cta_primary', label: 'Teks tombol utama', type: 'text' },
      { name: 'hero.cta_secondary', label: 'Teks tombol sekunder', type: 'text' },
    ],
  },
  {
    key: 'kegiatan',
    label: 'Kegiatan',
    fields: [
      { name: 'kegiatan.section_label', label: 'Section label', type: 'text' },
      { name: 'kegiatan.title', label: 'Judul section', type: 'text' },
    ],
  },
  {
    key: 'sejarah',
    label: 'Sejarah',
    fields: [
      { name: 'sejarah.section_label', label: 'Section label', type: 'text' },
    ],
  },
  {
    key: 'kontak',
    label: 'Kontak',
    fields: [
      { name: 'kontak.section_label', label: 'Section label', type: 'text' },
      { name: 'kontak.title', label: 'Judul section', type: 'text' },
      { name: 'kontak.email', label: 'Email', type: 'text' },
      { name: 'kontak.instagram', label: 'Instagram', type: 'text' },
      { name: 'kontak.linkedin', label: 'LinkedIn', type: 'text' },
      { name: 'kontak.alamat', label: 'Alamat lengkap', type: 'textarea' },
      { name: 'kontak.jam', label: 'Jam operasional', type: 'text' },
    ],
  },
]

export function AdminContent() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const all: Record<string, string> = {}
      await Promise.all(
        SECTIONS.map(async (sec) => {
          const res = await apiRequest<Record<string, string>>(`/content/${sec.key}`)
          if (res.success && res.data) Object.assign(all, res.data)
        }),
      )
      setValues(all)
      setLoading(false)
    }
    load()
  }, [])

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(section: SectionConfig) {
    setSaving(section.key)
    try {
      await Promise.all(
        section.fields.map((f) =>
          apiRequest(`/content/${f.name}`, {
            method: 'PUT',
            body: JSON.stringify({ value: values[f.name] ?? '' }),
          }),
        ),
      )
      toast.success(`Section "${section.label}" berhasil disimpan`)
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Memuat konten...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Edit Konten</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola teks yang tampil di landing page per section
        </p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="bg-gray-100">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key} className="mt-4">
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">
                  {section.label}
                </CardTitle>
                <CardDescription>
                  Edit konten section {section.label.toLowerCase()} pada landing page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.name} className="space-y-1.5">
                        <Label htmlFor={field.name} className="text-sm">
                          {field.label}
                          <span className="ml-2 text-xs text-gray-400 font-mono">
                            {field.name}
                          </span>
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={field.name}
                            value={values[field.name] ?? ''}
                            onChange={(e) => setField(field.name, e.target.value)}
                            rows={4}
                            className="bg-white border-gray-200 resize-none"
                          />
                        ) : (
                          <Input
                            id={field.name}
                            value={values[field.name] ?? ''}
                            onChange={(e) => setField(field.name, e.target.value)}
                            className="bg-white border-gray-200"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Preview konten aktif
                    </p>
                    <div className="space-y-3">
                      {previewItems(section).length === 0 ? (
                        <p className="text-sm text-gray-400">Belum ada konten yang terisi.</p>
                      ) : (
                        previewItems(section).map((item) => (
                          <div key={item.label} className="space-y-1">
                            <p className="text-xs text-gray-500 font-mono">{item.label}</p>
                            <p className="text-sm text-gray-900 whitespace-pre-line break-words">{item.value}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Button onClick={() => handleSave(section)} disabled={saving === section.key} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving === section.key ? 'Menyimpan...' : 'Simpan perubahan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
  function previewItems(section: SectionConfig) {
    return section.fields
      .map((field) => ({
        label: field.label,
        value: (values[field.name] ?? '').trim(),
      }))
      .filter((item) => item.value.length > 0)
  }
