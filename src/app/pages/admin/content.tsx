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
      { name: 'hero.subtitle', label: 'Subtitle', type: 'text' },
      { name: 'hero.title', label: 'Title', type: 'text' },
      { name: 'hero.highlight', label: 'Highlight', type: 'text' },
      { name: 'hero.description', label: 'Description', type: 'textarea' },
      { name: 'hero.cta_primary', label: 'CTA Primary', type: 'text' },
      { name: 'hero.cta_secondary', label: 'CTA Secondary', type: 'text' },
    ],
  },
  {
    key: 'kegiatan',
    label: 'Kegiatan',
    fields: [
      { name: 'kegiatan.section_label', label: 'Section label', type: 'text' },
      { name: 'kegiatan.title', label: 'Title', type: 'text' },
      ...Array.from({ length: 6 }, (_, index) => ([
        { name: `kegiatan.card${index + 1}.id`, label: `Card ${index + 1} ID`, type: 'text' as const },
        { name: `kegiatan.card${index + 1}.icon`, label: `Card ${index + 1} Icon`, type: 'text' as const },
        { name: `kegiatan.card${index + 1}.title`, label: `Card ${index + 1} Title`, type: 'text' as const },
        { name: `kegiatan.card${index + 1}.tag`, label: `Card ${index + 1} Tag`, type: 'text' as const },
        { name: `kegiatan.card${index + 1}.description`, label: `Card ${index + 1} Description`, type: 'textarea' as const },
      ])).flat(),
    ],
  },
  {
    key: 'sejarah',
    label: 'Sejarah',
    fields: [
      { name: 'sejarah.section_label', label: 'Section label', type: 'text' },
      ...Array.from({ length: 3 }, (_, index) => ([
        { name: `sejarah.item${index + 1}.year`, label: `Item ${index + 1} Year`, type: 'text' as const },
        { name: `sejarah.item${index + 1}.title`, label: `Item ${index + 1} Title`, type: 'text' as const },
        { name: `sejarah.item${index + 1}.subtitle`, label: `Item ${index + 1} Subtitle`, type: 'text' as const },
        { name: `sejarah.item${index + 1}.description`, label: `Item ${index + 1} Description`, type: 'textarea' as const },
      ])).flat(),
    ],
  },
  {
    key: 'kontak',
    label: 'Kontak',
    fields: [
      { name: 'kontak.section_label', label: 'Section label', type: 'text' },
      { name: 'kontak.title', label: 'Title', type: 'text' },
      { name: 'kontak.email', label: 'Email', type: 'text' },
      { name: 'kontak.instagram', label: 'Instagram', type: 'text' },
      { name: 'kontak.linkedin', label: 'LinkedIn', type: 'text' },
      { name: 'kontak.alamat', label: 'Address', type: 'textarea' },
      { name: 'kontak.jam', label: 'Operational hours', type: 'text' },
    ],
  },
  {
    key: 'cta',
    label: 'CTA',
    fields: [
      { name: 'cta.image', label: 'CTA Image URL', type: 'text' },
      { name: 'cta.title', label: 'CTA Title', type: 'text' },
      { name: 'cta.button', label: 'CTA Button', type: 'text' },
    ],
  },
  {
    key: 'footer',
    label: 'Footer',
    fields: [
      { name: 'footer.brand', label: 'Brand', type: 'text' },
      { name: 'footer.description', label: 'Description', type: 'textarea' },
      { name: 'footer.badge', label: 'Badge', type: 'text' },
      { name: 'footer.email', label: 'Email text', type: 'text' },
      { name: 'footer.email_link', label: 'Email href', type: 'text' },
      { name: 'footer.instagram_link', label: 'Instagram URL', type: 'text' },
      { name: 'footer.linkedin_link', label: 'LinkedIn URL', type: 'text' },
      { name: 'footer.github_link', label: 'GitHub URL', type: 'text' },
      { name: 'footer.address', label: 'Address line 1', type: 'text' },
      { name: 'footer.address2', label: 'Address line 2', type: 'text' },
      { name: 'footer.copyright', label: 'Copyright', type: 'text' },
      { name: 'footer.privacy', label: 'Privacy label', type: 'text' },
      { name: 'footer.terms', label: 'Terms label', type: 'text' },
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
        section.fields.map((field) =>
          apiRequest(`/content/${field.name}`, {
            method: 'PUT',
            body: JSON.stringify({ value: values[field.name] ?? '' }),
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
    return <div className="flex items-center justify-center py-20 text-gray-400">Memuat konten...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Edit Konten</h1>
        <p className="mt-0.5 text-sm text-gray-500">Kelola teks dan URL landing page per section.</p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="bg-gray-100">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key} className="mt-4">
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base text-gray-800">{section.label}</CardTitle>
                <CardDescription>Edit konten section {section.label.toLowerCase()}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label htmlFor={field.name} className="text-sm text-gray-700">
                      {field.label}
                      <span className="ml-2 font-mono text-xs text-gray-400">{field.name}</span>
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        rows={4}
                        value={values[field.name] ?? ''}
                        onChange={(e) => setField(field.name, e.target.value)}
                        className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        value={values[field.name] ?? ''}
                        onChange={(e) => setField(field.name, e.target.value)}
                        className="border-gray-200 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    )}
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-2">
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

