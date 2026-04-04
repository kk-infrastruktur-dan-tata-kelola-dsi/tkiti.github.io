import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import * as schema from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve ke /app/data/tkiti.db di dalam Docker, atau ke backend/data/tkiti.db secara lokal
const dataDir = join(__dirname, '../../data')
const dbPath = join(dataDir, 'tkiti.db')

// Pastikan folder data/ ada sebelum SQLite coba buka file
mkdirSync(dataDir, { recursive: true })

const sqlite = new Database(dbPath)

// WAL mode: lebih cepat untuk concurrent reads, aman untuk single-writer
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS content (
    key text PRIMARY KEY NOT NULL,
    value text NOT NULL,
    updated_at integer
  );

  CREATE TABLE IF NOT EXISTS anggota (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    nama text NOT NULL,
    role text NOT NULL,
    master_id integer,
    divisi text,
    photo text,
    periode_id integer,
    parent_id integer,
    urutan integer
  );

  CREATE TABLE IF NOT EXISTS struktur_periode (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    nama text NOT NULL,
    mulai text,
    selesai text,
    is_active integer DEFAULT 0,
    created_at integer
  );

  CREATE TABLE IF NOT EXISTS struktur_master (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    role text NOT NULL UNIQUE,
    parent_master_id integer,
    parent_role text,
    urutan integer NOT NULL,
    divisi text,
    single integer DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    src text NOT NULL,
    caption text,
    tanggal text,
    urutan integer
  );

  CREATE TABLE IF NOT EXISTS articles (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text NOT NULL,
    thumbnail text,
    author text,
    published integer DEFAULT false,
    likes integer DEFAULT 0,
    created_at integer,
    updated_at integer
  );
  CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON articles (slug);
  CREATE INDEX IF NOT EXISTS articles_published_created_at ON articles (published, created_at DESC);
  CREATE INDEX IF NOT EXISTS articles_published ON articles (published);
  CREATE INDEX IF NOT EXISTS articles_created_at ON articles (created_at DESC);

  CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);

  -- Gallery indexes for ordering queries
  CREATE INDEX IF NOT EXISTS gallery_urutan ON gallery (urutan);

  -- Anggota indexes for hierarchy and period queries
  CREATE INDEX IF NOT EXISTS anggota_periode_id ON anggota (periode_id);
  CREATE INDEX IF NOT EXISTS anggota_master_id ON anggota (master_id);
  CREATE INDEX IF NOT EXISTS anggota_parent_id ON anggota (parent_id);
  CREATE INDEX IF NOT EXISTS anggota_urutan ON anggota (urutan);

  -- Struktur periode indexes for active period queries
  CREATE INDEX IF NOT EXISTS struktur_periode_is_active ON struktur_periode (is_active);
`)

const anggotaColumns = sqlite.prepare(`PRAGMA table_info(anggota)`).all() as Array<{ name: string }>
const periodeColumns = sqlite.prepare(`PRAGMA table_info(struktur_periode)`).all() as Array<{ name: string }>
const masterColumns = sqlite.prepare(`PRAGMA table_info(struktur_master)`).all() as Array<{ name: string }>
if (periodeColumns.length === 0) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS struktur_periode (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      nama text NOT NULL,
      mulai text,
      selesai text,
      is_active integer DEFAULT 0,
      created_at integer
    );
  `)
}
if (!anggotaColumns.some((col) => col.name === 'periode_id')) {
  sqlite.exec(`ALTER TABLE anggota ADD COLUMN periode_id integer;`)
}
if (!anggotaColumns.some((col) => col.name === 'parent_id')) {
  sqlite.exec(`ALTER TABLE anggota ADD COLUMN parent_id integer;`)
}
if (!anggotaColumns.some((col) => col.name === 'master_id')) {
  sqlite.exec(`ALTER TABLE anggota ADD COLUMN master_id integer;`)
}
if (masterColumns.length === 0) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS struktur_master (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      role text NOT NULL UNIQUE,
      parent_role text,
      urutan integer NOT NULL,
      divisi text,
      single integer DEFAULT 0
    );
  `)
}
if (!masterColumns.some((col) => col.name === 'single')) {
  sqlite.exec(`ALTER TABLE struktur_master ADD COLUMN single integer DEFAULT 0;`)
}
if (!masterColumns.some((col) => col.name === 'parent_master_id')) {
  sqlite.exec(`ALTER TABLE struktur_master ADD COLUMN parent_master_id integer;`)
}

export const db = drizzle(sqlite, { schema })
