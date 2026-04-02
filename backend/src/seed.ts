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
  { key: 'kegiatan.card1.id', value: '001' },
  { key: 'kegiatan.card1.icon', value: 'memory' },
  { key: 'kegiatan.card1.title', value: 'Perawatan Komputer Laboratorium' },
  { key: 'kegiatan.card1.tag', value: 'Hardware & Software' },
  { key: 'kegiatan.card1.description', value: 'Pemeliharaan rutin, pengecekan hardware, update software, dan optimasi performa seluruh komputer di laboratorium untuk memastikan kesiapan operasional harian.' },
  { key: 'kegiatan.card2.id', value: '002' },
  { key: 'kegiatan.card2.icon', value: 'layers' },
  { key: 'kegiatan.card2.title', value: 'Manajemen Virtualisasi (Proxmox)' },
  { key: 'kegiatan.card2.tag', value: 'Virtualisasi' },
  { key: 'kegiatan.card2.description', value: 'Pemantauan performa, serta optimasi resource pada platform Proxmox VE — termasuk manajemen VM, container, dan alokasi jaringan virtual untuk mendukung riset dan praktikum.' },
  { key: 'kegiatan.card3.id', value: '003' },
  { key: 'kegiatan.card3.icon', value: 'hub' },
  { key: 'kegiatan.card3.title', value: 'Manajemen Jaringan & Server' },
  { key: 'kegiatan.card3.tag', value: 'Networking' },
  { key: 'kegiatan.card3.description', value: 'Perancangan, konfigurasi, dan pemantauan jaringan komputer, administrasi server Linux, serta pengelolaan layanan web dan aplikasi berbasis cloud maupun on-premise.' },
  { key: 'kegiatan.card4.id', value: '004' },
  { key: 'kegiatan.card4.icon', value: 'shield' },
  { key: 'kegiatan.card4.title', value: 'Keamanan & Audit Sistem' },
  { key: 'kegiatan.card4.tag', value: 'Security' },
  { key: 'kegiatan.card4.description', value: 'Evaluasi kerentanan sistem, penetration testing dasar, konfigurasi firewall, serta audit kepatuhan untuk memastikan keamanan infrastruktur laboratorium.' },
  { key: 'kegiatan.card5.id', value: '005' },
  { key: 'kegiatan.card5.icon', value: 'insights' },
  { key: 'kegiatan.card5.title', value: 'Monitoring & Observability' },
  { key: 'kegiatan.card5.tag', value: 'Monitoring' },
  { key: 'kegiatan.card5.description', value: 'Pemantauan real-time performa server, jaringan, dan layanan menggunakan dashboard monitoring untuk mendeteksi anomali dan memastikan uptime maksimal.' },
  { key: 'kegiatan.card6.id', value: '006' },
  { key: 'kegiatan.card6.icon', value: 'school' },
  { key: 'kegiatan.card6.title', value: 'Pelatihan & Asistensi Praktikum' },
  { key: 'kegiatan.card6.tag', value: 'Edukasi' },
  { key: 'kegiatan.card6.description', value: 'Mendukung kegiatan praktikum mahasiswa, membimbing penggunaan tools teknis, serta menyelenggarakan workshop singkat terkait infrastruktur dan tata kelola TI.' },
  { key: 'sejarah.section_label', value: '[01_SEJARAH]' },
  { key: 'sejarah.item1.year', value: '2010' },
  { key: 'sejarah.item1.title', value: 'Awal Berdiri' },
  { key: 'sejarah.item1.subtitle', value: 'Pendirian Laboratorium' },
  { key: 'sejarah.item1.description', value: 'Laboratorium Tata Kelola dan Infrastruktur Teknologi Informasi didirikan di Departemen Sistem Informasi, Fakultas Teknologi Informasi, sebagai respons atas kebutuhan pengelolaan infrastruktur IT yang terstruktur.' },
  { key: 'sejarah.item2.year', value: '2015–2018' },
  { key: 'sejarah.item2.title', value: 'Perubahan Nama & Pengembangan' },
  { key: 'sejarah.item2.subtitle', value: '' },
  { key: 'sejarah.item2.description', value: 'Laboratorium mengalami perubahan nama menjadi Laboratorium Dasar Komputer (LDKDM), kemudian berkembang menjadi LDKTIS. Angkatan ini mulai membangun kegiatan praktikum dan riset dalam bidang komputer.' },
  { key: 'sejarah.item3.year', value: '2024' },
  { key: 'sejarah.item3.title', value: 'Era TKITI' },
  { key: 'sejarah.item3.subtitle', value: 'Saat Ini' },
  { key: 'sejarah.item3.description', value: 'Pada semester gasal tahun 2024, terjadi perubahan besar dalam susunan organisasi jabatan. Lab diperkuat oleh pembina dan pengurus yang memiliki spesialisasi teknik masing-masing, dengan visi menjadi laboratorium benchmark dalam pengelolaan infrastruktur teknologi informasi.' },
  { key: 'cta.image', value: 'https://images.unsplash.com/photo-1631358429403-25d69fb4ce24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbmV0d29yayUyMGdsb2JlJTIwdGVjaG5vbG9neSUyMGluZnJhc3RydWN0dXJlfGVufDF8fHx8MTc3NDk1MzU0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  { key: 'cta.title', value: 'SIAP MEMBANGUN MASA DEPAN INFRASTRUKTUR?' },
  { key: 'cta.button', value: 'BERGABUNG DENGAN KAMI' },
  { key: 'footer.brand', value: 'TKITI' },
  { key: 'footer.description', value: 'Laboratorium Tata Kelola & Infrastruktur Teknologi Informasi' },
  { key: 'footer.badge', value: '[ SISTEM INFORMASI · UNAND ]' },
  { key: 'footer.email', value: 'tkiti@ft.unand.ac.id' },
  { key: 'footer.email_link', value: 'mailto:tkiti@ft.unand.ac.id' },
  { key: 'footer.instagram_link', value: 'https://instagram.com/lab_TATI' },
  { key: 'footer.linkedin_link', value: 'https://linkedin.com/company/tkiti-unand' },
  { key: 'footer.github_link', value: 'https://github.com/tkiti-unand' },
  { key: 'footer.address', value: 'Gedung Teknologi Informasi, Lantai 2' },
  { key: 'footer.address2', value: 'Departemen Sistem Informasi, Universitas Andalas' },
  { key: 'footer.copyright', value: '© 2024 LABORATORIUM TKITI — DEPARTEMEN SISTEM INFORMASI' },
  { key: 'footer.privacy', value: 'PRIVACY' },
  { key: 'footer.terms', value: 'TERMS' },
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
