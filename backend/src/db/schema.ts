import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── content ──────────────────────────────────────────────────────────────────
// Key-value store untuk teks yang bisa diedit via CMS (hero, about, kontak, dsb.)
export const content = sqliteTable('content', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// ─── anggota ──────────────────────────────────────────────────────────────────
// Struktur organisasi lab: kepemimpinan, anggota aktif, kolaborasi
export const anggota = sqliteTable('anggota', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  role: text('role').notNull(),
  divisi: text('divisi'),   // 'kepemimpinan' | 'anggota' | 'kolaborasi'
  photo: text('photo'),     // path relatif dari /uploads/
  periodeId: integer('periode_id'),
  parentId: integer('parent_id'),
  urutan: integer('urutan'),
})

export const strukturPeriode = sqliteTable('struktur_periode', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  mulai: text('mulai'),
  selesai: text('selesai'),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }),
})

// ─── gallery ──────────────────────────────────────────────────────────────────
// Foto dokumentasi kegiatan lab
export const gallery = sqliteTable('gallery', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  src: text('src').notNull(),       // path relatif dari /uploads/
  caption: text('caption'),
  tanggal: text('tanggal'),         // format: YYYY-MM-DD
  urutan: integer('urutan'),
})

// ─── articles ─────────────────────────────────────────────────────────────────
// Artikel/berita lab, konten dalam Markdown
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),       // Markdown
  thumbnail: text('thumbnail'),             // path relatif dari /uploads/
  author: text('author'),
  published: integer('published', { mode: 'boolean' }).default(false),
  likes: integer('likes').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

// ─── users ────────────────────────────────────────────────────────────────────
// Admin panel users (JWT auth via jose)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
})

// ─── Types ────────────────────────────────────────────────────────────────────
export type Content = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert

export type Anggota = typeof anggota.$inferSelect
export type NewAnggota = typeof anggota.$inferInsert

export type StrukturPeriode = typeof strukturPeriode.$inferSelect
export type NewStrukturPeriode = typeof strukturPeriode.$inferInsert

export type Gallery = typeof gallery.$inferSelect
export type NewGallery = typeof gallery.$inferInsert

export type Article = typeof articles.$inferSelect
export type NewArticle = typeof articles.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
