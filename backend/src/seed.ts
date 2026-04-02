/**
 * Seed script — buat atau update admin user.
 * Jalankan SETELAH migration: pnpm db:migrate
 *
 * Usage:
 *   pnpm db:seed
 *
 * Default credentials (ubah setelah pertama kali login):
 *   username : admin
 *   password : admin123
 */
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './db/client.js'
import { content, users } from './db/schema.js'

const username = process.env.SEED_USERNAME ?? 'admin'
const password = process.env.SEED_PASSWORD ?? 'admin123'
const overwrite = process.env.SEED_OVERWRITE === 'true'

const defaultContent: Array<{ key: string; value: string }> = [
  { key: 'hero.subtitle', value: 'SISTEM INFORMASI · UNIVERSITAS ANDALAS' },
  { key: 'hero.title', value: 'Laboratorium Tata Kelola &' },
  { key: 'hero.highlight', value: 'Infrastruktur Teknologi Informasi' },
  {
    key: 'hero.description',
    value:
      'Kelompok keahlian yang memetakan secara mendalam berbagai aspek infrastruktur teknologi informasi — dari perancangan jaringan, konfigurasi server, hingga deployment aplikasi dan layanan web.',
  },
  { key: 'hero.cta_primary', value: 'Mulai Eksplorasi' },
  { key: 'hero.cta_secondary', value: 'Pelajari Sejarah' },
  { key: 'kegiatan.section_label', value: '//KEGIATAN_LAB' },
  { key: 'kegiatan.title', value: 'CORE CAPABILITIES' },
  { key: 'sejarah.section_label', value: '[01_SEJARAH]' },
  { key: 'kontak.section_label', value: '//KONTAK' },
  { key: 'kontak.title', value: 'HUBUNGI KAMI' },
  { key: 'kontak.email', value: 'tkiti@ft.unand.ac.id' },
  { key: 'kontak.instagram', value: '@lab_TATI' },
  { key: 'kontak.linkedin', value: 'Lab TKITI' },
  {
    key: 'kontak.alamat',
    value:
      'Gedung Teknologi Informasi, Lantai 2\nDepartemen Sistem Informasi\nFakultas Teknologi Informasi, Universitas Andalas\nJl. Universitas Andalas, Padang, Sumatera Barat',
  },
  { key: 'kontak.jam', value: 'Senin–Jumat 08.00–17.00' },
]

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL
  )
`)

for (const item of defaultContent) {
  db.insert(content)
    .values({ key: item.key, value: item.value, updatedAt: new Date() })
    .onConflictDoNothing({ target: content.key })
    .run()
}

const passwordHash = await bcrypt.hash(password, 12)

const existingUser = db.select().from(users).where(eq(users.username, username)).get()

if (!existingUser) {
  db.insert(users).values({ username, passwordHash }).run()
  console.log(`✓ Admin user dibuat: ${username}`)
  console.log('✓ Default content key berhasil dipastikan di database')
  console.log('  Segera ganti password setelah pertama kali login!')
  process.exit(0)
}

if (!overwrite) {
  console.log(`ℹ User "${username}" sudah ada. Tidak diubah.`)
  console.log('✓ Default content key berhasil dipastikan di database')
  console.log('  Untuk reset password jalankan ulang dengan SEED_OVERWRITE=true')
  process.exit(0)
}

db.update(users).set({ passwordHash }).where(eq(users.id, existingUser.id)).run()
console.log('✓ Default content key berhasil dipastikan di database')
console.log(`✓ Password admin "${username}" berhasil direset`)

process.exit(0)
